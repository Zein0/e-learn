import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  try {
    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { phone: { contains: query } },
            ],
          }
        : undefined,
      take: 10,
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/admin/users", error);
    return NextResponse.json({ error: "فشل البحث" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const { email, name, phone } = (await request.json()) as {
      email?: string;
      name?: string;
      phone?: string;
    };
    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        firebaseUid: `admin-created-${randomUUID()}`,
        role: "LEARNER",
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/admin/users", error);
    return NextResponse.json({ error: "فشل إنشاء المستخدم" }, { status: 500 });
  }
}
