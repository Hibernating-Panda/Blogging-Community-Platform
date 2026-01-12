"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { PRESET_CATEGORIES } from "@/types/firestore";
import React from "react";

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  /* ---------------- FORM STATE ---------------- */
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [contentText, setContentText] = useState("");

  /* ---------------- ERRORS ---------------- */
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  /* ---------------- LOAD POST ---------------- */
  useEffect(() => {
    const loadPost = async () => {
      const snap = await getDoc(doc(db, "posts", id));
      if (!snap.exists()) return;

      const data = snap.data();
      setPost(data);

      setTitle(data.title || "");
      setSummary(data.summary || "");
      setCategories(data.categories || []);
      setCategoryNames(data.categoryNames || []);

      if (data.contentType === "markdown") {
        const res = await fetch(data.contentUrl);
        const txt = await res.text();
        setContentText(txt);
      }

      setLoading(false);
    };

    loadPost();
  }, [id]);

  useEffect(() => {
    if (!coverImageFile) return;

    const url = URL.createObjectURL(coverImageFile);
    return () => URL.revokeObjectURL(url);
  }, [coverImageFile]);

  useEffect(() => {
    if (!coverImageFile) {
      setCoverPreview(null);
      return;
    }

    const url = URL.createObjectURL(coverImageFile);
    setCoverPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [coverImageFile]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!post) return <p className="p-6">Post not found.</p>;
  if (!auth.currentUser || auth.currentUser.uid !== post.authorId)
    return <p className="p-6 text-red-600">Not allowed.</p>;

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const e: Record<string, string> = {};

    if (title.length < 5 || title.length > 100)
      e.title = "Title must be 5–100 characters.";

    if (summary.length < 10 || summary.length > 300)
      e.summary = "Summary must be 10–300 characters.";

    if (categories.length < 1 || categories.length > 2)
      e.categories = "Select 1–2 categories.";

    if (!contentText || contentText.length < 50)
      e.content = "Content must be at least 50 characters.";

    if (!post.coverImageUrl && !coverImageFile)
      e.cover = "Cover image is required.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- CLOUDINARY ---------------- */
  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", "setpre");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dyuznbate/image/upload",
      { method: "POST", body: fd }
    );

    if (!res.ok) throw new Error("Image upload failed");

    const json = await res.json();
    if (!json.secure_url) throw new Error("Invalid image upload response");

    return json.secure_url;
  };

  const uploadMarkdown = async (text: string) => {
    const fd = new FormData();
    fd.append("file", new Blob([text], { type: "text/markdown" }));
    fd.append("upload_preset", "setpre");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dyuznbate/raw/upload",
      { method: "POST", body: fd }
    );

    const json = await res.json();
    return json.secure_url;
  };

  /* ---------------- SAVE ---------------- */
  const onSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    try {
      let coverImageUrl = post.coverImageUrl;

      if (coverImageFile) {
        coverImageUrl = await uploadImage(coverImageFile);
      }

      const contentUrl = await uploadMarkdown(contentText);

      await updateDoc(doc(db, "posts", id), {
        title,
        summary,
        categories,
        categoryNames,
        coverImageUrl,
        contentUrl,
        contentType: "markdown",
        updatedAt: serverTimestamp(),
      });

      window.location.href = `/post/${id}`;
    } catch (e: any) {
      alert(e.message);
    }

    setIsSaving(false);
  };

  /* ---------------- CATEGORY TOGGLE ---------------- */
  const toggleCategory = (id: string, name: string) => {
    if (categories.includes(id)) {
      setCategories(categories.filter((x) => x !== id));
      setCategoryNames(categoryNames.filter((x) => x !== name));
      return;
    }

    if (categories.length >= 2) return;

    setCategories([...categories, id]);
    setCategoryNames([...categoryNames, name]);
  };


  /* ---------------- RENDER ---------------- */
  return (
    <div className="flex gap-10 p-6 cursor-default">
      <div className="w-2/3 bg-white border rounded-xl p-8 shadow-sm">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Research Post</h1>
            <p className="text-gray-500 text-sm">Update your research</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => (window.location.href = `/post/${id}`)}
              className="px-5 py-2 bg-gray-300 rounded cursor-pointer hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 text-white rounded hover:opacity-80 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* TITLE */}
        <h2 className="text-lg font-semibold mb-2">Title</h2>
        {errors.title && <p className="text-red-500 text-sm mb-1">{errors.title}</p>}
        <input
          className="w-full p-3 border rounded mb-5"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* COVER */}
        <h2 className="text-lg font-semibold mb-2">Cover Image</h2>
        {errors.cover && <p className="text-red-500 text-sm mb-1">{errors.cover}</p>}
        <div
          className={`h-80 border rounded relative ${
            isDragging ? "border-blue-500 bg-blue-50" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);

            const file = e.dataTransfer.files[0];
            if (!file || !file.type.startsWith("image/")) {
              setErrors((prev) => ({
                ...prev,
                cover: "Only image files are allowed",
              }));
              return;
            }

            setCoverImageFile(file);
          }}
        >
          <input
            type="file"
            hidden
            id="coverInput"
            onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
          />

          {/* DROP ZONE TEXT (only when no image) */}
          {!coverImageFile && !post.coverImageUrl && (
            <label
              htmlFor="coverInput"
              className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 cursor-pointer"
            >
              <p>Drag & drop cover image</p>
              <p className="text-sm">or click to upload</p>
            </label>
          )}

          {/* IMAGE PREVIEW */}
          {(coverImageFile || post.coverImageUrl) && (
            <img
              src={coverPreview || post.coverImageUrl}
              className="absolute inset-0 w-full h-full object-contain rounded cursor-pointer hover:opacity-50 transition-opacity"
              alt="Cover preview"
            />
          )}
        </div>


        {/* CATEGORIES */}
        <h3 className="text-lg font-semibold my-2">Categories</h3>
        {errors.categories && <p className="text-red-500 text-sm mb-1">{errors.categories}</p>}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">
            Categories
          </label>

          <p className="text-sm text-gray-500 mb-2">
            Select 1–2 categories
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_CATEGORIES.map((c) => {
              const checked = categories.includes(c.id);

              return (
                <label
                  key={c.id}
                  className={`
                    flex items-center gap-2
                    border rounded px-3 py-2 cursor-pointer
                    transition
                    ${
                      checked
                        ? "bg-blue-50 border-blue-500"
                        : "hover:bg-gray-50"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(c.id, c.name)}
                    className="accent-blue-600"
                  />

                  <span className="text-sm">{c.name}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* SUMMARY */}
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
        {errors.summary && <p className="text-red-500 text-sm mb-1">{errors.summary}</p>}
        <textarea
          className="w-full p-3 border rounded mb-5"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        {/* CONTENT */}
        <h3 className="text-lg font-semibold mb-2">Content</h3>
        {errors.content && <p className="text-red-500 text-sm mb-1">{errors.content}</p>}
        <textarea
          className="w-full p-3 border rounded h-48 resize-none"
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
        />
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
