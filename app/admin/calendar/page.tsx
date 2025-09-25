import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUTC } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  let upcoming: { id: string; learner: string; course: string; startAt: string }[] = [];
  try {
    const records = await prisma.appointment.findMany({
      include: { user: true, course: true },
      where: { startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 12,
    });
    upcoming = records.map((record) => ({
      id: record.id,
      learner: record.user.name ?? record.user.email,
      course: record.course.title,
      startAt: record.startAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load calendar", error);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">التقويم</h1>
        <p className="text-brand-600">عرض سريع لأبرز الجلسات القادمة.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>الجلسات القادمة</CardTitle>
          <CardDescription>أقرب 12 جلسة مجدولة.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {upcoming.map((item) => (
            <div key={item.id} className="rounded-2xl border border-brand-100 bg-white/80 p-4">
              <p className="text-sm font-semibold text-brand-700">{item.learner}</p>
              <p className="text-sm text-brand-500">{item.course}</p>
              <p className="text-xs text-brand-400">{formatUTC(item.startAt)}</p>
            </div>
          ))}
          {upcoming.length === 0 && <p className="text-brand-500">لا توجد جلسات قادمة حالياً.</p>}
        </CardContent>
      </Card>
    </section>
  );
}
