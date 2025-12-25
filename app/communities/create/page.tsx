"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CreateCommunityPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const createCommunity = async () => {
    if (!auth.currentUser || !name.trim()) return;

    setLoading(true);

    const id = crypto.randomUUID();
    const uid = auth.currentUser.uid;
    
    const inviteCode =
      visibility === "private"
        ? Math.random().toString(36).substring(2, 10)
        : null;

        const uploadToCloudinary = async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", "setpre"); // your preset

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dyuznbate/upload",
        {
          method: "POST",
          body: form,
        }
      );

      const json = await res.json();
      return json.secure_url;
    };

    let profileImageUrl: string | null = null;

    if (profileImage) {
      profileImageUrl = await uploadToCloudinary(profileImage);
    }

    await setDoc(doc(db, "communities", id), {
      name,
      description,
      ownerId: uid,
      visibility,
      inviteCode,
      memberCount: 1,
      profileImage: profileImageUrl, // 👈 NEW
      createdAt: serverTimestamp(),
    });

    // 🔹 OWNER → MEMBERS
    await setDoc(doc(db, "communities", id, "members", uid), {
      role: "owner",
      joinedAt: serverTimestamp(),
    });

    // 🔹 OWNER → USER INDEX (THIS WAS MISSING)
    await setDoc(doc(db, "users", uid, "communities", id), {
      joinedAt: serverTimestamp(),
    });

      window.location.href = `/communities/${id}`;
    };

  return (
    <div className="h-full bg-white grid grid-cols-4 cursor-default justify-between w-full">
      <div className="col-span-3 p-6 space-y-5">

        {/* HEADER */}
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create a Community
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Bring people together around a shared interest
            </p>
          </div>
        <div className="flex flex-col items-center gap-2">
          {/* AVATAR */}
          <div className="relative">
            {profileImage ? (
              <img
                src={URL.createObjectURL(profileImage)}
                className="w-24 h-24 rounded-full object-cover border"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{
                  backgroundColor: stringToColor(name || "C"),
                }}
              >
                {(name || "C")[0]?.toUpperCase()}
              </div>
            )}

            {/* UPLOAD */}
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-blue-700">
              Edit
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setProfileImage(e.target.files?.[0] || null)
                }
              />
            </label>
          </div>

          <p className="text-sm text-gray-500">Community profile</p>
        </div>

        </div>

        {/* NAME */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Community name
          </label>
          <input
            className="mt-1 w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. AI Research Hub"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="mt-1 w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="What is this community about?"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* VISIBILITY */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Community type
          </label>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                visibility === "public"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <p className="font-semibold">Public</p>
              <p className="text-sm text-gray-500">
                Anyone can find and join
              </p>
            </button>

            <button
              type="button"
              onClick={() => setVisibility("private")}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                visibility === "private"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <p className="font-semibold">Private</p>
              <p className="text-sm text-gray-500">
                Invite only access
              </p>
            </button>
          </div>
        </div>

        {/* PRIVATE NOTE */}
        {visibility === "private" && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            Private communities can only be joined using an invite link or code.
          </div>
        )}

        {/* ACTION */}
        <button
          onClick={createCommunity}
          disabled={loading || !name.trim()}
          className={`w-full py-3 rounded-xl text-white font-semibold transition cursor-pointer ${
            loading || !name.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Creating..." : "Create Community"}
        </button>
      </div>

      <div className="col-span-1 border-l border-[#D6D6D6] sticky h-[calc(100vh-3rem)] bg-white top-12">
        <div className="h-full w-full p-4 text-gray-800 cursor-default">
          <h1 className="text-2xl font-bold mb-4">Community Guidelines</h1>

          <ul className="list-disc pl-5 space-y-3 text-base">
            <li>Choose a clear and respectful community name</li>
            <li>Provide an accurate description of the community</li>
            <li>Public communities are visible to everyone</li>
            <li>Private communities require an invite</li>
            <li>Respect all members and avoid harmful behavior</li>
            <li>Owners and admins are responsible for moderation</li>
            <li>Invite members responsibly</li>
          </ul>

          <p className="mt-2 text-sm text-gray-500">
            By creating a community, you agree to follow these guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
