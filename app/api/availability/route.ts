import { NextResponse } from "next/server";

import { getAvailableSlots } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weeksParam = searchParams.get("weeks");
  const weeks = weeksParam ? Number(weeksParam) : undefined;
  const totalWeeks =
    weeks && !Number.isNaN(weeks) && weeks > 0 ? Math.min(weeks, 12) : 6;

  const now = new Date();
  const start = new Date(now.getTime());
  const end = new Date(start.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000);

  try {
    const slots = await getAvailableSlots({ start, end });
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET /api/availability", error);
    return NextResponse.json({ error: "Failed to load availability" }, { status: 500 });
  }
}
