import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function LoginPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <section className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-3xl">{dictionary.login.title}</CardTitle>
          <CardDescription>{dictionary.login.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm dictionary={dictionary.login.form} />
        </CardContent>
      </Card>
    </section>
  );
}
