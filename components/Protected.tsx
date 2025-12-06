"use client";

import useUser from "@/hooks/useUser";
import { redirect } from "next/navigation";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) return <p>Loading...</p>;
  if (!user) redirect("/login");

  return <>{children}</>;
}
