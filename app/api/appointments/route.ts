import { NextResponse } from "next/server";
import { Prisma, AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const learnerId = url.searchParams.get("userId");

  const where: Prisma.AppointmentWhereInput = {};
  if (user.role === "LEARNER") {
    where.userId = user.id;
  } else if (learnerId) {
    where.userId = learnerId;
  }
  if (status) where.status = status as AppointmentStatus;
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = new Date(from);
    if (to) where.startAt.lte = new Date(to);
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where,
      include: { course: true, user: true },
      orderBy: { startAt: "asc" },
      take: user.role === "LEARNER" ? 20 : 100,
    });
    const payload = appointments.map((appointment) => ({
      id: appointment.id,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      status: appointment.status,
      course: appointment.course.title,
      learner: appointment.user.name ?? appointment.user.email,
      notes: appointment.teacherNotes,
    }));
    return NextResponse.json({ appointments: payload });
  } catch (error) {
    console.error("GET /api/appointments", error);
    return NextResponse.json({ error: "فشل جلب المواعيد" }, { status: 500 });
  }
}
