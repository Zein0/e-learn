"use client";

import { useEffect, useMemo, useState } from "react";
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

type DayEntry = {
  key: string;
  label: string;
  date: Date;
  slots: { startAt: string; endAt: string; label: string }[];
};

type MonthEntry = {
  key: string;
  year: number;
  month: number;
  label: string;
};

type WeekEntry = {
  key: string;
  start: Date;
  end: Date;
  label: string;
  days: {
    key: string;
    date: Date;
    slotsCount: number;
    isDisabled: boolean;
  }[];
};

type ViewMode = "month" | "week";

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const offset = (day + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

function getWeekEnd(date: Date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

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

  const dayKeyFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: SYSTEM_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [],
  );

  const groupedByDay = useMemo(() => {
    if (!availabilityQuery.data?.slots) {
      return [] as DayEntry[];
    }

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

    const map = new Map<string, DayEntry>();

    availabilityQuery.data.slots.forEach((slot) => {
      const startDate = new Date(slot.startAt);
      const key = dayKeyFormatter.format(startDate);
      if (!map.has(key)) {
        map.set(key, {
          key,
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
  }, [availabilityQuery.data, dayKeyFormatter, locale]);

  const dayMap = useMemo(() => {
    return new Map(groupedByDay.map((day) => [day.key, day]));
  }, [groupedByDay]);

  const months = useMemo(() => {
    if (!groupedByDay.length) return [] as MonthEntry[];

    const monthFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: SYSTEM_TIMEZONE,
      month: "long",
      year: "numeric",
    });

    const map = new Map<string, MonthEntry>();

    groupedByDay.forEach((day) => {
      const year = day.date.getFullYear();
      const month = day.date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        const sample = new Date(year, month, 1);
        map.set(key, {
          key,
          year,
          month,
          label: monthFormatter.format(sample),
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year === b.year) {
        return a.month - b.month;
      }
      return a.year - b.year;
    });
  }, [groupedByDay, locale]);

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>();

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: SYSTEM_TIMEZONE,
      weekday: "short",
    });
    const reference = new Date(Date.UTC(2024, 0, 1));
    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date(reference);
      day.setUTCDate(reference.getUTCDate() + index);
      return formatter.format(day).toUpperCase();
    });
  }, [locale]);

  const weeks = useMemo(() => {
    if (!groupedByDay.length) return [] as WeekEntry[];

    const sortedDays = groupedByDay
      .map((entry) => entry.date)
      .sort((a, b) => a.getTime() - b.getTime());
    const overallStart = getWeekStart(sortedDays[0]);
    const overallEnd = getWeekEnd(sortedDays[sortedDays.length - 1]);

    const rangeFormatter = new Intl.DateTimeFormat(locale, {
      timeZone: SYSTEM_TIMEZONE,
      month: "long",
      day: "numeric",
    });

    const result: WeekEntry[] = [];
    const cursor = new Date(overallStart);

    while (cursor.getTime() <= overallEnd.getTime()) {
      const weekStart = new Date(cursor);
      const weekEnd = new Date(cursor);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startLabel = rangeFormatter.format(weekStart);
      const endLabel = rangeFormatter.format(weekEnd);
      const label = dictionary.weekLabel
        .replace("{{start}}", startLabel)
        .replace("{{end}}", endLabel);

      const days = Array.from({ length: 7 }).map((_, index) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + index);
        const key = dayKeyFormatter.format(dayDate);
        const dayEntry = dayMap.get(key);
        const slotsCount = dayEntry?.slots.length ?? 0;
        return {
          key,
          date: dayDate,
          slotsCount,
          isDisabled: slotsCount === 0,
        };
      });

      result.push({
        key: dayKeyFormatter.format(weekStart),
        start: weekStart,
        end: weekEnd,
        label,
        days,
      });

      cursor.setDate(cursor.getDate() + 7);
    }

    return result;
  }, [dayKeyFormatter, dayMap, dictionary.weekLabel, groupedByDay, locale]);

  useEffect(() => {
    setCurrentMonthIndex((prev) => {
      if (!months.length) return 0;
      return Math.min(prev, Math.max(months.length - 1, 0));
    });
  }, [months.length]);

  useEffect(() => {
    setCurrentWeekIndex((prev) => {
      if (!weeks.length) return 0;
      return Math.min(prev, Math.max(weeks.length - 1, 0));
    });
  }, [weeks.length]);

  useEffect(() => {
    if (!value) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return;
    const key = dayKeyFormatter.format(parsed);
    setSelectedDayKey(key);
    const monthKey = key.slice(0, 7);
    const monthIndex = months.findIndex((month) => month.key === monthKey);
    if (monthIndex !== -1) {
      setCurrentMonthIndex(monthIndex);
    }
    const weekIndex = weeks.findIndex((week) => week.days.some((day) => day.key === key));
    if (weekIndex !== -1) {
      setCurrentWeekIndex(weekIndex);
    }
  }, [value, dayKeyFormatter, months, weeks]);

  useEffect(() => {
    if (!selectedDayKey) return;
    if (!dayMap.has(selectedDayKey)) {
      setSelectedDayKey(undefined);
      if (value) {
        onChange(undefined);
      }
    }
  }, [dayMap, onChange, selectedDayKey, value]);

  useEffect(() => {
    if (!selectedDayKey) return;
    const weekIndex = weeks.findIndex((week) => week.days.some((day) => day.key === selectedDayKey));
    if (weekIndex !== -1) {
      setCurrentWeekIndex(weekIndex);
    }
  }, [selectedDayKey, weeks]);

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

  const currentMonth = months[currentMonthIndex];

  const calendarDays = useMemo(() => {
    if (!currentMonth) return [] as {
      key: string;
      date: Date;
      slotsCount: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }[];

    const monthStart = new Date(currentMonth.year, currentMonth.month, 1);
    const start = new Date(monthStart);
    const offset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - offset);

    return Array.from({ length: 42 }).map((_, index) => {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + index);
      const key = dayKeyFormatter.format(dayDate);
      const dayEntry = dayMap.get(key);
      const slotsCount = dayEntry?.slots.length ?? 0;
      const isCurrentMonth = dayDate.getMonth() === currentMonth.month;
      const isSelected = selectedDayKey === key;
      const isDisabled = slotsCount === 0;
      return {
        key,
        date: dayDate,
        slotsCount,
        isCurrentMonth,
        isSelected,
        isDisabled,
      };
    });
  }, [currentMonth, dayKeyFormatter, dayMap, selectedDayKey]);

  const selectedDay = selectedDayKey ? dayMap.get(selectedDayKey) : undefined;

  const currentWeek = weeks[currentWeekIndex];

  const canGoPrevMonth = currentMonthIndex > 0;
  const canGoNextMonth = currentMonthIndex < months.length - 1;
  const canGoPrevWeek = currentWeekIndex > 0;
  const canGoNextWeek = currentWeekIndex < weeks.length - 1;

  const canGoPrev = viewMode === "month" ? canGoPrevMonth : canGoPrevWeek;
  const canGoNext = viewMode === "month" ? canGoNextMonth : canGoNextWeek;

  const handlePrev = () => {
    if (viewMode === "month") {
      if (canGoPrevMonth) {
        setCurrentMonthIndex((index) => Math.max(index - 1, 0));
      }
    } else if (canGoPrevWeek) {
      setCurrentWeekIndex((index) => Math.max(index - 1, 0));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      if (canGoNextMonth) {
        setCurrentMonthIndex((index) => Math.min(index + 1, months.length - 1));
      }
    } else if (canGoNextWeek) {
      setCurrentWeekIndex((index) => Math.min(index + 1, weeks.length - 1));
    }
  };

  const currentLabel = viewMode === "month" ? currentMonth?.label : currentWeek?.label;

  const handleDaySelect = (dayKey: string) => {
    if (selectedDayKey !== dayKey) {
      setSelectedDayKey(dayKey);
    }
    const dayEntry = dayMap.get(dayKey);
    if (!dayEntry) return;
    if (!dayEntry.slots.some((slot) => slot.startAt === value)) {
      onChange(undefined);
    }
  };

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
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="rounded-3xl border border-brand-100 bg-white/70 p-4 shadow-sm lg:flex-1">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex rounded-full bg-brand-50 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "month" ? "default" : "ghost"}
                  className={`rounded-full px-4 ${viewMode === "month" ? "bg-brand-500 text-white hover:bg-brand-500" : "text-brand-600"}`}
                  onClick={() => setViewMode("month")}
                  aria-pressed={viewMode === "month"}
                >
                  {dictionary.viewModes.month}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "week" ? "default" : "ghost"}
                  className={`rounded-full px-4 ${viewMode === "week" ? "bg-brand-500 text-white hover:bg-brand-500" : "text-brand-600"}`}
                  onClick={() => setViewMode("week")}
                  aria-pressed={viewMode === "week"}
                >
                  {dictionary.viewModes.week}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canGoPrev}
                  onClick={handlePrev}
                  className="h-8 w-8 rounded-full p-0 text-lg"
                  aria-label={dictionary.navigation.previous}
                >
                  &lsaquo;
                </Button>
                <p className="text-sm font-semibold text-brand-700">{currentLabel}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!canGoNext}
                  onClick={handleNext}
                  className="h-8 w-8 rounded-full p-0 text-lg"
                  aria-label={dictionary.navigation.next}
                >
                  &rsaquo;
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-wide text-brand-400">
              {weekdayLabels.map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            {viewMode === "month" ? (
              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarDays.map((day) => {
                  const isSelected = day.isSelected;
                  const baseClasses =
                    "flex h-20 flex-col items-center justify-center rounded-2xl border text-sm transition";
                  const stateClasses = day.isDisabled
                    ? "cursor-not-allowed border-dashed border-brand-100 bg-brand-50/60 text-brand-300"
                    : isSelected
                      ? "border-brand-500 bg-brand-500 text-white shadow-md"
                      : day.isCurrentMonth
                        ? "border-brand-100 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50"
                        : "border-transparent bg-brand-50/30 text-brand-300";
                  return (
                    <button
                      key={`${day.key}-${day.date.getDate()}`}
                      type="button"
                      disabled={day.isDisabled}
                      onClick={() => handleDaySelect(day.key)}
                      className={`${baseClasses} ${stateClasses}`}
                    >
                      <span className="text-base font-semibold">{day.date.getDate()}</span>
                      <span
                        className={`mt-1 inline-flex min-w-[2rem] justify-center rounded-full px-2 py-1 text-[11px] font-medium ${
                          isSelected ? "bg-white/90 text-brand-600" : "bg-brand-100 text-brand-600"
                        }`}
                      >
                        {day.slotsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {currentWeek?.days.map((day) => {
                  const isSelected = selectedDayKey === day.key;
                  const baseClasses =
                    "flex min-h-[5.5rem] flex-col items-center justify-center rounded-2xl border text-sm transition";
                  const stateClasses = day.isDisabled
                    ? "cursor-not-allowed border-dashed border-brand-100 bg-brand-50/60 text-brand-300"
                    : isSelected
                      ? "border-brand-500 bg-brand-500 text-white shadow-md"
                      : "border-brand-100 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50";
                  return (
                    <button
                      key={`${day.key}-${day.date.getDate()}`}
                      type="button"
                      disabled={day.isDisabled}
                      onClick={() => handleDaySelect(day.key)}
                      className={`${baseClasses} ${stateClasses}`}
                    >
                      <span className="text-base font-semibold">{day.date.getDate()}</span>
                      <span
                        className={`mt-1 inline-flex min-w-[2rem] justify-center rounded-full px-2 py-1 text-[11px] font-medium ${
                          isSelected ? "bg-white/90 text-brand-600" : "bg-brand-100 text-brand-600"
                        }`}
                      >
                        {day.slotsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="rounded-3xl border border-brand-100 bg-white/70 p-4 shadow-sm lg:w-[320px] xl:w-[360px]">
            {selectedDay ? (
              <div className="flex h-full flex-col">
                <div className="space-y-1 border-b border-brand-100 pb-3">
                  <p className="text-sm font-semibold text-brand-700">{selectedDay.label}</p>
                  <p className="text-xs text-brand-500">{dictionary.description}</p>
                </div>
                <div className="mt-3 flex-1 overflow-y-auto pr-1">
                  <div className="flex flex-col gap-2">
                    {selectedDay.slots.map((slot) => {
                      const isSelected = value === slot.startAt;
                      return (
                        <Button
                          key={slot.startAt}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          className="w-full justify-between rounded-2xl px-4"
                          onClick={() => onChange(isSelected ? undefined : slot.startAt)}
                        >
                          <span>{slot.label}</span>
                          {isSelected && <span className="text-xs font-semibold uppercase">✓</span>}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-brand-50/70 p-6 text-center text-sm text-brand-500">
                {dictionary.description}
              </div>
            )}
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
