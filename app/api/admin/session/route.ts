import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { LOCALE_COOKIE } from "@/lib/i18n-config";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };

    if (!idToken) {
      return NextResponse.json({ error: "ID token is required" }, { status: 400 });
    }

    const auth = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(idToken);

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }

    const cookieStore = cookies();
    cookieStore.set("session", idToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    cookieStore.set({
      name: LOCALE_COOKIE,
      value: "en",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/session", error);
    return NextResponse.json({ error: "Failed to create admin session" }, { status: 500 });
  }
}

