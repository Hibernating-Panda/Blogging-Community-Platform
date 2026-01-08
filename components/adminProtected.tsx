"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminProtected({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const token = await user.getIdTokenResult();

      // 🔒 ADMIN CHECK
      if (!token.claims.admin) {
        router.replace("/403"); // or "/"
        return;
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Checking permissions…
      </div>
    );
  }

  return <>{children}</>;
}
