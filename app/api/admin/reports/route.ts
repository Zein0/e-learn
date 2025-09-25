import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const [receipts, statusGroups, discounts] = await Promise.all([
      prisma.adminCashReceipt.aggregate({ _sum: { amount: true } }),
      prisma.appointment.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.booking.aggregate({ _sum: { discountAmount: true } }),
    ]);

    const statusCounts = statusGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count.status;
      return acc;
    }, {});

    const booked = (statusCounts.SCHEDULED ?? 0) + (statusCounts.RESCHEDULED ?? 0);
    const done = statusCounts.DONE ?? 0;
    const canceled = (statusCounts.CANCELED ?? 0) + (statusCounts.NO_SHOW ?? 0);
    const scheduledHours = booked + done;
    const completedHours = done;
    const utilizationPercentage = scheduledHours
      ? Number(((completedHours / scheduledHours) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      revenue: Number(receipts._sum.amount ?? 0),
      sessions: {
        booked,
        done,
        canceled,
      },
      discountUsage: Number(discounts._sum.discountAmount ?? 0),
      utilization: {
        scheduledHours,
        completedHours,
        percentage: utilizationPercentage,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/reports", error);
    return NextResponse.json({ error: "فشل جلب التقارير" }, { status: 500 });
  }
}
