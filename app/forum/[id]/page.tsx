"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { PRESET_CATEGORIES } from "@/types/firestore";

type SortType = "newest" | "oldest" | "mostReplies";

export default function ForumDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [forum, setForum] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [sort, setSort] = useState<SortType>("newest");

  /* ---------------- REALTIME FORUM + ANSWERS ---------------- */
  useEffect(() => {
    if (!id) return;

    const forumRef = doc(db, "forums", id);

    let unsubAuth: (() => void) | null = null;

    const unsubForum = onSnapshot(forumRef, (snap) => {
      if (!snap.exists()) return;

      const forumData = snap.data();

      setForum({
        id: snap.id,
        ...forumData,
      });

      // ✅ auth listener depends on forum snapshot
      if (!unsubAuth) {
        unsubAuth = onAuthStateChanged(auth, async (user) => {
          if (!user) return;

          const forumViewRef = doc(db, "forumViews", id, "users", user.uid);
          const historyRef = doc(db, "history", user.uid, "forums", id);

          await runTransaction(db, async (tx) => {
            const viewSnap = await tx.get(forumViewRef);

            // 👁️ increment view ONCE
            if (!viewSnap.exists()) {
              tx.set(forumViewRef, { viewedAt: serverTimestamp() });
              tx.update(forumRef, { views: increment(1) });
            }

            // 🕒 ALWAYS update history
            let authorName = "Unknown";

            if (forumData.authorId) {
              const userSnap = await tx.get(
                doc(db, "users", forumData.authorId)
              );

              if (userSnap.exists()) {
                authorName =
                  userSnap.data().username ||
                  userSnap.data().name ||
                  "Unknown";
              }
            }

            tx.set(
              historyRef,
              {
                forumId: id,
                forumTitle: forumData.title,
                authorId: forumData.authorId,
                authorName, // ✅ ALWAYS CORRECT
                lastViewedAt: serverTimestamp(),
                type: "forum",
              },
              { merge: true }
            );

          });
        });
      }
    });

    const q = query(
      collection(db, "forumAnswers", id, "items"),
      orderBy("createdAt", "asc")
    );

    const unsubAnswers = onSnapshot(q, (snap) => {
      setAnswers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubForum();
      unsubAnswers();
      if (unsubAuth) unsubAuth();
    };
  }, [id]);


  /* ---------------- ANSWER TREE ---------------- */
  const answerTree = useMemo(() => {
    const map: Record<string, any> = {};
    const roots: any[] = [];

    // 1️⃣ Build map
    answers.forEach((a) => {
      map[a.id] = { ...a, replies: [], depth: 0 };
    });

    // 2️⃣ Build tree with depth clamp (max 3 levels)
    answers.forEach((a) => {
      if (a.parentId && map[a.parentId]) {
        const parent = map[a.parentId];

        if (parent.depth < 2) {
          map[a.id].depth = parent.depth + 1;
          parent.replies.push(map[a.id]);
        } else {
          // clamp depth → attach to parent's parent
          map[a.id].depth = parent.depth;
          map[parent.parentId]?.replies.push(map[a.id]);
        }
      } else {
        roots.push(map[a.id]);
      }
    });

    // 3️⃣ Sort root-level answers ONLY
    if (sort === "newest") {
      roots.sort(
        (a, b) => b.createdAt?.seconds - a.createdAt?.seconds
      );
    }

    if (sort === "oldest") {
      roots.sort(
        (a, b) => a.createdAt?.seconds - b.createdAt?.seconds
      );
    }

    if (sort === "mostReplies") {
      roots.sort(
        (a, b) =>
          countReplies(b) - countReplies(a)
      );
    }

    return roots;
  }, [answers, sort]);

  function countReplies(answer: any): number {
    if (!answer.replies?.length) return 0;
    return (
      answer.replies.length +
      answer.replies.reduce(
        (sum: number, r: any) => sum + countReplies(r),
        0
      )
    );
  }

  const renderAnswer = (a: any) => {
    const isOwner = auth.currentUser?.uid === a.authorId;
    const isEditingThis = editing?.id === a.id;
    const isReplyingThis = replyTo?.id === a.id;

    // 🚫 lock UI when another comment is active
    const isLocked =
      (editing && !isEditingThis) || (replyTo && !isReplyingThis);

    return (
      <div
        key={a.id}
        className={`rounded p-4 bg-white ${
          a.depth > 0 ? "ml-6 border-l-2" : ""
        }`}
      >
        <p className="font-semibold">{a.authorName}</p>

        {/* CONTENT */}
        {isEditingThis ? (
          <>
            <textarea
              className="w-full p-2 rounded mt-2"
              value={editing.text}
              onChange={(e) =>
                setEditing({ ...editing, text: e.target.value })
              }
            />

            <div className="flex gap-3 mt-2 text-sm">
              <button className="text-blue-600" onClick={saveEdit}>
                Save
              </button>
              <button
                className="text-red-600"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2">{a.text}</p>
        )}

        {/* ACTIONS */}
        {!isEditingThis && !isLocked && (
          <div className="flex gap-4 mt-2 text-sm">
            {a.depth < 3 && (
              <button
                className={isReplyingThis ? "text-red-600" : "text-blue-600"}
                onClick={() =>
                  isReplyingThis ? setReplyTo(null) : setReplyTo(a)
                }
              >
                {isReplyingThis ? "Cancel" : "Reply"}
              </button>
            )}

            {!isReplyingThis && isOwner && (
              <>
                <button
                  className="text-green-600"
                  onClick={() => setEditing(a)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600"
                  onClick={() => deleteAnswer(a.id)}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* RECURSIVE REPLIES */}
        <div className="mt-3 space-y-3">
          {a.replies?.map((r: any) => renderAnswer(r))}
        </div>
      </div>
    );
  };



  /* ---------------- POST / REPLY ---------------- */
  async function submitAnswer(parentId: string | null = null) {
    const user = auth.currentUser;
    if (!user || !answerText.trim()) return;

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const username =
      userSnap.exists() ? userSnap.data().username || "User" : "User";

    let finalParentId: string | null = null;

    if (replyTo) {
      // 🔒 depth clamp
      finalParentId =
        replyTo.depth >= 2 ? replyTo.parentId : replyTo.id;
    }

    // 🔥 Create answer
    const answerRef = await addDoc(
      collection(db, "forumAnswers", id, "items"),
      {
        text: answerText.trim(),
        authorId: user.uid,
        authorName: username,
        parentId: finalParentId,
        createdAt: serverTimestamp(),
      }
    );

    /* --------------------------------------------------
      🔔 NOTIFICATIONS
    -------------------------------------------------- */

    // 🟦 CASE 1: FIRST ANSWER OF A TREE → notify forum owner
    if (!replyTo && forum.authorId !== user.uid) {
      await addDoc(
        collection(db, "notifications", forum.authorId, "items"),
        {
          type: "forum-answer",
          forumId: id,
          forumTitle: forum.title,
          answerId: answerRef.id,
          fromUserId: user.uid,
          fromUsername: username,
          textPreview: answerText.slice(0, 100),
          createdAt: serverTimestamp(),
          read: false,
        }
      );
    }

    // 🟩 CASE 2: REPLY → notify parent answer owner
    if (replyTo) {
      const parent = answers.find((a) => a.id === replyTo.id);

      if (parent && parent.authorId !== user.uid) {
        await addDoc(
          collection(db, "notifications", parent.authorId, "items"),
          {
            type: "forum-reply",
            forumId: id,
            forumTitle: forum.title,
            answerId: parentId,
            fromUserId: user.uid,
            fromUsername: username,
            textPreview: answerText.slice(0, 100),
            createdAt: serverTimestamp(),
            read: false,
          }
        );
      }
    }

    /* -------------------------------------------------- */

    // 🔥 Count only top-level answers
    if (!parentId) {
      await updateDoc(doc(db, "forums", id), {
        answersCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    }

    setAnswerText("");
    setReplyTo(null);
  }


  /* ---------------- EDIT / DELETE ---------------- */
  async function saveEdit() {
    if (!editing) return;
    await updateDoc(
      doc(db, "forumAnswers", id, "items", editing.id),
      { text: editing.text }
    );
    setEditing(null);
  }

  async function deleteAnswer(answerId: string) {
    await deleteDoc(doc(db, "forumAnswers", id, "items", answerId));
  }

  if (!forum) return null;

  /* ---------------- RENDER ---------------- */
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
      <h1 className="text-2xl font-semibold">{forum.title}</h1>
      <h2 className="text-sm text-gray-600">
        Author: {forum.authorName} ·{" "}
        {forum.createdAt
          ? new Date(forum.createdAt.seconds * 1000).toLocaleString()
          : ""}
      </h2>

      <p className="text-gray-600">{forum.description}</p>

      <div className="flex gap-2 justify-between">
        <div className="flex gap-2 items-center text-sm text-center cursor-default">
          <span className="font-medium">Category:</span>
          {forum.categories.map((c: string) => {
          const cat = PRESET_CATEGORIES.find((x) => x.id === c);
          return (
            <span key={c} className="bg-blue-100 px-3 py-1 rounded text-sm">
              {cat?.name}
            </span>
          );
        })}
        </div>
        {/* SORT */}
        <div className="flex text-sm border border-black rounded-lg">
          <button onClick={() => setSort("newest")} className={sort === "newest" ? "cursor-pointer text-white bg-black px-3 py-1 rounded" : "cursor-pointer text-black px-3 py-1 rounded"}>Newest</button>
          <button onClick={() => setSort("oldest")} className={sort === "oldest" ? "cursor-pointer text-white bg-black px-3 py-1 rounded" : "cursor-pointer text-black px-3 py-1 rounded"}>Oldest</button>
          <button onClick={() => setSort("mostReplies")} className={sort === "mostReplies" ? "cursor-pointer text-white bg-black px-3 py-1 rounded" : "cursor-pointer text-black px-3 py-1 rounded"}>Most Replies</button>
        </div>
      </div>

      {/* ANSWERS */}
      {answerTree.map((a) => renderAnswer(a))}
      </div>

      {/* INPUT */}
      <div className="flex gap-3 items-center sticky border-t border-gray-200 bottom-0 left-0 right-0 bg-gray-100 p-6 z-10">
        <textarea
          className="w-full border p-3 rounded resize-none"
          placeholder={
            replyTo ? `Replying to ${replyTo.authorName}` : "Write your answer..."
          }
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
        />

        <button
          onClick={() => submitAnswer(replyTo?.id || null)}
          className="bg-blue-600 text-white px-4 py-2 rounded h-12 cursor-pointer"
        >
          Post
        </button>
      </div>
    </div>
  );
}
