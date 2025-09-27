import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        difficulties: true,
        topics: { orderBy: { order: "asc" } },
      },
      orderBy: { titleEn: "asc" },
    });
    const payload = courses.map((course) => ({
      ...course,
      difficulties: course.difficulties.map((difficulty) => ({
        ...difficulty,
        pricePerSession: Number(difficulty.pricePerSession),
      })),
    }));
    return NextResponse.json({ courses: payload });
  } catch (error) {
    console.error("GET /api/courses", error);
    return NextResponse.json({ error: "Failed to load courses" }, { status: 500 });
  }
}
