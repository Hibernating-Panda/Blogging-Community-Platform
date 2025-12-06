import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET!;

    const uploadURL = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const cloudinaryData = new FormData();
    cloudinaryData.append("file", file);
    cloudinaryData.append("upload_preset", preset);
    cloudinaryData.append("folder", folder || "posts");

    const res = await fetch(uploadURL, {
      method: "POST",
      body: cloudinaryData,
    });

    const json = await res.json();

    return NextResponse.json({ url: json.secure_url });
  } catch (err) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
