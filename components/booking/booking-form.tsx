"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { BookingCourse, BookingDictionary } from "@/lib/types/booking";
import { useBookingStore } from "@/stores/booking";

const CURRENCY_CODE = "USD";

type BookingFormProps = {
  courses: BookingCourse[];
  locale: string;
  dictionary: BookingDictionary;
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

function formatCurrency(locale: string, value: number) {
  return value.toLocaleString(locale, { style: "currency", currency: CURRENCY_CODE });
}

function renderTemplate(template: string, replacements: Record<string, string | number>) {
  return Object.entries(replacements).reduce((result, [key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, "g");
    return result.replace(pattern, String(value));
  }, template);
}

export function BookingForm({ courses, locale, dictionary }: BookingFormProps) {
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
  const [isSummaryOpen, setSummaryOpen] = useState(false);

  const placementOptions = useMemo(
    () =>
      [
        { value: "KNOWN_LEVEL", label: dictionary.placementOptions.KNOWN_LEVEL },
        { value: "PLACEMENT_TEST", label: dictionary.placementOptions.PLACEMENT_TEST },
        { value: "DISCOVERY_CALL", label: dictionary.placementOptions.DISCOVERY_CALL },
      ],
    [dictionary.placementOptions],
  );

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
        throw new Error(dictionary.errors.pricingFailed);
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

  useEffect(() => {
    if (pricingQuery.isError) {
      toast.error(dictionary.errors.pricingFailed);
    }
  }, [dictionary.errors.pricingFailed, pricingQuery.isError]);

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
        throw new Error(message?.error ?? dictionary.errors.bookingFailed);
      }
      return (await response.json()) as BookingResponse;
    },
    onSuccess: (data) => {
      toast.success(dictionary.toast.success, {
        description: renderTemplate(dictionary.toast.reference, { id: data.booking.id }),
      });
      setSummaryOpen(false);
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

  const summaryBody = (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-brand-600">
        <span>{dictionary.form.summary.sessionsLabel}</span>
        <span>{sessionsTotal}</span>
      </div>
      {pricingQuery.isSuccess && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>{dictionary.form.summary.subtotalLabel}</span>
            <span>{formatCurrency(locale, pricingQuery.data.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-emerald-600">
            <span>{dictionary.form.summary.discountLabel}</span>
            <span>-{formatCurrency(locale, pricingQuery.data.discountAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-brand-800">
            <span>{dictionary.form.summary.finalLabel}</span>
            <span>{formatCurrency(locale, pricingQuery.data.finalAmount)}</span>
          </div>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="coupon">{dictionary.form.summary.couponLabel}</Label>
        <div className="flex gap-2">
          <Input
            id="coupon"
            placeholder={dictionary.form.summary.couponPlaceholder}
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => pricingQuery.refetch()}
            disabled={!couponCode}
          >
            {dictionary.form.summary.couponCheck}
          </Button>
        </div>
      </div>
      {pricingQuery.data?.upsell && (
        <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-700">
          {renderTemplate(dictionary.form.summary.upsellTemplate, {
            sessions: pricingQuery.data.upsell.sessionsNeeded,
            percent: pricingQuery.data.upsell.unlockPercentOff,
            savings: formatCurrency(locale, pricingQuery.data.upsell.estimatedSavings),
          })}
        </div>
      )}
      <Button
        type="button"
        className="w-full"
        size="lg"
        onClick={() => bookingMutation.mutate()}
        disabled={!canSubmit || bookingMutation.isPending}
      >
        {bookingMutation.isPending ? dictionary.form.actions.confirming : dictionary.form.actions.confirm}
      </Button>
    </div>
  );

  if (!courses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.emptyCourses.title}</CardTitle>
          <CardDescription>{dictionary.emptyCourses.description}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{dictionary.form.course.title}</CardTitle>
              <CardDescription>{dictionary.form.course.description}</CardDescription>
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
              <CardTitle>{dictionary.form.difficulty.title}</CardTitle>
              <CardDescription>{dictionary.form.difficulty.description}</CardDescription>
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
              <CardTitle>{dictionary.form.topics.title}</CardTitle>
              <CardDescription>{dictionary.form.topics.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {topics.length === 0 && <p className="text-sm text-brand-500">{dictionary.form.topics.empty}</p>}
              <div className="flex flex-wrap gap-2">
                {topics.map((topic) => (
                  <Badge
                    key={topic.id}
                    selected={selectedTopicIds.includes(topic.id)}
                    onClick={() => toggleTopic(topic.id)}
                  >
                    {renderTemplate(dictionary.form.topics.chipTemplate, {
                      name: topic.name,
                      sessions: topic.sessionsRequired,
                    })}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dictionary.form.details.title}</CardTitle>
              <CardDescription>{dictionary.form.details.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>{dictionary.form.details.placementQuestion}</Label>
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
                  <Label htmlFor="level">{dictionary.form.details.levelLabel}</Label>
                  <Input
                    id="level"
                    placeholder={dictionary.form.details.levelPlaceholder}
                    value={levelProvided ?? ""}
                    onChange={(event) => setField("levelProvided", event.target.value)}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="slot">{dictionary.form.details.slotLabel}</Label>
                <Input
                  id="slot"
                  type="datetime-local"
                  value={slotStartAt ?? ""}
                  onChange={(event) => setField("slotStartAt", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">{dictionary.form.details.notesLabel}</Label>
                <Textarea
                  id="notes"
                  placeholder={dictionary.form.details.notesPlaceholder}
                  value={notes ?? ""}
                  onChange={(event) => setField("notes", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="hidden space-y-4 lg:block">
          <Card className="sticky top-28">
            <CardHeader>
              <CardTitle>{dictionary.form.summary.title}</CardTitle>
              <CardDescription>{dictionary.form.summary.description}</CardDescription>
            </CardHeader>
            <CardContent>{summaryBody}</CardContent>
          </Card>
        </aside>
      </div>

      <Sheet open={isSummaryOpen} onOpenChange={setSummaryOpen}>
        <SheetTrigger asChild>
          <Button className="fixed inset-x-4 bottom-5 z-30 rounded-full py-6 shadow-lg lg:hidden">
            {dictionary.summaryButton}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[32px] bg-white p-6 lg:hidden">
          <SheetHeader className="text-right">
            <SheetTitle>{dictionary.form.summary.title}</SheetTitle>
            <SheetDescription>{dictionary.form.summary.description}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 pb-6">{summaryBody}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
