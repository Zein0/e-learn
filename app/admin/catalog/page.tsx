import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import type { AdminCatalogCourse } from "@/lib/types/admin";
import { CatalogManager } from "@/components/admin/catalog/catalog-manager";

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let courses: AdminCatalogCourse[] = [];
  try {
    const records = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: true,
      },
      orderBy: { titleEn: "asc" },
    });

    courses = records.map((course) => ({
      id: course.id,
      title: { en: course.titleEn, ar: course.titleAr },
      description: { en: course.descriptionEn, ar: course.descriptionAr },
      type: course.type,
      category: course.category,
      difficulties: course.difficulties.map((difficulty) => ({
        id: difficulty.id,
        label: difficulty.label,
        pricePerSession: Number(difficulty.pricePerSession),
      })),
      topics: course.topics
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((topic) => ({
          id: topic.id,
          name: topic.name,
          description: topic.description,
          sessionsRequired: topic.sessionsRequired,
          estimatedHours: topic.estimatedHours,
          order: topic.order,
          difficultyId: topic.difficultyId,
        })),
    }));
  } catch (error) {
    console.error("Failed to load catalog", error);
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{dictionary.admin.catalog.title}</h1>
        <p className="text-brand-600">{dictionary.admin.catalog.description}</p>
      </div>
      <CatalogManager initialCourses={courses} dictionary={dictionary.admin.catalog} locale={locale} />
    </section>
  );
}
