"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
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

    const loadFavorites = async () => {
      setLoading(true);

      // Get list of favorite post IDs
      const favSnap = await getDocs(collection(db, "favorites", uid, "posts"));

      const favPosts: any[] = [];

      for (const fav of favSnap.docs) {
        const postId = fav.id;

        const favData = fav.data(); // <-- contains favoritedAt

        const postSnap = await getDoc(doc(db, "posts", postId));
        if (postSnap.exists()) {
          favPosts.push({
            id: postId,
            ...postSnap.data(),
            favoritedAt: favData.favoritedAt || null,
          });
        }
      }


      setFavorites(favPosts);
      setLoading(false);
    };

    loadFavorites();
  }, [uid]);

  const { searchText, selectedCategory } = useSearch();

  const filtered = favorites.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchText.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchText.toLowerCase());

    const matchCategory =
      !selectedCategory || p.categoryId === selectedCategory;

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
        <h1 className="text-3xl font-bold mb-6">❤️ Your Favorites</h1>

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
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  className="w-32 h-20 object-cover rounded"
                  alt="cover"
                />
              )}

              <div className="flex flex-col justify-between">
                <h2 className="text-xl font-semibold">{post.title}</h2>

                <p className="text-xs text-gray-800 mt-1">
                  Category: {post.categoryName}
                </p>

                {post.viewCount !== undefined && (
                  <p className="text-xs text-gray-600 mt-1">
                    Favorited At: {post.favoritedAt?.toDate?.().toLocaleString()}
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
