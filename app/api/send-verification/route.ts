import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Generate Firebase verification link
    const link = await adminAuth.generateEmailVerificationLink(email, {
      url: `${process.env.APP_URL}/verify`
    });

    // 2. Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Email template
    const html = `
      <div style="font-family:Arial; max-width:500px; margin:0 auto; padding:20px;">
        <h2 style="font-size:24px; font-weight:700;">Verify your email ✨</h2>

        <p>Thanks for joining us! Click the button below to verify your account.</p>

        <a href="${link}" 
           style="
             display:inline-block;
             background:#4f46e5;
             color:white;
             padding:12px 20px;
             border-radius:8px;
             text-decoration:none;
             font-weight:600;
             margin-top:12px;
           ">
          Verify Email
        </a>

        <p style="font-size:12px; color:#555; margin-top:20px;">
          If you didn’t request this, ignore this email.
        </p>
      </div>
    `;

    // 4. Send email
    await transporter.sendMail({
      from: `"Blog Platform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
