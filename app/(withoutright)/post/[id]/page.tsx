"use client";

import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDocs } from "firebase/firestore";

export default function PostDetail() {
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);

  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [post, setPost] = useState<any>(null);
  const [textContent, setTextContent] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ---------------- GET POST ---------------- */
  useEffect(() => {
  if (!id) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "posts", id));
      if (!snap.exists()) return;

      const data = snap.data();

      let authorName = data.authorName || "";
      let authorImage = data.authorImage || "/profile.jpg";

      // 🔥 If authorName OR authorImage missing, fetch from users/{uid}
      if (!authorName || !authorImage) {
        const userSnap = await getDoc(doc(db, "users", data.authorId));
        if (userSnap.exists()) {
          const u = userSnap.data();
          authorName = u.name || authorName;
          authorImage = u.image || authorImage;
        }
      }

      setPost({
        ...data,
        authorName,
        authorImage,
      });

      // Load text content
      if (data.contentType === "txt" || data.contentType === "md") {
        const res = await fetch(data.contentUrl);
        const txt = await res.text();
        setTextContent(txt);
      }
    };

    load();
  }, [id]);

  // Real-time comments listener
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "comments", id, "items"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(buildCommentTree(list));
    });
  }, [id]);

  /* ---------------- TRACK VIEWS ---------------- */
  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const viewRef = doc(db, "views", id, "users", uid);

    const recordView = async () => {
      const snap = await getDoc(viewRef);
      if (snap.exists()) return;

      await setDoc(viewRef, { viewedAt: new Date() });
      await updateDoc(doc(db, "posts", id), {
        viewCount: increment(1),
      });
    };

    recordView();
  }, [auth.currentUser]);

  /* ---------------- LOAD COMMENTS ---------------- */

  if (!post) return <p className="p-6">Loading...</p>;

  const isOwner = auth.currentUser?.uid === post.authorId;

  /* ---------------- DELETE POST ---------------- */
  const deletePost = async () => {
    await deleteDoc(doc(db, "posts", id));
    window.location.href = "/home";
  };

  function buildCommentTree(flat: any[]) {
    const map: any = {};
    const roots: any[] = [];

    flat.forEach((c) => (map[c.id] = { ...c, children: [] }));

    flat.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]); // top-level comment
      }
    });

    return roots;
  }

  /* ---------------- COMMENT ---------------- */
  // CREATE COMMENT
  const submitComment = async () => {
    if (!auth.currentUser || !commentText.trim()) return;

    const uid = auth.currentUser.uid;

    const userSnap = await getDoc(doc(db, "users", uid));
    const userData = userSnap.exists() ? userSnap.data() : {};

    const authorName =
      userData.username ||
      auth.currentUser.displayName ||
      "User";

    const authorImage =
      userData.photoURL ||
      auth.currentUser.photoURL ||
      "/profile.jpg";

    const newId = `${Date.now()}`;

    // NEW DEPTH SYSTEM
    let depth = 0;
    let parentId = null;

    if (replyingTo) {
      // If replying to depth 0 → depth 1
      if (replyingTo.depth === 0) {
        depth = 1;
        parentId = replyingTo.id;
      }
      // If replying to depth 1 → depth 2
      else if (replyingTo.depth === 1) {
        depth = 2;
        parentId = replyingTo.id;
      }
      // If replying to depth 2 → stay depth 2 and group under its parent
      else if (replyingTo.depth === 2) {
        depth = 2;
        parentId = replyingTo.parentId;
      }
    }

    await setDoc(doc(db, "comments", id, "items", newId), {
      authorId: uid,
      authorName,
      authorImage,
      text: commentText,
      createdAt: serverTimestamp(),
      parentId,
      depth,
    });

    setCommentText("");
    setReplyingTo(null);
  };

  // DELETE COMMENT
  const deleteComment = async (commentId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const cRef = doc(db, "comments", id, "items", commentId);
    const cSnap = await getDoc(cRef);

    if (!cSnap.exists() || cSnap.data().authorId !== uid) {
      alert("You can only delete your own comments.");
      return;
    }

    await deleteDoc(cRef);
  };


  // EDIT COMMENT
  const saveEditComment = async () => {
    if (!editing || !auth.currentUser) return;

    const uid = auth.currentUser.uid;

    // Load comment to verify owner
    const cRef = doc(db, "comments", id, "items", editing.id);
    const cSnap = await getDoc(cRef);

    if (!cSnap.exists() || cSnap.data().authorId !== uid) {
      alert("You can only edit your own comments.");
      return;
    }

    await updateDoc(cRef, {
      text: editing.text,
      updatedAt: serverTimestamp(),
    });

    setEditing(null);
  };

  /* ---------------- RENDER COMMENT TREE ---------------- */
  const renderComment = (c: any, level = 0) => {
    const isOwner = auth.currentUser?.uid === c.authorId;
    const canReply = c.depth < 3;

    return (
      <div key={c.id} style={{ marginLeft: level * 20 }} className="border-l pl-3 my-3">

        {/* USER HEADER */}
        <div className="flex gap-2 items-center">
          <img src={c.authorImage || "/profile.jpg"} className="w-8 h-8 rounded-full" />
          <div>
            <p className="font-semibold">{c.authorName}</p>
            <p className="text-xs text-gray-500">
              {c.createdAt?.toDate?.().toLocaleString() ?? ""}
            </p>
          </div>
        </div>

        {/* COMMENT TEXT */}
        <p className="mt-2 break-all">{c.text}</p>

        {/* ACTIONS */}
        <div className="flex gap-4 text-sm mt-1">
          {canReply && (
            <button
              className="text-blue-600"
              onClick={() => setReplyingTo(c)}
            >
              Reply
            </button>
          )}

          {isOwner && (
            <>
              <button
                className="text-green-600"
                onClick={() => setEditing({ id: c.id, text: c.text })}
              >
                Edit
              </button>
              <button
                className="text-red-600"
                onClick={() => deleteComment(c.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>

        {/* RENDER CHILDREN */}
        {c.children?.map((child: any) => renderComment(child, level + 1))}
      </div>
    );
  };


  return (
    <div className="flex h-full">
      {/* LEFT CONTENT */}
      <div className="w-2/3 p-6 overflow-y-scroll relative hide-scrollbar">

        {/* EDIT / DELETE ONLY FOR OWNER */}
        {isOwner && (
          <div className="absolute right-4 top-8 flex gap-3">
            <Link
              href={`/post/${id}/edit`}
              className="text-blue-400 hover:text-blue-700"
            >
              <svg
                height="24"
                width="24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
              >
                <path d="M535.6 85.7C513.7 63.8 478.3 63.8 456.4 85.7L432 110.1L529.9 208L554.3 183.6C576.2 161.7 576.2 126.3 554.3 104.4L535.6 85.7zM236.4 305.7C230.3 311.8 225.6 319.3 222.9 327.6L193.3 416.4C190.4 425 192.7 434.5 199.1 441C205.5 447.5 215 449.7 223.7 446.8L312.5 417.2C320.7 414.5 328.2 409.8 334.4 403.7L496 241.9L398.1 144L236.4 305.7zM160 128C107 128 64 171 64 224L64 480C64 533 107 576 160 576L416 576C469 576 512 533 512 480L512 384C512 366.3 497.7 352 480 352C462.3 352 448 366.3 448 384L448 480C448 497.7 433.7 512 416 512L160 512C142.3 512 128 497.7 128 480L128 224C128 206.3 142.3 192 160 192L256 192C273.7 192 288 177.7 288 160C288 142.3 273.7 128 256 128L160 128z" />
              </svg>
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-red-500 hover:text-red-700 cursor-pointer"
            >
              <svg
                height="24"
                width="24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
              >
                <path d="M232.7 69.9C237.1 56.8 249.3 48 263.1 48L377 48C390.8 48 403 56.8 407.4 69.9L416 96L512 96C529.7 96 544 110.3 544 128C544 145.7 529.7 160 512 160L128 160C110.3 160 96 145.7 96 128C96 110.3 110.3 96 128 96L224 96L232.7 69.9zM128 208L512 208L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 208zM216 272C202.7 272 192 282.7 192 296L192 488C192 501.3 202.7 512 216 512C229.3 512 240 501.3 240 488L240 296C240 282.7 229.3 272 216 272zM320 272C306.7 272 296 282.7 296 296L296 488C296 501.3 306.7 512 320 512C333.3 512 344 501.3 344 488L344 296C344 282.7 333.3 272 320 272zM424 272C410.7 272 400 282.7 400 296L400 488C400 501.3 410.7 512 424 512C437.3 512 448 501.3 448 488L448 296C448 282.7 437.3 272 424 272z" />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <img
            src={post.authorImage || "/profile.jpg"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-gray-500 text-sm">Author</p>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

        {post.coverImage && (
          <img src={post.coverImage} className="w-full rounded mb-6" />
        )}

        <p className="text-gray-600 mb-4">{post.summary}</p>

        {/* TEXT */}
        {post.contentType === "txt" && (
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded border">
            {textContent}
          </pre>
        )}

        {/* PDF */}
        {post.contentType === "pdf" && (
          <iframe src={post.contentUrl} className="w-full h-[600px]" />
        )}
      </div>

      {/* RIGHT SIDE COMMENTS */}
      <div className="w-1/3 border-l p-4 overflow-y-scroll">
        <h2 className="text-xl font-bold mb-3">Comments</h2>

        {/* INPUT BOX */}
        {replyingTo && (
          <p className="text-sm mb-1 text-gray-600">
            Replying to <b>{replyingTo.authorName}</b>
          </p>
        )}

        <textarea
          className="w-full border p-2 rounded resize-none"
          placeholder="Write a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />

        <button
          onClick={submitComment}
          className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
        >
          Post Comment
        </button>

        {/* COMMENT TREE */}
        <div className="mt-4">
          {comments.map((c) => renderComment(c))}
        </div>
      </div>


      {/* DELETE CONFIRMATION */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded shadow">
            <p>Delete post permanently?</p>

            <div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button onClick={deletePost} className="text-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
