import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { BookingForm } from "@/components/booking/booking-form";
import type { BookingCourse } from "@/lib/types/booking";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let courses: BookingCourse[] = [];
  try {
    const records = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { titleEn: "asc" },
    });
    courses = records.map((course) => ({
      id: course.id,
      title: locale === "ar" ? course.titleAr : course.titleEn,
      description: locale === "ar" ? course.descriptionAr : course.descriptionEn,
      type: course.type,
      category: locale === "ar" ? course.categoryAr : course.categoryEn,
      difficulties: course.difficulties.map((difficulty) => ({
        id: difficulty.id,
        name: locale === "ar" ? difficulty.nameAr : difficulty.nameEn,
        pricePerSession: Number(difficulty.pricePerSession),
      })),
      topics: course.topics.map((topic) => ({
        id: topic.id,
        name: locale === "ar" ? topic.nameAr : topic.nameEn,
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
        <h1 className="font-display text-3xl text-brand-800">{dictionary.booking.title}</h1>
        <p className="mt-2 text-brand-600">{dictionary.booking.description}</p>
      </div>
      <BookingForm courses={courses} locale={locale} dictionary={dictionary.booking} />
    </section>
  );
}
