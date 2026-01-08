"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const linkClasses = (path: string) =>
    `flex gap-2 px-2 py-2 items-center cursor-pointer ${
      pathname === path ? "text-[#282D38] bg-[#282D38]/30 rounded-lg font-semibold" : "text-black"
    }`;

  return (
    <div className="h-full w-full p-4">
      <div className="flex-col gap-3 flex text-xl">

        <Link href="/home" className={linkClasses("/home")}>
          <svg width="28px" height="28px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="currentColor"
              d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"
            />
          </svg>
          <div>Home</div>
        </Link>

        <Link href="/communities" className={linkClasses("/my-communities")}>
          <svg width="28px" height="28px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 80C377.4 80 424 126.6 424 184C424 241.4 377.4 288 320 288C262.6 288 216 241.4 216 184C216 126.6 262.6 80 320 80zM96 152C135.8 152 168 184.2 168 224C168 263.8 135.8 296 96 296C56.2 296 24 263.8 24 224C24 184.2 56.2 152 96 152zM0 480C0 409.3 57.3 352 128 352C140.8 352 153.2 353.9 164.9 357.4C132 394.2 112 442.8 112 496L112 512C112 523.4 114.4 534.2 118.7 544L32 544C14.3 544 0 529.7 0 512L0 480zM521.3 544C525.6 534.2 528 523.4 528 512L528 496C528 442.8 508 394.2 475.1 357.4C486.8 353.9 499.2 352 512 352C582.7 352 640 409.3 640 480L640 512C640 529.7 625.7 544 608 544L521.3 544zM472 224C472 184.2 504.2 152 544 152C583.8 152 616 184.2 616 224C616 263.8 583.8 296 544 296C504.2 296 472 263.8 472 224zM160 496C160 407.6 231.6 336 320 336C408.4 336 480 407.6 480 496L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 496z"/></svg>
          <div>Communities</div>
        </Link>

        <Link href="/favorites" className={linkClasses("/favorites")}>
          <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor">
            <path d="m480-120-58-52q-101-91-167-157T150-447.5Q111-500 95.5-544T80-634q0-94 63-157t157-63q52 0 99 22t81 62q34-40 81-62t99-22q94 0 157 63t63 157q0 46-15.5 90T810-447.5Q771-395 705-329T538-172l-58 52Z"/>
          </svg>
          <div>Favorites</div>
        </Link>

        <Link href="/history" className={linkClasses("/history")}>
          <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor">
            <path d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Z"/>
          </svg>
          <div>History</div>
        </Link>

        <Link href="/forum" className={linkClasses("/forum")}>
          <svg xmlns="http://www.w3.org/2000/svg" height="28px" viewBox="0 -960 960 960" width="28px" fill="currentColor">
            <path d="M120-120v-720h720v720H360l-240 180v-180H120Zm60-600v480h540v-480H180Zm0 0v480-480Z"/>
          </svg>
          <div>Forum</div>
        </Link>
      </div>
    </div>
  );
}
