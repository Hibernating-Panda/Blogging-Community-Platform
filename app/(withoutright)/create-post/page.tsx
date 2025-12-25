"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { PRESET_CATEGORIES } from "@/types/firestore";

export default function CreatePostPage() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [contentText, setContentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    if (contentText) form.append("contentText", contentText);

    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const data = await res.json();
    if (data.id) window.location.href = `/home`;
    else alert(data.error);

    setIsLoading(false);
  };

  return (
    <div className="flex gap-10 p-6 cursor-default">

      {/* LEFT PANEL – FORM */}
      <div className="w-2/3 bg-white border border-gray-300 rounded-xl p-8 shadow-sm">

        {/* HEADER + BUTTONS */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Create Research Post</h1>
            <p className="text-gray-500 text-sm">
              Share your research findings with the community
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = "/home")}
              className="px-5 py-2 rounded-lg bg-gray-300 text-black font-medium hover:bg-gray-400 cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={submitPost}
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
            >
              {isLoading ? "Publishing..." : "Publish"}
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

        <div className="mb-5">
          <label className="block font-semibold mb-1">Research Cover</label>

          {/* DRAG + DROP AREA */}
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
            {/* HIDDEN INPUT */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="coverInput"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />

            {/* UI */}
            <label
              htmlFor="coverInput"
              className="cursor-pointer flex flex-col items-center text-gray-500"
            >
              <svg width="28" height="28" fill="currentColor"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M480 80c8.8 0 16 7.2 16 16l0 256c0 8.8-7.2 16-16 16l-320 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l320 0zM160 32c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L160 32zm80 112a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm140.7 3.8c-4.3-7.3-12.2-11.8-20.7-11.8s-16.4 4.5-20.7 11.8l-46.5 79-17.2-24.6c-4.5-6.4-11.8-10.2-19.7-10.2s-15.2 3.8-19.7 10.2l-56 80c-5.1 7.3-5.8 16.9-1.6 24.8S191.1 320 200 320l240 0c8.6 0 16.6-4.6 20.8-12.1s4.2-16.7-.1-24.1l-80-136zM48 152c0-13.3-10.7-24-24-24S0 138.7 0 152L0 448c0 35.3 28.7 64 64 64l360 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L64 464c-8.8 0-16-7.2-16-16l0-296z"/></svg>
              <span className="text-sm">
                {coverImage ? "Change photo" : "Drag and drop the photo here"}
              </span>
            </label>
          </div>

          {/* PREVIEW */}
          {coverImage && (
            <div className="mt-3">
              <img
                src={URL.createObjectURL(coverImage)}
                className="w-full rounded-lg border"
                alt="Cover preview"
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
            placeholder="Provide a concise summary of your research objectives"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        {/* FULL CONTENT */}
        <div>
          <label className="block font-semibold mb-1">Full Content</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg h-48 resize-none"
            placeholder="Write your detailed research content here"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
          />
        </div>

      </div>

      {/* RIGHT PANEL – GUIDELINES */}
      <div className="w-1/4 absolute top-0 pt-20 px-4 right-0 border-l h-full border-[#D9D9D9]">
        <h2 className="text-xl font-bold mb-3">Publishing Guidelines</h2>

        <ul className="space-y-4 text-gray-800">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Clear Title</p>
              <p className="text-sm">Use descriptive searchable title</p>
            </div>
          </li>

          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Proper Abstract</p>
              <p className="text-sm">
                Summarize key findings and methodology
              </p>
            </div>
          </li>
        </ul>
      </div>

    </div>
  );
}
