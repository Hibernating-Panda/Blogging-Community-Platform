import Link from "next/link";
import Tag from "./Tag";
import { PRESET_CATEGORIES } from "@/types/firestore";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { deleteDoc, doc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  id: string;
  title: string;
  desc: string;
  answers: number;
  views: number;
  tags: string[];
  author: string;
  time: string;
  authorId: string; // 🔑 REQUIRED
};

export default function QuestionItem(props: Props) {
  const uid = auth.currentUser?.uid;
  const isOwner = uid === props.authorId;
  const [deletepopup, setDeletepopup] = useState(false);

  const handleDelete = async () => {
    if (!auth.currentUser) return;

    try {
      // 🔥 delete forum/question itself
      await deleteDoc(doc(db, "forums", props.id));

      setDeletepopup(false);
    } catch (err) {
      alert("Failed to delete question");
      console.error(err);
    }
  };


  return (
    <div className="relative flex gap-4 border-b pb-6 pt-2 cursor-default">
      {/* LEFT STATS */}
      <div className="text-center text-sm text-gray-500 w-20 flex flex-col justify-between">
        <div>
          <div>{props.answers} answers</div>
          <div>{props.views} views</div>
        </div>
        <div className="mt-2">
          <span className="text-md text-gray-400">Category:</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 pr-24">
        {/* TITLE */}
        <Link
          href={`/forum/${props.id}`}
          className="text-blue-600 font-medium hover:underline block"
        >
          {props.title}
        </Link>

        {/* DESCRIPTION */}
        <p className="text-gray-600 mt-1 line-clamp-2">
          {props.desc}
        </p>

        {/* TAGS + META */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2 flex-wrap">
            {props.tags.map((tagId) => {
              const cat = PRESET_CATEGORIES.find(
                (c) => c.id === tagId
              );
              return cat ? <Tag key={tagId} name={cat.name} /> : null;
            })}
          </div>

          <span className="text-sm text-gray-500">
            {props.author} · {props.time}
          </span>
        </div>
      </div>

      {/* OWNER ACTIONS (TOP RIGHT) */}
      {isOwner && (
        <div className="absolute top-2 right-2 flex gap-3 text-sm">
          <Link
            href={`/forum/${props.id}/edit`}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/></svg>
          </Link>

          <button
            className="text-red-600 hover:underline cursor-pointer"
            onClick={() => {
              setDeletepopup(true);
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M136.7 5.9L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-8.7-26.1C306.9-7.2 294.7-16 280.9-16L167.1-16c-13.8 0-26 8.8-30.4 21.9zM416 144L32 144 53.1 467.1C54.7 492.4 75.7 512 101 512L347 512c25.3 0 46.3-19.6 47.9-44.9L416 144z"/></svg>
          </button>

          {deletepopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-lg font-semibold">Delete Question</h2>
                <p className="text-gray-600">Are you sure you want to delete this question?</p>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer"
                    onClick={() => {
                      handleDelete();
                      setDeletepopup(false);
                    }}
                  >
                    Delete
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer"
                    onClick={() => setDeletepopup(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
