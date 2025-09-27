import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CashBookingForm, type CashBookingCourse } from "@/components/admin/cash-booking-form";

export const dynamic = "force-dynamic";

export default async function AdminCashBookingPage() {
  const locale = await getLocale();
  let courses: CashBookingCourse[] = [];
  try {
    const records = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: { orderBy: { order: "asc" } },
      },
      orderBy: { titleEn: "asc" },
    });
    courses = records.map((course) => ({
      id: course.id,
      title: locale === "ar" ? course.titleAr : course.titleEn,
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
        <h1 className="font-display text-3xl text-brand-800">Cash booking</h1>
        <p className="text-brand-600">Create bookings for learners paying in cash and issue receipts instantly.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Booking details</CardTitle>
          <CardDescription>Fill in learner information, pick a course, and record the receipt details.</CardDescription>
        </CardHeader>
        <CardContent>
          <CashBookingForm courses={courses} />
        </CardContent>
      </Card>
    </section>
  );
}
