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
  const [isDragging, setIsDragging] = useState(false);

  const stripHTML = (text: string) => {
    const div = document.createElement("div");
    div.innerHTML = text;
    return div.textContent || div.innerText || "";
  };


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
        const cleanText = stripHTML(contentText);
        const textBlob = new Blob([cleanText], { type: "text/plain" });
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
    <div className="flex gap-10 p-6 cursor-default">

      {/* LEFT PANEL – FORM */}
      <div className="w-2/3 bg-white border border-gray-300 rounded-xl p-8 shadow-sm">

        {/* HEADER + BUTTONS */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Research Post</h1>
            <p className="text-gray-500 text-sm">
              Update your research and apply necessary corrections
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = `/post/${id}`)}
              className="px-5 py-2 rounded-lg bg-gray-300 text-black font-medium hover:bg-gray-400 cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-300 my-6"></div>

        {/* TITLE */}
        <div className="mb-5">
          <label className="block font-semibold mb-1">Research Title</label>
          <input
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter your research title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* COVER */}
        <div className="mb-5">
          <label className="block font-semibold mb-1">Research Cover</label>

          {/* DRAG + DROP */}
          <div
            className={`
              w-full h-40 border rounded-lg
              flex flex-col items-center justify-center
              transition
              ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"}
            `}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);

              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith("image/")) {
                setCoverImage(file);
              }
            }}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="coverInput"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />

            <label
              htmlFor="coverInput"
              className="cursor-pointer flex flex-col items-center text-gray-500"
            >
              <svg width="28" height="28" fill="currentColor"
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                <path d="M480 80c8.8 0 16 7.2 16 16l0 256c0 8.8-7.2 16-16 16l-320 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l320 0zM160 32c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L160 32zm80 112a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm140.7 3.8c-4.3-7.3-12.2-11.8-20.7-11.8s-16.4 4.5-20.7 11.8l-46.5 79-17.2-24.6c-4.5-6.4-11.8-10.2-19.7-10.2s-15.2 3.8-19.7 10.2l-56 80c-5.1 7.3-5.8 16.9-1.6 24.8S191.1 320 200 320l240 0c8.6 0 16.6-4.6 20.8-12.1s4.2-16.7-.1-24.1l-80-136zM48 152c0-13.3-10.7-24-24-24S0 138.7 0 152L0 448c0 35.3 28.7 64 64 64l360 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L64 464c-8.8 0-16-7.2-16-16l0-296z"/>
              </svg>

              <span className="text-sm">
                {coverImage ? "Change Photo" : "Drag and drop the photo here"}
              </span>
            </label>
          </div>

          {/* PREVIEW */}
          {(coverImage || post.coverImage) && (
            <div className="mt-3">
              <img
                src={coverImage ? URL.createObjectURL(coverImage) : post.coverImage}
                className="w-full rounded-lg border"
              />
            </div>
          )}
        </div>

        {/* CATEGORY */}
        <div className="mb-5">
          <label className="block font-semibold mb-1">
            Category <span className="text-red-500">*</span>
          </label>

          <select
            className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-pointer"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select a category</option>
            {PRESET_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* SUMMARY */}
        <div className="mb-5">
          <label className="block font-semibold mb-1">Abstract / Summary</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Update the summary of your research"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        {/* FULL CONTENT */}
        <div className="mb-5">
          <label className="block font-semibold mb-1">Full Content</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg h-48 resize-none"
            placeholder="Edit your detailed research content"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
          />
        </div>

      </div>

      {/* RIGHT PANEL – GUIDELINES */}
      <div className="w-1/4 absolute top-0 pt-20 px-4 right-0 border-l h-full border-[#D9D9D9]">
        <h2 className="text-xl font-bold mb-3">Editing Guidelines</h2>

        <ul className="space-y-4 text-gray-800">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Keep Title Relevant</p>
              <p className="text-sm">Ensure the research title reflects updates</p>
            </div>
          </li>

          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Maintain Clarity</p>
              <p className="text-sm">
                Keep summary brief and focused on research findings
              </p>
            </div>
          </li>
        </ul>
      </div>

    </div>
  );
}
