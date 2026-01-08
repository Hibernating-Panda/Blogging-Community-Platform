"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";

/* ================= TYPES ================= */

type Community = {
  id: string;
  name?: string;
  ownerId?: string;
  visibility?: string;
  profileImage?: string;
  createdAt?: any; // Firestore Timestamp OR ms
  totalMembers?: number;
};

/* ================= HELPERS ================= */

// Firestore Timestamp OR number → formatted string (NO UTC)
function formatCreatedAt(value: any) {
    if (!value) return "—";

    // Already formatted string (your case)
    if (typeof value === "string") {
        return value.replace(/\s*UTC[+-]\d+/i, "").trim();
    }

    // Firestore Timestamp (client SDK)
    if (value.seconds) {
        return new Date(value.seconds * 1000).toLocaleString();
    }

    // Firestore Admin SDK
    if (value._seconds) {
        return new Date(value._seconds * 1000).toLocaleString();
    }

    // Milliseconds
    if (typeof value === "number") {
        return new Date(value).toLocaleString();
    }

    return "—";
}

function toMillis(value: any): number {
    if (!value) return 0;

    // Firestore client SDK
    if (value.seconds) {
        return value.seconds * 1000;
    }

    // Firestore admin SDK
    if (value._seconds) {
        return value._seconds * 1000;
    }

    // Milliseconds
    if (typeof value === "number") {
        return value;
    }

    // Formatted date string (YOUR CASE)
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
    }


/* ================= AVATAR ================= */

function CommunityAvatar({
  name,
  image,
}: {
  name?: string;
  image?: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt="community"
        className="w-10 h-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center font-semibold">
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
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
        className="bg-white p-6 rounded-xl w-[400px]"
      >
        {children}
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminCommunityManagementPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] =
    useState<Community | null>(null);
  const [selectedDeleteCommunity, setSelectedDeleteCommunity] =
    useState<Community | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"oldest" | "newest">("newest");
  const [loading, setLoading] = useState(true);

  /* ---------- LOAD ---------- */
  useEffect(() => {
    const load = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/admin/communities", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCommunities(await res.json());
      setLoading(false);
    };

    load();
  }, []);

  /* ---------- DELETE ---------- */
  const deleteCommunity = async (id: string) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;

    await fetch(`/api/admin/communities/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setCommunities((prev) => prev.filter((c) => c.id !== id));
  };

  /* ---------- SORT + SEARCH ---------- */
  const list = useMemo(() => {
    const q = search.toLowerCase();

    return [...communities]
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.ownerId?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aTime = toMillis(a.createdAt);
        const bTime = toMillis(b.createdAt);
        return sort === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [communities, search, sort]);

  /* ---------- UI ---------- */
  return (
    <div className="p-6 bg-white text-black cursor-default">
      <h1 className="text-3xl font-bold mb-4">
        Community Management
      </h1>

      {/* Controls */}
      <div className="flex gap-4 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or owner ID"
          className="px-3 py-2 border rounded w-[260px]"
        />

        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as "oldest" | "newest")
          }
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
          {list.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 border-b hover:bg-gray-100"
            >
              <CommunityAvatar
                name={c.name}
                image={c.profileImage}
              />

              <div className="flex-1">
                <p className="font-medium">{c.name}</p>
                <p className="text-sm text-gray-500">
                    {c.totalMembers ?? 0} members | {c.visibility}
                </p>
              </div>

              <button
                onClick={() => setSelectedCommunity(c)}
                className="px-3 py-1 border rounded cursor-pointer hover:bg-gray-300"
              >
                View
              </button>

              <button
                onClick={() => setSelectedDeleteCommunity(c)}
                className="px-3 py-1 border rounded text-red-500 cursor-pointer hover:bg-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedCommunity && (
        <Modal onClose={() => setSelectedCommunity(null)}>
            <CommunityAvatar
                name={selectedCommunity.name}
                image={selectedCommunity.profileImage}
              />
            <p><b>Name:</b> {selectedCommunity.name}</p>
            <p><b>ID:</b> {selectedCommunity.id}</p>
            <p><b>Owner_ID:</b> {selectedCommunity.ownerId}</p>
            <p><b>Created:</b> {formatCreatedAt(selectedCommunity.createdAt)}</p>
            <p><b>Members:</b> {selectedCommunity.totalMembers}</p>
        </Modal>
      )}
      
      {/* Delete Modal */}
      {selectedDeleteCommunity && (
        <Modal onClose={() => setSelectedDeleteCommunity(null)}>
          <p>Delete {selectedDeleteCommunity.name}?</p>
          <button
            onClick={() => {
              deleteCommunity(selectedDeleteCommunity.id);
              setSelectedDeleteCommunity(null);
            }}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            Confirm Delete
          </button>
        </Modal>
      )}
    </div>
  );
}