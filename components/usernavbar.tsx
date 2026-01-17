"use client";

import Image from "next/image";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useSearch } from "@/context/SearchContext";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function UserNavbar() {
  const { user } = useUser();
  const router = useRouter();

  const displayPhoto = user?.photoURL || "/profile.jpg";
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);


  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [catOpen, setCatOpen] = useState(false);
  const dropdownRef2 = useRef<HTMLDivElement>(null);
  const hasUnread = notifications.some((n) => !n.read);


  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "notifications", user.uid, "items"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setNotifications(list);
    });
  }, [user?.uid]);

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  const { searchText, setSearchText, selectedCategory, setSelectedCategory, categories } =
    useSearch();

  return (
    <div className="px-3 py-1 h-full w-full grid grid-cols-12">
      {/* LOGO */}
      <Link href="/home" className="flex items-center h-full gap-2 col-start-1">
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="h-10 w-10"/>
        <h1 className="font-bold text-center text-2xl bg-gradient-to-r from-[#282D38] to-[#C19858] bg-clip-text text-transparent">
          ResearcHub
        </h1>
      </Link>

      <div className="flex items-center gap-3 mx-auto col-start-3">

        {/* SEARCH BAR */}
        <div className="relative w-full flex justify-between items-center pl-3 pr-6 gap-1 py-1 border-[#D9D9D9] border rounded-3xl">
            <input
              type="text"
              placeholder="Search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="focus:outline-none"
            />

            <Image
              src="/search.svg"
              className="w-4 h-4 pointer-events-none"
              width={24}
              height={24}
              alt="search"
            />
        </div>


        {/* CATEGORY DROPDOWN */}
        <div className="relative" ref={dropdownRef2}>
          <button
            onClick={() => setCatOpen(!catOpen)}
            className="
              flex items-center justify-between
              px-4 py-1
              border border-[#D9D9D9] 
              rounded-3xl 
              bg-white
              cursor-pointer
              w-64
            "
          >
            <span className="truncate">
              {selectedCategory
                ? categories.find(c => c.id === selectedCategory)?.name
                : "All Categories"}
            </span>

            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                catOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* DROPDOWN MENU */}
          {catOpen && (
            <div
              className="
                absolute right-2 mt-3 
                bg-white rounded-lg shadow-lg z-50 
                pb-2
              "
            >
              {/* ALL CATEGORIES */}
              <div
                onClick={() => {
                  setSelectedCategory(null);
                  setCatOpen(false);
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer rounded-t-lg"
              >
                All Categories
              </div>

              {/* CATEGORY LIST */}
              <div>
                {categories.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setCatOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-nowrap"
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT SIDE ICONS */}
      <div className="col-end-13 flex gap-4 items-center text-black">

        {/* CREATE POST BUTTON + TOOLTIP */}
        <div className="relative group">
          <Link href="/create-post" className="border rounded px-2 py-1 cursor-pointer text-lg border-[#282D38] bg-[#282D38] text-white hover:opacity-80">
            +
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 
                          opacity-0 group-hover:opacity-100
                          bg-black text-white text-sm px-2 py-1 rounded 
                          pointer-events-none transition-opacity whitespace-nowrap">
            Create Post
          </div>
        </div>

        {/* NOTIFICATION ICON */}
        <div className="relative">
          <svg
            onClick={() => setNotifOpen(!notifOpen)}
            className="cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
            height="28px"
            viewBox="0 -960 960 960"
            width="28px"
            fill="currentColor"
          >
            <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80Z"/>
          </svg>

          {hasUnread && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
          )}
        </div>

        {notifOpen && (
          <div className="fixed right-20 top-12 bg-white rounded-lg shadow-lg z-50 h-80 overflow-y-auto hide-scrollbar"
            onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-2 border-b sticky top-0 bg-white max-w-80 min-w-80">
              <h3 className="font-semibold">Notifications</h3>
              <button onClick={() => setNotifOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
                ✕
              </button>
            </div>


            {notifications.length === 0 && (
              <p className="p-4 text-sm text-gray-500">No notifications</p>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={async () => {     
                  router.push(`/post/${n.postId}`);
                  await deleteDoc(
                    doc(db, "notifications", user!.uid, "items", n.id)
                  );
                }}
                className={`block px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 w-80 ${
                  !n.read ? "bg-blue-50" : ""
                }`}
              >
                <p className="font-medium">
                  {n.fromUsername} replied to {n.postTitle}
                </p>
                <p className="text-gray-600 truncate">{n.replyText}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {n.createdAt?.toDate?.().toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* PROFILE DROPDOWN */}
        <div ref={dropdownRef} className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center">
            <Image
              src={displayPhoto}
              alt="Profile"
              width={50}
              height={50}
              className="min-h-10 min-w-10 rounded-full object-cover cursor-pointer"
            />
          </button>

          {/* DROPDOWN MENU */}
          {open && (
            <div className="absolute right-0 mt-3 w-40 bg-white rounded-lg shadow-lg z-50">

              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-[#282D38]/30 text-sm rounded-t-lg"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>

              <Link
                href="/settings"
                className="block px-4 py-2 hover:bg-[#282D38]/30 text-sm"
                onClick={() => setOpen(false)}
              >
                Settings
              </Link>

              <button
                onClick={logout}
                className="cursor-pointer block px-4 py-2 hover:bg-[#282D38]/30 text-sm w-full text-left text-red-600 rounded-b-lg"
              >
                Logout
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
