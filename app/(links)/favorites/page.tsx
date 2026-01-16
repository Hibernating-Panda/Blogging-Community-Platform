"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import Link from "next/link";
import { useSearch } from "@/context/SearchContext";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  // -----------------------------
  // LOAD FAVORITES
  // -----------------------------
  useEffect(() => {
    if (!uid) return;

    setLoading(true);

    const unsub = onSnapshot(
      collection(db, "favorites", uid, "posts"),
      async (snap) => {
        const favPosts = await Promise.all(
          snap.docs.map(async (fav) => {
            const postId = fav.id;
            const favData = fav.data();
            const postSnap = await getDoc(doc(db, "posts", postId));
            if (!postSnap.exists()) return null;
            const post = postSnap.data();
            return {
              id: postId,
              ...post,
              favoritedAt: favData.favoritedAt || null,
            };
          })
        );

        setFavorites(favPosts.filter(Boolean) as any[]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const { searchText, selectedCategory } = useSearch();

  const filtered = favorites.filter((p) => {
    const search = searchText.toLowerCase();

    const matchSearch =
      p.title?.toLowerCase().includes(search) ||
      p.authorName?.toLowerCase().includes(search) ||
      p.categoryNames?.some((name: string) =>
        name.toLowerCase().includes(search)
      );

    const matchCategory =
      !selectedCategory || p.categories?.includes(selectedCategory);

    return matchSearch && matchCategory;
  });

  if (!uid)
    return (
      <div className="p-6">
        <p className="text-gray-600">Login to see your favorites.</p>
      </div>
    );

  return (
    <div className="p-6 text-black">
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-6">Your Favorites</h1>

        {loading && <p>Loading...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-gray-600">No favorite posts yet.</p>
        )}

        <div className="flex flex-col gap-4">
          {filtered.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="border border-[#D9D9D9] rounded-lg p-4 flex gap-4 hover:bg-gray-50 transition"
            >
              {post.coverImageUrl && (
                <img
                  src={post.coverImageUrl}
                  className="w-32 h-20 object-cover rounded"
                  alt="cover"
                />
              )} 

              <div className="flex flex-col justify-between">
                <h2 className="text-xl font-semibold">{post.title}</h2>

                <p className="text-xs text-gray-800 mt-1">
                  Category: {post.categoryNames?.join(", ")}
                </p>

                {post.favoritedAt && (
                  <p className="text-xs text-gray-600 mt-1">
                    Favorited At: {post.favoritedAt.toDate().toLocaleString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
