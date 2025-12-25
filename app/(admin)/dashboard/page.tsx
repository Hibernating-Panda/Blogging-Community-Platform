import Navbar from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import StatCard from "@/components/statecard";
import ActionCard from "@/components/actioncard";
import React from "react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen min-w-screen bg-white text-black">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
        <Navbar />
      </div>
      <div className="flex pt-16 h-screen">
        <div className="hidden md:block w-64 border-r">
          <Sidebar />
        </div>
        <main className="bg-white items-center flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="flex-1 p-6 overflow-y-auto bg-gray-100 rounded-2xl border-2 border-black shadow-md">
            <h1 className="text-4xl font-bold ml-1 mb-8">Admin Dashboard</h1>
            <h2 className="text-xl font-bold ml-1 mb-5">Platform Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 ml-5">
              <StatCard title="Total Registered Users" value="1,234" change="35%" note="Since last month" image="/users-solid 1.svg" />
              <StatCard title="New research posts(Last 7 days)" value="567" change="10%" note="Compared to previous 7days" image="/book-open-solid 1.svg" />
              <StatCard title="Community Interactions (Daily)" value="99.9%" change="20%" note="Active comments and from replies" image="/comment-regular 1.svg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 ml-5">
              <ActionCard value="60" image="/comment-regular 1.svg" title="User Management" description="Manage and oversee user management" />
              <ActionCard value="10" image="/book-bookmark-solid 1.svg" title="Research Management" description="Manage and oversee user management" />
              <ActionCard value="2" image="/message-regular 2.svg" title="Community Moderation" description="Manage and oversee community moderation" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

