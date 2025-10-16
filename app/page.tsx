import Image from "next/image";
import UploadUserModal from "@/components/uploadbutton"

export default function Home() {
  return (
    <div className="min-w-screen min-h-screen bg-black">
      <Image src="/middle.jpg" alt="middle" width={500} height={500} className="w-full h-full"/>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex justify-center items-center font-bold text-white text-[120px] font-sans">
        FUCK YOU
      </div>
      <UploadUserModal />
    </div>
  );
}
