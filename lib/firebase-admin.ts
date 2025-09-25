import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

export function getFirebaseAdmin() {
  if (!firebaseAdminConfig.projectId || !firebaseAdminConfig.clientEmail || !firebaseAdminConfig.privateKey) {
    throw new Error("Missing Firebase admin credentials");
  }
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(firebaseAdminConfig) });
  return getAuth(app);
}
