"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import type { BookingDictionary } from "@/lib/types/booking";
import { SYSTEM_TIMEZONE } from "@/lib/timezone";

type AvailabilityPickerProps = {
  value?: string;
  onChange: (value?: string) => void;
  locale: string;
  sessions: number;
  dictionary: BookingDictionary["form"]["details"]["availability"];
};

type AvailabilityResponse = {
  slots: { startAt: string; endAt: string }[];
};

export function AvailabilityPicker({ value, onChange, locale, sessions, dictionary }: AvailabilityPickerProps) {
  const availabilityQuery = useQuery<AvailabilityResponse>({
    queryKey: ["availability"],
    queryFn: async () => {
      const response = await fetch("/api/availability");
      if (!response.ok) {
        throw new Error("Failed to load availability");
      }
      return (await response.json()) as AvailabilityResponse;
    },
  });

  const groupedByDay = useMemo(() => {
    if (!availabilityQuery.data?.slots) {
      return [] as {
        label: string;
        date: Date;
        slots: { startAt: string; endAt: string; label: string }[];
      }[];
    }

    const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: SYSTEM_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const dayLabelFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: SYSTEM_TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "short",
    });

    const timeFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: SYSTEM_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const map = new Map<
      string,
      {
        label: string;
        date: Date;
        slots: { startAt: string; endAt: string; label: string }[];
      }
    >();

    availabilityQuery.data.slots.forEach((slot) => {
      const startDate = new Date(slot.startAt);
      const key = dayKeyFormatter.format(startDate);
      if (!map.has(key)) {
        map.set(key, {
          label: dayLabelFormatter.format(startDate),
          date: startDate,
          slots: [],
        });
      }
      map.get(key)?.slots.push({
        startAt: slot.startAt,
        endAt: slot.endAt,
        label: timeFormatter.format(startDate),
      });
    });

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        slots: entry.slots.sort((a, b) => (a.startAt < b.startAt ? -1 : 1)),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [availabilityQuery.data, locale]);

  const selectedSlot = useMemo(() => {
    if (!value || !availabilityQuery.data?.slots) return undefined;
    return availabilityQuery.data.slots.find((slot) => slot.startAt === value);
  }, [availabilityQuery.data, value]);

  const selectedSummary = useMemo(() => {
    if (!selectedSlot) return null;
    const start = new Date(selectedSlot.startAt);
    const dateLabel = new Intl.DateTimeFormat(locale, {
      timeZone: SYSTEM_TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(start);
    const timeLabel = new Intl.DateTimeFormat(locale, {
      timeZone: SYSTEM_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(start);

    return dictionary.selected
      .replace("{{count}}", String(sessions))
      .replace("{{date}}", dateLabel)
      .replace("{{time}}", timeLabel);
  }, [selectedSlot, dictionary.selected, sessions, locale]);

  return (
    <div className="space-y-4 rounded-3xl border border-brand-100 bg-white/80 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-brand-700">{dictionary.title}</p>
        <p className="text-xs text-brand-500">{dictionary.description}</p>
        <p className="text-xs text-brand-400">{dictionary.timezone.replace("{{timezone}}", SYSTEM_TIMEZONE)}</p>
      </div>
      {availabilityQuery.isLoading ? (
        <p className="text-sm text-brand-500">{dictionary.loading}</p>
      ) : availabilityQuery.isError ? (
        <p className="rounded-2xl bg-brand-50/70 p-4 text-sm text-brand-500">{dictionary.empty}</p>
      ) : groupedByDay.length === 0 ? (
        <p className="rounded-2xl bg-brand-50/70 p-4 text-sm text-brand-500">{dictionary.empty}</p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedByDay.map((day) => (
              <div key={day.label} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-3">
                <p className="text-sm font-semibold text-brand-700">{day.label}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {day.slots.map((slot) => {
                    const isSelected = value === slot.startAt;
                    return (
                      <Button
                        key={slot.startAt}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="rounded-2xl px-4"
                        onClick={() => onChange(isSelected ? undefined : slot.startAt)}
                      >
                        {slot.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedSummary && (
        <div className="space-y-2 rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-700">
          <p>{selectedSummary}</p>
          <p>{dictionary.sessionsNote}</p>
        </div>
      )}
    </div>
  );
}
