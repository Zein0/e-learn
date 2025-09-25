import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLocale, getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

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
      orderBy: { title: "asc" },
    });
  } catch (error) {
    console.error("Failed to load courses", error);
  }

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] bg-white/80 p-8 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{dict.common.courses}</h1>
        <p className="mt-3 max-w-2xl text-brand-600">
          تصفح باقات تعليم الإنجليزية حسب المستوى ونوع الدورة، وشاهد عدد الجلسات والسعر لكل مستوى بدقة.
        </p>
      </div>

      <div className="container-grid">
        {courses.length === 0 && (
          <Card className="col-span-full text-center">
            <CardHeader>
              <CardTitle>لم يتم إضافة دورات بعد</CardTitle>
              <CardDescription>
                قم بإنشاء دورة جديدة من لوحة التحكم أو قم بتشغيل Prisma migrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin">فتح لوحة التحكم</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col justify-between">
            <div className="space-y-4">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-600">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1">{course.type}</span>
                  <span className="rounded-full bg-brand-500/10 px-3 py-1">{course.category}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-brand-700">المستويات</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.difficulties.map((difficulty) => (
                      <Badge key={difficulty.id}>
                        {difficulty.label} — {Number(difficulty.pricePerSession).toLocaleString(locale, {
                          style: "currency",
                          currency: "USD",
                        })}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-brand-700">الموضوعات</h3>
                  <div className="grid gap-2 text-sm text-brand-600">
                    {course.topics.map((topic) => (
                      <div key={topic.id} className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-2">
                        <span>{topic.name}</span>
                        <span className="text-xs text-brand-400">
                          {topic.sessionsRequired} جلسة · {topic.estimatedHours} ساعة تقديرية
                        </span>
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
        ))}
      </div>
    </section>
  );
}
