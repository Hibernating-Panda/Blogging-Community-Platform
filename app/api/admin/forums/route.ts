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
      .collection("forums")
      .orderBy("createdAt", "desc")
      .get();

    const forums = await Promise.all(
      snap.docs.map(async (doc) => {
        const d = doc.data() as any;

        let authorName = "";
        let authorImage = "";

        if (d.authorId) {
          const userSnap = await adminDb
            .collection("users")
            .doc(d.authorId)
            .get();

          if (userSnap.exists) {
            const u = userSnap.data()!;
            authorName = u.username || "";
            authorImage = u.photoURL || "";
          }
        }

        return {
          id: doc.id,
          title: d.title ?? "",
          authorId: d.authorId ?? "",
          authorName,
          authorImage,
          createdAt: d.createdAt ?? null,
          updatedAt: d.updatedAt ?? null,
          answersCount: d.answersCount ?? 0,
          isLocked: d.isLocked ?? false,
        };
      })
    );

    return NextResponse.json(forums);
  } catch (err) {
    console.error("ADMIN FORUMS ERROR:", err);
    return NextResponse.json({ error: "Failed to load forums" }, { status: 500 });
  }
}
