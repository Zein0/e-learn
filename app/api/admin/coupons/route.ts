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
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ coupons });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("GET /api/admin/coupons", error);
    return NextResponse.json({ error: "فشل تحميل الكوبونات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureAdmin();
    const data = (await request.json()) as Prisma.CouponCreateInput;
    const coupon = await prisma.coupon.create({ data });
    return NextResponse.json({ coupon });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("POST /api/admin/coupons", error);
    return NextResponse.json({ error: "فشل إنشاء الكوبون" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureAdmin();
    const { id, ...data } = (await request.json()) as { id?: string } & Prisma.CouponUpdateInput;
    if (!id) {
      return NextResponse.json({ error: "معرّف غير موجود" }, { status: 400 });
    }
    const coupon = await prisma.coupon.update({ where: { id }, data });
    return NextResponse.json({ coupon });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("PATCH /api/admin/coupons", error);
    return NextResponse.json({ error: "فشل تحديث الكوبون" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureAdmin();
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "معرّف غير موجود" }, { status: 400 });
    }
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("DELETE /api/admin/coupons", error);
    return NextResponse.json({ error: "فشل حذف الكوبون" }, { status: 500 });
  }
}
