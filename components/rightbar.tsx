"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import Link from "next/link";

export default function RightBar() {
  const [posts, setPosts] = useState<any[]>([]);
  const [forums, setForums] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        /* ---------- TOP POSTS ---------- */
        const postSnap = await getDocs(
          query(
            collection(db, "posts"),
            orderBy("likeCount", "desc"),
            limit(3)
          )
        );

        setPosts(postSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        /* ---------- TOP FORUMS ---------- */
        const forumSnap = await getDocs(
          query(
            collection(db, "forums"),
            orderBy("answersCount", "desc"),
            limit(3)
          )
        );

        setForums(forumSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        /* ---------- TOP PUBLIC COMMUNITIES ---------- */
        const communitySnap = await getDocs(
          query(
            collection(db, "communities"),
            where("visibility", "==", "public"),
            limit(50)
          )
        );

        const topPublic = communitySnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.memberCount || 0) - (a.memberCount || 0))
          .slice(0, 3);

        setCommunities(topPublic);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded bg-white shadow">
        <p>Loading trending content…</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded bg-white sticky top-4 space-y-6">
      {/* POSTS */}
      <Section title="🔥 Trending Posts">
        {posts.map((p, i) => (
          <RankItem
            key={p.id}
            index={i}
            href={`/post/${p.id}`}
            title={p.title}
            meta={`${p.likeCount} likes`}
          />
        ))}
      </Section>

      {/* FORUMS */}
      <Section title="💬 Active Forums">
        {forums.map((f, i) => (
          <RankItem
            key={f.id}
            index={i}
            href={`/forum/${f.id}`}
            title={f.title}
            meta={`${f.answersCount || 0} answers`}
          />
        ))}
      </Section>

      {/* COMMUNITIES */}
      <Section title="👥 Public Communities">
        {communities.map((c, i) => (
          <RankItem
            key={c.id}
            index={i}
            href={`/communities/join`}
            title={c.name}
            meta={`${c.memberCount || 0} members`}
          />
        ))}
      </Section>
    </div>
  );
}

/* ---------- HELPERS ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-2 cursor-default">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function RankItem({
  index,
  href,
  title,
  meta,
}: {
  index: number;
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="p-2 rounded hover:bg-gray-100 transition flex gap-2"
    >
      <span className="text-[#0088FF] font-semibold">{index + 1}</span>

      <div className="flex flex-col min-w-0">
        <p className="font-semibold truncate">{title}</p>
        <p className="text-sm text-gray-600 truncate">{meta}</p>
      </div>
    </Link>
  );
}
