import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
}

type TopicPayload = {
  difficultyId?: string;
  name?: string;
  description?: string;
  sessionsRequired?: number;
  estimatedHours?: number;
  order?: number;
};

type TopicPatchPayload = TopicPayload & {
  topicId?: string;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAdmin();
    const { id: courseId } = params;
    const payload = (await request.json()) as TopicPayload;
    const { difficultyId, name, description, sessionsRequired, estimatedHours, order } = payload;
    const sessionsValue =
      typeof sessionsRequired === "string" ? Number(sessionsRequired) : sessionsRequired;
    const hoursValue = typeof estimatedHours === "string" ? Number(estimatedHours) : estimatedHours;
    const orderValue = typeof order === "string" ? Number(order) : order;

    if (!courseId || !difficultyId || !name || sessionsValue === undefined) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    if (!Number.isInteger(sessionsValue) || sessionsValue <= 0) {
      return NextResponse.json({ error: "عدد الجلسات غير صالح" }, { status: 400 });
    }

    if (hoursValue !== undefined && (!Number.isInteger(hoursValue) || hoursValue <= 0)) {
      return NextResponse.json({ error: "عدد الساعات غير صالح" }, { status: 400 });
    }

    if (orderValue !== undefined && (!Number.isInteger(orderValue) || orderValue <= 0)) {
      return NextResponse.json({ error: "قيمة الترتيب غير صالحة" }, { status: 400 });
    }

    const difficulty = await prisma.courseDifficulty.findUnique({ where: { id: difficultyId } });
    if (!difficulty || difficulty.courseId !== courseId) {
      return NextResponse.json({ error: "المستوى غير موجود" }, { status: 404 });
    }

    const currentCount = await prisma.topic.count({ where: { courseId, difficultyId } });
    const nextOrder = orderValue ?? currentCount + 1;

    const topic = await prisma.topic.create({
      data: {
        courseId,
        difficultyId,
        name,
        description: description ?? null,
        sessionsRequired: sessionsValue,
        estimatedHours: hoursValue ?? sessionsValue,
        order: nextOrder,
      },
    });

    return NextResponse.json({ topic });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("POST /api/admin/courses/[id]/topics", error);
    return NextResponse.json({ error: "تعذر إنشاء الموضوع" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureAdmin();
    const { id: courseId } = params;
    const { topicId, difficultyId, name, description, sessionsRequired, estimatedHours, order } =
      (await request.json()) as TopicPatchPayload;
    const sessionsValue =
      typeof sessionsRequired === "string" ? Number(sessionsRequired) : sessionsRequired;
    const hoursValue = typeof estimatedHours === "string" ? Number(estimatedHours) : estimatedHours;
    const orderValue = typeof order === "string" ? Number(order) : order;

    if (!courseId || !topicId) {
      return NextResponse.json({ error: "معرّف غير صالح" }, { status: 400 });
    }

    const existing = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!existing || existing.courseId !== courseId) {
      return NextResponse.json({ error: "الموضوع غير موجود" }, { status: 404 });
    }

    const data: Prisma.TopicUpdateInput = {};

    if (difficultyId) {
      const difficulty = await prisma.courseDifficulty.findUnique({ where: { id: difficultyId } });
      if (!difficulty || difficulty.courseId !== courseId) {
        return NextResponse.json({ error: "المستوى غير صالح" }, { status: 400 });
      }
      data.difficulty = { connect: { id: difficultyId } };
    }

    if (name) {
      data.name = name;
    }

    if (description !== undefined) {
      data.description = description;
    }

    if (sessionsValue !== undefined) {
      if (!Number.isInteger(sessionsValue) || sessionsValue <= 0) {
        return NextResponse.json({ error: "عدد الجلسات غير صالح" }, { status: 400 });
      }
      data.sessionsRequired = sessionsValue;
    }

    if (hoursValue !== undefined) {
      if (!Number.isInteger(hoursValue) || hoursValue <= 0) {
        return NextResponse.json({ error: "عدد الساعات غير صالح" }, { status: 400 });
      }
      data.estimatedHours = hoursValue;
    }

    if (orderValue !== undefined) {
      if (!Number.isInteger(orderValue) || orderValue <= 0) {
        return NextResponse.json({ error: "قيمة الترتيب غير صالحة" }, { status: 400 });
      }
      data.order = orderValue;
    }

    const topic = await prisma.topic.update({
      where: { id: topicId },
      data,
    });

    return NextResponse.json({ topic });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }
    console.error("PATCH /api/admin/courses/[id]/topics", error);
    return NextResponse.json({ error: "تعذر تحديث الموضوع" }, { status: 500 });
  }
}
