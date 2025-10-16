import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { data } = await req.json();
    if (!data || typeof data !== "string") {
      return Response.json({ error: "Missing image data" }, { status: 400 });
    }

    const uploadResponse = await cloudinary.uploader.upload(data, {
      folder: "my-nextjs-app",
    });

    return Response.json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
