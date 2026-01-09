"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db, auth } from "../../../lib/firebase";
import { PRESET_CATEGORIES } from "../../../types/firestore";

export default function ForumDetailPage() {
  const { id } = useParams();

  const [forum, setForum] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);

  useEffect(() => {
    if (!id) return;

    const forumRef = doc(db, "forums", id as string);

    // 🔹 Forum realtime
    const unsubForum = onSnapshot(forumRef, (snap) => {
      if (snap.exists()) {
        setForum({ id: snap.id, ...snap.data() });
      }
    });

    // 🔹 Answers realtime
    const unsubAnswers = onSnapshot(
      collection(db, "forumAnswers", id as string, "items"),
      (snap) => {
        setAnswers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    // 🔹 Votes realtime (current user)
    let unsubVote = () => {};
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Anonymous view tracking (per-browser) using localStorage
        try {
          const key = `forum_viewed_${id}`;
          const alreadyViewed = typeof window !== "undefined" && window.localStorage.getItem(key);
          if (!alreadyViewed) {
            // Increment views once per browser for anonymous users
            runTransaction(db, async (tx) => {
              tx.update(forumRef, {
                views: increment(1),
              });
            })
              .then(() => {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(key, "1");
                }
              })
              .catch(() => {
                // ignore
              });
          }
        } catch {
          // ignore storage errors
        }
        return;
      }

      const voteRef = doc(
        db,
        "forumVotes",
        id as string,
        "users",
        user.uid
      );

      unsubVote = onSnapshot(voteRef, (snap) => {
        setUserVote(snap.exists() ? snap.data().value : 0);
      });

      // 🔥 VIEW TRACKING (TRANSACTION) — per-user
      runTransaction(db, async (tx) => {
        const viewRef = doc(
          db,
          "forumViews",
          id as string,
          "users",
          user.uid
        );

        const viewSnap = await tx.get(viewRef);
        if (!viewSnap.exists()) {
          tx.set(viewRef, {
            viewedAt: serverTimestamp(),
          });

          tx.update(forumRef, {
            views: increment(1),
          });
        }
      });
    });

    return () => {
      unsubForum();
      unsubAnswers();
      unsubAuth();
      unsubVote();
    };
  }, [id]);

  /* ---------- POST ANSWER ---------- */
  async function postAnswer() {
    const user = auth.currentUser;
    if (!user || !answerText.trim()) return;

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const username =
      userSnap.exists()
        ? userSnap.data().username || "Anonymous"
        : "Anonymous";

    await addDoc(
      collection(db, "forumAnswers", id as string, "items"),
      {
        text: answerText,
        authorId: user.uid,
        authorName: username,
        createdAt: serverTimestamp(),
      }
    );

    await updateDoc(doc(db, "forums", id as string), {
      answersCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    setAnswerText("");
  }

  /* ---------- VOTE ---------- */
  async function vote(value: 1 | -1) {
    const user = auth.currentUser;
    if (!user) return alert("Login required");

    const forumRef = doc(db, "forums", id as string);
    const voteRef = doc(
      db,
      "forumVotes",
      id as string,
      "users",
      user.uid
    );

    await runTransaction(db, async (tx) => {
      const voteSnap = await tx.get(voteRef);
      let delta: number = value;

      if (voteSnap.exists()) {
        const prev = voteSnap.data().value as 1 | -1;
        if (prev === value) {
          tx.delete(voteRef);
          delta = -value;
        } else {
          tx.update(voteRef, { value });
          delta = value * 2;
        }
      } else {
        tx.set(voteRef, { value });
      }

      tx.update(forumRef, {
        votes: increment(delta),
      });
    });
  }

  if (!forum) return null;

  return (
    <div className="p-6 space-y-6 bg-gray-100">

      <h1 className="text-2xl font-semibold">{forum.title}</h1>

      {/* VOTES */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => vote(1)}
          className={`text-2xl ${
            userVote === 1 ? "text-blue-600" : "text-gray-400"
          }`}
        >
          {userVote === 1 ? "▲" : "△"}
        </button>

        <span className="font-medium">{forum.votes}</span>

        <button
          onClick={() => vote(-1)}
          className={`text-2xl ${
            userVote === -1 ? "text-red-600" : "text-gray-400"
          }`}
        >
          {userVote === -1 ? "▼" : "▽"}
        </button>

        <span className="text-sm text-gray-500">
          {forum.views} views
        </span>
      </div>

      <p className="whitespace-pre-line">{forum.description}</p>

      {/* CATEGORIES */}
      <div className="flex gap-2 flex-wrap">
        {forum.categories.map((c: string) => {
          const cat = PRESET_CATEGORIES.find((x) => x.id === c);
          return (
            <span
              key={c}
              className="bg-blue-100 px-3 py-1 rounded text-sm"
            >
              {cat?.name}
            </span>
          );
        })}
      </div>

      {/* ANSWERS */}
      <h2 className="font-semibold">{answers.length} Answers</h2>

      {answers.map((a) => (
        <div key={a.id} className="bg-white p-4 rounded border">
          <p>{a.text}</p>
          <p className="text-sm text-gray-500 mt-2">
            {a.authorName}
          </p>
        </div>
      ))}

      {/* ADD ANSWER */}
      <textarea
        rows={4}
        value={answerText}
        onChange={(e) => setAnswerText(e.target.value)}
        className="w-full border p-3 rounded"
        placeholder="Write your answer..."
      />

      <button
        onClick={postAnswer}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Post Answer
      </button>
    </div>
  );
}
