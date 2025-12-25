"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, getDocs, query, collection, where } from "firebase/firestore";
import Image from "next/image";
import PostCard from "@/components/PostCard";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);

  // Profile fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); // Read-only
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  // Editing
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [originalData, setOriginalData] = useState<any>({});
  const [userPosts, setUserPosts] = useState<any[]>([]);

  // Load user posts
  const loadPosts = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const postsSnap = await getDocs(
      query(collection(db, "posts"), where("authorId", "==", user.uid))
    );

    const posts = postsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setUserPosts(posts);
  };

  loadPosts();



  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setEmail(user.email || ""); // From Firebase Auth

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setBio(data.bio || "");
        setGender(data.gender || "");
        setWorkplace(data.workplace || "");
        setPhotoURL(data.photoURL || "");

        setOriginalData(data);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handlePhotoChange = (file: File | null) => {
    if (!file) return;
    setNewPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const switchToEdit = () => {
    setPreview(null);
    setNewPhoto(null);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setUsername(originalData.username);
    setBio(originalData.bio);
    setGender(originalData.gender);
    setWorkplace(originalData.workplace);
    setPhotoURL(originalData.photoURL);

    setNewPhoto(null);
    setPreview(null);
    setEditMode(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;

    const formData = new FormData();
    formData.append("uid", user.uid);
    formData.append("username", username);
    formData.append("bio", bio);
    formData.append("gender", gender);
    formData.append("workplace", workplace);

    if (newPhoto) formData.append("photo", newPhoto);

    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to update profile");
      setSaving(false);
      return;
    }

    if (data.photoURL) setPhotoURL(data.photoURL);

    setOriginalData({
      username,
      bio,
      gender,
      workplace,
      photoURL: data.photoURL || photoURL,
    });

    setSaving(false);
    setEditMode(false);
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  // ------------------------------------------------------
  // VIEW MODE
  // ------------------------------------------------------
  if (!editMode) {
    return (
      <div className="max-w-2/3">
        <div className="bg-white rounded-xl m-6 p-6 border border-[#D9D9D9]">
        
          {/* PHOTO */}
          <div className="flex gap-2 w-full cursor-default">
            <Image
              src={photoURL || "/profile.jpg"}
              alt="Profile"
              width={150}
              height={150}
              className="rounded-full object-cover h-40 w-40 shadow-md border"
            />

            <div className="flex flex-col h-40 justify-center">
              <p className="text-2xl font-semibold">{username}</p>
              <p className="text-gray-500 text-lg">{email}</p>
            </div>

            <div className="w-full">

            </div>
            <button
              onClick={switchToEdit}
              className="self-end bg-[#282D38] text-white py-1 cursor-pointer px-2 rounded-lg text-lg font-semibold hover:opacity-80 transition text-nowrap"
            >
              Edit Profile
            </button>
          </div>

          <div className="mt-6 space-y-3 text-lg cursor-default">
            <p>
              <span className="font-semibold">Gender:</span>{" "}
              {gender || "Not set"}
            </p>
            <p>
              <span className="font-semibold">Workplace:</span>{" "}
              {workplace || "Not set"}
            </p>
            <p>
              <span className="font-semibold">Bio:</span>{" "}
              {bio || "No bio provided"}
            </p>
          </div>
        </div>

       <div className="cursor-default">
        {/* user profile UI here */}

        <h2 className="text-2xl font-bold ml-6">Your Posts</h2>

        <PostCard userOnly={true} />
      </div>
      </div>
    );
  }

// ------------------------------------------------------
// EDIT MODE (MATCH VIEW LAYOUT)
// ------------------------------------------------------
return (
  <div className="max-w-2/3 p-2">
    <div className="bg-white rounded-xl p-6 border border-[#D9D9D9]">

      {/* TOP SECTION: PHOTO + USER INFO + SAVE BUTTON */}
      <div className="flex gap-2 w-full cursor-default relative">

        {/* PHOTO */}
        <div className="flex flex-col items-center">
          <Image
            src={preview || photoURL || "/profile.jpg"}
            alt="Profile"
            width={150}
            height={150}
            className="rounded-full object-cover h-40 w-40 shadow-md border"
          />

          <label className="mt-3 cursor-pointer bg-gray-100 px-4 py-2 rounded-lg text-sm border hover:bg-gray-200 transition">
            Change Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* USERNAME + EMAIL */}
        <div className="flex flex-col h-40 justify-center ml-4 flex-1">
          <div className="mb-3">
            <label className="font-semibold">Username</label>
            <input
              className="w-full border p-2 rounded mt-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Email (read-only)</label>
            <input
              className="w-full border p-2 rounded mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
              value={email}
              disabled
            />
          </div>
        </div>
      </div>

      {/* BOTTOM FIELDS */}
      <div className="mt-6 space-y-3 text-lg cursor-default">

        {/* GENDER */}
        <div>
          <label className="font-semibold">Gender</label>
          <select
            className="w-full border p-2 rounded mt-1 cursor-pointer"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="" disabled>Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* WORKPLACE */}
        <div>
          <label className="font-semibold">Workplace</label>
          <input
            className="w-full border p-2 rounded mt-1"
            value={workplace}
            onChange={(e) => setWorkplace(e.target.value)}
          />
        </div>

        {/* BIO */}
        <div>
          <label className="font-semibold">Bio</label>
          <textarea
            className="w-full border p-2 rounded mt-1 h-24 resize-none"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="flex w-full justify-between">
          {/* CANCEL BUTTON */}
          <button
            onClick={cancelEdit}
            className="bg-gray-200 text-black py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition cursor-pointer"
          >
            Cancel
          </button>

          {/* SAVE BUTTON */}
          <button
            onClick={handleSave}
            className="bg-[#282D38] text-white py-2 px-4 rounded-lg font-semibold hover:opacity-80 transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        
      </div>

    </div>
          {/* USER POSTS */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Your Posts</h2>

        {userPosts.length === 0 ? (
          <p className="text-gray-500">You haven't published any posts yet.</p>
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-300 rounded-lg p-4 bg-white cursor-pointer hover:bg-gray-50 transition"
                onClick={() => (window.location.href = `/post/${post.id}`)}
              >
                <h3 className="text-xl font-semibold">{post.title}</h3>

                <p className="text-gray-600 text-sm mt-1">
                  {post.summary?.slice(0, 80)}...
                </p>

                <p className="text-gray-400 text-xs mt-2">
                  {post.categoryName || "Uncategorized"} •{" "}
                  {post.createdAt?.toDate().toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
  </div>
);

}
