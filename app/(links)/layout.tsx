"use client";
import Protected from "@/components/Protected";
import Sidebar from "@/components/sidebar";
import UserNavbar from "@/components/usernavbar";
import RightBar from "@/components/rightbar";

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen min-w-screen bg-white text-black">
      <Protected>
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20 border-[#D9D9D9]">
        <UserNavbar />
      </div>
      <div className="flex pt-16 h-screen">
        <div className="w-1/6 h-full bg-white border-r border-[#D9D9D9]">
          <Sidebar />
        </div>
        <div className="w-7/12 overflow-y-auto hide-scrollbar">
          {children}
        </div>
        <div className="w-3/12 border-l border-[#D9D9D9]">
          <RightBar />
        </div>
      </div>
      </Protected>
    </div>
  );
}