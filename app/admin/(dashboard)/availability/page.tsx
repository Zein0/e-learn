import { prisma } from "@/lib/db";
import { getDictionary, getLocale } from "@/lib/i18n";
import { SYSTEM_TIMEZONE } from "@/lib/timezone";
import type { AdminAvailabilitySlot } from "@/lib/types/admin";
import { AvailabilityManager } from "@/components/admin/settings/availability-manager";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  let slots: AdminAvailabilitySlot[] = [];
  try {
    const records = await prisma.availabilitySlot.findMany({
      orderBy: [
        { dayOfWeek: "asc" },
        { startMinutes: "asc" },
      ],
    });

    slots = records.map((record) => ({
      dayOfWeek: record.dayOfWeek,
      startMinutes: record.startMinutes,
      durationMinutes: record.durationMinutes,
    }));
  } catch (error) {
    console.error("Failed to load availability", error);
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
        <h1 className="font-display text-3xl text-brand-800">{dictionary.admin.availability.title}</h1>
        <p className="text-brand-600">{dictionary.admin.availability.description}</p>
      </div>
      <AvailabilityManager
        initialSlots={slots}
        dictionary={dictionary.admin.availability}
        timezone={SYSTEM_TIMEZONE}
        locale={locale}
      />
    </section>
  );
}
