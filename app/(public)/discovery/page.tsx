import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function DiscoveryPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] bg-white/80 p-8 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">جلسة تعريفية مجانية</h1>
        <p className="mt-3 max-w-2xl text-brand-600">
          احجز مكالمة تعريفية لمدة 20 دقيقة للتعرف على مستواك وتحديد الخطة الأنسب لك. سنراجع أهدافك، جدولك، ونوضح كيفية سير الدروس.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>ماذا تتوقع؟</CardTitle>
            <CardDescription>مراحل سريعة لتحديد أفضل مسار لك.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-brand-700">
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="font-semibold">1. التعارف</p>
              <p className="mt-1 text-brand-500">نسمع منك عن خبرتك السابقة وأهدافك المهنية أو الأكاديمية.</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="font-semibold">2. تقييم سريع</p>
              <p className="mt-1 text-brand-500">أسئلة خفيفة لتقدير مستواك الحالي وتحديد التحديات.</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="font-semibold">3. خطة عمل</p>
              <p className="mt-1 text-brand-500">نرشح لك الدورة، عدد الجلسات، وأفضل أوقات للحجز.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>جاهز للبدء؟</CardTitle>
            <CardDescription>اختر الوقت المناسب وسنؤكد الموعد خلال دقائق.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 text-sm text-brand-600">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input id="name" name="name" placeholder="مثال: أحمد محمد" />
            </div>
            <div className="grid gap-2 text-sm text-brand-600">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" name="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2 text-sm text-brand-600">
              <Label htmlFor="time">الوقت المقترح</Label>
              <Input id="time" type="datetime-local" name="time" />
            </div>
            <Button className="w-full" size="lg">
              {dict.home.cta}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
