import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const postRef = adminDb.collection("posts").doc(params.id);
    await postRef.delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE POST ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
