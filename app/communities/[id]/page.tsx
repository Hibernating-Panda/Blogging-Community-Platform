"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

/* ================= TYPES ================= */

type Member = {
  id: string;
  name: string;
  image: string;
};

type Message = {
  id: string;
  authorId: string;
  text: string;
  createdAt: any;
  editedAt?: any;
  replyTo?: {
    id: string;
    text: string;
    authorName: string;
  } | null;
  authorName?: string;
  authorImage?: string;
};

/* ================= PAGE ================= */

export default function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const uid = auth.currentUser?.uid;

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showDeleteCommunity, setShowDeleteCommunity] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /* ---------- HELPERS ---------- */

  const formatDate = (ts: any) => {
    if (!ts || !ts.seconds) return "";
    return new Date(ts.seconds * 1000).toDateString();
  };

  const formatTime = (ts: any) => {
    if (!ts || !ts.seconds) return "";
    return new Date(ts.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* ---------- LOAD COMMUNITY ---------- */

  useEffect(() => {
    if (!id) return;

    getDoc(doc(db, "communities", id)).then((snap) => {
      if (snap.exists()) setCommunity({ id: snap.id, ...snap.data() });
    });
  }, [id]);

  /* ---------- LOAD MEMBERS ---------- */

  useEffect(() => {
    if (!id) return;

    getDocs(collection(db, "communities", id, "members")).then(
      async (snap) => {
        const list = await Promise.all(
          snap.docs.map(async (d) => {
            const u = await getDoc(doc(db, "users", d.id));
            return {
              id: d.id,
              role: d.data().role,
              name: u.exists() ? u.data().username : "User",
              image: u.exists() ? u.data().photoURL : "/profile.jpg",
            };
          })
        );
        setMembers(list);
      }
    );
  }, [id]);

  useEffect(() => {
    if (!id || !uid) return;

    const checkRole = async () => {
      const snap = await getDoc(
        doc(db, "communities", id, "members", uid)
      );

      if (snap.exists()) {
        const role = snap.data().role;
        setIsAdmin(["admin", "owner"].includes(role));
        setIsOwner(role === "owner");
      }
    };

    checkRole();
  }, [id, uid]);

  /* ---------- REALTIME CHAT ---------- */

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "communities", id, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, async (snap) => {
      const msgs: Message[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data() as Omit<Message, "id" | "authorName" | "authorImage">;
          const u = await getDoc(doc(db, "users", data.authorId));

          return {
            id: d.id,
            ...data,
            authorName: u.exists() ? u.data().username : "User",
            authorImage: u.exists()
              ? u.data().photoURL
              : "/profile.jpg",
          } as Message;
        })
      );

      setMessages(msgs);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    });
  }, [id]);

  /* ---------- SEND MESSAGE ---------- */

  const sendMessage = async () => {
    if (!uid || !text.trim()) return;

    // ✏ EDIT MODE
    if (editingMessage) {
      await updateDoc(
        doc(db, "communities", id, "messages", editingMessage.id),
        {
          text,
          editedAt: serverTimestamp(),
        }
      );
      setEditingMessage(null);
      setText("");
      return;
    }

    // ➕ NEW MESSAGE
    await addDoc(collection(db, "communities", id, "messages"), {
      authorId: uid,
      authorName: auth.currentUser?.displayName || "User",
      authorImage: auth.currentUser?.photoURL || "/profile.jpg",
      text,
      createdAt: serverTimestamp(),
      replyTo: replyTo
        ? {
            id: replyTo.id,
            text: replyTo.text,
            authorName: replyTo.authorName || "User",
          }
        : null,
    });

    setText("");
    setReplyTo(null);
  };


  /* ---------- EDIT / DELETE ---------- */

  const editMessage = async (m: Message) => {
    const newText = prompt("Edit message", m.text);
    if (!newText) return;

    await updateDoc(
      doc(db, "communities", id, "messages", m.id),
      { text: newText, editedAt: serverTimestamp() }
    );
  };

  const deleteMessage = async (m: Message) => {
    if (!confirm("Delete message?")) return;

    await deleteDoc(
      doc(db, "communities", id, "messages", m.id)
    );
  };

  const promoteMember = async (uid: string, role: "admin" | "member") => {
    await updateDoc(
      doc(db, "communities", id, "members", uid),
      { role }
    );
  };

  const removeMember = async (uid: string) => {
    await deleteDoc(doc(db, "communities", id, "members", uid));
    await deleteDoc(doc(db, "users", uid, "communities", id));
  };

  const leaveCommunity = async () => {
    if (!uid) return;
    if (!confirm("Leave this community?")) return;

    await deleteDoc(doc(db, "communities", id, "members", uid));
    await deleteDoc(doc(db, "users", uid, "communities", id));

    await updateDoc(doc(db, "communities", id), {
      memberCount: (community.memberCount || 1) - 1,
    });

    window.location.href = "/communities";
  };

  const deleteCommunity = async () => {
    if (!id || !uid) return;

    setDeleting(true);

    // 1️⃣ Delete community document FIRST
    await deleteDoc(doc(db, "communities", id));

    // 2️⃣ Delete members
    const membersSnap = await getDocs(
      collection(db, "communities", id, "members")
    );

    for (const m of membersSnap.docs) {
      await deleteDoc(doc(db, "users", m.id, "communities", id));
      await deleteDoc(m.ref);
    }

    // 3️⃣ Delete messages
    const msgsSnap = await getDocs(
      collection(db, "communities", id, "messages")
    );

    for (const msg of msgsSnap.docs) {
      await deleteDoc(msg.ref);
    }

    window.location.href = "/communities";
  };

  if (!community) return <p className="p-6">Loading…</p>;

  /* ================= UI ================= */

  let lastDate = "";

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden bg-gray-50 text-black">

      {/* CHAT */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="bg-white border-b border-[#D6D6D6] px-6 py-4 sticky z-50">
          <h1 className="text-xl font-bold">{community.name}</h1>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
          {messages.map((m) => {
            const date =
            m.createdAt && m.createdAt.seconds
              ? formatDate(m.createdAt)
              : "";
            const showDate = date !== lastDate;
            lastDate = date;

            return (
              <div key={m.id}>
                {showDate && date && (
                  <div className="text-center text-xs text-gray-500 my-4 cursor-default">
                    {date}
                  </div>
                )}

                <div className="flex gap-3 group">
                  <img
                    src={m.authorImage}
                    className="w-10 h-10 rounded-full"
                  />

                  <div className="bg-white p-3 rounded-lg shadow max-w-xl relative cursor-default">
                    <p className="font-semibold text-sm">
                      {m.authorName}
                    </p>

                    {m.replyTo && (
                      <div className="text-xs border-l-2 pl-2 mb-1 text-gray-500">
                        Replying to {m.replyTo.authorName}
                        <br />
                        {m.replyTo.text}
                      </div>
                    )}

                    <p className="break-all">{m.text}</p>

                    <div className="flex justify-end gap-1 text-xs text-gray-400 mt-1">
                      {m.editedAt && <span>edited</span>}
                      <span>{formatTime(m.createdAt)}</span>
                    </div>

                    <div className="absolute -right-25 top-1 hidden group-hover:flex gap-1 text-xs">
                      <button className="cursor-pointer" onClick={() => setReplyTo(m)}>Reply</button>

                      {(m.authorId === uid || isAdmin) && (
                        <div className="flex gap-2 text-xs text-gray-400">
                          {m.authorId === uid && (
                            <button
                              className="cursor-pointer"
                              onClick={() => {
                                setEditingMessage(m);
                                setText(m.text);
                              }}
                            >
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteTarget(m)}
                            className="text-red-500 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* REPLY BAR */}
        {replyTo && (
          <div className="bg-gray-100 px-4 py-2 text-sm flex justify-between sticky bottom-18 z-50 cursor-default">
            Replying to {replyTo.authorName}
            <button className="ml-2 text-red-500 cursor-pointer" onClick={() => setReplyTo(null)}>✖</button>
          </div>
        )}

        {/* INPUT */}
        <div className="border-t bg-white p-4 sticky bottom-0 z-50 border-[#D6D6D6]">
          {editingMessage && (
            <div className="text-xs text-blue-600 mb-1">
              Editing message
              <button
                className="ml-2 text-red-500"
                onClick={() => {
                  setEditingMessage(null);
                  setText("");
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message..."
              className="flex-1 border rounded-xl px-4 py-2 border-[#D6D6D6]"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl cursor-pointer"
            >
              {editingMessage ? "Save" : "Send"}
            </button>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 space-y-4">
            <h3 className="font-semibold">Delete message?</h3>
            <p className="text-sm text-gray-600">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 rounded bg-red-600 text-white"
                onClick={async () => {
                  await deleteDoc(
                    doc(
                      db,
                      "communities",
                      id,
                      "messages",
                      deleteTarget.id
                    )
                  );
                  setDeleteTarget(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {/* SIDEBAR */}
      <aside className="w-80 bg-white border-l border-[#D6D6D6]
                        h-[calc(100vh-3rem)] overflow-y-auto p-4 space-y-6 cursor-default">

        {/* COMMUNITY INFO */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg cursor-default">Community Info</h2>

            {isOwner && (
              <button
                onClick={() => setShowDeleteCommunity(true)}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Delete
              </button>
            )}

            {showDeleteCommunity && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-96 space-y-4 cursor-default">
                <h3 className="text-lg font-semibold text-red-600">
                  Delete Community
                </h3>

                <p className="text-sm text-gray-600">
                  This will permanently delete the community,
                  all messages, and all members.
                  <br />
                  <b>This action cannot be undone.</b>
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteCommunity(false)}
                    disabled={deleting}
                    className="px-4 py-2 rounded border cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={deleteCommunity}
                    disabled={deleting}
                    className="px-4 py-2 rounded bg-red-600 text-white cursor-pointer"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          </div>

          <button
            onClick={leaveCommunity}
            className="w-full bg-red-500 hover:bg-red-600
                      text-white py-2 rounded-lg text-sm font-semibold cursor-pointer">
            Leave Community
          </button>
        </div>

        {/* ABOUT */}
        <div>
          <h3 className="font-semibold mb-1">About</h3>
          <p className="text-sm text-gray-600">
            {community.description || "No description provided"}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Created {formatDate(community.createdAt)}
            <br />
            {members.length} members
          </p>
        </div>

        {/* COMMUNITY RULES */}
        <CommunityRules
          community={community}
          isAdmin={isAdmin}
          id={id}
        />

        {/* MODERATORS */}
        <MemberSection
          title="Moderators"
          members={members.filter((m: any) => m.role !== "member")}
        />

        {/* MEMBERS */}
        <MemberSection
          title="Members"
          members={members.filter((m: any) => m.role === "member").slice(0, 5)}
        />
      </aside>

    </div>
  );
}

function CommunityRules({ community, isAdmin, id }: any) {
  const [editing, setEditing] = useState(false);
  const [rules, setRules] = useState<string[]>(community.rules || []);

  const saveRules = async () => {
    await updateDoc(doc(db, "communities", id), { rules });
    setEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">Community Rules</h3>
        {isAdmin && (
          <button
            onClick={() => {
              const next = !editing;
              setEditing(next);
              if (next && rules.length === 0) {
                setRules([""]);
              }
            }}
            className="text-xs text-blue-600 cursor-pointer"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        )}
      </div>

      <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
        {rules.map((r, i) => (
          <li key={i}>
            {editing ? (
              <input
                value={r}
                onChange={(e) => {
                  const copy = [...rules];
                  copy[i] = e.target.value;
                  setRules(copy);
                }}
                className="border rounded px-2 py-1 w-full bg-white"
              />
            ) : (
              r
            )}
          </li>
        ))}
      </ol>

      {editing && (
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={() => setRules([...rules, ""])}
            className="text-xs px-3 py-1 rounded border cursor-pointer"
          >
            Add rule
          </button>
          <button
            onClick={saveRules}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded cursor-pointer"
          >
            Save Rules
          </button>
        </div>
      )}
    </div>
  );
}

function MemberSection({ title, members }: any) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>

      <div className="space-y-2">
        {members.map((m: any) => (
          <div key={m.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={m.image} className="w-8 h-8 rounded-full" />
              <span className="text-sm">{m.name}</span>
            </div>

            {m.role !== "member" && (
              <span className="text-xs text-gray-400">
                {m.role === "owner" ? "Founder" : "Moderator"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
