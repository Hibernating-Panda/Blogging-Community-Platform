import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    /* ---------- AUTH ---------- */
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    if (!decoded.admin) {
      return NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      );
    }

    /* ---------- TIME WINDOWS ---------- */
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    /* ---------- PARALLEL INDEXED QUERIES ---------- */
    const [
      usersCountSnap,
      posts7DaysSnap,
      messagesDailySnap,
    ] = await Promise.all([
      // total users
      adminDb.collection("users").count().get(),

      // posts last 7 days
      adminDb
        .collection("posts")
        .where("createdAt", ">=", sevenDaysAgo)
        .count()
        .get(),

      // community interactions (messages, last 24h)
      adminDb
        .collectionGroup("messages")
        .where("createdAt", ">=", yesterday)
        .count()
        .get(),
    ]);

    /* ---------- RESPONSE ---------- */
    return NextResponse.json({
      users: usersCountSnap.data().count,
      posts7Days: posts7DaysSnap.data().count,
      interactionsDaily: messagesDailySnap.data().count,
    });
  } catch (err: any) {
    console.error("ADMIN STATS ERROR:", err);
    return NextResponse.json(
      {
        error: "Failed to load admin stats",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
