"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { useSearch } from "@/context/SearchContext";

interface Post {
  id: string;
  title: string;
  summary: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  categoryId: string;
  categoryName: string;
  createdAt: any;
  likeCount: number;
  userLiked?: boolean;
  isFavorited?: boolean;
  commentCount?: number;
}

interface PostCardProps {
  userOnly?: boolean;
  userId?: string | null;
}

export default function PostCard({ userOnly = false, userId = null }: PostCardProps) {

    const [authReady, setAuthReady] = useState(false);


  const [posts, setPosts] = useState<Post[]>([]);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const uid = auth.currentUser?.uid;
  const { searchText, selectedCategory } = useSearch();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
        setAuthReady(true);
    });

    return () => unsubscribe();
    }, []);

  useEffect(() => {
    if (!authReady) return; // wait until auth state known to keep hook order stable
    const loadPosts = async () => {
      try {
        const postSnap = await getDocs(collection(db, "posts"));

        // ✅ Run like/favorite checks in PARALLEL for each post
        const results: Post[] = await Promise.all(
          postSnap.docs.map(async (postDoc) => {
            const postId = postDoc.id;
            const postData = postDoc.data() as Omit<Post, "id">;

            let userLiked = false;
            let isFavorited = false;

            if (uid) {
              const [myLikeSnap, favSnap] = await Promise.all([
                getDoc(doc(db, "likes", postId, "users", uid)),
                getDoc(doc(db, "favorites", uid, "posts", postId)),
              ]);

              userLiked = myLikeSnap.exists();
              isFavorited = favSnap.exists();
            }

            return {
              id: postId,
              ...postData,
              likeCount: postData.likeCount || 0,
              userLiked,
              isFavorited,
            };
          })
        );

        // Optional: sort newest first
        results.sort((a, b) => {
          const da =
            a.createdAt?.toDate?.() ??
            (typeof a.createdAt === "string"
              ? new Date(a.createdAt)
              : new Date(0));
          const db_ =
            b.createdAt?.toDate?.() ??
            (typeof b.createdAt === "string"
              ? new Date(b.createdAt)
              : new Date(0));
          return db_.getTime() - da.getTime();
        });

        setPosts(results);
      } catch (err) {
        console.error(err);
      }
    };

    // run once when auth is ready; refire when uid changes
    loadPosts();
  }, [uid, authReady]);

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
          p.id === postId
            ? { ...p, userLiked: value === 1, likeCount: likeCount ?? p.likeCount }
            : p
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

    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(`/api/posts/${postId}/favorite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setPosts((curr) =>
        curr.map((p) =>
          p.id === postId 
            ? { ...p, isFavorited: data.favorited,
              favoritedAt: data.favoritedAt ? new Date(data.favoritedAt) : null,
              }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to favorite. Please try again.");
    }
  };

  const [deletePopup, setDeletePopup] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  // ✅ useMemo to avoid re-filtering on every render
  const filteredPosts = useMemo(() => {
  const search = searchText.trim().toLowerCase();

  // 🔥 Correct, safe filtering logic
  const targetUserId = userOnly
    ? (userId || uid)     // Route UID → fallback to logged-in UID
    : null;

  return posts.filter((p) => {
    // 🔥 If viewing a profile → show ONLY that user's posts
    if (userOnly && targetUserId && p.authorId !== targetUserId) return false;

    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search) ||
      p.authorName.toLowerCase().includes(search) ||
      p.categoryName.toLowerCase().includes(search);

    const matchCategory =
      !selectedCategory || p.categoryId === selectedCategory;

    return matchSearch && matchCategory;
  });
}, [posts, searchText, selectedCategory, userOnly, userId, uid]);


  if (!authReady) return null; // or loading UI

  return (
    <div className="p-6 text-black flex">
      <div className="w-full">
        {filteredPosts.map((post) => {
          const isFav = !!post.isFavorited;
          const isOwner = uid === post.authorId;

          const createdAtDate =
            post.createdAt?.toDate?.() ??
            (typeof post.createdAt === "string"
              ? new Date(post.createdAt)
              : new Date());

          return (
            <div
              key={post.id}
              className="border border-[#D9D9D9] rounded-lg p-4 mb-4 shadow bg-white"
            >
              {/* AUTHOR */}
              <div className="flex gap-2 items-center justify-between">
                <div
                  className="flex gap-2 items-center cursor-pointer"
                  onClick={() => {
                    if (uid === post.authorId) {
                      window.location.href = "/profile";
                    } else {
                      window.location.href = `/profile/${post.authorId}`;
                    }
                  }}
                >
                  <Image
                    src={post.authorImage || "/profile.jpg"}
                    alt="author"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                  />

                  <div className="w-full">
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-gray-500 text-sm">
                      {createdAtDate.toLocaleString()} • {post.categoryName}
                    </p>
                  </div>
                </div>


                {isOwner && (
                  <div className="flex gap-3 justify-end mb-2">
                    {/* EDIT */}
                    <Link
                      href={`/post/${post.id}/edit`}
                      className="text-blue-500 hover:text-blue-800"
                    >
                      <svg
                        height="24"
                        width="24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                      >
                        <path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z" />
                      </svg>
                    </Link>

                    {/* DELETE */}
                    <button
                      onClick={() => setDeletePopup({ open: true, id: post.id })}
                      className="text-red-500 hover:text-red-800 cursor-pointer"
                    >
                      <svg
                        height="24"
                        width="24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                      >
                        <path d="M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z" />
                      </svg>
                    </button>

                    {deletePopup.open && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn cursor-default">
                      <div className="bg-white rounded-lg shadow-lg w-120 p-6 animate-fadeIn">

                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                          Confirm Delete
                        </h2>

                        <p className="text-gray-700">
                          Are you sure you want to delete this post?
                        </p>

                        <p className="text-gray-700 mb-6">This action cannot be undone.</p>
                  

                        <div className="flex justify-between">
                          <button
                            onClick={() => setDeletePopup({ open: false, id: null })}
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={() => {
                              if (deletePopup.id) handleDelete(deletePopup.id);
                              setDeletePopup({ open: false, id: null });
                            }}
                            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                  </div>
                )}
              </div>

              <Link href={`/post/${post.id}`}>
                <h2 className="text-xl font-bold">{post.title}</h2>

                {/* ✅ Use next/image for better performance */}
                {post.coverImage && (
                  <div className="w-full mt-3 rounded overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      width={1200}
                      height={675}
                      className="w-full h-auto rounded"
                    />
                  </div>
                )}

                <p className="text-gray-700 mt-3">{post.summary}</p>
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
                      <Image
                        src="/thumbs-up-solid.svg"
                        width={24}
                        height={24}
                        alt="like"
                      />
                    ) : (
                      <Image
                        src="/thumbs-up-regular.svg"
                        width={24}
                        height={24}
                        alt="like"
                      />
                    )}
                    <span>{post.likeCount || 0}</span>
                  </button>

                  {/* COMMENT COUNT */}
                  <div className="flex gap-2 items-center">
                    <Image
                      src="/comment-solid.svg"
                      width={24}
                      height={24}
                      alt="comment"
                    />
                    {post.commentCount || 0}
                  </div>

                  {/* FAVORITE BUTTON */}
                  <button
                    onClick={() => toggleFavorite(post.id, isFav)}
                    className="flex gap-2 items-center cursor-pointer"
                  >
                    {isFav ? (
                      <Image
                        src="/heart-solid.svg"
                        width={24}
                        height={24}
                        alt="heart"
                      />
                    ) : (
                      <Image
                        src="/heart-regular.svg"
                        width={24}
                        height={24}
                        alt="heart"
                      />
                    )}
                  </button>
                </div>

                {/* SHARE */}
                <button
                  onClick={() =>
                    setShareLink(
                      typeof window !== "undefined"
                        ? `${window.location.origin}/post/${post.id}`
                        : null
                    )
                  }
                  className="cursor-pointer"
                >
                  <Image
                    src="/share-solid.svg"
                    width={24}
                    height={24}
                    alt="share"
                  />
                </button>

                {shareLink && (
                  <div className="fixed bg-black/50 inset-0 flex items-center justify-center z-50 animate-fadeIn">
                    <div className="bg-white p-6 rounded shadow-lg w-120 animate-fadeIn">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold">Share Link</h3>

                        <button
                          onClick={() => setShareLink(null)}
                          className="cursor-pointer hover:opacity-75 text-black font-bold"
                        >
                          X
                        </button>
                      </div>

                      <div className="flex gap-2 justify-between">
                        <p className="text-sm w-full break-all border p-2 rounded bg-gray-100 overflow-x-auto text-nowrap hide-scrollbar">
                          {shareLink}
                        </p>

                        <button
                          onClick={() => {
                            if (!shareLink) return;
                            navigator.clipboard.writeText(shareLink);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          className="bg-blue-600 text-white p-2 rounded cursor-pointer "
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
