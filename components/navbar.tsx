"use client";

import Image from "next/image"
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="px-3 py-1 h-full w-full justify-between flex">
      <Link href="/" className="flex items-center h-full gap-2">
        <Image src="/logo.png" alt="Logo" width={100} height={100} className="h-10 w-10"/>
        <h1 className="font-bold text-center text-2xl bg-gradient-to-r from-[#282D38] to-[#C19858] bg-clip-text text-transparent">ResearcHub</h1>
      </Link>
      <div className="flex h-full gap-2 items-center justify-center">
        <Link href="/signup" className="text-white bg-black px-4 py-1 rounded-4xl hover:bg-black/80">Sign Up</Link>
        <Link href="/login" className="text-white bg-black px-4 py-1 rounded-4xl hover:bg-black/80">Login</Link>
      </div>
    </div>
  )
}