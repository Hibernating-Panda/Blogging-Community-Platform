"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type User = {
  id: string;
  username?: string;
  bio?: string;
  gender?: string;
  photoURL?: string;
  email?: string;
  uid?: string;
  workplace?: string;
  createdAt?: number;
};

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<User | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "oldest" | "newest" | "7days" | "30days"
  >("newest");

  useEffect(() => {
    const loadUsers = async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUsers(data);
    };

    loadUsers();
  }, []);

  const deleteUser = async (uid: string) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;

    await fetch(`/api/admin/users/${uid}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers((prev) => prev.filter((u) => u.id !== uid));
  };

  const now = Date.now();

  const filteredUsers = users
    .filter((user) => {
      /* ---------- SEARCH ---------- */
      const matchesSearch =
        user.username?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.uid?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      /* ---------- DATE FILTER ---------- */
      if (!user.createdAt) return false;

      if (dateFilter === "7days") {
        return user.createdAt >= now - 7 * 24 * 60 * 60 * 1000;
      }

      if (dateFilter === "30days") {
        return user.createdAt >= now - 30 * 24 * 60 * 60 * 1000;
      }

      return true; // all / oldest / newest
    })
    .sort((a, b) => {
      const aTime = a.createdAt ?? 0;
      const bTime = b.createdAt ?? 0;

      if (dateFilter === "newest") {
        return bTime - aTime;
      }

      // default + "oldest"
      return aTime - bTime;
    });

  return (
    <div className="w-full h-full bg-white text-black cursor-default">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="bg-gray-100 rounded-2xl border-2 border-[#3D3D3D] shadow-md p-6">
          <h1 className="text-4xl font-bold mb-4">Users Management</h1>

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4 mb-6 
                          bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">

            {/* 🔍 Search */}
            <div className="relative w-full md:w-[300px]">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-2 pr-4 py-2 border rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>

            {/* 📅 Date Filter */}
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-sm font-medium">
                Sort / Filter:
              </span>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-4 py-2 border rounded-xl bg-white cursor-pointer
                          focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value="newest">Most recent</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>

          </div>



          <h2 className="text-3xl text-gray-500">User List</h2>

          <div className="bg-white p-6 rounded-2xl mt-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex p-4 mb-4 hover:bg-gray-100 rounded-2xl items-center"
              >
                <Image
                  src={user.photoURL || "/profile.jpg"}
                  alt="profile"
                  width={80}
                  height={80}
                  className="rounded-2xl"
                />

                <div className="flex flex-col ml-4">
                  <p className="text-lg font-medium">
                    {user.username || "Unnamed User"}
                  </p>
                  <p className="text-sm text-gray-500">{user.email || "No email"}</p>
                </div>

                <button
                  onClick={() => setSelectedUser(user)}
                  className="ml-auto mr-3 px-4 py-2 border rounded-lg hover:bg-blue-100 cursor-pointer"
                >
                  View
                </button>

                <button
                  onClick={() => setSelectedDeleteUser(user)}
                  className="flex items-center border-2 rounded-lg hover:bg-red-100 p-2 cursor-pointer"
                >
                  <span className="text-red-500 mr-2">Delete</span>
                  <Image src="/delete.png" alt="delete" width={20} height={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* View Popup */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-[400px] relative"
          >
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-3 right-3 hover:text-red-500 cursor-pointer"
            >
              ✕
            </button>

            <Image
              src={selectedUser.photoURL || "/profile.jpg"}
              alt="profile"
              width={80}
              height={80}
              className="rounded-2xl"
            />

            <p className="mt-4">
              <strong>UID:</strong> {selectedUser.uid}
            </p>
            <p>
              <strong>Username:</strong> {selectedUser.username || "—"}
            </p>
            <p>
              <strong>Gender:</strong> {selectedUser.gender || "—"}
            </p>
            <p>
              <strong>Workplace:</strong> {selectedUser.workplace || "—"}
            </p>
            <p>
              <strong>Bio:</strong> {selectedUser.bio || "—"}
            </p>
            <p>
              <strong>Created At:</strong> {" "}
              {selectedUser.createdAt
                ? formatMillis(selectedUser.createdAt)
                : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Delete Popup */}
      {selectedDeleteUser && (
        <div
          onClick={() => setSelectedDeleteUser(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-[400px]"
          >
            <h2 className="text-xl font-semibold mb-4">
              Delete {selectedDeleteUser.username}?
            </h2>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setSelectedDeleteUser(null)}
                className="px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteUser(selectedDeleteUser.id);
                  setSelectedDeleteUser(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg cursor-pointer hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMillis(ms: number) {
  return new Date(ms).toLocaleString();
}