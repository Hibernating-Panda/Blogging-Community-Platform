"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorLength, setErrorLength] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [errorUsername, setErrorUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSignup = async () => {
    setErrorEmail(null);
    setErrorLength(null);
    setErrorPassword(null);
    setErrorUsername(null);
    setLoading(true);

    if (username.length < 3) {
      setErrorUsername("Username must be at least 3 characters long");
      setLoading(false);
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorEmail("Invalid email address");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorLength("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorPassword("Passwords do not match");
      setLoading(false);
      return;
    }
    
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Save user profile
      await setDoc(doc(db, "users", userCred.user.uid), {
        uid: userCred.user.uid,
        email: userCred.user.email,
        username: username,
        photoURL: "",
        bio: "",
        role: "user",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log("STEP 3 - User profile saved!");
      
      await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      window.location.href = "/verify";

    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };
 
  return (
    <div className="flex items-center justify-center h-screen bg-white text-black">
      <div className="w-full max-w-lg bg-[#F6F4EC] p-10 rounded-xl shadow-md flex items-center justify-center flex-col gap-4">
        
        <div className="w-full flex justify-start mb-[-12px]">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-black/10 cursor-pointer"
          >
            <svg className="text-gray-600" height={20} width={20} fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>
          </Link>
        </div>

        <Image src="/logo.png" alt="Logo" width={100} height={100} className="h-32 w-32"/>

        <h1 className="text-2xl cursor-default mt-2">Welcome to <span className="font-bold text-center bg-gradient-to-r from-[#282D38] to-[#C19858] bg-clip-text text-transparent">ResearcHub</span></h1>

        {errorUsername && (
          <div className="text-red-500 text-sm mb-[-20] px-4 self-start">
            {errorUsername}
          </div>
        )}

        <input
          className="py-2 px-4 rounded-3xl text-black w-full bg-white mt-2 focus:outline-none focus:ring-0"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {errorEmail && (
          <div className="text-red-500 text-sm mb-[-20] px-4 self-start">
            {errorEmail}
          </div>
        )}

        <input
          className="w-full py-2 px-4 rounded-3xl text-black focus:outline-none focus:ring-0 bg-white mt-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {errorLength && (
          <div className="text-red-500 text-sm mb-[-20] px-4 self-start">
            {errorLength}
          </div>
        )}

        {/* PASSWORD FIELD */}
        <div className="relative items-center rounded-3xl justify-between flex w-full bg-white mt-2">
          <input
            type={showPass ? "text" : "password"}
            className="w-full py-2 px-4 text-black focus:outline-none focus:ring-0"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="items-center p-2 cursor-pointer text-gray-600 hover:opacity-80"
          >
            {showPass ? (
              <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
            ) : (
              <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg>
            )}
          </button>
        </div>

        {/* CONFIRM PASSWORD FIELD */}
        {errorPassword && (
          <div className="text-red-500 text-sm mb-[-20] px-4 self-start">
            {errorPassword}
          </div>
        )}

        <div className="relative w-full items-center flex justify-between rounded-3xl bg-white mt-2">
          <input
            type={showConfirm ? "text" : "password"}
            className="w-full px-4 py-2 text-black focus:outline-none focus:ring-0"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className=" text-gray-600 items-center p-2 cursor-pointer hover:opacity-80"
          >
            {showConfirm ? (
              <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z"/></svg>
            ) : (
              <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m644-428-58-58q9-47-27-88t-93-32l-58-58q17-8 34.5-12t37.5-4q75 0 127.5 52.5T660-500q0 20-4 37.5T644-428Zm128 126-58-56q38-29 67.5-63.5T832-500q-50-101-143.5-160.5T480-720q-29 0-57 4t-55 12l-62-62q41-17 84-25.5t90-8.5q151 0 269 83.5T920-500q-23 59-60.5 109.5T772-302Zm20 246L624-222q-35 11-70.5 16.5T480-200q-151 0-269-83.5T40-500q21-53 53-98.5t73-81.5L56-792l56-56 736 736-56 56ZM222-624q-29 26-53 57t-41 67q50 101 143.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z"/></svg>
            )}
          </button>
        </div>

        <button
          onClick={onSignup}
          disabled={loading}
          className={`bg-[#282D38] text-white px-8 py-2 rounded-3xl hover:opacity-80 mt-2
            ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <div className="cursor-default">
          Already have an account? <Link href="/login" className="underline text-[#282D38] cursor-pointer hover:opacity-70">Login</Link>
        </div>
      </div>
    </div>
  );
}
