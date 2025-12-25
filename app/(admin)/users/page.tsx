"use client";

import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import Image from "next/image";
import React, { useState } from "react";

const users = [
  {
    id: 1,
    name: "JohnDoe",
    dob: "10/02/2004",
    image: "/profile.jpg",
  },
  {
    id: 2,
    name: "Nika",
    dob: "11/10/2003",
    image: "/profile.jpg",
  },
  {
    id: 3,
    name: "Lucas",
    dob: "11/10/2003",
    image: "/profile.jpg",
  },
];

export default function AdminCommunityPage() {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<any>(null);

  return (
    <div className="min-h-screen min-w-screen bg-white text-black">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
        <Navbar />
      </div>

      <div className="flex pt-16 h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r">
          <Sidebar />
        </div>

        {/* Main */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-gray-100 rounded-2xl border-2 border-black shadow-md p-6">
            <h1 className="text-4xl font-bold mb-5">Users Management</h1>
            <h2 className="text-3xl text-gray-500">User List</h2>

            <div className="bg-white p-6 rounded-2xl mt-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex p-4 mb-4 hover:bg-gray-100 rounded-2xl items-center"
                >
                  {/* Profile image */}
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={80}
                    height={80}
                    className="rounded-4xl"
                  />

                  {/* User info */}
                  <div className="flex flex-col ml-4">
                    <p className="text-lg font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.dob}</p>
                  </div>

                  {/* View details */}
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="ml-auto mr-3 px-4 py-2 border rounded-lg hover:bg-blue-100"
                  >
                    View
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setSelectedDeleteUser(user)}
                    className="flex items-center border-2 rounded-lg hover:bg-red-100 p-2"
                  >
                    <span className="text-red-500 mr-2">Delete</span>
                    <Image
                      src="/delete.png"
                      alt="delete"
                      width={20}
                      height={20}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Popup */}
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
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <div className="flex items-center mb-4">
              <Image
                src={selectedUser.image}
                alt={selectedUser.name}
                width={80}
                height={80}
                className="rounded-4xl"
              />
              <div className="ml-4">
                <h2 className="text-xl font-semibold">
                  {selectedUser.name}
                </h2>
              </div>
            </div>

            <p>
              <strong>DOB:</strong> {selectedUser.dob}
            </p>
            <p>
              <strong>ID:</strong> {selectedUser.id}
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
            className="bg-white rounded-2xl p-6 w-[400px] relative"
          >
            <button
              onClick={() => setSelectedDeleteUser(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Delete User: {selectedDeleteUser.name}
            </h2>

            <p>Are you sure you want to delete this user?</p>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setSelectedDeleteUser(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle deletion logic here
                  setSelectedDeleteUser(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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