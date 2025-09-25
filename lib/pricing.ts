import { DiscountRule, Coupon, CourseDifficulty } from "@prisma/client";

type PricingInputs = {
  sessionsTotal: number;
  difficulty: Pick<CourseDifficulty, "pricePerSession">;
  discountRules: DiscountRule[];
  coupon?: Coupon | null;
};

type PricingResult = {
  subtotal: number;
  ruleDiscount?: DiscountRule | null;
  couponDiscount?: Coupon | null;
  appliedDiscountAmount: number;
  finalAmount: number;
};

export function calculatePricing({
  sessionsTotal,
  difficulty,
  discountRules,
  coupon,
}: PricingInputs): PricingResult {
  const pricePerSession = Number(difficulty.pricePerSession);
  const subtotal = sessionsTotal * pricePerSession;

  const eligibleRule = discountRules
    .filter((rule) => rule.isActive && sessionsTotal >= rule.minSessions)
    .sort((a, b) => Number(b.percentOff) - Number(a.percentOff))[0] ?? null;

  const ruleAmount = eligibleRule
    ? (Number(eligibleRule.percentOff) / 100) * subtotal
    : 0;

  const now = new Date();
  const couponActive = coupon && coupon.isActive &&
    (!coupon.startsAt || coupon.startsAt <= now) &&
    (!coupon.endsAt || coupon.endsAt >= now) &&
    (!coupon.maxRedemptions || (coupon.redeemedCount ?? 0) < coupon.maxRedemptions);

  let couponAmount = 0;
  if (couponActive) {
    if (coupon.type === "PERCENT") {
      couponAmount = (Number(coupon.value) / 100) * subtotal;
    } else {
      couponAmount = Number(coupon.value);
    }
  }

  const appliedDiscountAmount = Math.min(Math.max(ruleAmount, couponAmount), subtotal);
  const finalAmount = Math.max(0, subtotal - appliedDiscountAmount);

  return {
    subtotal,
    ruleDiscount: appliedDiscountAmount === ruleAmount ? eligibleRule : null,
    couponDiscount: appliedDiscountAmount === couponAmount ? coupon ?? null : null,
    appliedDiscountAmount,
    finalAmount,
  };
}

export function calculateUpsell({
  sessionsTotal,
  discountRules,
  pricePerSession,
}: {
  sessionsTotal: number;
  discountRules: DiscountRule[];
  pricePerSession: number;
}) {
  const activeRules = discountRules.filter((rule) => rule.isActive);
  const sorted = activeRules.sort((a, b) => a.minSessions - b.minSessions);
  const currentBest = sorted
    .filter((rule) => sessionsTotal >= rule.minSessions)
    .sort((a, b) => Number(b.percentOff) - Number(a.percentOff))[0];
  const nextRule = sorted.find((rule) => rule.minSessions > (currentBest?.minSessions ?? 0));
  if (!nextRule) return null;
  const sessionsNeeded = nextRule.minSessions - sessionsTotal;
  if (sessionsNeeded <= 0 || sessionsNeeded > 3) return null;
  const subtotal = sessionsTotal * pricePerSession;
  const futureSubtotal = nextRule.minSessions * pricePerSession;
  const currentDiscount = currentBest ? (Number(currentBest.percentOff) / 100) * subtotal : 0;
  const futureDiscount = (Number(nextRule.percentOff) / 100) * futureSubtotal;
  const savings = futureDiscount - currentDiscount;
  if (savings <= 0) return null;
  return {
    sessionsNeeded,
    unlockPercentOff: Number(nextRule.percentOff),
    estimatedSavings: Math.round(savings * 100) / 100,
  };
}
