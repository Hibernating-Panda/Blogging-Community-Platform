"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

type Community = {
  id: string;
  name: string;
  profileImage?: string | null;
  lastReadAt?: any;
  lastMessageAt?: any;
  hasUnread?: boolean;
};

export default function CommunitySidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [uid, setUid] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---------------- CLOSE DROPDOWN ---------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keep uid in state to avoid SSR/early access
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  /* ---------------- LOAD COMMUNITIES (FAST) ---------------- */
  useEffect(() => {
    if (!uid) return;

    const unsubscribers: (() => void)[] = [];

    const load = async () => {
      const userCommunitiesSnap = await getDocs(
        collection(db, "users", uid, "communities")
      );

      // 1️⃣ Build base list ONCE
      const baseList: Community[] = await Promise.all(
        userCommunitiesSnap.docs.map(async (d) => {
          const communitySnap = await getDoc(
            doc(db, "communities", d.id)
          );

          const data = communitySnap.data();
          const userData = d.data();

          return {
            id: d.id,
            name: data?.name ?? "Unknown",
            profileImage: data?.profileImage ?? null,
            lastReadAt: userData?.lastReadAt ?? null,
            lastMessageAt: null,
            hasUnread: false,
          };
        })
      );

      setCommunities(baseList);

      // 2️⃣ Attach listeners per community: user doc (lastReadAt) and last message
      userCommunitiesSnap.docs.forEach((d) => {
        const communityId = d.id;

        // Helpers to compare timestamps robustly (milliseconds precision)
        const toMs = (ts: any) =>
          ts?.toMillis
            ? ts.toMillis()
            : (ts?.seconds ?? 0) * 1000 + Math.floor((ts?.nanoseconds ?? 0) / 1e6);
        const computeHasUnread = (lastReadAt: any, lastMessageAt: any) => {
          if (!lastMessageAt) return false;
          if (!lastReadAt) return false; // avoid flicker until lastReadAt known
          return toMs(lastMessageAt) > toMs(lastReadAt);
        };

        // Listen to user's community doc for lastReadAt updates
        const unsubUser = onSnapshot(
          doc(db, "users", uid, "communities", communityId),
          (snap) => {
            const lastReadAt = snap.data()?.lastReadAt ?? null;
            setCommunities((prev) =>
              prev.map((c) =>
                c.id === communityId
                  ? {
                      ...c,
                      lastReadAt,
                      hasUnread: computeHasUnread(lastReadAt, c.lastMessageAt),
                    }
                  : c
              )
            );
          }
        );

        // Listen to most recent message for lastMessageAt updates
        const q = query(
          collection(db, "communities", communityId, "messages"),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const unsubMsg = onSnapshot(q, (snap) => {
          const lastMessageAt = snap.docs[0]?.data()?.createdAt ?? null;
          setCommunities((prev) =>
            prev.map((c) => {
              if (c.id !== communityId) return c;
              // If lastReadAt not known yet, update lastMessageAt but keep prior hasUnread to avoid flicker
              const hasUnread = c.lastReadAt
                ? computeHasUnread(c.lastReadAt, lastMessageAt)
                : c.hasUnread;
              return { ...c, lastMessageAt, hasUnread };
            })
          );
        });

        unsubscribers.push(unsubUser);
        unsubscribers.push(unsubMsg);
      });
    };

    load();

    return () => unsubscribers.forEach((u) => u());
  }, [uid]);

  /* ---------------- UI ---------------- */
  return (
    <div className="h-full w-full p-4">
      {/* HEADER */}
      <div className="w-full flex justify-between items-center mb-3">
        <h1 className="text-[#6B7280]">Your Communities</h1>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="text-white px-2 rounded-md border border-[#6B7280] bg-[#282D38] cursor-pointer hover:bg-[#6B7280]"
          >
            +
          </button>

          {open && (
            <div className="absolute right-0 bg-white rounded-lg shadow-lg z-50 border text-center flex flex-col w-50">
              <button
                onClick={() => router.push("/communities/create")}
                className="hover:bg-[#6B7280] hover:text-white px-3 py-2 cursor-pointer"
              >
                Create new Community
              </button>
              <button
                onClick={() => router.push("/communities/join")}
                className="hover:bg-[#6B7280] hover:text-white px-3 py-2 cursor-pointer"
              >
                Join new Community
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="flex flex-col gap-2">
        {communities.length === 0 && (
          <p className="text-sm text-gray-500">No communities yet</p>
        )}

        {communities.map((c) => {
          const active = pathname === `/communities/${c.id}`;

          return (
            <button
              key={c.id}
              onClick={() => router.push(`/communities/${c.id}`)}
              className={`flex items-center gap-3 px-2 py-2 rounded text-left ${
                active ? "bg-[#6B7280] text-white" : "hover:bg-gray-100"
              }`}
            >
              {/* AVATAR */}
              {c.profileImage ? (
                <img
                  src={c.profileImage}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: stringToColor(c.name) }}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
              )}

              <span className="truncate flex-1">{c.name}</span>

              {c.hasUnread && !active && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- COLOR HELPER ---------------- */
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
}
