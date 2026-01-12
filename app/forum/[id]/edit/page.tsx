"use client";

import { useEffect, useState } from "react";
import { PRESET_CATEGORIES } from "@/types/firestore";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

import React from "react";

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  const { id } = React.use(params); // ✅ correct

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* 🔴 ERRORS */
  const [errors, setErrors] = useState<{
    title?: string;
    body?: string;
    categories?: string;
    general?: string;
  }>({});

  /* ---------------- LOAD QUESTION ---------------- */
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "forums", id));
      if (!snap.exists()) {
        router.push("/forum");
        return;
      }

      const data = snap.data();
      setPost(data);
      setTitle(data.title || "");
      setBody(data.description || "");
      setCategories(data.categories || []);
      setLoading(false);
    };

    load();
  }, [id, router]);

  /* 🔐 OWNER CHECK */
  if (loading) return <p className="p-6">Loading…</p>;
  if (!auth.currentUser || auth.currentUser.uid !== post.authorId) {
    return (
      <p className="p-6 text-red-600">
        You are not allowed to edit this question.
      </p>
    );
  }

  /* ---------------- CATEGORY TOGGLE ---------------- */
  function toggleCategory(id: string) {
    setCategories((prev) => {
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }

      if (prev.length >= 2) {
        setErrors((e) => ({
          ...e,
          categories: "You can select up to 2 categories only.",
        }));
        return prev;
      }

      setErrors((e) => ({ ...e, categories: undefined }));
      return [...prev, id];
    });
  }

  /* ---------------- VALIDATION ---------------- */
  function validate() {
    const e: typeof errors = {};

    if (!title.trim() || title.trim().length < 10)
      e.title = "Title must be at least 10 characters.";

    if (!body.trim() || body.trim().length < 20)
      e.body = "Description must be at least 20 characters.";

    if (categories.length < 1)
      e.categories = "Select at least 1 category.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ---------------- SAVE ---------------- */
  async function handleSave() {
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await updateDoc(doc(db, "forums", id), {
        title: title.trim(),
        description: body.trim(),
        summary: body.trim().slice(0, 200),
        categories,
        updatedAt: serverTimestamp(),
      });

      router.push(`/forum/${id}`);
    } catch (err) {
      console.error(err);
      setErrors({
        general: "Failed to update question. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {/* LEFT FORM */}
      <div className="max-w-4xl py-10 px-6">

        <h1 className="text-3xl font-semibold mb-8">
          Edit Question
        </h1>

        {errors.general && (
          <div className="mb-4 text-red-600 font-medium">
            {errors.general}
          </div>
        )}

        {/* TITLE */}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">Title</label>
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
          )}
          <input
            className="w-full border px-4 py-2 rounded mt-2"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setErrors((er) => ({ ...er, title: undefined }));
            }}
          />
        </section>

        {/* BODY */}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">Description</label>
          {errors.body && (
            <p className="text-sm text-red-500 mt-1">{errors.body}</p>
          )}
          <textarea
            rows={8}
            className="w-full border p-4 rounded mt-2"
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setErrors((er) => ({ ...er, body: undefined }));
            }}
          />
        </section>

        {/* CATEGORIES */}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">Categories</label>
          <p className="text-sm text-gray-500 mb-2">
            Select 1–2 categories
          </p>
          {errors.categories && (
            <p className="text-sm text-red-500 mb-2">
              {errors.categories}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_CATEGORIES.map((c) => (
              <label
                key={c.id}
                className={`border rounded px-3 py-2 cursor-pointer ${
                  categories.includes(c.id)
                    ? "bg-blue-50 border-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={categories.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </section>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push(`/forum/${id}`)}
            className="px-6 py-3 bg-gray-200 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-3 rounded disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* RIGHT GUIDELINES */}
      <div className="w-1/4 absolute top-0 pt-20 px-4 right-0 border-l h-full border-[#D9D9D9] bg-white">
        <h2 className="text-xl font-bold mb-3">Editing Guidelines</h2>

        <ul className="space-y-4 text-gray-800">
          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Keep Title Relevant</p>
              <p className="text-sm">
                Make sure the title still reflects the question
              </p>
            </div>
          </li>

          <li className="flex items-start gap-2">
            <span className="w-2 h-2 bg-black rounded-full mt-2"></span>
            <div>
              <p className="font-semibold">Maintain Clarity</p>
              <p className="text-sm">
                Update the description clearly and concisely
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
