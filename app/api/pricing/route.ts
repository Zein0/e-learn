import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculatePricing, calculateUpsell } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const { courseId, difficultyId, topicIds, couponCode } = (await request.json()) as {
      courseId?: string;
      difficultyId?: string;
      topicIds?: string[];
      couponCode?: string;
    };
    if (!courseId || !difficultyId || !Array.isArray(topicIds) || topicIds.length === 0) {
      return NextResponse.json({ error: "بيانات غير مكتملة" }, { status: 400 });
    }

    const [difficulty, discountRules, coupon, topics] = await Promise.all([
      prisma.courseDifficulty.findUnique({ where: { id: difficultyId } }),
      prisma.discountRule.findMany({ where: { OR: [{ courseId }, { courseId: null }], isActive: true } }),
      couponCode ? prisma.coupon.findUnique({ where: { code: couponCode } }) : null,
      prisma.topic.findMany({ where: { id: { in: topicIds } } }),
    ]);

    if (!difficulty) {
      return NextResponse.json({ error: "لم يتم العثور على المستوى" }, { status: 404 });
    }

    const sessionsTotal = topics.reduce((sum, topic) => sum + topic.sessionsRequired, 0);
    const pricing = calculatePricing({
      sessionsTotal,
      difficulty,
      discountRules,
      coupon,
    });

    const upsell = calculateUpsell({
      sessionsTotal,
      discountRules,
      pricePerSession: Number(difficulty.pricePerSession),
    });

    return NextResponse.json({
      sessionsTotal,
      pricePerSession: Number(difficulty.pricePerSession),
      subtotal: pricing.subtotal,
      appliedDiscount: pricing.ruleDiscount?.id ?? pricing.couponDiscount?.code ?? null,
      discountAmount: pricing.appliedDiscountAmount,
      finalAmount: pricing.finalAmount,
      upsell,
    });
  } catch (error) {
    console.error("POST /api/pricing", error);
    return NextResponse.json({ error: "فشل احتساب السعر" }, { status: 500 });
  }
}
