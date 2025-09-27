import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculatePricing } from "@/lib/pricing";
import { validateSlot } from "@/lib/availability";

type BookingRequestPayload = {
  courseId?: string;
  difficultyId?: string;
  topicIds?: string[];
  placementChoice?: "KNOWN_LEVEL" | "PLACEMENT_TEST" | "DISCOVERY_CALL";
  levelProvided?: string;
  slotStartAt?: string;
  couponCode?: string;
  paymentMethod?: "ONLINE" | "CASH";
  notes?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }

  try {
    const {
      courseId,
      difficultyId,
      topicIds,
      placementChoice,
      levelProvided,
      slotStartAt,
      couponCode,
      paymentMethod,
      notes,
    } = (await request.json()) as BookingRequestPayload;

    if (!courseId || !difficultyId || !Array.isArray(topicIds) || topicIds.length === 0 || !slotStartAt) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    const [course, difficulty, topics, discountRules, coupon] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.courseDifficulty.findUnique({ where: { id: difficultyId } }),
      prisma.topic.findMany({ where: { id: { in: topicIds } } }),
      prisma.discountRule.findMany({ where: { OR: [{ courseId }, { courseId: null }], isActive: true } }),
      couponCode ? prisma.coupon.findUnique({ where: { code: couponCode } }) : null,
    ]);

    if (!course || !difficulty) {
      return NextResponse.json({ error: "الدورة أو المستوى غير موجود" }, { status: 404 });
    }

    const sessionsTotal = topics.reduce((sum, topic) => sum + topic.sessionsRequired, 0);
    const pricing = calculatePricing({ sessionsTotal, difficulty, discountRules, coupon });
    const { occurrences } = await validateSlot({ startAt: slotStartAt, sessions: sessionsTotal });

    const placement = placementChoice ?? "KNOWN_LEVEL";

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          courseId,
          selectedDifficultyId: difficultyId,
          selectedTopicIds: topicIds,
          placementChoice: placement,
          levelProvided,
          status: "CONFIRMED",
          sessionsTotal,
          subtotalAmount: pricing.subtotal,
          discountAmount: pricing.appliedDiscountAmount,
          finalAmount: pricing.finalAmount,
          couponCode: couponCode ?? null,
          couponId: coupon?.id,
          paymentMethod,
          notes,
        },
      });

      if (coupon && couponCode) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { redeemedCount: { increment: 1 } },
        });
      }

      const appointments = await Promise.all(
        occurrences.map((payload) =>
          tx.appointment.create({
            data: {
              bookingId: booking.id,
              userId: user.id,
              courseId,
              startAt: payload.startAt,
              endAt: payload.endAt,
              status: "SCHEDULED",
            },
          }),
        ),
      );

      return { booking, appointments };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/bookings", error);
    return NextResponse.json({ error: "فشل إنشاء الحجز" }, { status: 500 });
  }
}
