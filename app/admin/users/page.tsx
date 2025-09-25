import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  let users: { id: string; email: string; name?: string | null; role: string; bookings: number }[] = [];
  try {
    const records = await prisma.user.findMany({
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    users = records.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bookings: user._count.bookings,
    }));
  } catch (error) {
    console.error("Failed to load users", error);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">المتعلمون</h1>
        <p className="text-brand-600">آخر المتعلمين المسجلين وعدد حجوزاتهم.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>قائمة المتعلمين</CardTitle>
          <CardDescription>أحدث 20 متعلم.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-2xl border border-brand-100 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-brand-800">{user.name ?? "غير معروف"}</p>
                  <p className="text-xs text-brand-500">{user.email}</p>
                </div>
                <div className="text-xs text-brand-500">الدور: {user.role}</div>
                <div className="text-xs text-brand-500">الحجوزات: {user.bookings}</div>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-brand-500">لم يتم العثور على متعلمين.</p>}
        </CardContent>
      </Card>
    </section>
  );
}
