import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate Firebase email verification link
    const link = await adminAuth.generateEmailVerificationLink(email, {
      url: `${process.env.APP_URL}/verify`
    });

    // Send custom verification email
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Verify your email",
      html: `
        <div style="font-family: Arial; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">Verify your email</h2>
          <p>Thanks for signing up! Click the button below to verify your email address.</p>
          <a href="${link}"
             style="display:inline-block; background:#4f46e5; color:white; padding:12px 20px; border-radius:8px; text-decoration:none;">
             Verify Email
          </a>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Verification email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
