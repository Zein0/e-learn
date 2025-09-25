import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary, getLocale } from "@/lib/i18n";

const heroIllustration = "/hero-illustration.svg";

export default async function HomePage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-[48px] bg-white/80 p-8 shadow-soft ring-1 ring-brand-100 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-600">
            {dict.common.brandName}
          </span>
          <h1 className="font-display text-4xl text-brand-800 sm:text-5xl">
            {dict.home.headline}
          </h1>
          <p className="text-lg text-brand-600">{dict.home.subheadline}</p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/booking">{dict.home.cta}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/courses">{dict.common.courses}</Link>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/20 via-sand to-brand-200" />
          <Image
            src={heroIllustration}
            alt="Learn English Illustration"
            fill
            priority
            className="relative object-contain"
          />
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl text-brand-800">{dict.home.categoriesTitle}</h2>
            <p className="text-brand-600">
              صُممت مسارات التعلم لدينا لتدعم مهارات المحادثة، الكتابة، والاستعداد للامتحانات الدولية.
            </p>
          </div>
          <Button asChild variant="ghost" className="self-start border border-emerald-500/40">
            <Link href="/discovery">حجز جلسة تعريفية</Link>
          </Button>
        </div>
        <div className="container-grid">
          {dict.home.features.map((feature) => (
            <Card key={feature.title} className="card-gradient">
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-brand-600">
                  <li>✔ جلسات مباشرة عبر الإنترنت</li>
                  <li>✔ خطط مخصصة لأهدافك</li>
                  <li>✔ متابعة تقدم أسبوعية</li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-[40px] bg-brand-800 px-8 py-10 text-white lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-display text-3xl">منصة شاملة للمتعلمين والإداريين</h3>
          <p className="text-brand-50/80">
            إدارة الدورات، الحصص، والمدفوعات النقدية من لوحة تحكم واحدة متوافقة مع الأجهزة المحمولة.
          </p>
        </div>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          {["حجوزات ذكية", "تنبيهات خصومات", "دعم الكوبونات", "تقارير مالية"].map((item) => (
            <div key={item} className="rounded-3xl bg-white/10 p-4">
              <p className="font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
