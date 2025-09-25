import { getDictionary, getLocale } from "@/lib/i18n";

export async function Footer() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <footer className="mt-16 border-t border-brand-100 bg-white/60 backdrop-blur dark:bg-brand-900/60">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="font-display text-lg text-brand-800 dark:text-brand-100">{dict.common.brandName}</p>
          <p className="text-sm text-brand-500 dark:text-brand-200">
            © {new Date().getFullYear()} — منصة تعليم الإنجليزية. جميع الحقوق محفوظة.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-brand-600 dark:text-brand-200">
          <a href="mailto:hello@learnenglish.com" className="hover:text-emerald-600">
            hello@learnenglish.com
          </a>
          <a href="tel:+96100000000" className="hover:text-emerald-600">
            +961 00 000 000
          </a>
        </div>
      </div>
    </footer>
  );
}
