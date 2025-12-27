import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";
import React from "react";

export default function AdminCommunityPage(){
    return(
        <div className=" min-h-screen min-w-screen bg-white text-black">
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
            <Navbar/>
        </div>
    <div className="flex pt-16 h-screen">
        <div className="w-64 border-r">
            <Sidebar/>
        </div>
            <main className="bg-white items-center flex-1 p-6 overflow-y-auto">
            <div className="flex-1 p-6 overflow-y-auto bg-gray-100 rounded-2xl border-1 border-black shadow-md">
                    <h1 className="text-4xl font-bold ml-1 mb-30">Community Management</h1>
                    <p>Welcome to the Community Management Page. Here you can oversee and moderate community activities, manage user interactions, and ensure a positive environment for all members.</p>

                </div>
            </main>
        </div>
    </div>
    )
}