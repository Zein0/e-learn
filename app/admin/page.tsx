import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/lib/i18n";
import type { AdminDictionary } from "@/lib/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let stats = {
    courses: 0,
    bookings: 0,
    learners: 0,
    revenue: 0,
  };

  try {
    const [courses, bookings, learners, receipts] = await Promise.all([
      prisma.course.count(),
      prisma.booking.count(),
      prisma.user.count({ where: { role: "LEARNER" } }),
      prisma.adminCashReceipt.aggregate({ _sum: { amount: true } }),
    ]);
    stats = {
      courses,
      bookings,
      learners,
      revenue: Number(receipts._sum.amount ?? 0),
    };
  } catch (error) {
    console.error("Failed to load admin stats", error);
  }

  const copy = dictionary.admin.overview as AdminDictionary["overview"];
  const cards = [
    {
      title: copy.stats.courses.title,
      value: stats.courses.toLocaleString(locale),
      description: copy.stats.courses.description,
    },
    {
      title: copy.stats.bookings.title,
      value: stats.bookings.toLocaleString(locale),
      description: copy.stats.bookings.description,
    },
    {
      title: copy.stats.learners.title,
      value: stats.learners.toLocaleString(locale),
      description: copy.stats.learners.description,
    },
    {
      title: copy.stats.revenue.title,
      value: stats.revenue.toLocaleString(locale, { style: "currency", currency: "USD" }),
      description: copy.stats.revenue.description,
    },
  ];

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{copy.title}</h1>
        <p className="text-brand-600">{copy.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="card-gradient">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-brand-800">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-3xl bg-brand-800 p-6 text-white">
        <h2 className="font-display text-2xl">{copy.quickActionsTitle}</h2>
        <p className="mt-2 text-brand-50/80">{copy.quickActionsDescription}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild variant="outline" className="border-white/40 text-white hover:bg-white/10">
            <a href="/admin/cash-booking">{copy.quickActions.cashBooking}</a>
          </Button>
          <Button asChild className="bg-white text-brand-800 hover:bg-brand-100">
            <a href="/admin/appointments">{copy.quickActions.manageAppointments}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
