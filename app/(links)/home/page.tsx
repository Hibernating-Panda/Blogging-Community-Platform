"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { useSearch } from "@/context/SearchContext";

export default function HomePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const uid = auth.currentUser?.uid;
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      const postSnap = await getDocs(collection(db, "posts"));

      const results: any[] = [];

      for (const postDoc of postSnap.docs) {
        const postId = postDoc.id;
        const post = postDoc.data();

        // Use aggregated likeCount stored on the post
        let userLiked = false;
        let isFavorited = false;

        // Only check the current user's like doc (allowed by rules)
        if (uid) {
          const myLikeRef = doc(db, "likes", postId, "users", uid);
          const myLikeSnap = await getDoc(myLikeRef);
          userLiked = myLikeSnap.exists();
          // favorite state
          const favRef = doc(db, "favorites", uid, "posts", postId);
          const favSnap = await getDoc(favRef);
          isFavorited = favSnap.exists();
        }

        results.push({
          id: postId,
          ...post,
          likeCount: post.likeCount || 0,
          userLiked,
          isFavorited,
        });
      }

      setPosts(results);
    };

    loadPosts();
  }, [uid]);

  // LIKE
  const toggleLike = async (postId: string) => {
    if (!uid || !auth.currentUser) return alert("Login required");

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: 1 }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Like failed");

      const { likeCount, value } = json; // value: 1 (liked) or 0 (removed)
      setPosts((curr) =>
        curr.map((p) =>
          p.id === postId ? { ...p, userLiked: value === 1, likeCount } : p
        )
      );
    } catch (e) {
      console.error(e);
      alert("Failed to like. Please try again.");
    }
  };


  // FAVORITE
  const toggleFavorite = async (postId: string, isFav: boolean) => {
  if (!auth.currentUser) return alert("Login required");

  const token = await auth.currentUser.getIdToken();

  const res = await fetch(`/api/posts/${postId}/favorite`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });

  const data = await res.json();


  setPosts((curr) =>
    curr.map((p) =>
      p.id === postId ? { ...p, isFavorited: data.favorited } : p
    )
  );
};

  const { searchText, selectedCategory } = useSearch();

  const filtered = posts.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.authorName.toLowerCase().includes(searchText.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchText.toLowerCase());

    const matchCategory =
      !selectedCategory || p.categoryId === selectedCategory;

    return matchSearch && matchCategory;
  });



  return (
    <div className="p-6 text-black flex">
      <div className="w-2/3">
        {filtered.map((post) => {
          const liked = post.likedBy?.includes(uid);
          const isFav = post.isFavorited;

          return (
            <div key={post.id} className="border rounded-lg p-4 mb-4 shadow bg-white">
              {/* AUTHOR */}
              <div className="flex gap-2 mb-2 items-center">
                <Image
                  src={post.authorImage || "/profile.jpg"}
                  alt="author"
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold">{post.authorName}</p>
                  <p className="text-gray-500 text-sm">
                    {post.createdAt.toDate().toLocaleString()} • {post.categoryName}
                  </p>
                </div>
              </div>

              <Link href={`/post/${post.id}`}>
                <h2 className="text-xl font-bold">{post.title}</h2>
                <p className="text-gray-700">{post.summary}</p>
                <img src={post.coverImage} className="w-full rounded mt-3" />
              </Link>

              {/* ACTIONS */}
              <div className="flex justify-between mt-3 text-gray-600">
                <div className="flex gap-6 items-center">

                  {/* LIKE BUTTON */}
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="flex gap-2 items-center cursor-pointer"
                  >
                    {post.userLiked ? (
                      // FILLED LIKE (your SVG)
                      <Image src="/thumbs-up-solid.svg" width="24" height="24" alt="like" />
                    ) : (
                      // OUTLINE LIKE
                      <Image src="/thumbs-up-regular.svg" width="24" height="24" alt="like"/>
                    )}
                    <span>{post.likeCount || 0}</span>
                  </button>

                  {/* COMMENT COUNT */}
                  <div className="flex gap-2 items-center">
                    <Image src="/comment-solid.svg" width="24" height="24" alt="comment"/>
                    {post.commentCount || 0}
                  </div>

                  {/* FAVORITE BUTTON */}
                  <button
                    onClick={() => toggleFavorite(post.id, isFav)}
                    className="flex gap-2 items-center cursor-pointer"
                  >
                    {isFav ? (
                      // FILLED HEART
                      <Image src="/heart-solid.svg" width="24" height="24" alt="heart" />
                    ) : (
                      // OUTLINE HEART
                      <Image src="/heart-regular.svg" width="24" height="24" alt="heart" />
                    )}
                  </button>

                  
                </div>

                {/* SHARE */}
                <button
                  onClick={() => setShareLink(`${window.location.origin}/post/${post.id}`)}
                  className="cursor-pointer"
                >
                  <Image src="/share-solid.svg" width="24" height="24" alt="share" />
                </button>

                {shareLink && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
                    <div className="bg-white p-6 rounded shadow-lg w-80 animate-fadeIn z-100">
                      <h3 className="font-bold mb-3">Share Post</h3>

                      <p className="text-sm break-all border p-2 rounded bg-gray-100">
                        {shareLink}
                      </p>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          setCopied(true);

                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="bg-blue-600 text-white w-full mt-4 py-2 rounded cursor-pointer"
                      >
                        {copied ? "Link Copied!" : "Copy Link"}
                      </button>

                      <button
                        onClick={() => setShareLink(null)}
                        className="w-full mt-2 py-2 border rounded cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}


              </div>
            </div>
          );
        })}
      </div>

      <div className="w-1/3 pl-6" />
    </div>
  );
}
