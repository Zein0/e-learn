import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  type Locale,
} from "./lib/i18n-config";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const potentialLocale = segments[0] as Locale | undefined;

  if (pathname.startsWith("/admin")) {
    response.cookies.set({
      name: LOCALE_COOKIE,
      value: "en",
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  if (potentialLocale && SUPPORTED_LOCALES.includes(potentialLocale)) {
    response.cookies.set({
      name: LOCALE_COOKIE,
      value: potentialLocale,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

  const existing = request.cookies.get(LOCALE_COOKIE)?.value as Locale | undefined;
  if (!existing) {
    response.cookies.set({
      name: LOCALE_COOKIE,
      value: DEFAULT_LOCALE,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
