"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

type Community = {
  id: string;
  name: string;
  description?: string;
  profileImage?: string | null;
  memberCount?: number;
};

export default function JoinCommunityPage() {
  const [tab, setTab] = useState<"public" | "private">("public");
  const [publicCommunities, setPublicCommunities] = useState<Community[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState<Community | null>(null);

  const [selected, setSelected] = useState<Community | null>(null);

  // private
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uid = auth.currentUser?.uid;

  /* ---------------- LOAD JOINED COMMUNITIES ---------------- */
  useEffect(() => {
    if (!uid) return;

    const loadJoined = async () => {
      const snap = await getDocs(collection(db, "users", uid, "communities"));
      setJoinedIds(snap.docs.map((d) => d.id));
    };

    loadJoined();
  }, [uid]);

  /* ---------------- LOAD PUBLIC COMMUNITIES ---------------- */
  useEffect(() => {
    const loadPublic = async () => {
      const q = query(
        collection(db, "communities"),
        where("visibility", "==", "public")
      );

      const snap = await getDocs(q);

      setPublicCommunities(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Community[]
      );
    };

    loadPublic();
  }, []);

  /* ---------------- FILTER ---------------- */
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return publicCommunities.filter((c) =>
      c.name.toLowerCase().includes(s)
    );
  }, [search, publicCommunities]);

  /* ---------------- JOIN COMMUNITY ---------------- */
  const joinCommunity = async (community: Community) => {
    if (!uid) return;

    setLoading(true);

    await setDoc(doc(db, "communities", community.id, "members", uid), {
      role: "member",
      joinedAt: serverTimestamp(),
    });

    await setDoc(doc(db, "users", uid, "communities", community.id), {
      joinedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "communities", community.id), {
      memberCount: increment(1),
    });

    setJoinedIds((prev) => [...prev, community.id]);
    setSelected(null);
    setLoading(false);
  };

  /* ---------------- JOIN PRIVATE ---------------- */
  const joinPrivate = async () => {
    if (!uid || !inviteCode.trim()) return;

    setLoading(true);
    setError("");

    const q = query(
      collection(db, "communities"),
      where("inviteCode", "==", inviteCode.trim())
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      setError("Invalid invite code");
      setLoading(false);
      return;
    }

    const c = snap.docs[0];
    const id = c.id;

    if (joinedIds.includes(id)) {
      setAlreadyJoined(c.data() as Community);
      setLoading(false);
      return;
    }

    await setDoc(doc(db, "communities", id, "members", uid), {
      role: "member",
      joinedAt: serverTimestamp(),
    });

    await setDoc(doc(db, "users", uid, "communities", id), {
      joinedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "communities", id), {
      memberCount: increment(1),
    });

    window.location.href = `/communities/${id}`;
  };

  return (
    <div className="h-full bg-white flex gap-4">
      {/* LEFT */}
      <div className="w-3/4 bg-white rounded-2xl shadow-md p-6">
        {/* TABS */}
        <div className="flex gap-4 mb-6">
          {["public", "private"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-xl font-semibold cursor-pointer ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {t === "public" ? "Public Communities" : "Private Community"}
            </button>
          ))}
        </div>

        {/* PUBLIC */}
        {tab === "public" && (
          <>
            <input
              className="w-full p-3 border rounded-xl mb-4 border-[#e5e7eb]"
              placeholder="Search communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="border rounded-xl p-4 text-left hover:bg-gray-50 border-[#e5e7eb] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {c.profileImage ? (
                      <img
                        src={c.profileImage}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        {c.name[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-gray-500">
                        {c.memberCount ?? 0} members
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* PRIVATE */}
        {tab === "private" && (
          <>
            <input
              className="w-full p-3 border rounded-xl mb-3"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />

            {error && (
              <p className="text-red-600 text-sm mb-2">{error}</p>
            )}

            <button
              onClick={joinPrivate}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl cursor-pointer"
            >
              {loading ? "Joining..." : "Join Community"}
            </button>
          </>
        )}
      </div>

      {/* RIGHT GUIDELINES */}
      <div className="w-1/4 border-l p-4 border-[#e5e7eb] cursor-default">
        <h2 className="text-xl font-bold mb-3">Guidelines</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Be respectful to all members</li>
          <li>Public communities are visible to everyone</li>
          <li>Private communities require invite codes</li>
          <li>Admins can remove members</li>
        </ul>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <div className="flex items-center gap-3 mb-3">
              {selected.profileImage ? (
                <img
                  src={selected.profileImage}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {selected.name[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-lg">{selected.name}</p>
                <p className="text-sm text-gray-500">
                  {selected.memberCount ?? 0} members
                </p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">
              {selected.description || "No description provided"}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-200 rounded cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={joinedIds.includes(selected.id)}
                onClick={() => joinCommunity(selected)}
                className={`px-4 py-2 rounded text-white ${
                  joinedIds.includes(selected.id)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 cursor-pointer"
                }`}
              >
                {joinedIds.includes(selected.id) ? "Joined" : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}

      {alreadyJoined && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 cursor-default">
            <h2 className="text-lg font-bold mb-2">
              Already a Member
            </h2>

            <p className="text-gray-600 mb-4">
              You are already a member of <b>{alreadyJoined.name}</b>.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setAlreadyJoined(null)}
                className="px-4 py-2 bg-gray-200 rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
