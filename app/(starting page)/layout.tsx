import Sidebar from "@/components/sidebar";
import Navbar from "@/components/navbar";

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen min-w-screen bg-white text-black">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-20">
        <Navbar />
      </div>
      <div className="flex pt-16 h-screen">
        <div className="w-full overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}