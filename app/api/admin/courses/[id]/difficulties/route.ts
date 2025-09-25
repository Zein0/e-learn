import { NextResponse } from "next/server";
import { Prisma, type DifficultyLabel } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
}

type DifficultyPayload = {
  label?: DifficultyLabel;
  pricePerSession?: number;
};

type DifficultyPatchPayload = DifficultyPayload & {
  difficultyId?: string;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAdmin();
    const courseId = params.id;
    const payload = (await request.json()) as DifficultyPayload;
    const { label, pricePerSession } = payload;
    const parsedPrice = typeof pricePerSession === "string" ? Number(pricePerSession) : pricePerSession;

    if (!courseId || !label || parsedPrice === undefined) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: "قيمة السعر غير صالحة" }, { status: 400 });
    }

    const difficulty = await prisma.courseDifficulty.create({
      data: {
        courseId,
        label,
        pricePerSession: new Prisma.Decimal(parsedPrice),
      },
    });

    return NextResponse.json({ difficulty });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("POST /api/admin/courses/[id]/difficulties", error);
    return NextResponse.json({ error: "تعذر إنشاء المستوى" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAdmin();
    const { id: courseId } = params;
    const { difficultyId, label, pricePerSession } = (await request.json()) as DifficultyPatchPayload;
    const parsedPrice = typeof pricePerSession === "string" ? Number(pricePerSession) : pricePerSession;

    if (!courseId || !difficultyId) {
      return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
    }

    const existing = await prisma.courseDifficulty.findUnique({ where: { id: difficultyId } });
    if (!existing || existing.courseId !== courseId) {
      return NextResponse.json({ error: "العنصر غير موجود" }, { status: 404 });
    }

    const data: Prisma.CourseDifficultyUpdateInput = {};
    if (label) {
      data.label = label;
    }
    if (parsedPrice !== undefined) {
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json({ error: "قيمة السعر غير صالحة" }, { status: 400 });
      }
      data.pricePerSession = new Prisma.Decimal(parsedPrice);
    }

    const difficulty = await prisma.courseDifficulty.update({
      where: { id: difficultyId },
      data,
    });

    return NextResponse.json({ difficulty });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("PATCH /api/admin/courses/[id]/difficulties", error);
    return NextResponse.json({ error: "تعذر تحديث المستوى" }, { status: 500 });
  }
}
