"use client";

import AdminProtected from "@/components/adminProtected";
import AdminSidebar from "@/components/adminSidebar";
import AdminNavbar from "@/components/adminNavbar";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtected>
      <div className="min-h-screen bg-white text-black">
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20 border-[#D9D9D9]">
          <AdminNavbar />
        </div>

        <div className="flex pt-16 h-screen">
          <div className="w-1/6 h-full bg-white border-r border-[#D9D9D9]">
            <AdminSidebar />
          </div>

          <div className="w-5/6 overflow-y-auto hide-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
