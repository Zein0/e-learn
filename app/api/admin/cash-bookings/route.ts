import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculatePricing } from "@/lib/pricing";
import { validateSlot } from "@/lib/availability";

type CashBookingRequest = {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    phone?: string;
  };
  courseId?: string;
  difficultyId?: string;
  topicIds?: string[];
  slotStartAt?: string;
  couponCode?: string;
  cashReceipt?: {
    amount?: number;
    currency?: string;
  };
  notes?: string;
};

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as CashBookingRequest;
    const {
      user: userInput,
      courseId,
      difficultyId,
      topicIds,
      slotStartAt,
      couponCode,
      cashReceipt,
      notes,
    } = body;

    if (!courseId || !difficultyId || !Array.isArray(topicIds) || topicIds.length === 0 || !slotStartAt) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    let learner = null;
    if (userInput?.id) {
      learner = await prisma.user.findUnique({ where: { id: userInput.id } });
    } else if (userInput?.email) {
      learner = await prisma.user.upsert({
        where: { email: userInput.email },
        update: {
          name: userInput.name,
          phone: userInput.phone,
        },
        create: {
          email: userInput.email,
          name: userInput.name,
          phone: userInput.phone,
          firebaseUid: `cash-${randomUUID()}`,
          role: "LEARNER",
        },
      });
    }

    if (!learner) {
      return NextResponse.json({ error: "تعذر تحديد المتعلم" }, { status: 400 });
    }

    const [difficulty, topics, discountRules, coupon] = await Promise.all([
      prisma.courseDifficulty.findUnique({ where: { id: difficultyId } }),
      prisma.topic.findMany({ where: { id: { in: topicIds } } }),
      prisma.discountRule.findMany({ where: { OR: [{ courseId }, { courseId: null }], isActive: true } }),
      couponCode ? prisma.coupon.findUnique({ where: { code: couponCode } }) : null,
    ]);

    if (!difficulty) {
      return NextResponse.json({ error: "لم يتم العثور على المستوى" }, { status: 404 });
    }

    const sessionsTotal = topics.reduce((sum, topic) => sum + topic.sessionsRequired, 0);
    const pricing = calculatePricing({ sessionsTotal, difficulty, discountRules, coupon });

    const slot = await validateSlot({ userId: learner.id, startAt: slotStartAt });

    const appointmentsPayload = Array.from({ length: sessionsTotal }).map((_, index) => {
      const start = new Date(slot.startAt.getTime() + index * 60 * 60 * 1000);
      return {
        startAt: start,
        endAt: new Date(start.getTime() + 60 * 60 * 1000),
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId: learner.id,
          courseId,
          selectedDifficultyId: difficultyId,
          selectedTopicIds: topicIds,
          placementChoice: "KNOWN_LEVEL",
          status: "CONFIRMED",
          sessionsTotal,
          subtotalAmount: pricing.subtotal,
          discountAmount: pricing.appliedDiscountAmount,
          finalAmount: pricing.finalAmount,
          couponCode: couponCode ?? null,
          couponId: coupon?.id,
          paymentMethod: "CASH",
          notes,
        },
      });

      const appointments = await Promise.all(
        appointmentsPayload.map((payload) =>
          tx.appointment.create({
            data: {
              bookingId: booking.id,
              userId: learner.id,
              courseId,
              startAt: payload.startAt,
              endAt: payload.endAt,
              status: "SCHEDULED",
            },
          }),
        ),
      );

      const receipt = await tx.adminCashReceipt.create({
        data: {
          bookingId: booking.id,
          amount: cashReceipt?.amount ?? pricing.finalAmount,
          currency: cashReceipt?.currency ?? "USD",
          handledByAdminId: admin.id,
        },
      });

      if (coupon && couponCode) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { redeemedCount: { increment: 1 } },
        });
      }

      return { booking, appointments, cashReceipt: receipt };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/admin/cash-bookings", error);
    return NextResponse.json({ error: "فشل إنشاء الحجز النقدي" }, { status: 500 });
  }
}
