import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateSlot } from "@/lib/availability";

type AppointmentActionPayload = {
  action?: "CANCEL" | "RESCHEDULE" | "CONFIRM_DONE" | "ADD_NOTES";
  newStartAt?: string;
  notes?: string;
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { action, newStartAt, notes } = (await request.json()) as AppointmentActionPayload;

  const appointment = await prisma.appointment.findUnique({ where: { id: params.id } });
  if (!appointment) {
    return NextResponse.json({ error: "الموعد غير موجود" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && appointment.userId !== user.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    switch (action) {
      case "CANCEL": {
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "CANCELED" },
        });
        return NextResponse.json({ appointment: updated });
      }
      case "CONFIRM_DONE": {
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: { status: "DONE" },
        });
        return NextResponse.json({ appointment: updated });
      }
      case "ADD_NOTES": {
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: { teacherNotes: notes },
        });
        return NextResponse.json({ appointment: updated });
      }
      case "RESCHEDULE": {
        if (!newStartAt) {
          return NextResponse.json({ error: "يجب تحديد موعد جديد" }, { status: 400 });
        }
        const { occurrences } = await validateSlot({
          startAt: newStartAt,
          ignoreAppointmentId: appointment.id,
        });
        const updated = await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            startAt: occurrences[0].startAt,
            endAt: occurrences[0].endAt,
            status: "RESCHEDULED",
          },
        });
        return NextResponse.json({ appointment: updated });
      }
      default:
        return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
    }
  } catch (error) {
    console.error(`PATCH /api/appointments/${params.id}`, error);
    return NextResponse.json({ error: "فشل تحديث الموعد" }, { status: 500 });
  }
}
