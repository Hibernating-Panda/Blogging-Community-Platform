"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/statecard";
import ActionCard from "@/components/actioncard";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("You must be signed in.");
          return;
        }

        const token = await user.getIdToken();

        const res = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch admin stats");
        }

        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <p className="p-6">Loading stats…</p>;

  if (error)
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-300 bg-red-50 text-red-800 p-4">
          <p className="font-semibold">Admin Error</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="w-full h-full bg-white text-black cursor-default">
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="p-6 bg-gray-100 rounded-2xl border-2 border-[#707379] shadow-md">
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>

          <h2 className="text-xl font-bold mb-5 text-[#2D3748]">
            Platform Statistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Registered Users"
              value={stats.users}
              change="—"
              note="All time"
              image="/users-solid 1.svg"
            />

            <StatCard
              title="New research posts"
              value={stats.posts7Days}
              change="—"
              note="Last 7 days"
              image="/book-open-solid 1.svg"
            />

            <StatCard
              title="Community Interactions"
              value={stats.interactionsDaily}
              change="—"
              note="Recent activity"
              image="/comment-regular 1.svg"
            />

            <StatCard
              title="Total Forums"
              value={stats.forums}
              change="—"
              note="All time"
              image="/message-regular 2.svg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/users" className="cursor-pointer hover:opacity-80 hover:scale-105">
              <ActionCard
                value="Users"
                image="/comment-regular 1.svg"
                title="User Management"
                description="Manage and oversee user accounts"
              />
            </Link>
             
            <Link href="/admin/research" className="cursor-pointer hover:opacity-80 hover:scale-105">
              <ActionCard
                value="Research"
                image="/book-bookmark-solid 1.svg"
                title="Research Management"
                description="Moderate and review research posts"
              />
            </Link>
            <Link href="/admin/community" className="cursor-pointer hover:opacity-80 hover:scale-105">
              <ActionCard
                value="Communities"
                image="/message-regular 2.svg"
                title="Community Moderation"
                description="Manage communities and messages"
              />
            </Link>
            <Link
              href="/admin/forum"
              className="cursor-pointer hover:opacity-80 hover:scale-105 transition"
            >
              <ActionCard
                value="Forums"
                image="/message-regular 2.svg"
                title="Forum Management"
                description="Moderate forums and answers"
              />
            </Link>

          </div>
        </div>
      </main>
    </div>
  );
}
