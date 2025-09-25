"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminDictionary } from "@/lib/types/admin";
import { formatUTC } from "@/lib/timezone";

type CalendarAppointment = {
  id: string;
  learner: string;
  course: string;
  topic?: string | null;
  startAt: string;
  endAt: string;
  status: string;
};

type AdminCalendarProps = {
  appointments: CalendarAppointment[];
  locale: string;
  dictionary: AdminDictionary["calendar"];
};

const WEEK_STARTS_ON = 6; // Saturday for MENA region.

function groupByDay(appointments: CalendarAppointment[], start: Date, end: Date) {
  const days = eachDayOfInterval({ start, end });
  return days.map((day) => {
    const entries = appointments.filter((appointment) => {
      const date = new Date(appointment.startAt);
      return date >= startOfDay(day) && date <= endOfDay(day);
    });
    return { day, entries };
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function formatDay(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric" }).format(date);
}

function formatMonthLabel(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}

export function AdminCalendar({ appointments, locale, dictionary }: AdminCalendarProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const weekRange = useMemo(() => {
    const start = startOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(anchorDate, { weekStartsOn: WEEK_STARTS_ON });
    const days = groupByDay(appointments, start, end);
    return { start, end, days };
  }, [anchorDate, appointments]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(anchorDate);
    const monthEnd = endOfMonth(anchorDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd }).map((day) => ({
      day,
      entries: appointments.filter((appointment) => {
        const date = new Date(appointment.startAt);
        return date >= startOfDay(day) && date <= endOfDay(day);
      }),
    }));
    return { calendarStart, calendarEnd, days };
  }, [anchorDate, appointments]);

  const handlePrevious = () => {
    setAnchorDate((current) => (view === "week" ? addDays(current, -7) : subMonths(current, 1)));
  };

  const handleNext = () => {
    setAnchorDate((current) => (view === "week" ? addDays(current, 7) : addMonths(current, 1)));
  };

  const weekLabelStart = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(weekRange.start);
  const weekLabelEnd = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(weekRange.end);

  const activeLabel =
    view === "week"
      ? `${dictionary.weekOf} ${weekLabelStart} – ${weekLabelEnd}`
      : `${dictionary.monthOf} ${formatMonthLabel(anchorDate, locale)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 rounded-full bg-white/70 p-1 shadow-inner">
          <Button
            type="button"
            variant={view === "week" ? "default" : "ghost"}
            onClick={() => setView("week")}
          >
            {dictionary.weekView}
          </Button>
          <Button
            type="button"
            variant={view === "month" ? "default" : "ghost"}
            onClick={() => setView("month")}
          >
            {dictionary.monthView}
          </Button>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-inner">
          <Button type="button" variant="ghost" size="sm" onClick={handlePrevious}>
            {dictionary.previous}
          </Button>
          <p className="text-sm font-medium text-brand-700">{activeLabel}</p>
          <Button type="button" variant="ghost" size="sm" onClick={handleNext}>
            {dictionary.next}
          </Button>
        </div>
      </div>

      {view === "week" ? (
        <div className="overflow-x-auto">
          <div className="min-w-full rounded-3xl border border-brand-100 bg-white/90 p-4">
            <div className="grid gap-4 md:grid-cols-7">
              {weekRange.days.map(({ day, entries }) => (
                <div key={day.toISOString()} className="space-y-3">
                  <p className="text-sm font-semibold text-brand-700">{formatDay(day, locale)}</p>
                  <div className="space-y-2">
                    {entries.length === 0 ? (
                      <p className="text-xs text-brand-400">{dictionary.noSessions}</p>
                    ) : (
                      entries.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-brand-100 bg-brand-50/60 p-3">
                          <p className="text-sm font-semibold text-brand-800">{entry.learner}</p>
                          <p className="text-xs text-brand-500">{entry.course}</p>
                          {entry.topic && <p className="text-xs text-brand-400">{entry.topic}</p>}
                          <p className="mt-2 text-xs text-emerald-700">
                            {formatUTC(entry.startAt, { locale, variant: "time" })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-brand-100 bg-white/90 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {monthDays.days.map(({ day, entries }) => (
              <div
                key={day.toISOString()}
                className="min-h-[120px] rounded-2xl border border-brand-100 bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-brand-500">
                  <span>{format(day, "d")}</span>
                  <span>{format(day, "EEE")}</span>
                </div>
                <div className="mt-2 space-y-2">
                  {entries.slice(0, 2).map((entry) => (
                    <div key={entry.id} className="rounded-xl bg-brand-50/80 p-2 text-xs text-brand-700">
                      <p className="font-medium">{entry.learner}</p>
                      <p className="text-[11px] text-brand-500">{formatUTC(entry.startAt, { locale, variant: "time" })}</p>
                    </div>
                  ))}
                  {entries.length > 2 && (
                    <Badge className="cursor-default bg-emerald-500/10 text-xs text-emerald-700">
                      +{entries.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
