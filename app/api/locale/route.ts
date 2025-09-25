import { NextResponse } from "next/server";

import {
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n-config";

type Payload = {
  locale?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Payload;
  const locale = body.locale as Locale | undefined;

  if (!locale || !SUPPORTED_LOCALES.includes(locale)) {
    return NextResponse.json(
      { success: false, message: "Unsupported locale" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
