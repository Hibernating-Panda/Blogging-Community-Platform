"use client";

import React from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import PostCard from "@/components/PostCard";
import Image from "next/image";

export default function OtherUserProfilePage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {

  // ✅ Unwrap Next.js params properly
  const { uid } = React.use(params ?? {}) as { uid: string };

  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    if (!uid) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setProfile(snap.data());
    };

    load();
  }, [uid]);

  if (!profile) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-2/3 p-2">

      <div className="bg-white rounded-xl m-6 p-6 border border-[#D9D9D9]">

        <div className="flex items-center gap-4 mb-8">
          <Image
            src={profile.photoURL || "/profile.jpg"}
            alt="avatar"
            width={100}
            height={100}
            className="rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <p className="text-gray-600">{profile.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-lg cursor-default">
          <p><span className="font-semibold">Gender:</span> {profile.gender || "Not set"}</p>
          <p><span className="font-semibold">Workplace:</span> {profile.workplace || "Not set"}</p>
          <p><span className="font-semibold">Bio:</span> {profile.bio || "No bio provided"}</p>
        </div>
      </div>

      {/* USER POSTS */}
      <h2 className="text-2xl font-bold ml-6">{profile.username}'s Posts</h2>

      {/* ✅ Only show this user’s posts */}
      <PostCard userOnly userId={uid} />
    </div>
  );
}
