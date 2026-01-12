"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import Image from "next/image";

export default function OtherUserProfilePage() {
  const { uid } = useParams<{ uid: string }>();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<"all" | "posts" | "forums">("all");

  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userForums, setUserForums] = useState<any[]>([]);
  const [publicCommunities, setPublicCommunities] = useState<any[]>([]);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    if (!uid) return;

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setProfile(snap.data());
      setLoading(false);
    };

    loadProfile();
  }, [uid]);

  /* ---------------- LOAD POSTS ---------------- */
  useEffect(() => {
    if (!uid) return;

    const loadPosts = async () => {
      const snap = await getDocs(
        query(collection(db, "posts"), where("authorId", "==", uid))
      );
      setUserPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    loadPosts();
  }, [uid]);

  /* ---------------- LOAD FORUMS ---------------- */
  useEffect(() => {
    if (!uid) return;

    const loadForums = async () => {
      const snap = await getDocs(
        query(collection(db, "forums"), where("authorId", "==", uid))
      );
      setUserForums(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    loadForums();
  }, [uid]);

  /* ---------------- LOAD PUBLIC COMMUNITIES ---------------- */
  useEffect(() => {
    if (!uid) return;

    const loadCommunities = async () => {
      const memSnap = await getDocs(
        collection(db, "users", uid, "communities")
      );

      const list: any[] = [];

      for (const d of memSnap.docs) {
        const cSnap = await getDoc(doc(db, "communities", d.id));
        if (cSnap.exists() && cSnap.data().visibility === "public") {
          list.push({ id: cSnap.id, ...cSnap.data() });
        }
      }

      setPublicCommunities(list);
    };

    loadCommunities();
  }, [uid]);

  if (loading || !profile) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  return (
    <div className="flex gap-6">
      {/* ================= MAIN ================= */}
      <div className="flex-1 max-w-2/3">

        {/* PROFILE CARD */}
        <div className="bg-white rounded-xl p-6 mt-6 ml-6 border border-[#D9D9D9]">
          <div className="flex gap-4 w-full cursor-default">
            <Image
              src={profile.photoURL || "/profile.jpg"}
              alt="Profile"
              width={150}
              height={150}
              className="rounded-full object-cover h-40 w-40 shadow-md border"
            />

            <div className="flex flex-col justify-center">
              <p className="text-2xl font-semibold">{profile.username}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-lg cursor-default">
            <p>
              <span className="font-semibold">Gender:</span>{" "}
              {profile.gender || "Not set"}
            </p>
            <p>
              <span className="font-semibold">Workplace:</span>{" "}
              {profile.workplace || "Not set"}
            </p>
            <p>
              <span className="font-semibold">Bio:</span>{" "}
              {profile.bio || "No bio provided"}
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="ml-6 mt-6 flex gap-2 cursor-default">
          {["all", "posts", "forums"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-3 py-1 rounded border ${
                activeTab === t
                  ? "bg-[#282D38] text-white"
                  : "bg-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="ml-6 mt-4 space-y-6">

          {/* POSTS */}
          {(activeTab === "all" || activeTab === "posts") && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Posts</h2>
              {userPosts.length === 0 ? (
                <p className="text-gray-500">No posts yet.</p>
              ) : (
                <div className="space-y-3">
                  {userPosts.map((p) => (
                    <div
                      key={p.id}
                      className="border border-[#D9D9D9] rounded p-3 bg-white hover:bg-gray-50 transition cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/post/${p.id}`)
                      }
                    >
                      <p className="font-semibold">{p.title}</p>
                      {p.coverImageUrl && (
                        <img
                          src={p.coverImageUrl}
                          className="w-full h-80 object-contain rounded"
                        />
                      )}
                      <p className="text-sm text-gray-600 truncate">
                        {p.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FORUMS */}
          {(activeTab === "all" || activeTab === "forums") && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Forums</h2>
              {userForums.length === 0 ? (
                <p className="text-gray-500">No forums yet.</p>
              ) : (
                <div className="space-y-3">
                  {userForums.map((f) => (
                    <div
                      key={f.id}
                      className="border border-[#D9D9D9] rounded p-3 bg-white hover:bg-gray-50 transition cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/forum/${f.id}`)
                      }
                    >
                      <p className="font-semibold">{f.title}</p>
                      <p className="text-sm text-gray-600">
                        {(f.answersCount || 0)} answers
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside className="w-80 sticky top-6 bg-white border border-[#D9D9D9] rounded-xl h-fit p-4 mt-6">
        <h3 className="font-semibold mb-3">Public Communities</h3>

        {publicCommunities.length === 0 ? (
          <p className="text-sm text-gray-500">No communities joined.</p>
        ) : (
          <ul className="space-y-2">
            {publicCommunities.map((c) => (
              <a
                key={c.id}
                href={`/communities/${c.id}`}
                className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded"
              >
                {c.profileImage ? (
                  <img
                    src={c.profileImage}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white">
                    {String(c.name || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span>{c.name}</span>
              </a>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
