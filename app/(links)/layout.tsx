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
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
        <UserNavbar />
      </div>
      <div className="flex pt-16 h-screen">
        <div className="w-1/6 h-full bg-white border-r">
          <Sidebar />
        </div>
        <div className="w-5/6 overflow-y-auto">
          {children}
        </div>
      </div>
      </Protected>
    </div>
  );
}