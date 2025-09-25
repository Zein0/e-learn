import { cookies } from "next/headers";
import { getFirebaseAdmin } from "./firebase-admin";
import { prisma } from "./db";

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
    const decoded = await auth.verifyIdToken(token);
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
