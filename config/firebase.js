import admin from "firebase-admin";
import dotenv from "dotenv";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

dotenv.config();

const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://make-your-own-platter-default-rtdb.asia-southeast1.firebasedatabase.app";

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount),
  databaseURL,
};

if (!admin.apps.length) {
  admin.initializeApp(firebaseConfig);
  console.log(`Firebase Realtime Database URL: ${databaseURL}`);
}

export const getDatabase = () => admin.database();

export default admin;
