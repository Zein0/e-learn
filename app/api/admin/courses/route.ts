import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function GET() {
  try {
    await requireAdmin();
    const courses = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: true,
      },
      orderBy: { title: "asc" },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("GET /api/admin/courses", error);
    return NextResponse.json({ error: "فشل تحميل الدورات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = (await request.json()) as Prisma.CourseCreateInput;
    const { title, description, type, category } = payload;
    if (!title || !description || !type || !category) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }
    const course = await prisma.course.create({
      data: { title, description, type, category },
    });
    return NextResponse.json({ course });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("POST /api/admin/courses", error);
    return NextResponse.json({ error: "فشل إنشاء الدورة" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { id, ...data } = (await request.json()) as { id?: string } & Prisma.CourseUpdateInput;
    if (!id) {
      return NextResponse.json({ error: "معرّف غير موجود" }, { status: 400 });
    }
    const course = await prisma.course.update({
      where: { id },
      data,
    });
    return NextResponse.json({ course });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("PATCH /api/admin/courses", error);
    return NextResponse.json({ error: "فشل تحديث الدورة" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "معرّف غير موجود" }, { status: 400 });
    }
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("DELETE /api/admin/courses", error);
    return NextResponse.json({ error: "فشل حذف الدورة" }, { status: 500 });
  }
}
