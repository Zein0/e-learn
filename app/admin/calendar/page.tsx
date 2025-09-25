import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";

import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import type { AdminDictionary } from "@/lib/types/admin";
import { AdminCalendar } from "@/components/admin/calendar/admin-calendar";

export const dynamic = "force-dynamic";

type CalendarPageDictionary = AdminDictionary["calendar"];

type CalendarAppointment = {
  id: string;
  learner: string;
  course: string;
  topic?: string | null;
  startAt: string;
  endAt: string;
  status: string;
};

export default async function AdminCalendarPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  const now = new Date();
  const rangeStart = startOfMonth(subMonths(now, 2));
  const rangeEnd = endOfMonth(addMonths(now, 2));

  let appointments: CalendarAppointment[] = [];
  try {
    const records = await prisma.appointment.findMany({
      where: {
        startAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      include: {
        user: true,
        course: true,
        topic: true,
      },
      orderBy: { startAt: "asc" },
    });

    appointments = records.map((record) => ({
      id: record.id,
      learner: record.user.name ?? record.user.email,
      course: record.course.title,
      topic: record.topic?.name ?? null,
      startAt: record.startAt.toISOString(),
      endAt: record.endAt.toISOString(),
      status: record.status,
    }));
  } catch (error) {
    console.error("Failed to load calendar", error);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{dictionary.admin.calendar.title}</h1>
        <p className="text-brand-600">{dictionary.admin.calendar.description}</p>
      </div>
      <AdminCalendar appointments={appointments} locale={locale} dictionary={dictionary.admin.calendar as CalendarPageDictionary} />
    </section>
  );
}
