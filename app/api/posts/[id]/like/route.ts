import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest, { params }: any) {
  try {
    const { id } = params;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    if (!token) return NextResponse.json({ error: "Missing auth token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json().catch(() => ({}));
    const value = typeof body.value === "number" ? body.value : 1; // default to like

    const userLikeRef = adminDb.collection("likes").doc(id).collection("users").doc(uid);
    const snap = await userLikeRef.get();

    let newValue = value;

    if (snap.exists) {
      const oldValue = snap.data()?.value ?? 1;
      if (oldValue === value) {
        // same value again → remove
        await userLikeRef.delete();
        newValue = 0;
      } else {
        await userLikeRef.set({ value, likedAt: new Date() }, { merge: true });
      }
    } else {
      await userLikeRef.set({ value, likedAt: new Date() });
    }

    // Recompute likeCount by summing values
    const likesSnap = await adminDb.collection("likes").doc(id).collection("users").get();
    let total = 0;
    likesSnap.forEach((d) => {
      const v = d.data()?.value;
      if (typeof v === "number") total += v;
    });

    await adminDb.collection("posts").doc(id).update({ likeCount: total });

    return NextResponse.json({ ok: true, likeCount: total, value: newValue });
  } catch (e: any) {
    console.error("POST /api/posts/[id]/like error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
