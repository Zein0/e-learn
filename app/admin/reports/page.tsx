import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  let data = {
    revenue: 0,
    sessionsBooked: 0,
    sessionsDone: 0,
    sessionsCanceled: 0,
    discountUsage: 0,
  };

  try {
    const [receipts, booked, done, canceled, discounts] = await Promise.all([
      prisma.adminCashReceipt.aggregate({ _sum: { amount: true } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "DONE" } }),
      prisma.appointment.count({ where: { status: { in: ["CANCELED", "NO_SHOW"] } } }),
      prisma.booking.aggregate({ _sum: { discountAmount: true } }),
    ]);
    data = {
      revenue: Number(receipts._sum.amount ?? 0),
      sessionsBooked: booked,
      sessionsDone: done,
      sessionsCanceled: canceled,
      discountUsage: Number(discounts._sum.discountAmount ?? 0),
    };
  } catch (error) {
    console.error("Failed to load reports", error);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">التقارير</h1>
        <p className="text-brand-600">راقب الأداء المالي وتشغيل الجلسات.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>إيراد نقدي</CardTitle>
            <CardDescription>إجمالي المدفوعات النقدية المؤكدة.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">
              {data.revenue.toLocaleString("ar-LB", { style: "currency", currency: "USD" })}
            </p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>جلسات محجوزة</CardTitle>
            <CardDescription>إجمالي الجلسات في النظام.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{data.sessionsBooked.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>جلسات منجزة</CardTitle>
            <CardDescription>الجلسات المكتملة بنجاح.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{data.sessionsDone.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>جلسات ملغاة/غياب</CardTitle>
            <CardDescription>المواعيد التي لم تكتمل.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">{data.sessionsCanceled.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>خصومات مستخدمة</CardTitle>
            <CardDescription>قيمة الخصومات المطبقة.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-brand-800">
              {data.discountUsage.toLocaleString("ar-LB", { style: "currency", currency: "USD" })}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
