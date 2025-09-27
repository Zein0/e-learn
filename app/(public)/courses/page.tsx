import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocale, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const coursesDict = dict.coursesPage;

  type CourseWithRelations = Prisma.CourseGetPayload<{
    include: {
      difficulties: true;
      topics: true;
    };
  }>;

  let courses: CourseWithRelations[] = [];
  try {
    courses = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { titleEn: "asc" },
    });
  } catch (error) {
    console.error("Failed to load courses", error);
  }

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] bg-white/80 p-8 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{dict.common.courses}</h1>
        <p className="mt-3 max-w-2xl text-brand-600">{coursesDict.description}</p>
      </div>

      <div className="container-grid">
        {courses.length === 0 && (
          <Card className="col-span-full text-center">
            <CardHeader>
              <CardTitle>{coursesDict.empty.title}</CardTitle>
              <CardDescription>{coursesDict.empty.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin">{coursesDict.empty.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {courses.map((course) => {
          const title = locale === "ar" ? course.titleAr : course.titleEn;
          const description = locale === "ar" ? course.descriptionAr : course.descriptionEn;
          return (
          <Card key={course.id} className="flex flex-col justify-between">
            <div className="space-y-4">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-600">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1">{course.type}</span>
                  <span className="rounded-full bg-brand-500/10 px-3 py-1">{course.category}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-brand-700">{coursesDict.difficulties.title}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {course.difficulties.map((difficulty) => (
                      <div
                        key={difficulty.id}
                        className="rounded-3xl border border-emerald-200/60 bg-emerald-50/80 px-4 py-3 text-emerald-700 shadow-sm"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                          {difficulty.name}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {Number(difficulty.pricePerSession).toLocaleString(locale, {
                            style: "currency",
                            currency: "USD",
                          })}{" "}
                          <span className="text-xs font-normal text-emerald-600">
                            · {coursesDict.difficulties.priceLabel}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </div>
            <div className="px-6 pb-6">
              <Button asChild className="w-full">
                <Link href={`/booking?courseId=${course.id}`}>{dict.common.getStarted}</Link>
              </Button>
            </div>
          </Card>
          );
        })}
      </div>
    </section>
  );
}
