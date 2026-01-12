import Link from "next/link";

export default function CommunitiesPage() {
  return (
    <div className="p-6 w-full h-full text-center flex items-center justify-center flex-col gap-4">
      <h1 className="text-3xl font-bold cursor-default">Select a community to view, or join one!</h1>
      <Link href="/communities/join" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Join a community
      </Link>
    </div>
  );
}
  