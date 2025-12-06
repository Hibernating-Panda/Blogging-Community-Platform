"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false); // VIEW vs EDIT mode

  // Profile fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  // For editing
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Keep original data for cancel
  const [originalData, setOriginalData] = useState<any>({});

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username || "");
        setBio(data.bio || "");
        setGender(data.gender || "");
        setWorkplace(data.workplace || "");
        setPhotoURL(data.photoURL || "");

        setOriginalData(data); // save backup
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

    if (newPhoto) {
      formData.append("photo", newPhoto);
    }

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

    // Update local state
    if (data.photoURL) {
      setPhotoURL(data.photoURL);
    }

    setOriginalData({
      username,
      bio,
      gender,
      workplace,
      photoURL: data.photoURL || photoURL,
    });

    setSaving(false);
    setEditMode(false);
    alert("Profile updated!");
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  // --------------------------------------------------------
  // VIEW MODE
  // --------------------------------------------------------
  if (!editMode) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

        {/* Photo */}
        <div className="flex justify-center mb-6">
          <Image
            src={photoURL || "/profile.jpg"}
            alt="Profile"
            width={150}
            height={150}
            className="rounded-full object-cover h-40 w-40 border shadow"
          />
        </div>

        <div className="mt-4 space-y-4 text-lg">
          <p><span className="font-semibold">Username:</span> {username}</p>
          <p><span className="font-semibold">Bio:</span> {bio || "No bio"}</p>
          <p><span className="font-semibold">Gender:</span> {gender || "Not set"}</p>
          <p><span className="font-semibold">Workplace:</span> {workplace || "Not set"}</p>
        </div>

        <button
          onClick={switchToEdit}
          className="w-full bg-[#282D38] text-white p-3 rounded-lg text-lg font-semibold mt-6 hover:bg-[#282D38]"
        >
          Edit Profile
        </button>
      </div>
    );
  }

  // --------------------------------------------------------
  // EDIT MODE
  // --------------------------------------------------------
  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Profile</h1>

      {/* PHOTO */}
      <div className="flex flex-col items-center mb-6">
        <Image
          src={preview || photoURL || "/profile.jpg"}
          width={140}
          height={140}
          alt="Profile"
          className="rounded-full object-cover h-36 w-36 border shadow"
        />

        <label className="mt-3 cursor-pointer bg-gray-100 px-4 py-2 rounded-lg text-sm border hover:bg-gray-200">
          Choose Photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {/* Username */}
      <div className="mb-4">
        <label className="font-semibold">Username</label>
        <input
          className="w-full border p-2 rounded mt-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      {/* Bio */}
      <div className="mb-4">
        <label className="font-semibold">Bio</label>
        <textarea
          className="w-full border p-2 rounded mt-1"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      {/* Gender */}
      <div className="mb-4">
        <label className="font-semibold">Gender</label>
        <select
          className="w-full border p-2 rounded mt-1"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Workplace */}
      <div className="mb-4">
        <label className="font-semibold">Workplace</label>
        <input
          className="w-full border p-2 rounded mt-1"
          value={workplace}
          onChange={(e) => setWorkplace(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleSave}
          className="flex-1 bg-[#282D38] text-white p-3 rounded-lg text-lg font-semibold hover:bg-[#282D38]"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          onClick={cancelEdit}
          className="flex-1 bg-gray-200 text-black p-3 rounded-lg text-lg font-semibold hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
