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
import Image from "next/image";
import { useSearch } from "@/context/SearchContext";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  // ---------------------------------------
  // LOAD FAVORITES
  // ---------------------------------------
  useEffect(() => {
    if (!uid) return;

    const loadFavorites = async () => {
      setLoading(true);

      // Get list of postId that user favorited
      const favSnap = await getDocs(collection(db, "favorites", uid, "posts"));

      const favPosts: any[] = [];

      for (const fav of favSnap.docs) {
        const postId = fav.id;

        // Fetch actual post data
        const postSnap = await getDoc(doc(db, "posts", postId));
        if (postSnap.exists()) {
          favPosts.push({ id: postId, ...postSnap.data() });
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
      <div className="w-2/3">
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
            className="border rounded-lg p-4 shadow bg-white"
          >
            {/* AUTHOR */}
            <div className="flex gap-3 items-center mb-2">
              <Image
                src={post.authorImage || "/profile.jpg"}
                alt="author"
                width={36}
                height={36}
                className="rounded-full object-cover"
              />

              <div>
                <p className="font-semibold">{post.authorName}</p>

                {post.createdAt?.toDate && (
                  <p className="text-sm text-gray-600">
                    {post.createdAt.toDate().toLocaleString()} •{" "}
                    {post.categoryName}
                  </p>
                )}
              </div>
            </div>

            {/* TITLE + SUMMARY */}
            <h2 className="text-xl font-bold">{post.title}</h2>
            <p className="text-gray-700 mb-3">{post.summary}</p>

            {/* COVER IMAGE */}
            {post.coverImage && (
              <img
                src={post.coverImage}
                className="w-full rounded mt-2"
                alt="cover"
              />
            )}
          </Link>
        ))}
      </div>
      </div>
      
    </div>
  );
}
