import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "مطلوب رمز الهوية" }, { status: 400 });
    }
    const auth = getFirebaseAdmin();
    const decoded = await auth.verifyIdToken(idToken);
    const { uid, email, name, phone_number } = decoded;
    if (!email) {
      return NextResponse.json({ error: "لا يوجد بريد إلكتروني" }, { status: 400 });
    }
    const user = await prisma.user.upsert({
      where: { firebaseUid: uid },
      update: { email, name: name ?? undefined, phone: phone_number ?? undefined },
      create: {
        firebaseUid: uid,
        email,
        name: name ?? undefined,
        phone: phone_number ?? undefined,
        role: "LEARNER",
      },
    });

    cookies().set("session", idToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/users", error);
    return NextResponse.json({ error: "فشل التحقق" }, { status: 500 });
  }
}

export async function DELETE() {
  cookies().delete("session");
  return NextResponse.json({ success: true });
}
