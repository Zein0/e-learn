import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/appointments", label: "المواعيد" },
  { href: "/admin/calendar", label: "التقويم" },
  { href: "/admin/reports", label: "التقارير" },
  { href: "/admin/cash-booking", label: "حجوزات نقدية" },
  { href: "/admin/users", label: "المتعلمون" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-brand-500">مرحباً</p>
            <p className="font-display text-xl text-brand-800">{user.name ?? user.email}</p>
            <p className="text-xs text-brand-400">دور: {user.role}</p>
          </div>
          <nav className="space-y-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl px-4 py-2 text-brand-700 transition hover:bg-emerald-500/10 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
