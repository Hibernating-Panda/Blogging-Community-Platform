"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

type Forum = {
  id: string;
  title?: string;
  authorId?: string;
  authorName?: string;
  authorImage?: string;
  createdAt?: any;
  updatedAt?: any;
  answersCount?: number;
  isLocked?: boolean;
};

function toMillis(value: any): number {
  if (!value) return 0;
  if (value?.toMillis) return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  if (value?._seconds) return value._seconds * 1000;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function formatDate(value: any) {
  if (!value) return "—";
  let date: Date | null = null;
  if (value?.toMillis) date = new Date(value.toMillis());
  else if (value?.seconds) date = new Date(value.seconds * 1000);
  else if (value?._seconds) date = new Date(value._seconds * 1000);
  else if (typeof value === "number") date = new Date(value);
  else if (typeof value === "string") return value.replace(/\s*UTC[+-]\d+/i, "").trim();
  if (!date || isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()} className="bg-white p-6 rounded-xl w-[450px]">
        {children}
      </div>
    </div>
  );
}

export default function AdminForumManagementPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [selectedDeleteForum, setSelectedDeleteForum] = useState<Forum | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const res = await fetch("/api/admin/forums", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setForums(data);
      setLoading(false);
    };
    load();
  }, []);

  const deleteForum = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch(`/api/admin/forums/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setForums((prev) => prev.filter((f) => f.id !== id));
  };

  const list = useMemo(() => {
    const q = search.toLowerCase();
    return [...forums]
      .filter((f) => f.title?.toLowerCase().includes(q) || f.authorName?.toLowerCase().includes(q))
      .sort((a, b) => {
        const aTime = toMillis(a.createdAt);
        const bTime = toMillis(b.createdAt);
        return sort === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [forums, search, sort]);

  return (
    <div className="p-6 bg-white text-black cursor-default">
      <h1 className="text-3xl font-bold mb-4">Forum Management</h1>

      <div className="flex gap-4 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, author"
          className="px-3 py-2 border rounded w-[300px]"
        />

        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="px-3 py-2 border rounded cursor-pointer">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {loading && <p>Loading…</p>}

      {!loading && (
        <div className="border rounded">
          {list.map((f) => (
            <div key={f.id} className="flex gap-4 px-4 py-3 border-b items-center hover:bg-gray-100">       

              <div className="flex-1">
                <p className="font-medium">{f.title}</p>
                <p className="text-sm text-gray-400">Created: {formatDate(f.createdAt)}</p>
              </div>

              <div className="text-sm text-gray-500 text-right">
                💬 {f.answersCount ?? 0}
              </div>

              <button onClick={() => setSelectedForum(f)} className="px-3 py-1 border rounded cursor-pointer">View</button>
              <button onClick={() => setSelectedDeleteForum(f)} className="px-3 py-1 border rounded text-red-500 cursor-pointer">Delete</button>
            </div>
          ))}
        </div>
      )}

      {selectedForum && (
        <Modal onClose={() => setSelectedForum(null)}>
          <p><b>Title:</b> {selectedForum.title}</p>
          <p><b>Author:</b> {selectedForum.authorName}</p>
          <p><b>Created:</b> {formatDate(selectedForum.createdAt)}</p>
          <p><b>Updated:</b> {formatDate(selectedForum.updatedAt)}</p>
          <p><b>Answers:</b> {selectedForum.answersCount ?? 0}</p>
        </Modal>
      )}

      {selectedDeleteForum && (
        <Modal onClose={() => setSelectedDeleteForum(null)}>
          <p>Delete "{selectedDeleteForum.title}"?</p>
          <button
            onClick={() => {
              deleteForum(selectedDeleteForum.id);
              setSelectedDeleteForum(null);
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
