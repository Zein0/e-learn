import { cookies } from "next/headers";
import { getFirebaseAdmin } from "./firebase-admin";
import { prisma } from "./db";

function getTokenIssuer(token: string) {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }
  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = Buffer.from(padded, "base64").toString("utf8");
    const decoded = JSON.parse(payload) as { iss?: unknown };
    return typeof decoded.iss === "string" ? decoded.iss : null;
  } catch (error) {
    console.error("Failed to decode session token", error);
    return null;
  }
}

export type SessionUser = {
  id: string;
  role: "LEARNER" | "ADMIN";
  email: string;
  name?: string | null;
  firebaseUid: string;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get("session")?.value;
  if (!token) return null;
  try {
    const auth = getFirebaseAdmin();
    const issuer = getTokenIssuer(token);
    const isSessionCookie = issuer?.includes("session.firebase.google.com");
    const decoded = isSessionCookie
      ? await auth.verifySessionCookie(token, true)
      : await auth.verifyIdToken(token, true);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });
    if (!user) return null;
    return {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      firebaseUid: decoded.uid,
    };
  } catch (error) {
    console.error("Failed to resolve current user", error);
    return null;
  }
}

export async function requireRole(role: SessionUser["role"]) {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    throw new Error("Unauthorized");
  }
  return user;
}
