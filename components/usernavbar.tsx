"use client";

import Image from "next/image";
import Link from "next/link";
import useUser from "@/hooks/useUser";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useSearch } from "@/context/SearchContext";

export default function UserNavbar() {
  const { user } = useUser();

  const displayName = user?.username || "Guest";
  const displayPhoto = user?.photoURL || "/profile.jpg";

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

      <div className="flex items-center gap-3 mx-auto col-start-3 w-[500px]">

      {/* SEARCH BAR */}
      <div className="relative w-full">
    <input
      type="text"
      placeholder="Search"
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      className="w-full px-3 py-1 border rounded-lg"
    />

    <Image
      src="/search.svg"
      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
      width={24}
      height={24}
      alt="search"
    />
</div>


      {/* CATEGORY DROPDOWN */}
      <select
        value={selectedCategory ?? ""}
        onChange={(e) =>
          setSelectedCategory(e.target.value === "" ? null : e.target.value)
        }
        className="px-3 pt-2 pb-1  border rounded-lg"
      >
        <option value="">All Categories</option>

        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
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
        <svg className="cursor-pointer" xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor">
          <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z"/>
        </svg>

        {/* PROFILE DROPDOWN */}
        <div ref={dropdownRef} className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center">
            <Image
              src={displayPhoto}
              alt="Profile"
              width={50}
              height={50}
              className="h-10 w-10 rounded-full object-cover cursor-pointer"
            />
          </button>

          {/* DROPDOWN MENU */}
          {open && (
            <div className="absolute right-0 mt-3 w-40 bg-white border rounded-lg shadow-lg z-50">

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
