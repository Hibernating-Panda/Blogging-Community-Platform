"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc, 
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import Link from "next/link";
import { useSearch } from "@/context/SearchContext";
import { PRESET_CATEGORIES } from "@/types/firestore";

type SortType = "latest" | "oldest";
type FilterType = "all" | "post" | "forum";

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortType>("latest");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const { searchText, selectedCategory } = useSearch();

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    const loadHistory = async () => {
      if (!auth.currentUser) return;

      const uid = auth.currentUser.uid;
      const results: any[] = [];

      // POSTS HISTORY
      const postSnap = await getDocs(
        query(
          collection(db, "history", uid, "posts"),
          orderBy("lastViewedAt", "desc")
        )
      );

      for (const h of postSnap.docs) {
        const postDoc = await getDoc(doc(db, "posts", h.id));
        if (postDoc.exists()) {
          results.push({
            id: h.id,
            type: "post",
            lastViewedAt: h.data().lastViewedAt,
            ...postDoc.data(),
          });
        }
      }

      // FORUM HISTORY
      const forumSnap = await getDocs(
        query(
          collection(db, "history", uid, "forums"),
          orderBy("lastViewedAt", "desc")
        )
      );

      for (const h of forumSnap.docs) {
        const forumDoc = await getDoc(doc(db, "forums", h.id));
        if (!forumDoc.exists()) continue;

        const forumData = forumDoc.data();

        let authorName = "Unknown";
        if (forumData.authorId) {
          const userSnap = await getDoc(
            doc(db, "users", forumData.authorId)
          );
          if (userSnap.exists()) {
            authorName =
              userSnap.data().username ||
              userSnap.data().name ||
              "Unknown";
          }
        }

        results.push({
          id: h.id,
          type: "forum",
          lastViewedAt: h.data().lastViewedAt,
          authorName,              // ✅ FIX
          ...forumData,
        });
      }
      
      setItems(results);
      setLoading(false);
    };

    loadHistory();
  }, []);

  /* ---------------- FILTER + SORT ---------------- */
  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        // 🔹 type filter
        if (filterType !== "all" && item.type !== filterType) {
          return false;
        }

        // 🔹 search
        const matchSearch =
          item.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          item.authorName?.toLowerCase().includes(searchText.toLowerCase());

        // 🔹 category (posts & forums both use categories[])
        const matchCategory =
          !selectedCategory ||
          item.categories?.includes?.(selectedCategory);

        return matchSearch && matchCategory;
      })
      .sort((a, b) => {
        if (sort === "latest") {
          return (
            b.lastViewedAt?.seconds - a.lastViewedAt?.seconds
          );
        }
        if (sort === "oldest") {
          return (
            a.lastViewedAt?.seconds - b.lastViewedAt?.seconds
          );
        }
        return 0;
      });
  }, [items, searchText, selectedCategory, sort, filterType]);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold cursor-default">History</h1>

        <div className="flex gap-4">
          {/* TYPE FILTER */}
          <div className="flex border rounded overflow-hidden text-sm">
            {["all", "post", "forum"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t as FilterType)}
                className={`px-3 py-1 capitalize cursor-pointer ${
                  filterType === t
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* SORT */}
          <div className="flex border rounded overflow-hidden text-sm">
            {["latest", "oldest"].map((s) => (
              <button
                key={s}
                onClick={() => setSort(s as SortType)}
                className={`px-3 py-1 cursor-pointer ${
                  sort === s
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-600">No history found.</p>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={
              item.type === "post"
                ? `/post/${item.id}`
                : `/forum/${item.id}`
            }
            className="border border-[#D9D9D9] rounded-lg p-4 flex gap-4 hover:bg-gray-50 transition"
          >
            {item.coverImageUrl && (
              <img
                src={item.coverImageUrl}
                className="w-32 h-20 object-cover rounded"
                alt="cover"
              />
            )}

            <div className="flex flex-col justify-between">
              <h2 className="text-xl font-semibold">{item.title}</h2>

              <p className="text-xs text-gray-800">
                {item.type === "post" ? "Post" : "Forum"} •{" "}
                {item.authorName} •{" "}
                {item.categories.map((c: string, i: number) => {
                  const cat = PRESET_CATEGORIES.find((x) => x.id === c);
                  return (
                    <span key={c}>
                      {i > 0 && ", "}
                      {cat?.name}
                    </span>
                  );
                })}
              </p>

              <p className="text-xs text-gray-600">
                Last Viewed:{" "}
                {item.lastViewedAt?.toDate?.().toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
