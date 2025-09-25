import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function DiscoveryPage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const discovery = dict.discovery;

  return (
    <section className="space-y-10">
      <div className="rounded-[36px] bg-white/80 p-8 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{discovery.title}</h1>
        <p className="mt-3 max-w-2xl text-brand-600">{discovery.description}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>{discovery.flow.title}</CardTitle>
            <CardDescription>{discovery.flow.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-brand-700">
            {discovery.flow.steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl bg-white/60 p-4">
                <p className="font-semibold">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1 text-brand-500">{step.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{discovery.form.title}</CardTitle>
            <CardDescription>{discovery.form.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 text-sm text-brand-600">
              <Label htmlFor="name">{discovery.form.fields.name.label}</Label>
              <Input id="name" name="name" placeholder={discovery.form.fields.name.placeholder} />
            </div>
            <div className="grid gap-2 text-sm text-brand-600">
              <Label htmlFor="email">{discovery.form.fields.email.label}</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder={discovery.form.fields.email.placeholder}
              />
            </div>
            <div className="grid gap-2 text-sm text-brand-600">
              <Label htmlFor="time">{discovery.form.fields.time.label}</Label>
              <Input id="time" type="datetime-local" name="time" />
            </div>
            <Button className="w-full" size="lg">
              {discovery.form.submit}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
