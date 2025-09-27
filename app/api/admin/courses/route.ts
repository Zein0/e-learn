import { NextResponse } from "next/server";

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
      orderBy: { titleEn: "asc" },
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

type CoursePayload = {
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  type?: string;
  categoryEn?: string;
  categoryAr?: string;
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { titleEn, titleAr, descriptionEn, descriptionAr, type, categoryEn, categoryAr } =
      (await request.json()) as CoursePayload;
    if (!titleEn || !titleAr || !descriptionEn || !descriptionAr || !type || !categoryEn || !categoryAr) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }
    const course = await prisma.course.create({
      data: {
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        type: type as "PRIVATE" | "CLASSROOM",
        categoryEn,
        categoryAr,
      },
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

type CourseUpdatePayload = CoursePayload & { id?: string };

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { id, titleEn, titleAr, descriptionEn, descriptionAr, type, categoryEn, categoryAr } =
      (await request.json()) as CourseUpdatePayload;
    if (!id || !titleEn || !titleAr || !descriptionEn || !descriptionAr || !type || !categoryEn || !categoryAr) {
      return NextResponse.json({ error: "معرّف غير موجود" }, { status: 400 });
    }
    const course = await prisma.course.update({
      where: { id },
      data: {
        titleEn,
        titleAr,
        descriptionEn,
        descriptionAr,
        type: type as "PRIVATE" | "CLASSROOM",
        categoryEn,
        categoryAr,
      },
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
