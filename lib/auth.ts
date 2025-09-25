import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
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
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  try {
    const auth = getFirebaseAdmin();
    const decoded = await auth.verifySessionCookie(token, true);
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
    const code =
      (typeof error === "object" && error && "code" in error
        ? (error as { code?: string }).code
        : undefined) ??
      (typeof error === "object" && error && "errorInfo" in error
        ? (error as { errorInfo?: { code?: string } }).errorInfo?.code
        : undefined);
    if (
      code === "auth/id-token-expired" ||
      code === "auth/session-cookie-expired" ||
      code === "auth/session-cookie-revoked"
    ) {
      cookieStore.delete("session");
    }
    const requestHeaders = headers();
    const currentPath = requestHeaders.get("next-url") ?? "";
    if (!currentPath.startsWith("/api")) {
      if (currentPath.startsWith("/admin")) {
        if (!currentPath.startsWith("/admin/login")) {
          redirect("/admin/login");
        }
      } else if (!currentPath.startsWith("/login")) {
        redirect("/login");
      }
    }
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
