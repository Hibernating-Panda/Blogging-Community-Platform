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
  addDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [post, setPost] = useState<any>(null);
  const [textContent, setTextContent] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userCache, setUserCache] = useState<Record<string, any>>({});
  const commentRef = useRef<HTMLTextAreaElement>(null);

  /* ---------------- LOAD POST ---------------- */

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(doc(db, "posts", id), async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      let userLiked = false;
      let isFavorited = false;

      const uid = auth.currentUser?.uid;
      if (uid) {
        const [likeSnap, favSnap] = await Promise.all([
          getDoc(doc(db, "likes", id, "users", uid)),
          getDoc(doc(db, "favorites", uid, "posts", id)),
        ]);
        userLiked = likeSnap.exists();
        isFavorited = favSnap.exists();
      }

      setPost({
        ...data,
        isLiked: userLiked,  
        isFavorited,
      });

    // Load markdown / text
    if (data.contentType === "markdown" || data.contentType === "txt") {
      try {
        const res = await fetch(data.contentUrl);
            const txt = await res.text();
            setTextContent(txt);
          } catch {
            setTextContent("[Unable to load content]");
          }
        }
      });
    return () => unsub();
    }, [id]);

  /* ---------------- TRACK VIEW + HISTORY ---------------- */
  useEffect(() => {
    if (!auth.currentUser || !id) return;

    const uid = auth.currentUser.uid;

    const viewRef = doc(db, "postViews", id, "users", uid);
    const historyRef = doc(db, "history", uid, "posts", id);

    const record = async () => {
      // postViews (analytics)
      await setDoc(
        viewRef,
        { viewedAt: serverTimestamp() },
        { merge: true }
      );

      // increment views (allowed by new rule)
      await updateDoc(doc(db, "posts", id), {
        viewCount: increment(1),
      });

      // history (always update)
      await setDoc(
        historyRef,
        { lastViewedAt: serverTimestamp() },
        { merge: true }
      );
    };

    record();
  }, [id]);


  /* ---------------- COMMENTS ---------------- */
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

  function buildCommentTree(flat: any[]) {
    const map: any = {};
    const roots: any[] = [];

    flat.forEach((c) => (map[c.id] = { ...c, children: [] }));

    flat.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots; 
  }

  const isOwner = !!post && auth.currentUser?.uid === post.authorId;

    /* ---------------- ACTIONS ---------------- */

  const toggleLike = async () => {
    if (!auth.currentUser) return alert("Login required");

    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`/api/posts/${id}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const json = await res.json();

    setPost((p: any) => ({
      ...p,
      isLiked: json.value === 1,   // ✅ THIS LINE FIXES SVG
      likeCount: json.likeCount ?? p.likeCount,
    }));
  };


  const toggleFavorite = async () => {
    if (!auth.currentUser) return alert("Login required");

    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`/api/posts/${id}/favorite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setPost((p: any) => ({
      ...p,
      isFavorited: data.favorited,
    }));
  };

  const deletePost = async () => {
    await deleteDoc(doc(db, "posts", id));
    window.location.href = "/home";
  };

  /* ---------------- COMMENTS ---------------- */

  const submitComment = async () => {
    if (!auth.currentUser || !commentText.trim()) return;

    const uid = auth.currentUser.uid;
    const userSnap = await getDoc(doc(db, "users", uid));
    const user = userSnap.data() || {};

    const newId = `${Date.now()}`;

    let depth = 0;
    let parentId = null;
    let replyToId = null;
    let replyToName = null;

    if (replyingTo) {
      replyToId = replyingTo.id;
      replyToName = replyingTo.authorName;

      // depth rules
      if (replyingTo.depth === 0) {
        depth = 1;
        parentId = replyingTo.id;
      } else if (replyingTo.depth === 1) {
        depth = 2;
        parentId = replyingTo.id;
      } else {
        depth = 2;
        parentId = replyingTo.parentId; // clamp depth
      }
    }

    const data: any = {
      authorId: uid,
      authorName: user.username || "User",
      authorImage: user.photoURL || "/profile.jpg",
      text: commentText,
      depth,
      createdAt: serverTimestamp(),
    };

    // add parentId ONLY if exists
    if (parentId) {
      data.parentId = parentId;
    }

    // add replyToId ONLY if replying
    if (replyingTo) {
      data.replyToId = replyingTo.authorId;
    }

    await setDoc(doc(db, "comments", id, "items", newId), data);

    // 🔥 INCREMENT COMMENT COUNT (reply counts too)
    await updateDoc(doc(db, "posts", id), {
      commentCount: increment(1),
    });

    // after creating the reply comment
    if (replyingTo && replyingTo.authorId !== uid) {
      await addDoc(
        collection(db, "notifications", replyingTo.authorId, "items"),
        {
          type: "reply",
          postId: id,
          postTitle: post.title,
          commentId: newId,
          replyText: commentText.slice(0, 100),
          fromUserId: uid,
          fromUsername: user.username || "User",
          createdAt: serverTimestamp(),
          read: false,
        }
      );
    }

    // 🔔 Notify post owner on FIRST comment of a tree
    if (!parentId && post.authorId !== uid) {
      await addDoc(
        collection(db, "notifications", post.authorId, "items"),
        {
          type: "post-comment",
          postId: id,
          postTitle: post.title,
          commentId: newId,
          fromUserId: uid,
          fromUsername: user.username || "User",
          textPreview: commentText.slice(0, 100),
          createdAt: serverTimestamp(),
          read: false,
        }
      );
    }


    setCommentText("");
    setReplyingTo(null);
  };

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

    // 🔥 DECREMENT COMMENT COUNT
    await updateDoc(doc(db, "posts", id), {
      commentCount: increment(-1),
    });
  };

  const saveEditComment = async () => {
    if (!editing || !auth.currentUser) return;

    const ref = doc(db, "comments", id, "items", editing.id);

    await updateDoc(ref, {
      text: editing.text,
      editedAt: serverTimestamp(),
    });

    setEditing(null);
  };

  const renderComment = (c: any, level = 0) => {
    const canReply = c.depth < 3;
    const isOwner = auth.currentUser?.uid === c.authorId;
    const user = userCache[c.authorId];
    const replyUser = userCache[c.replyToId];

    return (
      <div key={c.id} style={{ marginLeft: level * 20 }} className="border-l pl-3 my-3">
        <div className="flex gap-2 items-center">

          <img
            src={user?.photoURL || "/profile.jpg"}
            className="w-8 h-8 rounded-full"
          />

          <div>
            <p className="font-semibold">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-gray-500">
              {c.createdAt?.toDate?.().toLocaleString()}
              {c.editedAt && (
                <span className="ml-1 italic">(edited)</span>
              )}
            </p>
          </div>
        </div>

        {editing?.id === c.id ? (
          <>
            <textarea
              ref={commentRef}
              className="w-full border p-2 rounded resize-none overflow-hidden"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                if (commentRef.current) {
                  commentRef.current.style.height = "auto";
                  commentRef.current.style.height =
                    commentRef.current.scrollHeight + "px";
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEditComment();
                  if (commentRef.current) {
                    commentRef.current.style.height = "auto";
                  }
                }
              }}
              placeholder="Write a comment..."
              rows={1}
            />


            <div className="flex gap-3 mt-2 text-sm">
              <button
                className="text-blue-600 cursor-pointer"
                onClick={() => saveEditComment()}
              >
                Save
              </button>

              <button
                className="text-gray-500 cursor-pointer"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2 break-words flex flex-col">
            {replyUser && (
              <span className="text-sm text-gray-500 mr-2">
                | Reply to <b>{replyUser.username}</b>
              </span>
            )}
            {c.text}
          </p>
        )}


        {!editing?.id && (<div className="flex gap-4 text-sm mt-1">
          {canReply && (
            <button className="text-blue-600 cursor-pointer" onClick={() => setReplyingTo(c)}>
              Reply
            </button>
          )}
          {isOwner && (
            <>
              <button
                className="text-green-600 cursor-pointer"
                onClick={() =>
                  setEditing({
                    id: c.id,
                    text: c.text,
                  })
                }
              >
                Edit
              </button>

              <button
                className="text-red-600 cursor-pointer"
                onClick={() => deleteComment(c.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>
        )}

        {c.children?.map((child: any) => renderComment(child, level + 1))}
      </div>
    );
  };

  useEffect(() => {
    const loadUsers = async () => {
      const missingUserIds = comments
        .map((c) => c.authorId)
        .filter(
          (uid) => uid && !userCache[uid]
        );

      if (missingUserIds.length === 0) return;

      const entries = await Promise.all(
        missingUserIds.map(async (uid) => {
          const snap = await getDoc(doc(db, "users", uid));
          if (!snap.exists()) return null;

          return [
            uid,
            {
              username: snap.data().username || "User",
              photoURL: snap.data().photoURL || "/profile.jpg",
            },
          ];
        })
      );

      setUserCache((prev) => ({
        ...prev,
        ...Object.fromEntries(entries.filter(Boolean) as any),
      }));
    };

    loadUsers();
  }, [comments]);

  
  if (!post) return <p className="p-6">Loading...</p>;

  /* ---------------- RENDER ---------------- */

  return (
    <div className="flex h-full">
      {/* LEFT */}
      <div className="w-2/3 p-6 overflow-y-scroll relative hide-scrollbar overflow-x-hidden">
        {isOwner && (
          <div className="absolute right-4 top-8 flex gap-3">
            <Link href={`/post/${id}/edit`} className="text-blue-500 hover:text-blue-600">
              <svg height="20" width="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L368 46.1 465.9 144 490.3 119.6c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L432 177.9 334.1 80 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"/></svg>
            </Link>
            <button onClick={() => setShowDeleteModal(true)} className="text-red-600 hover:text-red-700 cursor-pointer">
              <svg height="20" width="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M136.7 5.9L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-8.7-26.1C306.9-7.2 294.7-16 280.9-16L167.1-16c-13.8 0-26 8.8-30.4 21.9zM416 144L32 144 53.1 467.1C54.7 492.4 75.7 512 101 512L347 512c25.3 0 46.3-19.6 47.9-44.9L416 144z"/></svg>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <img src={post.authorImage} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-semibold">{post.authorName}</p>
            <p className="text-sm text-gray-500">
              {post.categoryNames?.join(", ")}
            </p>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>

        {post.coverImageUrl && (
          <img src={post.coverImageUrl} className="w-full rounded mb-6" />
        )}

        <p className="text-gray-600 mb-4">{post.summary}</p>
        <div className="flex gap-6 mb-4 text-lg">
          <button onClick={toggleLike} className="flex gap-2">
            {post.isLiked ? 
            <svg className="cursor-pointer" height="24" width="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M80 160c17.7 0 32 14.3 32 32l0 256c0 17.7-14.3 32-32 32l-48 0c-17.7 0-32-14.3-32-32L0 192c0-17.7 14.3-32 32-32l48 0zM270.6 16C297.9 16 320 38.1 320 65.4l0 4.2c0 6.8-1.3 13.6-3.8 19.9L288 160 448 160c26.5 0 48 21.5 48 48 0 19.7-11.9 36.6-28.9 44 17 7.4 28.9 24.3 28.9 44 0 23.4-16.8 42.9-39 47.1 4.4 7.3 7 15.8 7 24.9 0 22.2-15 40.8-35.4 46.3 2.2 5.5 3.4 11.5 3.4 17.7 0 26.5-21.5 48-48 48l-87.9 0c-36.3 0-71.6-12.4-99.9-35.1L184 435.2c-15.2-12.1-24-30.5-24-50l0-186.6c0-14.9 3.5-29.6 10.1-42.9L226.3 43.3C234.7 26.6 251.8 16 270.6 16z"/></svg>
            : 
            <svg className="cursor-pointer" height="24" width="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M171.5 38.8C192.3 4 236.5-10 274 7.6l7.2 3.8C316 32.3 330 76.5 312.4 114l0 0-14.1 30 109.7 0 7.4 .4c36.3 3.7 64.6 34.4 64.6 71.6 0 13.2-3.6 25.4-9.8 36 6.1 10.6 9.7 22.8 9.8 36 0 18.3-6.9 34.8-18 47.5 1.3 5.3 2 10.8 2 16.5 0 25.1-12.9 47-32.2 59.9-1.9 35.5-29.4 64.2-64.4 67.7l-7.4 .4-104.1 0c-18 0-35.9-3.4-52.6-9.9l-7.1-3-.7-.3-6.6-3.2-.7-.3-12.2-6.5c-12.3-6.5-23.3-14.7-32.9-24.1-4.1 26.9-27.3 47.4-55.3 47.4l-32 0c-30.9 0-56-25.1-56-56L0 200c0-30.9 25.1-56 56-56l32 0c10.8 0 20.9 3.1 29.5 8.5l50.1-106.5 .6-1.2 2.7-5 .6-.9zM56 192c-4.4 0-8 3.6-8 8l0 224c0 4.4 3.6 8 8 8l32 0c4.4 0 8-3.6 8-8l0-224c0-4.4-3.6-8-8-8l-32 0zM253.6 51c-14.8-6.9-32.3-1.6-40.7 12l-2.2 4-56.8 120.9c-3.5 7.5-5.5 15.5-6 23.7l-.1 4.2 0 112.9 .2 7.9c2.4 32.7 21.4 62.1 50.7 77.7l11.5 6.1 6.3 3.1c12.4 5.6 25.8 8.5 39.4 8.5l104.1 0 2.4-.1c12.1-1.2 21.6-11.5 21.6-23.9l-.2-2.6c-.1-.9-.2-1.7-.4-2.6-2.7-12.1 4.3-24.2 16-28 9.7-3.1 16.6-12.2 16.6-22.8 0-4.3-1.1-8.2-3.1-11.8-6.3-11.1-2.8-25.2 8-32 6.8-4.3 11.2-11.8 11.2-20.2 0-7.1-3.1-13.5-8.2-18-5.2-4.6-8.2-11.1-8.2-18s3-13.4 8.2-18c5.1-4.5 8.2-10.9 8.2-18l-.1-2.4c-1.1-11.3-10.1-20.3-21.4-21.4l-2.4-.1-147.5 0c-8.2 0-15.8-4.2-20.2-11.1-4.4-6.9-5-15.7-1.5-23.1L269 93.6c7-15 1.4-32.7-12.5-41L253.6 51z"/></svg>
            }
            {post.likeCount || 0}</button>
          <button onClick={toggleFavorite}>
            {post.isFavorited ? 
            <svg className="cursor-pointer" height="24" width="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M241 87.1l15 20.7 15-20.7C296 52.5 336.2 32 378.9 32 452.4 32 512 91.6 512 165.1l0 2.6c0 112.2-139.9 242.5-212.9 298.2-12.4 9.4-27.6 14.1-43.1 14.1s-30.8-4.6-43.1-14.1C139.9 410.2 0 279.9 0 167.7l0-2.6C0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1z"/></svg> : 
            <svg className="cursor-pointer" height="24" width="24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M378.9 80c-27.3 0-53 13.1-69 35.2l-34.4 47.6c-4.5 6.2-11.7 9.9-19.4 9.9s-14.9-3.7-19.4-9.9l-34.4-47.6c-16-22.1-41.7-35.2-69-35.2-47 0-85.1 38.1-85.1 85.1 0 49.9 32 98.4 68.1 142.3 41.1 50 91.4 94 125.9 120.3 3.2 2.4 7.9 4.2 14 4.2s10.8-1.8 14-4.2c34.5-26.3 84.8-70.4 125.9-120.3 36.2-43.9 68.1-92.4 68.1-142.3 0-47-38.1-85.1-85.1-85.1zM271 87.1c25-34.6 65.2-55.1 107.9-55.1 73.5 0 133.1 59.6 133.1 133.1 0 68.6-42.9 128.9-79.1 172.8-44.1 53.6-97.3 100.1-133.8 127.9-12.3 9.4-27.5 14.1-43.1 14.1s-30.8-4.7-43.1-14.1C176.4 438 123.2 391.5 79.1 338 42.9 294.1 0 233.7 0 165.1 0 91.6 59.6 32 133.1 32 175.8 32 216 52.5 241 87.1l15 20.7 15-20.7z"/></svg>}
          </button>
        </div>

        {post.contentType === "markdown" && (
          <div
            className="
              prose
              max-w-none
              bg-gray-100
              p-4
              rounded
              overflow-x-hidden
            "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="whitespace-pre-wrap break-words">
                    {children}
                  </p>
                ),
                code: ({ inline, children }: any) =>
                  inline ? (
                    <code className="bg-gray-200 px-1 rounded">
                      {children}
                    </code>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words bg-gray-200 p-3 rounded">
                      <code>{children}</code>
                    </pre>
                  ),
              }}
            >
              {textContent}
            </ReactMarkdown>
          </div>
        )}
 
      </div>

      {/* RIGHT COMMENTS */}
      <div className="w-1/3 border-l px-4 overflow-y-scroll cursor-default hide-scrollbar">
        <div className="sticky bottom-0 bg-white top-0 py-2 z-10">
          <h2 className="text-xl font-bold mb-3">Comments ({post.commentCount ?? 0})</h2>

          {replyingTo && (
            <p className="text-sm text-gray-500 mb-1">
              Replying to <b>{replyingTo.authorName}</b>
              <button
                className="ml-2 text-red-500"
                onClick={() => setReplyingTo(null)}
              >
                ✕
              </button>
            </p>
          )}

          <textarea
            ref={commentRef}
            className="w-full border p-2 rounded resize-none overflow-hidden"
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (commentRef.current) {
                commentRef.current.style.height = "auto";
                commentRef.current.style.height =
                  commentRef.current.scrollHeight + "px";
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submitComment();
                if (commentRef.current) {
                  commentRef.current.style.height = "auto";
                }
              }
            }}
            placeholder="Write a comment..."
            rows={1}
          />


          <button
            onClick={submitComment}
            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded cursor-pointer"
          >
            Post Comment
          </button>
        </div>

        <div>{comments.map((c) => renderComment(c))}</div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded">
            <p>Delete post permanently?</p>
            <div className="flex justify-end gap-3 mt-3">
              <button onClick={() => setShowDeleteModal(false)} className="cursor-pointer hover:underline">
                Cancel
              </button>
              <button onClick={deletePost} className="text-red-600 cursor-pointer hover:underline">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
