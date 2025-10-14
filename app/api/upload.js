// pages/api/upload.js
import cloudinary from "@/lib/cloudinary";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const fileStr = req.body.data; // base64 image string
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: "my-nextjs-app",
    });

    res.status(200).json({ url: uploadResponse.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
}

// On the client side:

// const handleUpload = async (file) => {
//   const reader = new FileReader();
//   reader.readAsDataURL(file);
//   reader.onloadend = async () => {
//     const res = await fetch("/api/upload", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ data: reader.result }),
//     });
//     const data = await res.json();
//     console.log("Uploaded image URL:", data.url);
//   };
// };