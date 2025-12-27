import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest, ctx: any) {
  try {
    // MUST AWAIT PARAMS
    const { id: postId } = await ctx.params;

    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const favRef = adminDb
      .collection("favorites")
      .doc(userId)
      .collection("posts")
      .doc(postId);

    const snap = await favRef.get();

    // REMOVE FAVORITE
    if (snap.exists) {
      await favRef.delete();
      return NextResponse.json({
        favorited: false,
        favoritedAt: null,
      });
    }

    // ADD FAVORITE
    const favoritedAt = new Date();
    await favRef.set({ favoritedAt });

    return NextResponse.json({
      favorited: true,
      favoritedAt,
    });

  } catch (err: any) {
    console.error("Favorite API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
