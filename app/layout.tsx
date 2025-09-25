import "@total-typescript/ts-reset";
import "./globals.css";

import type { Metadata } from "next";
import { Cairo, Baloo_2 } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getLocale, isRTL } from "@/lib/i18n";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });
const baloo = Baloo_2({ subsets: ["latin"], variable: "--font-baloo" });

export const metadata: Metadata = {
  title: "منصة تعلم الإنجليزية",
  description: "تعلم الإنجليزية عبر دورات خاصة وجماعية مع مدربين محترفين.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dir = isRTL(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} ${baloo.variable}`}>
      <body className={dir}>
        <Providers>
          <div className="min-h-screen bg-sand/70">
            <Navbar />
            <main className="container pb-16 pt-10">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
