import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);

    if (!decoded.admin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const communitiesSnap = await adminDb
      .collection("communities")
      .orderBy("createdAt", "desc")
      .get();

    // 🔥 Run member counts in parallel
    const communities = await Promise.all(
      communitiesSnap.docs.map(async (doc) => {
        const membersCountSnap = await adminDb
          .collection("communities")
          .doc(doc.id)
          .collection("members")
          .count()
          .get();

        return {
          id: doc.id,
          ...doc.data(),
          totalMembers: membersCountSnap.data().count,
        };
      })
    );

    return NextResponse.json(communities);
  } catch (err: any) {
    console.error("COMMUNITY FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Failed to load communities" },
      { status: 500 }
    );
  }
}
