import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://make-your-own-platter-default-rtdb.asia-southeast1.firebasedatabase.app";

// Credentials come from env vars (not the gitignored serviceAccountKey.json)
// so the same code works on Vercel, where only env vars are available.
// FIREBASE_PRIVATE_KEY's newlines often arrive escaped as literal "\n" —
// e.g. when pasted into a .env file — so they're unescaped defensively here;
// this is a no-op if the value already contains real newlines.
const firebaseConfig = {
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  databaseURL,
};

if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
  console.log(`Firebase Realtime Database URL: ${databaseURL}`);
}

export const getDatabase = () => admin.database();

export default admin;
