"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function RightBar() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTrending = async () => {
      const q = query(
        collection(db, "posts"),
        orderBy("likeCount", "desc"),
        limit(3)
      );

      const snap = await getDocs(q);

      const list: any[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));

      setPosts(list);
      setLoading(false);
    };

    loadTrending();
  }, []);

  if (loading) return (
    <div className="p-4 rounded bg-white shadow">
      <p>Loading trending research…</p>
    </div>
  );

  return (
    <div className="p-4 rounded bg-white sticky top-4">
      <h2 className="text-lg font-bold mb-3 cursor-default">Trending Research</h2>

      {posts.length === 0 && (
        <p className="text-gray-500 cursor-default">No posts found.</p>
      )}

      <div className="flex flex-col gap-2">
        {posts.map((p, index) => (
          <Link
            href={`/post/${p.id}`}
            key={p.id}
            className="p-2 rounded hover:bg-gray-100 transition"
          >
            <div className="flex gap-2">
                <p className="text-[#0088FF]">{index + 1}</p>

                <div className="flex gap-2 flex-col">
                  <p className="font-semibold truncate">
                  {p.title}
                  </p>
                  <p className="text-gray-600 text-sm truncate">
                    {p.categoryName} • {p.likeCount} likes
                  </p>
                </div>
            </div>
           
          </Link>
        ))}
      </div>
    </div>
  );
}
