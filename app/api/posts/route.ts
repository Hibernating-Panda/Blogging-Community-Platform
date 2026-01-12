import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { PRESET_CATEGORIES } from "@/types/firestore";

const CLOUDINARY_URL =
  "https://api.cloudinary.com/v1_1/dyuznbate/raw/upload";
const CLOUDINARY_PRESET = "setpre";

async function uploadRawMarkdown(
  content: string,
  publicId: string
): Promise<string> {
  const fd = new FormData();
  fd.append(
    "file",
    new Blob([content], { type: "text/markdown; charset=utf-8" })
  );
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("resource_type", "raw");
  fd.append("folder", "research_posts");
  fd.append("public_id", publicId);

  const res = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: fd,
  });

  const json = await res.json();
  if (!json.secure_url) {
    throw new Error(json.error?.message || "Content upload failed");
  }

  return json.secure_url;
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dyuznbate/image/upload",
    { method: "POST", body: fd }
  );

  const json = await res.json();
  if (!json.secure_url) {
    throw new Error(json.error?.message || "Image upload failed");
  }

  return json.secure_url;
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const form = await req.formData();

    const title = form.get("title") as string;
    const summary = form.get("summary") as string;
    const categoriesRaw = form.get("categories") as string;
    const contentText = form.get("contentText") as string | null;
    const coverFile = form.get("coverImage") as File | null;

    if (!title || !summary || !categoriesRaw || !contentText) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const categories: string[] = JSON.parse(categoriesRaw);

    if (categories.length < 1 || categories.length > 2) {
      return NextResponse.json(
        { error: "Select 1–2 categories" },
        { status: 400 }
      );
    }

    // 🔹 Upload cover image
    let coverImageUrl = "";
    if (coverFile) {
      coverImageUrl = await uploadImage(coverFile);
    }

    // 🔹 Upload markdown
    const contentPublicId = `post_${Date.now()}_${userId}`;
    const contentUrl = await uploadRawMarkdown(
      contentText,
      contentPublicId
    );

    // 🔹 Author
    const authorSnap = await adminDb.collection("users").doc(userId).get();
    const author = authorSnap.data() || {};

    // 🔹 Category names
    const categoryNames = categories.map(
      (id) => PRESET_CATEGORIES.find((c) => c.id === id)?.name || id
    );

    const postRef = await adminDb.collection("posts").add({
      authorId: userId,
      authorName: author.username || "Unknown",
      authorImage: author.photoURL || "/profile.jpg",

      title,
      summary,

      categories,
      categoryNames,

      coverImageUrl,
      contentType: "markdown",
      contentUrl,

      createdAt: new Date(),
      updatedAt: new Date(),

      views: 0,
      likes: 0,
      comments: 0,
      isPublished: true,
    });

    return NextResponse.json({ id: postRef.id });
  } catch (err: any) {
    console.error("POST ERROR:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

