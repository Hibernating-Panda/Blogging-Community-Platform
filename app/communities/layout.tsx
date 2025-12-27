"use client";
import Protected from "@/components/Protected";
import CommunityNavbar from "../../components/communityNavbar";
import CommunitySidebar from "../../components/commnitySidebar";

export default function Layout({
  children, 
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen min-w-screen bg-white text-black">
      <Protected>
        <div className="border-b border-[#D6D6D6] z-50 w-full fixed bg-white h-12">
          <CommunityNavbar />
        </div>
              
      <div className="w-full min-h-screen grid grid-cols-5 pt-12">
        <div className="col-span-1 border-r border-[#D6D6D6] sticky top-12 h-[calc(100vh-3rem)] bg-white">
          <CommunitySidebar />
        </div>

        <div className="col-span-4 col-start-2 bg-white">
          {children}
        </div>
      </div>

      </Protected>
    </div>
  );
}