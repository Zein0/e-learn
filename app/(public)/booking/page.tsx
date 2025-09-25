import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { BookingForm } from "@/components/booking/booking-form";
import type { BookingCourse } from "@/lib/types/booking";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const locale = await getLocale();

  let courses: BookingCourse[] = [];
  try {
    const records = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { title: "asc" },
    });
    courses = records.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      type: course.type,
      category: course.category,
      difficulties: course.difficulties.map((difficulty) => ({
        id: difficulty.id,
        label: difficulty.label,
        pricePerSession: Number(difficulty.pricePerSession),
      })),
      topics: course.topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        sessionsRequired: topic.sessionsRequired,
        estimatedHours: topic.estimatedHours,
        difficultyId: topic.difficultyId,
      })),
    }));
  } catch (error) {
    console.error("Failed to load booking courses", error);
  }

  return (
    <section className="space-y-8">
      <div className="rounded-[36px] bg-white/80 p-8 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">حجز جلساتك</h1>
        <p className="mt-2 text-brand-600">
          اختر دورتك، المستوى المناسب، ثم حدد الموضوعات التي تحتاجها لتحصل على عرض سعر دقيق مع تنبيه بالخصومات القريبة.
        </p>
      </div>
      <BookingForm courses={courses} locale={locale} />
    </section>
  );
}
