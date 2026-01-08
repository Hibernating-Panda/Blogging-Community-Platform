//lib/firebaseAdmin.ts

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missing: string[] = [];
  if (!projectId) missing.push("FIREBASE_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!rawPrivateKey) missing.push("FIREBASE_PRIVATE_KEY");

  if (missing.length) {
    throw new Error(
      `Firebase Admin credentials are missing: ${missing.join(", ")}. Set these environment variables before running.`
    );
  }

  // rawPrivateKey is defined by the guard above; assert for TypeScript
  const privateKey = (rawPrivateKey as string).replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
