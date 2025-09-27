"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type {
  AdminAvailabilityDictionary,
  AdminAvailabilitySlot,
} from "@/lib/types/admin";

const START_HOUR = 8;
const END_HOUR = 21;

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);

type AvailabilityManagerProps = {
  initialSlots: AdminAvailabilitySlot[];
  dictionary: AdminAvailabilityDictionary;
  timezone: string;
  locale?: string;
};

function formatHour(hour: number, locale: string | undefined, timezone: string) {
  const date = new Date(Date.UTC(2024, 0, 1, hour, 0));
  return new Intl.DateTimeFormat(locale ?? "en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

export function AvailabilityManager({
  initialSlots,
  dictionary,
  timezone,
  locale,
}: AvailabilityManagerProps) {
  const initialSelection = useMemo(() => {
    const set = new Set<string>();
    initialSlots.forEach((slot) => {
      const hour = Math.floor(slot.startMinutes / 60);
      set.add(`${slot.dayOfWeek}-${hour}`);
    });
    return set;
  }, [initialSlots]);

  const [selection, setSelection] = useState<Set<string>>(initialSelection);

  useEffect(() => {
    setSelection(new Set(initialSelection));
  }, [initialSelection]);

  const toggleSlot = (day: number, hour: number) => {
    setSelection((current) => {
      const key = `${day}-${hour}`;
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelection(new Set());
  };

  const mutation = useMutation<{ slots: AdminAvailabilitySlot[] }, Error, AdminAvailabilitySlot[]>({
    mutationFn: async (slots: AdminAvailabilitySlot[]) => {
      const response = await fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to save availability");
      }
      return (await response.json()) as { slots: AdminAvailabilitySlot[] };
    },
    onSuccess: (data) => {
      const next = new Set<string>();
      data.slots.forEach((slot) => {
        next.add(`${slot.dayOfWeek}-${Math.floor(slot.startMinutes / 60)}`);
      });
      setSelection(next);
      toast.success(dictionary.success);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    const slots: AdminAvailabilitySlot[] = Array.from(selection).map((entry) => {
      const [day, hour] = entry.split("-").map((value) => Number(value));
      return {
        dayOfWeek: day,
        startMinutes: hour * 60,
        durationMinutes: 60,
      };
    });
    mutation.mutate(slots);
  };

  return (
    <div className="space-y-6 rounded-3xl bg-white/90 p-6 shadow-soft ring-1 ring-brand-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-brand-600">{dictionary.instructions}</p>
        <p className="text-xs text-brand-400">
          {dictionary.timezoneNote.replace("{{timezone}}", timezone)}
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            {dictionary.clearAction}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            {dictionary.weekdays.map((dayLabel, index) => (
              <div
                key={dayLabel}
                className="space-y-3 rounded-3xl border border-brand-100 bg-brand-50/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-brand-700">{dayLabel}</p>
                  <span className="text-xs text-brand-400">
                    {Array.from(selection).filter((entry) => entry.startsWith(`${index}-`)).length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {HOURS.map((hour) => {
                    const key = `${index}-${hour}`;
                    const isSelected = selection.has(key);
                    const timeLabel = formatHour(hour, locale, timezone);
                    const displayLabel = dictionary.hourLabel.replace("{{time}}", timeLabel);
                    return (
                      <Button
                        key={key}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="justify-center"
                        onClick={() => toggleSlot(index, hour)}
                      >
                        {displayLabel}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        {selection.size === 0 && (
          <p className="rounded-2xl bg-brand-50/80 p-4 text-sm text-brand-500">
            {dictionary.empty}
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? dictionary.savingAction : dictionary.saveAction}
        </Button>
      </div>
    </div>
  );
}
