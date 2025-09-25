import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CashBookingForm, type CashBookingCourse } from "@/components/admin/cash-booking-form";

export const dynamic = "force-dynamic";

export default async function AdminCashBookingPage() {
  let courses: CashBookingCourse[] = [];
  try {
    const records = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: { orderBy: { order: "asc" } },
      },
      orderBy: { title: "asc" },
    });
    courses = records.map((course) => ({
      id: course.id,
      title: course.title,
      difficulties: course.difficulties.map((difficulty) => ({
        id: difficulty.id,
        label: difficulty.label,
        pricePerSession: Number(difficulty.pricePerSession),
      })),
      topics: course.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        sessionsRequired: topic.sessionsRequired,
        difficultyId: topic.difficultyId,
      })),
    }));
  } catch (error) {
    console.error("Failed to load courses for cash booking", error);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">حجز نقدي</h1>
        <p className="text-brand-600">أنشئ حجزاً للمتعلمين الذين يدفعون نقداً وأصدر إيصالاً فورياً.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تفاصيل الحجز</CardTitle>
          <CardDescription>املأ بيانات المتعلم، اختر الدورة، وأدخل معلومات الإيصال.</CardDescription>
        </CardHeader>
        <CardContent>
          <CashBookingForm courses={courses} />
        </CardContent>
      </Card>
    </section>
  );
}
