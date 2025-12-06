import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { adminDb } from "@/lib/firebaseAdmin";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(req: Request) {
  try {
    const form = await req.formData();

    const uid = form.get("uid") as string;
    const username = form.get("username") as string;
    const bio = form.get("bio") as string;
    const gender = form.get("gender") as string;
    const workplace = form.get("workplace") as string;
    const file = form.get("photo") as File | null;

    if (!uid) {
      return NextResponse.json({ error: "Missing UID" }, { status: 400 });
    }

    let photoURL: string | null = null;

    // -------------------------
    // UPLOAD TO CLOUDINARY
    // -------------------------
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const uploaded = await cloudinary.uploader.upload(
        `data:${file.type};base64,${buffer.toString("base64")}`,
        {
          folder: "profiles",
          public_id: uid, // overwrite old photo
          transformation: [{ width: 400, height: 400, crop: "fill" }],
        }
      );

      photoURL = uploaded.secure_url;
    }

    // -------------------------
    // UPDATE FIRESTORE
    // -------------------------
    await adminDb.collection("users").doc(uid).update({
      username,
      bio,
      gender,
      workplace,
      ...(photoURL && { photoURL }),
      updatedAt: Date.now(),
    });

    return NextResponse.json({ success: true, photoURL });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
