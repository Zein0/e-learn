import { prisma } from "@/lib/db";
import { AppointmentsTable, type AdminAppointment } from "@/components/admin/appointments-table";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  let appointments: AdminAppointment[] = [];
  try {
    const records = await prisma.appointment.findMany({
      include: {
        user: true,
        course: true,
        topic: true,
        booking: true,
      },
      orderBy: { startAt: "asc" },
      take: 50,
    });
    appointments = records.map((appointment) => ({
      id: appointment.id,
      learner: appointment.user.name ?? appointment.user.email,
      course: appointment.course.title,
      topic: appointment.topic?.name ?? "—",
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      status: appointment.status,
      notes: appointment.teacherNotes ?? "",
    }));
  } catch (error) {
    console.error("Failed to load appointments", error);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">Manage appointments</h1>
        <p className="text-brand-600">Update session status, leave notes for instructors, or reschedule bookings.</p>
      </div>
      <AppointmentsTable appointments={appointments} />
    </section>
  );
}
