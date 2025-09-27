import { prisma } from "./db";
import { SYSTEM_TIMEZONE, toUTC } from "./timezone";

type AvailabilityRecord = {
  id: string;
  dayOfWeek: number;
  startMinutes: number;
  durationMinutes: number;
};

type ValidateSlotOptions = {
  startAt: string;
  sessions?: number;
  durationMinutes?: number;
  ignoreAppointmentId?: string;
};

type ValidateSlotResult = {
  occurrences: { startAt: Date; endAt: Date }[];
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SYSTEM_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SYSTEM_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "long",
});

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SYSTEM_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function partsToRecord(parts: Intl.DateTimeFormatPart[]) {
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

function getZonedDateParts(date: Date) {
  const record = partsToRecord(dateFormatter.formatToParts(date));
  return {
    year: Number(record.year ?? "0"),
    month: Number(record.month ?? "0"),
    day: Number(record.day ?? "0"),
  };
}

function getZonedDateTimeParts(date: Date) {
  const record = partsToRecord(dateTimeFormatter.formatToParts(date));
  const weekdayName = record.weekday ?? "Sunday";
  const dayOfWeek = WEEKDAY_INDEX[weekdayName] ?? 0;
  const hour = Number(record.hour ?? "0");
  const minute = Number(record.minute ?? "0");
  return {
    ...getZonedDateParts(date),
    dayOfWeek,
    minutes: hour * 60 + minute,
  };
}

function getTimeZoneOffset(date: Date) {
  const record = partsToRecord(offsetFormatter.formatToParts(date));
  const asUTC = Date.UTC(
    Number(record.year ?? "0"),
    Number(record.month ?? "1") - 1,
    Number(record.day ?? "1"),
    Number(record.hour ?? "0"),
    Number(record.minute ?? "0"),
    Number(record.second ?? "0"),
  );
  return asUTC - date.getTime();
}

function buildZonedDate(
  { year, month, day }: { year: number; month: number; day: number },
  minutes: number,
) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const assumedUTC = new Date(Date.UTC(year, month - 1, day, hours, mins));
  const offset = getTimeZoneOffset(assumedUTC);
  return new Date(assumedUTC.getTime() + offset);
}

export async function getAvailabilitySchedule() {
  const records = await prisma.availabilitySlot.findMany({
    where: { isActive: true },
    orderBy: [
      { dayOfWeek: "asc" },
      { startMinutes: "asc" },
    ],
  });

  return records.map((record) => ({
    id: record.id,
    dayOfWeek: record.dayOfWeek,
    startMinutes: record.startMinutes,
    durationMinutes: record.durationMinutes,
  }));
}

function ensureMatchesAvailability(
  schedule: AvailabilityRecord[],
  candidate: { dayOfWeek: number; minutes: number },
) {
  const match = schedule.find(
    (slot) => slot.dayOfWeek === candidate.dayOfWeek && slot.startMinutes === candidate.minutes,
  );

  if (!match) {
    throw new Error("Selected slot is not available");
  }

  return match;
}

export async function validateSlot(options: ValidateSlotOptions): Promise<ValidateSlotResult> {
  const { startAt, sessions = 1, durationMinutes = 60, ignoreAppointmentId } = options;
  const initialStart = toUTC(startAt);
  const totalSessions = Math.max(1, sessions);

  if (Number.isNaN(initialStart.getTime())) {
    throw new Error("Invalid slot time");
  }

  if (initialStart <= new Date()) {
    throw new Error("Slot must be in the future");
  }

  const schedule = await getAvailabilitySchedule();
  if (!schedule.length) {
    throw new Error("Instructor availability is not configured");
  }

  const occurrences: { startAt: Date; endAt: Date }[] = [];
  for (let index = 0; index < totalSessions; index += 1) {
    const sessionStart = new Date(initialStart.getTime() + index * 7 * 24 * 60 * 60 * 1000);
    const zoned = getZonedDateTimeParts(sessionStart);
    const matchingSlot = ensureMatchesAvailability(schedule, {
      dayOfWeek: zoned.dayOfWeek,
      minutes: zoned.minutes,
    });
    const duration = matchingSlot.durationMinutes || durationMinutes;
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);
    occurrences.push({ startAt: sessionStart, endAt: sessionEnd });
  }

  const rangeStart = occurrences[0]?.startAt ?? initialStart;
  const rangeEnd = occurrences[occurrences.length - 1]?.endAt ?? new Date(initialStart.getTime() + durationMinutes * 60 * 1000);

  const conflicts = await prisma.appointment.findMany({
    where: {
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
      startAt: { lt: rangeEnd },
      endAt: { gt: rangeStart },
      ...(ignoreAppointmentId ? { id: { not: ignoreAppointmentId } } : {}),
    },
    select: { id: true, startAt: true, endAt: true },
  });

  const hasConflict = conflicts.some((conflict) =>
    occurrences.some(
      (occurrence) => conflict.startAt < occurrence.endAt && conflict.endAt > occurrence.startAt,
    ),
  );

  if (hasConflict) {
    throw new Error("Slot is already booked");
  }

  return { occurrences };
}

export async function getAvailableSlots({
  start,
  end,
}: {
  start: Date;
  end: Date;
}) {
  const schedule = await getAvailabilitySchedule();
  if (!schedule.length) {
    return [];
  }

  const busyAppointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
    select: { startAt: true, endAt: true },
  });

  const now = new Date();
  const slots: { startAt: string; endAt: string }[] = [];
  const cursor = new Date(start.getTime());

  while (cursor <= end) {
    const { year, month, day } = getZonedDateParts(cursor);
    const dayOfWeek = getZonedDateTimeParts(cursor).dayOfWeek;
    const daySlots = schedule.filter((slot) => slot.dayOfWeek === dayOfWeek);

    daySlots.forEach((slot) => {
      const slotStart = buildZonedDate({ year, month, day }, slot.startMinutes);
      if (slotStart <= now) return;
      const slotEnd = new Date(slotStart.getTime() + slot.durationMinutes * 60 * 1000);
      const blocked = busyAppointments.some(
        (appointment) => appointment.startAt < slotEnd && appointment.endAt > slotStart,
      );
      if (!blocked) {
        slots.push({ startAt: slotStart.toISOString(), endAt: slotEnd.toISOString() });
      }
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return slots.sort((a, b) => (a.startAt < b.startAt ? -1 : 1));
}
