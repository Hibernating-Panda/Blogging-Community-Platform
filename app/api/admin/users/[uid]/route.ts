import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function DELETE(
  req: Request,
  { params }: { params: { uid: string } }
) {
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

    const uid = params.uid;

    // Delete Firestore profile
    await adminDb.collection("users").doc(uid).delete();

    // OPTIONAL: delete auth account
    // await adminAuth.deleteUser(uid);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE USER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
