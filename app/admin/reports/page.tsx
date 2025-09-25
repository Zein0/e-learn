import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import type { AdminDictionary } from "@/lib/types/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type ReportsDictionary = AdminDictionary["reports"];

type ReportsData = {
  revenue: number;
  sessions: {
    booked: number;
    done: number;
    canceled: number;
  };
  discountUsage: number;
  utilization: {
    scheduledHours: number;
    completedHours: number;
    percentage: number;
  };
};

function formatCurrency(locale: string, value: number) {
  return value.toLocaleString(locale, { style: "currency", currency: "USD" });
}

function formatUtilization(copy: string, utilization: ReportsData["utilization"], locale: string) {
  return copy
    .replace("{{completed}}", utilization.completedHours.toLocaleString(locale))
    .replace("{{scheduled}}", utilization.scheduledHours.toLocaleString(locale))
    .replace("{{percentage}}", utilization.percentage.toLocaleString(locale));
}

export default async function AdminReportsPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  const data: ReportsData = {
    revenue: 0,
    sessions: { booked: 0, done: 0, canceled: 0 },
    discountUsage: 0,
    utilization: { scheduledHours: 0, completedHours: 0, percentage: 0 },
  };

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

    data.revenue = Number(receipts._sum.amount ?? 0);
    data.sessions = {
      booked: (statusCounts.SCHEDULED ?? 0) + (statusCounts.RESCHEDULED ?? 0),
      done: statusCounts.DONE ?? 0,
      canceled: (statusCounts.CANCELED ?? 0) + (statusCounts.NO_SHOW ?? 0),
    };
    data.discountUsage = Number(discounts._sum.discountAmount ?? 0);
    data.utilization = {
      scheduledHours: data.sessions.booked + data.sessions.done,
      completedHours: data.sessions.done,
      percentage:
        data.sessions.booked + data.sessions.done > 0
          ? Number(((data.sessions.done / (data.sessions.booked + data.sessions.done)) * 100).toFixed(1))
          : 0,
    };
  } catch (error) {
    console.error("Failed to load reports", error);
  }

  const copy = dictionary.admin.reports as ReportsDictionary;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{copy.title}</h1>
        <p className="text-brand-600">{copy.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>{copy.revenueCard}</CardTitle>
            <CardDescription>{copy.revenueDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{formatCurrency(locale, data.revenue)}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>{copy.bookedCard}</CardTitle>
            <CardDescription>{copy.bookedDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{data.sessions.booked.toLocaleString(locale)}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>{copy.doneCard}</CardTitle>
            <CardDescription>{copy.doneDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{data.sessions.done.toLocaleString(locale)}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>{copy.canceledCard}</CardTitle>
            <CardDescription>{copy.canceledDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{data.sessions.canceled.toLocaleString(locale)}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>{copy.discountsCard}</CardTitle>
            <CardDescription>{copy.discountsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{formatCurrency(locale, data.discountUsage)}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>{copy.utilizationCard}</CardTitle>
            <CardDescription>{copy.utilizationDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{`${data.utilization.percentage.toLocaleString(locale)}%`}</p>
            <p className="mt-2 text-sm text-brand-600">
              {formatUtilization(copy.utilizationDetail, data.utilization, locale)}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
