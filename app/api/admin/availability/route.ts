import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAvailabilitySchedule } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const slots = await getAvailabilitySchedule();
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET /api/admin/availability", error);
    return NextResponse.json({ error: "فشل تحميل المواعيد" }, { status: 500 });
  }
}

type AvailabilityInput = {
  dayOfWeek: number;
  startMinutes: number;
  durationMinutes?: number;
};

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as { slots?: AvailabilityInput[] };
    const slots = Array.isArray(body.slots) ? body.slots : [];

    const sanitized = slots
      .map((slot) => ({
        dayOfWeek: Number(slot.dayOfWeek),
        startMinutes: Number(slot.startMinutes),
        durationMinutes: slot.durationMinutes ? Number(slot.durationMinutes) : 60,
      }))
      .filter(
        (slot) =>
          Number.isInteger(slot.dayOfWeek) &&
          slot.dayOfWeek >= 0 &&
          slot.dayOfWeek <= 6 &&
          Number.isInteger(slot.startMinutes) &&
          slot.startMinutes >= 0 &&
          slot.startMinutes < 24 * 60 &&
          Number.isInteger(slot.durationMinutes) &&
          slot.durationMinutes > 0 &&
          slot.durationMinutes <= 180,
      );

    await prisma.$transaction([
      prisma.availabilitySlot.deleteMany({}),
      ...(sanitized.length
        ? [
            prisma.availabilitySlot.createMany({
              data: sanitized.map((slot) => ({
                dayOfWeek: slot.dayOfWeek,
                startMinutes: slot.startMinutes,
                durationMinutes: slot.durationMinutes,
              })),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ slots: sanitized });
  } catch (error) {
    console.error("PUT /api/admin/availability", error);
    return NextResponse.json({ error: "فشل تحديث المواعيد" }, { status: 500 });
  }
}
