import { prisma } from "./db";
import { toUTC } from "./timezone";

export async function validateSlot({
  userId,
  startAt,
}: {
  userId: string;
  startAt: string;
}) {
  const slotStart = toUTC(startAt);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

  if (slotStart <= new Date()) {
    throw new Error("Slot must be in the future");
  }

  const overlaps = await prisma.appointment.findFirst({
    where: {
      userId,
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
      OR: [
        {
          startAt: { lte: slotStart },
          endAt: { gt: slotStart },
        },
        {
          startAt: { lt: slotEnd },
          endAt: { gte: slotEnd },
        },
      ],
    },
  });

  if (overlaps) {
    throw new Error("Overlapping appointment");
  }

  return { startAt: slotStart, endAt: slotEnd };
}
