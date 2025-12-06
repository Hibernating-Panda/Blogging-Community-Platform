"use client";

import { useState } from "react";
import { login, googleLogin } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await login(email, password);
      window.location.href = "/home";
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="font-bold">Login</h1>

      <input
        className="border p-2 block"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 block"
        placeholder="password"
        value={password}
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} className="mt-2 bg-[#282D38] text-white px-4 py-2">
        Login
      </button>

      <button
        onClick={googleLogin}
        className="mt-2 bg-black text-white px-4 py-2"
      >
        Login with Google
      </button>
    </div>
  );
}
