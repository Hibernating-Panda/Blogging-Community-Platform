import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);

    if (!decoded.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snap = await adminDb
      .collection("posts")
      .orderBy("createdAt", "desc") // server-side sort (FAST)
      .get();

    const posts = snap.docs.map((doc) => {
      const d = doc.data();

      return {
        id: doc.id,
        title: d.title ?? "",
        summary: d.summary ?? "",
        authorId: d.authorId ?? "",
        authorName: d.authorName ?? "",
        authorImage: d.authorImage ?? "",
        categoryNames: d.categoryNames ?? [],
        coverImageUrl: d.coverImageUrl ?? "",
        createdAt: d.createdAt ?? null,
        updatedAt: d.updatedAt ?? null,
        likeCount: d.likeCount ?? 0,
        commentCount: d.commentCount ?? 0,
        viewCount: d.viewCount ?? 0,
        isPublished: d.isPublished ?? false,
      };
    });

    return NextResponse.json(posts);
  } catch (err: any) {
    console.error("ADMIN POSTS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 }
    );
  }
}
