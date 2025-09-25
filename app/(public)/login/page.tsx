import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <section className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-3xl">تسجيل الدخول</CardTitle>
          <CardDescription>
            قم بتسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور. سيتم إنشاء حسابك تلقائياً إن لم يكن موجوداً.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </section>
  );
}
