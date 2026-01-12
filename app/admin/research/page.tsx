"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

/* ================= TYPES ================= */

type Post = {
  id: string;
  title?: string;
  summary?: string;
  authorId?: string;
  authorName?: string;
  authorImage?: string;
  categoryNames?: string[];
  coverImageUrl?: string;
  createdAt?: any;
  updatedAt?: any;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  isPublished?: boolean;
};

/* ================= HELPERS ================= */

// Parse ANY date shape → ms (for sorting)
function toMillis(value: any): number {
  if (!value) return 0;

  if (value.seconds) return value.seconds * 1000;
  if (value._seconds) return value._seconds * 1000;
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

// Format date WITHOUT timezone text
function formatDate(value: any) {
  if (!value) return "—";

  let date: Date | null = null;

  if (value.seconds) date = new Date(value.seconds * 1000);
  else if (value._seconds) date = new Date(value._seconds * 1000);
  else if (typeof value === "number") date = new Date(value);
  else if (typeof value === "string") {
    return value.replace(/\s*UTC[+-]\d+/i, "").trim();
  }

  if (!date || isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ================= MODAL ================= */

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white p-6 rounded-xl w-[450px]"
      >
        {children}
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminPostManagementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDeletePost, setSelectedDeletePost] = useState<Post | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    const load = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/admin/posts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts(await res.json());
      setLoading(false);
    };

    load();
  }, []);

  /* ---------- DELETE ---------- */
  const deletePost = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;

    await fetch(`/api/admin/posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  /* ---------- SORT + SEARCH ---------- */
  const list = useMemo(() => {
    const q = search.toLowerCase();

    return [...posts]
      .filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.authorName?.toLowerCase().includes(q) ||
          p.categoryNames?.some((name) => name.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const aTime = toMillis(a.createdAt);
        const bTime = toMillis(b.createdAt);
        return sort === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [posts, search, sort]);

  /* ---------- UI ---------- */
  return (
    <div className="p-6 bg-white text-black cursor-default">
      <h1 className="text-3xl font-bold mb-4">
        Research Management
      </h1>

      <div className="flex gap-4 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, author, category"
          className="px-3 py-2 border rounded w-[300px]"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="px-3 py-2 border rounded cursor-pointer"
        > 
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* List */}
      {loading && <p>Loading…</p>}

      {!loading && (
        <div className="border rounded">
          {list.map((p) => (
            <div
              key={p.id}
              className="flex gap-4 px-4 py-3 border-b items-center hover:bg-gray-100"
            >
              {/* Cover */}
              {p.coverImageUrl ? (
                <img
                  src={p.coverImageUrl}
                  className="w-14 h-14 rounded object-cover"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-200 rounded" />
              )}

              {/* Info */}
              <div className="flex-1">
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-gray-500">
                  {p.authorName} · {p.categoryNames?.join(", ")}
                </p>
                <p className="text-sm text-gray-400">
                  Created: {formatDate(p.createdAt)}
                </p>
              </div>

              {/* Stats */}
              <div className="text-sm text-gray-500 text-right">
                ❤️ {p.likeCount ?? 0}<br />
                💬 {p.commentCount ?? 0}<br />
              </div>

              <button
                onClick={() => setSelectedPost(p)}
                className="px-3 py-1 border rounded cursor-pointer"
              >
                View
              </button>

              <button
                onClick={() => setSelectedDeletePost(p)}
                className="px-3 py-1 border rounded text-red-500 cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedPost && (
        <Modal onClose={() => setSelectedPost(null)}>
          {selectedPost.coverImageUrl && (
          <img
            src={selectedPost.coverImageUrl}
            className="w-full h-64 object-contain rounded mb-3"
          />
          )}
          <p><b>Title:</b> {selectedPost.title}</p>
          <p><b>Author:</b> {selectedPost.authorName}</p>
          <p><b>Category:</b> {selectedPost.categoryNames?.join(", ")}</p>
          <p><b>Created:</b> {formatDate(selectedPost.createdAt)}</p>
          <p><b>Updated:</b> {formatDate(selectedPost.updatedAt)}</p>
        </Modal>
      )}

      {/* Delete Modal */}
      {selectedDeletePost && (
        <Modal onClose={() => setSelectedDeletePost(null)}>
          <p>Delete "{selectedDeletePost.title}"?</p>
          <button
            onClick={() => {
              deletePost(selectedDeletePost.id);
              setSelectedDeletePost(null);
            }}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded cursor-pointer"
          >
            Confirm Delete
          </button>
        </Modal>
      )}
    </div>
  );
}
