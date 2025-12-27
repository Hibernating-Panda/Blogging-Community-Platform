"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
} from "firebase/firestore";

type Community = {
  id: string;
  name: string;
  profileImage?: string | null;
};

export default function CommunitySidebar() {
  const [open, setOpen] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const uid = auth.currentUser?.uid;

  /* CLOSE DROPDOWN */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* LOAD USER COMMUNITIES */
  useEffect(() => {
    if (!uid) return;

    const loadCommunities = async () => {
      const snap = await getDocs(
        collection(db, "users", uid, "communities")
      );

      const list: Community[] = [];

      for (const d of snap.docs) {
        const communitySnap = await getDoc(
          doc(db, "communities", d.id)
        );

        if (!communitySnap.exists()) continue;

      const data = communitySnap.data();

      list.push({
        id: communitySnap.id,
        name: data.name,
        profileImage: data.profileImage || null,
      });

      }

      setCommunities(list);
    };

    loadCommunities();
  }, [uid]);


  return (
    <div className="h-full w-full p-4">
      {/* HEADER */}
      <div className="w-full flex justify-between items-center mb-3">
        <h1 className="text-[#6B7280]">Your Communities</h1>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="text-white px-2 rounded-xl border border-[#6B7280] bg-[#282D38] cursor-pointer hover:opacity-80"
          >
            +
          </button>

          {open && (
            <div className="absolute right-0 w-50 bg-white rounded-lg shadow-lg z-50 border-[#6B7280] border text-center flex flex-col">
              <button
                onClick={() => (window.location.href = "/communities/create")}
                className="hover:bg-[#6B7280] hover:text-white cursor-pointer rounded-t-md px-3 py-2"
              >
                Create new Community
              </button>
              <button
                onClick={() => (window.location.href = "/communities/join")}
                className="hover:bg-[#6B7280] hover:text-white cursor-pointer rounded-b-md px-3 py-2"
              >
                Join new Community
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COMMUNITY NAMES */}
      <div className="flex flex-col gap-2 text-base">
        {communities.length === 0 && (
          <p className="text-sm text-gray-500">No communities yet</p>
        )}

        {communities.map((c) => (
          <button
            key={c.id}
            onClick={() => (window.location.href = `/communities/${c.id}`)}
            className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-100 transition text-left cursor-pointer"
          >
            {/* AVATAR */}
            {c.profileImage ? (
              <img
                src={c.profileImage}
                alt={c.name}
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

            {/* NAME */}
            <span className="truncate">{c.name}</span>
          </button>
        ))}

      </div>
    </div>
  );
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
