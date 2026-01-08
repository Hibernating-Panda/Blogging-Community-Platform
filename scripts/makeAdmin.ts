import "dotenv/config"; // 👈 MUST be first
import { adminAuth } from "../lib/firebaseAdmin";

const uid = "V9AMzkU6YDVBASAWTp61nJaAQ0g2";

async function makeAdmin() {
  await adminAuth.setCustomUserClaims(uid, {
    admin: true,
  });

  console.log(`✅ User ${uid} is now an admin`);
  process.exit(0);
}

makeAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
