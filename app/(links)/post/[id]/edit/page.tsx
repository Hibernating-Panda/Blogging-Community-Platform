"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { PRESET_CATEGORIES } from "@/types/firestore";
import React from "react";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [coverImage, setCoverImage] = useState<File | null>(null);

  const [contentText, setContentText] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // -------- Load existing post --------
  useEffect(() => {
    const loadPost = async () => {
      const snap = await getDoc(doc(db, "posts", id));
      if (!snap.exists()) return;

      const data = snap.data();
      setPost(data);

      setTitle(data.title);
      setSummary(data.summary);
      setCategoryId(data.categoryId);

      // Fetch plain text if txt/md
      if (data.contentType === "txt" || data.contentType === "md") {
        const res = await fetch(data.contentUrl);
        const txt = await res.text();
        setContentText(txt);
      }

      setLoading(false);
    };

    loadPost();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!post) return <p className="p-6">Post not found.</p>;
  if (!auth.currentUser || auth.currentUser.uid !== post.authorId)
    return <p className="p-6 text-red-600">You are not allowed to edit this post.</p>;

  // -------- Cloudinary upload --------
  const uploadToCloudinary = async (file: Blob | File, preset: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);

    const res = await fetch("https://api.cloudinary.com/v1_1/dyuznbate/upload", {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    return json.secure_url;
  };

  // -------- Save Updates --------
  const onSave = async () => {
    setIsSaving(true);

    try {
      let coverUrl = post.coverImage;

      // Replace cover image
      if (coverImage) {
        coverUrl = await uploadToCloudinary(coverImage, "setpre");
      }

      let contentUrl = post.contentUrl;
      let contentType = post.contentType;

      // If user uploads new file
      if (contentFile) {
        const ext = contentFile.name.split(".").pop()?.toLowerCase() || "txt";
        contentType = ext as any;
        contentUrl = await uploadToCloudinary(contentFile, "setpre");
      }
      // If user edits text
      else if (contentText.length > 0) {
        const textBlob = new Blob([contentText], { type: "text/plain" });
        contentUrl = await uploadToCloudinary(textBlob, "setpre");
        contentType = "txt";
      }

      // Update Firestore
      await updateDoc(doc(db, "posts", id), {
        title,
        summary,
        categoryId,
        coverImage: coverUrl,
        contentUrl,
        contentType,
        updatedAt: serverTimestamp(),
      });

      window.location.href = `/post/${id}`;
    } catch (err: any) {
      alert(err.message);
    }

    setIsSaving(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Edit Post</h1>

      <input
        className="w-full p-2 border mb-3"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full p-2 border mb-3"
        placeholder="Summary"
        rows={3}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />

      <select
        className="w-full p-2 border mb-3"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        <option value="">Select category</option>
        {PRESET_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="block mb-1 font-medium">Replace Cover Image</label>
      <input
        type="file"
        accept="image/*"
        className="w-full border p-2 mb-3"
        onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
      />

      <label className="block mb-1 font-medium">Edit Content</label>

      <textarea
        className="w-full p-2 border mb-3"
        placeholder="Edit your content..."
        rows={10}
        value={contentText}
        disabled={contentFile !== null}
        onChange={(e) => setContentText(e.target.value)}
      />

      <div className="text-center font-semibold my-2">OR Upload new file</div>

      <input
        type="file"
        accept=".txt,.md,.pdf,.doc,.docx"
        className="w-full border p-2 mb-3"
        onChange={(e) => setContentFile(e.target.files?.[0] || null)}
        disabled={contentText.length > 0}
      />

      <button
        className="bg-blue-900 text-white p-2 w-full rounded"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
