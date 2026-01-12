import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    /* ---------------- PARAMS (FIXED) ---------------- */
    const { id } = await ctx.params;

    /* ---------------- AUTH ---------------- */
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("Authorization");

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    /* ---------------- LOAD POST ---------------- */
    const postRef = adminDb.collection("posts").doc(id);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    const post = postSnap.data()!;

    /* ---------------- LIKE LOGIC ---------------- */
    const body = await req.json().catch(() => ({}));
    const value = typeof body.value === "number" ? body.value : 1;

    const userLikeRef = adminDb
      .collection("likes")
      .doc(id)
      .collection("users")
      .doc(uid);

    const likeSnap = await userLikeRef.get();
    const isFirstLike = !likeSnap.exists;

    let newValue = value;

    if (likeSnap.exists) {
      const oldValue = likeSnap.data()?.value ?? 1;

      if (oldValue === value) {
        // unlike
        await userLikeRef.delete();
        newValue = 0;
      } else {
        await userLikeRef.set(
          { value, likedAt: new Date() },
          { merge: true }
        );
      }
    } else {
      await userLikeRef.set({
        value,
        likedAt: new Date(),
      });
    }

    /* ---------------- 🔔 FIRST LIKE NOTIFICATION ---------------- */
    if (
      isFirstLike &&
      newValue === 1 &&
      post.authorId !== uid
    ) {
      const userSnap = await adminDb
        .collection("users")
        .doc(uid)
        .get();

      const username =
        userSnap.exists
          ? userSnap.data()?.username || "User"
          : "User";

      await adminDb
        .collection("notifications")
        .doc(post.authorId)
        .collection("items")
        .add({
          type: "post-like",
          postId: id,
          postTitle: post.title,
          fromUserId: uid,
          fromUsername: username,
          createdAt: new Date(),
          read: false,
        });
    }

    /* ---------------- RECOUNT LIKES ---------------- */
    const likesSnap = await adminDb
      .collection("likes")
      .doc(id)
      .collection("users")
      .get();

    let total = 0;
    likesSnap.forEach((d) => {
      const v = d.data()?.value;
      if (typeof v === "number") total += v;
    });

    await postRef.update({ likeCount: total });

    return NextResponse.json({
      ok: true,
      likeCount: total,
      value: newValue,
    });
  } catch (e: any) {
    console.error("POST /api/posts/[id]/like error:", e);
    return NextResponse.json(
      { error: e.message || "Internal error" },
      { status: 500 }
    );
  }
}
