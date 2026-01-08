"use client";

import { useState } from "react";
import { PRESET_CATEGORIES } from "../../../types/firestore";
import { auth } from "../../../lib/firebase";

type PostOption = "staging" | "public";

export default function AskQuestionPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [postOption, setPostOption] = useState<PostOption>("public");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!title.trim() || !body.trim() || selectedCategories.length === 0) {
      alert("Please provide title, body and select at least one category.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const fd = new FormData();
      fd.append("title", title);
      // summary: first 200 chars
      fd.append("summary", body.slice(0, 200));
      // API expects a single categoryId; send first selected
      fd.append("categoryId", selectedCategories[0]);
      fd.append("contentText", body);

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit");

      alert("Question submitted.");
      // reset form
      setTitle("");
      setBody("");
      setSelectedCategories([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-10 px-6">
        {/* HEADER */}
        <h1 className="text-3xl font-semibold mb-8">Ask a public question</h1>

        {/* TITLE */}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="block font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Be specific and imagine you’re asking a question to another person.
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How to center a div in Tailwind CSS?"
            className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </section>

        {/* BODY */}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="block font-medium mb-1">
            Body <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Include all the information someone would need to answer your
            question.
          </p>

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-3 border rounded-t-md px-3 py-2 bg-gray-50 text-sm">
            {["B", "I", "U", "</>", "🔗", "🖼️", "≡", "?"].map((item) => (
              <button
                key={item}
                type="button"
                className="px-2 py-1 border rounded hover:bg-gray-200"
              >
                {item}
              </button>
            ))}
          </div>

          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Explain your problem in detail..."
            className="w-full border border-t-0 rounded-b-md p-4 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </section>

        {/* CATEGORIES */}
        <section className="bg-white border rounded-lg p-6 mb-6">
          <label className="block font-medium mb-1">
            Categories <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Select one or more categories for your question.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PRESET_CATEGORIES.map((c) => {
              const checked = selectedCategories.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedCategories((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((x) => x !== c.id)
                          : [...prev, c.id]
                      );
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{c.name}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 disabled:opacity-60 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
          >
            {isSubmitting ? "Submitting…" : "Submit Question"}
          </button>
        </div>
      </div>
    </div>
  );
}
