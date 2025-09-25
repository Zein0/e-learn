import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export function getFirebaseClient() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (!apiKey || !projectId || !authDomain) {
    throw new Error("Missing Firebase web configuration");
  }
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey,
        authDomain,
        projectId,
      });
  return getAuth(app);
}
