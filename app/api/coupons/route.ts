import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { code } = (await request.json()) as { code?: string };
    if (!code) {
      return NextResponse.json({ valid: false, message: "يرجى إدخال الكوبون" });
    }
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      return NextResponse.json({ valid: false, message: "الكوبون غير موجود" });
    }
    const now = new Date();
    const isValid =
      coupon.isActive &&
      (!coupon.startsAt || coupon.startsAt <= now) &&
      (!coupon.endsAt || coupon.endsAt >= now) &&
      (!coupon.maxRedemptions || (coupon.redeemedCount ?? 0) < coupon.maxRedemptions);

    if (!isValid) {
      return NextResponse.json({ valid: false, message: "الكوبون غير صالح حالياً" });
    }

    return NextResponse.json({ valid: true, type: coupon.type, value: Number(coupon.value) });
  } catch (error) {
    console.error("POST /api/coupons", error);
    return NextResponse.json({ valid: false, message: "حدث خطأ" }, { status: 500 });
  }
}
