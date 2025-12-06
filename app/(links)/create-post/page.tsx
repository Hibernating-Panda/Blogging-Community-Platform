"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { PRESET_CATEGORIES } from "@/types/firestore";
import TipTapEditor from "@/components/TipTapEditor";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [coverImage, setCoverImage] = useState<File | null>(null);

  // TipTap text content (HTML)
  const [contentText, setContentText] = useState("");

  // Optional file upload
  const [contentFile, setContentFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const submitPost = async () => {
    if (!auth.currentUser) return alert("Not logged in.");
    if (!title || !categoryId) return alert("Missing required fields.");

    setIsLoading(true);

    const form = new FormData();
    form.append("title", title);
    form.append("summary", summary);
    form.append("categoryId", categoryId);
    form.append("authorId", auth.currentUser.uid);

    if (coverImage) form.append("coverImage", coverImage);
    if (contentText) form.append("contentText", contentText); // HTML from TipTap
    if (contentFile) form.append("contentFile", contentFile);

    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const data = await res.json();

    if (data.id) window.location.href = `/post/${data.id}`;
    else alert(data.error);

    setIsLoading(false);
  };

  return (
    <div className="p-6 mx-auto w-full max-w-3xl">
      <h1 className="text-3xl font-bold mb-4">Create Post</h1>

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
        <option value="">Select Category</option>
        {PRESET_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="font-medium">Cover Image</label>
      <input
        type="file"
        accept="image/*"
        className="w-full border p-2 mb-3"
        onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
      />

      {/* TIPTAP EDITOR */}
      <label className="font-medium">Post Content (Rich Text Editor)</label>
      <TipTapEditor
        value={contentText}
        onChange={(html) => {
          setContentText(html);
          setContentFile(null);
        }}
      />

      <button
        onClick={submitPost}
        disabled={isLoading}
        className="bg-[#282D38] text-white p-2 w-full rounded"
      >
        {isLoading ? "Publishing..." : "Publish Post"}
      </button>
    </div>
  );
}
