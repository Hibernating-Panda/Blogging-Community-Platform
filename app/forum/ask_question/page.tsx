"use client";

import { useState } from "react";
import { PRESET_CATEGORIES } from "../../../types/firestore";
import { auth, db } from "../../../lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AskQuestionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleCategory(id: string) {
    setCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 2) {
        alert("You can select up to 2 categories only.");
        return prev;
      }
      return [...prev, id];
    });
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!title.trim() || !body.trim() || categories.length === 0) {
      alert("All fields are required.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Login required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const ref = await addDoc(collection(db, "forums"), {
        title,
        description: body,
        summary: body.slice(0, 200),
        categories,
        authorId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        votes: 0,
        answersCount: 0,
        views: 0,
      });

      router.push(`/forum/${ref.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to submit question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-10 px-6">

        <h1 className="text-3xl font-semibold mb-8">
          Ask a public question
        </h1>

        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">Title *</label>
          <input
            className="w-full border px-4 py-2 rounded mt-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </section>

        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">Body *</label>
          <textarea
            rows={8}
            className="w-full border p-4 rounded mt-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </section>

        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="font-medium">Categories *</label>
          <p className="text-sm text-gray-500 mb-2">
            Select 1–2 categories
          </p>

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

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-3 rounded"
          >
            {isSubmitting ? "Submitting…" : "Submit Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
