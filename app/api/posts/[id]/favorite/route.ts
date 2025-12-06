import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest, { params }: any) {
  try {
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;
    const postId = params.id;

    const favRef = adminDb
      .collection("favorites")
      .doc(userId)
      .collection("posts")
      .doc(postId);

    const snap = await favRef.get();

    if (snap.exists) {
      await favRef.delete();
      return NextResponse.json({ favorited: false });
    } else {
      await favRef.set({
        favoritedAt: new Date(),
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (err: any) {
    console.error("Favorite API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
