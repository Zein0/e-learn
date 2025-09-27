import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary, getLocale, isRTL } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { NavbarLanguageSwitch } from "@/components/navbar-language-switch";

export const dynamic = "force-dynamic";

export async function Navbar() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const dir = isRTL(locale) ? "rtl" : "ltr";
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-brand-100/60 bg-sand/80 backdrop-blur-xl dark:bg-brand-900/80">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-sand shadow-soft">
            {dict.common.brandName}
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-700 md:flex">
          <Link href="/courses" className="hover:text-emerald-600">
            {dict.common.courses}
          </Link>
          <Link href="/booking" className="hover:text-emerald-600">
            {dict.common.booking}
          </Link>
          <Link href="/discovery" className="hover:text-emerald-600">
            {dict.common.discovery}
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="hover:text-emerald-600">
              {dict.common.dashboard}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <NavbarLanguageSwitch
            locale={locale}
            labels={{
              title: dict.common.language,
              arabic: dict.common.languageArabic,
              english: dict.common.languageEnglish,
            }}
          />
          {/* <ThemeToggle dir={dir} labels={{ light: dict.common.lightMode, dark: dict.common.darkMode }} /> */}
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link href="/login">{dict.common.login}</Link>
          </Button>
          <Button asChild size="sm" className="md:hidden">
            <Link href="/booking">{dict.common.getStarted}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
