import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLanguageInitializer } from "@/components/admin/admin-language-initializer";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const locale = await getLocale();
  const dictionary = await getDictionary(locale);
  const navItems = [
    { href: "/admin", label: dictionary.admin.nav.overview },
    { href: "/admin/appointments", label: dictionary.admin.nav.appointments },
    { href: "/admin/calendar", label: dictionary.admin.nav.calendar },
    { href: "/admin/catalog", label: dictionary.admin.nav.catalog },
    { href: "/admin/availability", label: dictionary.admin.nav.availability },
    { href: "/admin/reports", label: dictionary.admin.nav.reports },
    { href: "/admin/cash-booking", label: dictionary.admin.nav.cashBooking },
    { href: "/admin/users", label: dictionary.admin.nav.users },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <AdminLanguageInitializer locale={locale} />
      <aside className="h-fit rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-brand-500">{dictionary.admin.layout.greeting}</p>
            <p className="font-display text-xl text-brand-800">{user.name ?? user.email}</p>
            <p className="text-xs text-brand-400">
              {dictionary.admin.layout.role}: {dictionary.admin.roles[user.role]}
            </p>
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
