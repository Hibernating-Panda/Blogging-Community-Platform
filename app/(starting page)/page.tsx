"use client";

import Link from "next/link";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function StartingPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/home"); // user logged in → go to home
      }
    });

    return () => unsub();
  }, []);
  return (
    <div className="h-full w-full bg-[#F6F4EC] flex items-center justify-between">
      <div className="ml-20 flex flex-col gap-4 cursor-default">
        <h1 className="text-7xl font-bold ">Enhance your
        <br />
        Research & idea</h1>
        <p className="text-2xl">The only place where you can find research idea and collaboration in Cambodia</p>
        <Link href="/signup" className="text-center bg-black rounded-4xl text-white text-lg p-2 w-75 cursor-pointer hover:opacity-80">Start Reading</Link>
      </div>
      <div>
        <Image src="/logo.png" alt="logo" width={500} height={500} />
      </div>
    </div>
  );
}
