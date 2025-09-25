"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export type CashBookingCourse = {
  id: string;
  title: string;
  difficulties: { id: string; label: string; pricePerSession: number }[];
  topics: { id: string; name: string; sessionsRequired: number; difficultyId: string }[];
};

type FormState = {
  userEmail: string;
  userName: string;
  userPhone: string;
  courseId?: string;
  difficultyId?: string;
  selectedTopics: string[];
  slotStartAt: string;
  couponCode?: string;
  amount: string;
  currency: string;
  notes: string;
};

const initialState: FormState = {
  userEmail: "",
  userName: "",
  userPhone: "",
  selectedTopics: [],
  slotStartAt: "",
  amount: "0",
  currency: "USD",
  notes: "",
};

export function CashBookingForm({ courses }: { courses: CashBookingCourse[] }) {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    courseId: courses[0]?.id,
    difficultyId: courses[0]?.difficulties[0]?.id,
  });

  const selectedCourse = useMemo(() => courses.find((course) => course.id === form.courseId) ?? courses[0], [courses, form.courseId]);
  const selectedDifficulty = useMemo(
    () => selectedCourse?.difficulties.find((difficulty) => difficulty.id === form.difficultyId) ?? selectedCourse?.difficulties[0],
    [selectedCourse, form.difficultyId],
  );
  const topics = useMemo(
    () => selectedCourse?.topics.filter((topic) => topic.difficultyId === selectedDifficulty?.id) ?? [],
    [selectedCourse, selectedDifficulty],
  );

  const sessionsTotal = topics
    .filter((topic) => form.selectedTopics.includes(topic.id))
    .reduce((sum, topic) => sum + topic.sessionsRequired, 0);

  const estimatedAmount = sessionsTotal * (selectedDifficulty?.pricePerSession ?? 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/cash-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: form.userEmail,
            name: form.userName,
            phone: form.userPhone,
          },
          courseId: selectedCourse?.id,
          difficultyId: selectedDifficulty?.id,
          topicIds: form.selectedTopics,
          slotStartAt: form.slotStartAt,
          couponCode: form.couponCode || undefined,
          cashReceipt: {
            amount: Number(form.amount || estimatedAmount || 0),
            currency: form.currency,
          },
          notes: form.notes,
        }),
      });
      if (!response.ok) {
        const message = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(message?.error ?? "فشل إنشاء الحجز النقدي");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("تم إنشاء الحجز النقدي");
      setForm({ ...initialState, courseId: courses[0]?.id, difficultyId: courses[0]?.difficulties[0]?.id });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    },
  });

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTopic = (topicId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topicId)
        ? prev.selectedTopics.filter((id) => id !== topicId)
        : [...prev.selectedTopics, topicId],
    }));
  };

  if (!courses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>لا توجد دورات متاحة للحجز</CardTitle>
          <CardDescription>أضف الدورات من لوحة التحكم قبل إنشاء حجوزات نقدية.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="userEmail">البريد الإلكتروني</Label>
          <Input
            id="userEmail"
            type="email"
            required
            value={form.userEmail}
            onChange={(event) => updateField("userEmail", event.target.value)}
            placeholder="learner@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="userName">الاسم الكامل</Label>
          <Input
            id="userName"
            required
            value={form.userName}
            onChange={(event) => updateField("userName", event.target.value)}
            placeholder="اسم المتعلم"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="userPhone">رقم الهاتف</Label>
          <Input
            id="userPhone"
            value={form.userPhone}
            onChange={(event) => updateField("userPhone", event.target.value)}
            placeholder="مثال: +961123456"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slot">موعد الجلسة الأولى</Label>
          <Input
            id="slot"
            type="datetime-local"
            required
            value={form.slotStartAt}
            onChange={(event) => updateField("slotStartAt", event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>الدورة</Label>
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <Button
                key={course.id}
                type="button"
                variant={course.id === selectedCourse?.id ? "default" : "outline"}
                onClick={() => updateField("courseId", course.id)}
              >
                {course.title}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label>المستوى</Label>
          <div className="flex flex-wrap gap-2">
            {selectedCourse?.difficulties.map((difficulty) => (
              <Button
                key={difficulty.id}
                type="button"
                variant={difficulty.id === selectedDifficulty?.id ? "default" : "outline"}
                onClick={() => updateField("difficultyId", difficulty.id)}
              >
                {difficulty.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label>الموضوعات المختارة</Label>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Badge key={topic.id} selected={form.selectedTopics.includes(topic.id)} onClick={() => toggleTopic(topic.id)}>
                {topic.name} · {topic.sessionsRequired} جلسة
              </Badge>
            ))}
          </div>
          <p className="text-sm text-brand-500">
            إجمالي الجلسات: {sessionsTotal} — القيمة المقترحة:
            {" "}
            {estimatedAmount.toLocaleString("ar-LB", { style: "currency", currency: form.currency })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="amount">المبلغ المحصل</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            value={form.amount}
            onChange={(event) => updateField("amount", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">العملة</Label>
          <Input
            id="currency"
            value={form.currency}
            onChange={(event) => updateField("currency", event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="coupon">كوبون (اختياري)</Label>
          <Input
            id="coupon"
            value={form.couponCode ?? ""}
            onChange={(event) => updateField("couponCode", event.target.value)}
            placeholder="CODE10"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">ملاحظات</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="ملاحظات إضافية للمدرب أو المتعلم"
        />
      </div>

      <Button type="submit" size="lg" className="w-full md:w-auto" disabled={mutation.isPending}>
        {mutation.isPending ? "جاري الإنشاء..." : "إنشاء الحجز"}
      </Button>
    </form>
  );
}
