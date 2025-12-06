"use client";
import Protected from "@/components/Protected";
import Sidebar from "@/components/sidebar";
import UserNavbar from "@/components/usernavbar";

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen min-w-screen bg-white text-black">
      <Protected>
      {children}
      </Protected>
    </div>
  );
}