"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useSearch } from "@/context/SearchContext";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!auth.currentUser) return;

      const userId = auth.currentUser.uid;

      // Load history sorted by latest
      const q = query(
        collection(db, "history", userId, "posts"),
        orderBy("viewedAt", "desc")
      );

      const snap = await getDocs(q);

      const items: any[] = [];

      for (const docSnap of snap.docs) {
        const postId = docSnap.id;
        const viewedAt = docSnap.data().viewedAt;

        const postSnap = await getDoc(doc(db, "posts", postId));
        if (postSnap.exists()) {
          items.push({
            id: postId,
            viewedAt,
            ...postSnap.data(),
          });
        }
      }

      setHistory(items);
      setLoading(false);
    };

    loadHistory();
  }, []);

  const { searchText, selectedCategory } = useSearch();
  
    const filtered = history.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchText.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchText.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(searchText.toLowerCase());
  
      const matchCategory =
        !selectedCategory || p.categoryId === selectedCategory;
  
      return matchSearch && matchCategory;
    });

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">History</h1>

      {filtered.length === 0 && (
        <p className="text-gray-600">No history found.</p>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((post) => (
          <Link
            href={`/post/${post.id}`}
            key={post.id}
            className="border rounded-lg p-4 flex gap-4 hover:bg-gray-50 transition"
          >
            {post.coverImage && (
              <img
                src={post.coverImage}
                className="w-32 h-20 object-cover rounded"
                alt="cover"
              />
            )}

            <div className="flex-1">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-gray-600 text-sm">{post.summary}</p>
              <p className="text-xs text-gray-400 mt-1">
                Viewed: {post.viewedAt?.toDate?.().toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
