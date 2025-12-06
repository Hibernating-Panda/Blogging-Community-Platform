import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { PRESET_CATEGORIES } from "@/types/firestore";

export async function POST(req: NextRequest) {
  try {
    // Extract user token
    const token = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    // Verify token
    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    // Parse form data
    const form = await req.formData();

    const title = form.get("title") as string;
    const summary = form.get("summary") as string;
    const categoryId = form.get("categoryId") as string;

    const coverFile = form.get("coverImage") as File | null;
    const contentText = form.get("contentText") as string | null;
    const contentFile = form.get("contentFile") as File | null;

    if (!title || !categoryId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Upload to Cloudinary
    const upload = async (file: Blob | File) => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "setpre");
      fd.append("resource_type", "auto");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dyuznbate/auto/upload",
        { method: "POST", body: fd }
      );

      const json = await res.json();
      if (!json.secure_url) throw new Error(json.error?.message || "Upload failed");
      return json.secure_url;
    };

    let coverImageUrl = "";
    if (coverFile) coverImageUrl = await upload(coverFile);

    let contentUrl = "";
    let contentType: any = "txt";

    if (contentFile) {
      const ext = contentFile.name.split(".").pop()?.toLowerCase();
      contentType = ext || "txt";
      contentUrl = await upload(contentFile);
    } else if (contentText) {
      const blob = new Blob([contentText], { type: "text/plain" });
      contentUrl = await upload(blob);
      contentType = "txt";
    }

    // Get user profile
    const authorSnap = await adminDb.collection("users").doc(userId).get();
    const author = authorSnap.data() || {};

    // Get category name from PRESET
    const categoryEntry = PRESET_CATEGORIES.find((c) => c.id === categoryId);
    const categoryName = categoryEntry?.name || "Uncategorized";

    // Save to Firestore
    const postRef = await adminDb.collection("posts").add({
      authorId: userId,
      authorName: author.username || "Unknown",
      authorImage: author.photoURL || "/profile.jpg",
      title,
      summary,
      categoryId,
      categoryName,
      coverImage: coverImageUrl,
      contentUrl,
      contentType,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isPublished: true,
    });

    return NextResponse.json({ id: postRef.id }, { status: 200 });
  } catch (err: any) {
    console.error("API POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
