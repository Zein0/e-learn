"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useBookingStore } from "@/stores/booking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { BookingCourse } from "@/lib/types/booking";

const placementOptions = [
  { value: "KNOWN_LEVEL", label: "أنا أعرف مستواي" },
  { value: "PLACEMENT_TEST", label: "أحتاج اختبار تحديد مستوى" },
  { value: "DISCOVERY_CALL", label: "أريد جلسة تعريفية" },
] as const;

type BookingFormProps = {
  courses: BookingCourse[];
  locale: string;
};

type PricingResponse = {
  sessionsTotal: number;
  pricePerSession: number;
  subtotal: number;
  appliedDiscount: string | null;
  discountAmount: number;
  finalAmount: number;
  upsell?: {
    sessionsNeeded: number;
    unlockPercentOff: number;
    estimatedSavings: number;
  } | null;
};

type BookingResponse = {
  booking: { id: string };
  appointments: { id: string; startAt: string; endAt: string }[];
};

export function BookingForm({ courses, locale }: BookingFormProps) {
  const {
    courseId,
    difficultyId,
    selectedTopicIds,
    placementChoice,
    levelProvided,
    slotStartAt,
    pricingPreview,
    notes,
    setField,
    toggleTopic,
  } = useBookingStore();

  const [couponCode, setCouponCode] = useState("");

  const selectedCourse = useMemo(() => courses.find((course) => course.id === courseId) ?? courses[0], [courses, courseId]);
  const difficulties = selectedCourse?.difficulties ?? [];
  const selectedDifficulty = difficulties.find((diff) => diff.id === difficultyId) ?? difficulties[0];

  useEffect(() => {
    if (!courseId && selectedCourse) {
      setField("courseId", selectedCourse.id);
    }
  }, [courseId, selectedCourse, setField]);

  useEffect(() => {
    if (!difficultyId && selectedDifficulty) {
      setField("difficultyId", selectedDifficulty.id);
    }
  }, [difficultyId, selectedDifficulty, setField]);

  const topics = useMemo(
    () => selectedCourse?.topics.filter((topic) => topic.difficultyId === selectedDifficulty?.id) ?? [],
    [selectedCourse, selectedDifficulty],
  );

  const sessionsTotal = useMemo(
    () =>
      topics
        .filter((topic) => selectedTopicIds.includes(topic.id))
        .reduce((sum, topic) => sum + topic.sessionsRequired, 0),
    [topics, selectedTopicIds],
  );

  const pricingQuery = useQuery<PricingResponse>({
    queryKey: [
      "pricing",
      {
        courseId: selectedCourse?.id,
        difficultyId: selectedDifficulty?.id,
        topicIds: selectedTopicIds,
        couponCode,
      },
    ],
    enabled: Boolean(selectedCourse?.id && selectedDifficulty?.id && selectedTopicIds.length > 0),
    queryFn: async () => {
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse?.id,
          difficultyId: selectedDifficulty?.id,
          topicIds: selectedTopicIds,
          couponCode: couponCode || undefined,
        }),
      });
      if (!response.ok) {
        throw new Error("فشل احتساب السعر");
      }
      return (await response.json()) as PricingResponse;
    },
  });

  useEffect(() => {
    if (pricingQuery.data) {
      setField("pricingPreview", {
        sessionsTotal: pricingQuery.data.sessionsTotal,
        subtotal: pricingQuery.data.subtotal,
        discountAmount: pricingQuery.data.discountAmount,
        finalAmount: pricingQuery.data.finalAmount,
      });
    }
  }, [pricingQuery.data, setField]);

  const bookingMutation = useMutation<BookingResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse?.id,
          difficultyId: selectedDifficulty?.id,
          topicIds: selectedTopicIds,
          placementChoice,
          levelProvided,
          slotStartAt,
          couponCode: couponCode || undefined,
          paymentMethod: "CASH",
          notes,
        }),
      });
      if (!response.ok) {
        const message = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(message?.error ?? "فشل إنشاء الحجز");
      }
      return (await response.json()) as BookingResponse;
    },
    onSuccess: (data) => {
      toast.success("تم حجز جلساتك بنجاح", {
        description: `رقم الحجز ${data.booking.id}`,
      });
      useBookingStore.getState().reset();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const canSubmit = Boolean(
    selectedCourse?.id &&
      selectedDifficulty?.id &&
      selectedTopicIds.length > 0 &&
      slotStartAt &&
      pricingPreview?.finalAmount,
  );

  if (!courses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>لا توجد دورات متاحة</CardTitle>
          <CardDescription>يرجى التواصل مع الإدارة لإضافة الدورات.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>اختر الدورة</CardTitle>
            <CardDescription>اختر الدورة التي تناسب أهدافك التعليمية.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => setField("courseId", course.id)}
                className={`rounded-3xl border p-4 text-right transition ${
                  course.id === selectedCourse?.id
                    ? "border-emerald-500 bg-emerald-500/10 shadow-soft"
                    : "border-brand-100 bg-white hover:border-emerald-500"
                }`}
              >
                <p className="font-semibold text-brand-800">{course.title}</p>
                <p className="mt-1 text-sm text-brand-500">{course.category}</p>
                <p className="mt-2 text-xs text-brand-400">{course.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المستوى</CardTitle>
            <CardDescription>اختر مستوى الصعوبة لترى سعر الجلسة.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {difficulties.map((difficulty) => (
              <Button
                key={difficulty.id}
                type="button"
                variant={difficulty.id === selectedDifficulty?.id ? "default" : "outline"}
                onClick={() => setField("difficultyId", difficulty.id)}
              >
                {difficulty.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الموضوعات</CardTitle>
            <CardDescription>حدد الموضوعات التي تريد تغطيتها ليتم حساب عدد الجلسات.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topics.length === 0 && <p className="text-sm text-brand-500">لا توجد موضوعات لهذا المستوى بعد.</p>}
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <Badge
                  key={topic.id}
                  selected={selectedTopicIds.includes(topic.id)}
                  onClick={() => toggleTopic(topic.id)}
                >
                  {topic.name} · {topic.sessionsRequired} جلسة
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفاصيل إضافية</CardTitle>
            <CardDescription>اختر طريقة تحديد المستوى وأدخل الوقت المناسب.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>كيف نحدد مستواك؟</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {placementOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={placementChoice === option.value ? "default" : "outline"}
                    onClick={() => setField("placementChoice", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            {placementChoice === "KNOWN_LEVEL" && (
              <div className="grid gap-2">
                <Label htmlFor="level">مستواي الحالي</Label>
                <Input
                  id="level"
                  placeholder="مثال: B1 متوسط"
                  value={levelProvided ?? ""}
                  onChange={(event) => setField("levelProvided", event.target.value)}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="slot">موعد مفضل (توقيتك المحلي)</Label>
              <Input
                id="slot"
                type="datetime-local"
                value={slotStartAt ?? ""}
                onChange={(event) => setField("slotStartAt", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                placeholder="معلومات إضافية حول أهدافك أو تفضيلاتك."
                value={notes ?? ""}
                onChange={(event) => setField("notes", event.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4">
        <Card className="sticky top-28">
          <CardHeader>
            <CardTitle>ملخص الحجز</CardTitle>
            <CardDescription>راجع التفاصيل قبل التأكيد.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm text-brand-600">
              <span>عدد الجلسات</span>
              <span>{sessionsTotal}</span>
            </div>
            {pricingQuery.isSuccess && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>السعر الإجمالي</span>
                  <span>{pricingQuery.data.subtotal.toLocaleString(locale, { style: "currency", currency: "USD" })}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-600">
                  <span>الخصم</span>
                  <span>-{pricingQuery.data.discountAmount.toLocaleString(locale, { style: "currency", currency: "USD" })}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-brand-800">
                  <span>المبلغ النهائي</span>
                  <span>{pricingQuery.data.finalAmount.toLocaleString(locale, { style: "currency", currency: "USD" })}</span>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="coupon">كوبون خصم</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  placeholder="أدخل الكوبون"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pricingQuery.refetch()}
                  disabled={!couponCode}
                >
                  تحقق
                </Button>
              </div>
            </div>
            {pricingQuery.data?.upsell && (
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-700">
                أضف {pricingQuery.data.upsell.sessionsNeeded} جلسات إضافية لتحصل على خصم
                {" "}
                {pricingQuery.data.upsell.unlockPercentOff}% وتوفر
                {" "}
                {pricingQuery.data.upsell.estimatedSavings.toLocaleString(locale, { style: "currency", currency: "USD" })}
              </div>
            )}
            <Button
              type="button"
              className="w-full"
              size="lg"
              onClick={() => bookingMutation.mutate()}
              disabled={!canSubmit || bookingMutation.isPending}
            >
              {bookingMutation.isPending ? "جاري التأكيد..." : "تأكيد الحجز"}
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
