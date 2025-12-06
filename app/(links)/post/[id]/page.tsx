"use client";

import { db, auth } from "@/lib/firebase";
import { doc, getDoc, deleteDoc, setDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import React from "react";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [post, setPost] = useState<any>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const trackView = async () => {
      if (!id || !auth.currentUser) return;
      try {
        await setDoc(
          doc(db, "history", auth.currentUser.uid, "posts", id),
          { viewedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (e) {
        console.error(e);
      }
    };
    trackView();
  }, [id, auth.currentUser]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "posts", id));
      if (!snap.exists()) return;

      const data = snap.data();
      setPost(data);

      // fetch TXT/MD content
      if (data.contentType === "txt" || data.contentType === "md") {
        const res = await fetch(data.contentUrl);
        const txt = await res.text();
        setTextContent(txt);
      }
    };

    load();
  }, [id]);

  useEffect(() => {
  if (!auth.currentUser) return;

  const uid = auth.currentUser.uid;
  const viewRef = doc(db, "views", id, "users", uid);

  const recordView = async () => {
    const snap = await getDoc(viewRef);

    // already viewed → do nothing
    if (snap.exists()) return;

    // mark this user has viewed
    await setDoc(viewRef, {
      viewedAt: new Date(),
    });

    // increment viewCount in posts
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, {
      viewCount: increment(1),
    });
  };

  recordView();
}, [auth.currentUser]);

  if (!post) return <p className="p-6">Loading...</p>;

  const isPDF = post.contentType === "pdf";
  const isText = post.contentType === "txt" || post.contentType === "md";
  const isDoc = post.contentType === "doc" || post.contentType === "docx";

  const isOwner = auth.currentUser?.uid === post.authorId;

  // DELETE FUNCTION
  const deletePost = async () => {
    try {
      await deleteDoc(doc(db, "posts", id));
      window.location.href = "/home";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full">
      {/* LEFT CONTENT */}
      <div className="w-2/3 p-6 overflow-y-scroll sticky top-0 relative">

        {/* ---- EDIT / DELETE BUTTONS ---- */}
        {isOwner && (
          <div className="absolute right-4 top-8 flex gap-3">
            <Link
              href={`/post/${id}/edit`}
              className="text-blue-400 rounded hover:text-blue-800 cursor-pointer"
            >
              <svg height="24" width="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z"/></svg>
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-red-400 rounded hover:text-red-800 cursor-pointer"
            >
              <svg height="24" width="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z"/></svg>
            </button>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

        <p className="text-gray-600 mb-4">{post.summary}</p>

        {post.coverImage && (
          <img src={post.coverImage} className="w-full rounded mb-6" />
        )}

        {/* PDF */}
        {isPDF && (
          <iframe
            src={post.contentUrl}
            className="w-full h-[600px] border rounded"
          />
        )}

        {/* TEXT/MD */}
        {isText && (
          <div className="whitespace-pre-wrap bg-gray-100 p-4 rounded border"
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        )}

        {/* DOC/DOCX */}
        {isDoc && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <p className="font-semibold mb-2">Document file:</p>
            <a
              href={post.contentUrl}
              target="_blank"
              className="text-blue-600 underline"
            >
              Open Document
            </a>
          </div>
        )}
      </div>

      {/* COMMENTS */}
      <div className="w-1/3 border-l p-4 overflow-y-scroll">
        <h2 className="text-xl font-bold mb-3">Comments</h2>
        <p>No comments yet</p>
      </div>

      {/* DELETE POPUP MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="bg-white rounded-lg p-6 w-80 shadow-lg animate-fadeIn">
            <h2 className="text-xl font-bold mb-3 text-black">
              Delete Post?
            </h2>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-black"
              >
                Cancel
              </button>

              <button
                onClick={deletePost}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
