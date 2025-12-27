"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"idle" | "sent" | "error" | "cooldown">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Smooth auto redirect when verified
  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        window.location.href = "/home";
      }
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resendEmail = async () => {
    if (!auth.currentUser) return;

    setErrorMsg("");
    setStatus("cooldown");
    setCooldown(10); // 10-second cooldown to avoid spamming

    try {
      await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.currentUser.email }),
      });


      setStatus("sent");
    } catch (err: any) {
      setStatus("error");

      if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many requests. Please try again later.");
      } else {
        setErrorMsg("Failed to send verification email.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-black px-4">
      <div className="bg-white border shadow-lg p-8 rounded-2xl max-w-sm w-full animate-fadeIn">

        <h1 className="text-2xl font-bold mb-3">Check Your Email</h1>

        <p className="text-sm text-gray-600 mb-4">
          We've sent a verification link to
        </p>

        <p className="font-semibold mb-6 bg-gray-100 p-2 rounded text-center">
          {auth.currentUser?.email}
        </p>

        <button
          onClick={resendEmail}
          disabled={status === "cooldown"}
          className={`w-full py-2 rounded-lg text-white transition-all ${
            status === "cooldown"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#282D38] hover:bg-[#1e222b]"
          }`}
        >
          {status === "cooldown"
            ? `Resend in ${cooldown}s`
            : "Resend Verification Email"}
        </button>

        {/* SUCCESS */}
        {status === "sent" && (
          <p className="text-green-600 text-center mt-3 animate-fadeIn">
            Verification email sent!
          </p>
        )}

        {/* ERROR */}
        {status === "error" && (
          <p className="text-red-600 text-center mt-3 animate-fadeIn">
            {errorMsg}
          </p>
        )}

        <p className="mt-6 text-xs text-gray-500 text-center">
          This page will refresh automatically once your email is verified.
        </p>
      </div>
    </div>
  );
}
