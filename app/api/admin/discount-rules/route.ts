import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
}

export async function GET() {
  try {
    await ensureAdmin();
    const rules = await prisma.discountRule.findMany({ orderBy: { minSessions: "asc" } });
    return NextResponse.json({ rules });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("GET /api/admin/discount-rules", error);
    return NextResponse.json({ error: "فشل تحميل القواعد" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureAdmin();
    const payload = (await request.json()) as Prisma.DiscountRuleUncheckedCreateInput;
    const { courseId, minSessions, percentOff, isActive } = payload;
    const rule = await prisma.discountRule.create({
      data: {
        courseId: courseId ?? null,
        minSessions: minSessions ?? 0,
        percentOff: percentOff ?? 0,
        isActive: isActive ?? true,
      },
    });
    return NextResponse.json({ rule });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("POST /api/admin/discount-rules", error);
    return NextResponse.json({ error: "فشل إنشاء القاعدة" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureAdmin();
    const { id, ...data } = (await request.json()) as { id?: string } & Prisma.DiscountRuleUncheckedUpdateInput;
    if (!id) {
      return NextResponse.json({ error: "معرّف غير موجود" }, { status: 400 });
    }
    const rule = await prisma.discountRule.update({ where: { id }, data });
    return NextResponse.json({ rule });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("PATCH /api/admin/discount-rules", error);
    return NextResponse.json({ error: "فشل تحديث القاعدة" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureAdmin();
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "معرّف غير موجود" }, { status: 400 });
    }
    await prisma.discountRule.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("DELETE /api/admin/discount-rules", error);
    return NextResponse.json({ error: "فشل حذف القاعدة" }, { status: 500 });
  }
}
