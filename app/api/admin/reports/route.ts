import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const [receipts, sessions, discounts] = await Promise.all([
      prisma.adminCashReceipt.aggregate({ _sum: { amount: true } }),
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.booking.aggregate({ _sum: { discountAmount: true } }),
    ]);

    return NextResponse.json({
      revenue: Number(receipts._sum.amount ?? 0),
      sessions,
      discountUsage: Number(discounts._sum.discountAmount ?? 0),
    });
  } catch (error) {
    console.error("GET /api/admin/reports", error);
    return NextResponse.json({ error: "فشل جلب التقارير" }, { status: 500 });
  }
}
