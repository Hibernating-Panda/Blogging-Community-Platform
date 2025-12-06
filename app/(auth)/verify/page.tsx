"use client";

import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { sendEmailVerification } from "firebase/auth";

export default function VerifyEmailPage() {
  const [emailSent, setEmailSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resendEmail = async () => {
    if (!auth.currentUser) return;

    setErrorMsg(""); // clear old errors

    try {
      await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.currentUser.email }),
      });

      setEmailSent(true);
    } catch (err: any) {
      if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many requests. Please try again later.");
      } else {
        setErrorMsg("Failed to send email. Please try again.");
      }
    }
  };

  // Refresh user token every few seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload();

      if (auth.currentUser?.emailVerified) {
        window.location.href = "/home";
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-black">
      <div className="bg-white border shadow p-6 rounded-xl max-w-sm">

        <h1 className="text-xl font-bold mb-2">Verify Your Email</h1>
        <p className="text-sm mb-4">We’ve sent a verification link to:</p>
        <p className="font-semibold mb-6">{auth.currentUser?.email}</p>

        <button
          onClick={resendEmail}
          className="bg-[#282D38] text-white p-2 rounded w-full"
        >
          Resend Email
        </button>

        {/* SUCCESS */}
        {emailSent && (
          <p className="text-green-600 text-center mt-2">
            Verification email sent!
          </p>
        )}

        {/* ERROR */}
        {errorMsg && (
          <p className="text-red-600 text-center mt-2">
            {errorMsg}
          </p>
        )}

      </div>
    </div>
  );
}
