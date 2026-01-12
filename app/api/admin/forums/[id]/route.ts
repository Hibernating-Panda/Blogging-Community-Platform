import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);

    if (!decoded.admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ref = adminDb.collection("forums").doc(id);
    await ref.delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE FORUM ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete forum" },
      { status: 500 }
    );
  }
}
