"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  getDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import QuestionItem from "@/components/QuestionItem";
import { useSearch } from "@/context/SearchContext";

type SortType = "newest" | "active" | "unanswered";

export default function ForumPage() {
  const [forums, setForums] = useState<any[]>([]);
  const [sort, setSort] = useState<SortType>("newest");

  const { searchText, selectedCategory } = useSearch();

  useEffect(() => {
    let q;

    if (sort === "newest") {
      q = query(collection(db, "forums"), orderBy("createdAt", "desc"));
    } else if (sort === "active") {
      q = query(collection(db, "forums"), orderBy("updatedAt", "desc"));
    } else {
      q = query(collection(db, "forums"), orderBy("answersCount", "asc"));
    }

    const unsub = onSnapshot(q, async (snap) => {
      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();

          // 🔥 fetch author name
          let authorName = "Anonymous";
          if (data.authorId) {
            const userSnap = await getDoc(
              doc(db, "users", data.authorId)
            );
            if (userSnap.exists()) {
              authorName =
                userSnap.data().username ||
                userSnap.data().name ||
                "Anonymous";
            }
          }

          return {
            id: d.id,
            ...data,
            authorName,
          };
        })
      );

      setForums(items);
    });

    return () => unsub();
  }, [sort]);

  /* ---------- SEARCH + CATEGORY FILTER ---------- */
  const filteredForums = useMemo(() => {
    const text = searchText.toLowerCase();

    return forums.filter((f) => {
      const matchesTitle =
        !searchText ||
        f.title?.toLowerCase().includes(text);

      const matchesAuthor =
        !searchText ||
        f.authorName?.toLowerCase().includes(text);

      const matchesCategory =
        !selectedCategory ||
        f.categories?.includes(selectedCategory);

      // 🔑 Title OR Author must match
      return (matchesTitle || matchesAuthor) && matchesCategory;
    });
  }, [forums, searchText, selectedCategory]);


  return (
    <div className="min-h-screen bg-gray-50 cursor-default">
      <div className="w-3/4 px-10 py-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Forum</h1>

          <div className="flex border rounded-md overflow-hidden text-sm">
            <button
              onClick={() => setSort("newest")}
              className={`px-4 py-2 cursor-pointer ${
                sort === "newest"
                  ? "bg-gray-200 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              Newest
            </button>

            <button
              onClick={() => setSort("active")}
              className={`px-4 py-2 cursor-pointer ${
                sort === "active"
                  ? "bg-gray-200 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              Active
            </button>

            <button
              onClick={() => setSort("unanswered")}
              className={`px-4 py-2 cursor-pointer ${
                sort === "unanswered"
                  ? "bg-gray-200 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              Unanswered
            </button>
          </div>

          <Link
            href="/forum/ask_question"
            className="bg-blue-600 text-white px-5 py-2 rounded-md"
          >
            Ask Question
          </Link>
        </div>

        {/* FORUM LIST */}
        <div className="space-y-6">
          {filteredForums.map((q) => (
            <QuestionItem
              key={q.id}
              id={q.id}
              title={q.title}
              desc={q.description}
              answers={q.answersCount ?? 0}
              views={q.views ?? 0}
              tags={q.categories}
              author={q.authorName}
              authorId={q.authorId}
              time={
                q.createdAt?.seconds
                  ? new Date(
                      q.createdAt.seconds * 1000
                    ).toLocaleString()
                  : ""
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
