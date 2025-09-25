"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatUTC } from "@/lib/timezone";
import { toast } from "sonner";

export type AdminAppointment = {
  id: string;
  learner: string;
  course: string;
  topic: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string;
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Scheduled",
  DONE: "Completed",
  CANCELED: "Canceled",
  RESCHEDULED: "Rescheduled",
  NO_SHOW: "No show",
};

type Action = "CANCEL" | "CONFIRM_DONE" | "ADD_NOTES" | "RESCHEDULE";

export function AppointmentsTable({ appointments }: { appointments: AdminAppointment[] }) {
  const [notesState, setNotesState] = useState<Record<string, string>>(() =>
    Object.fromEntries(appointments.map((appointment) => [appointment.id, appointment.notes])),
  );

  const mutation = useMutation({
    mutationFn: async ({ id, action, newStartAt }: { id: string; action: Action; newStartAt?: string }) => {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, newStartAt, notes: notesState[id] }),
      });
      if (!response.ok) {
        const message = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(message?.error ?? "Failed to update appointment");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Appointment updated");
      window.location.reload();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Unexpected error");
    },
  });

  const handleAction = (id: string, action: Action) => {
    if (action === "RESCHEDULE") {
      const newStartAt = window.prompt(
        "Select a new start date in YYYY-MM-DDTHH:mm format",
        new Date().toISOString().slice(0, 16),
      );
      if (!newStartAt) return;
      mutation.mutate({ id, action, newStartAt });
      return;
    }
    mutation.mutate({ id, action });
  };

  return (
    <div className="overflow-x-auto rounded-3xl bg-white/80 shadow-soft ring-1 ring-brand-100">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-brand-100/60 text-brand-600">
          <tr>
            <th className="px-4 py-3 font-medium">Learner</th>
            <th className="px-4 py-3 font-medium">Course</th>
            <th className="px-4 py-3 font-medium">Topic</th>
            <th className="px-4 py-3 font-medium">Schedule</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Notes</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="border-t border-brand-100/60">
              <td className="px-4 py-3 font-medium text-brand-800">{appointment.learner}</td>
              <td className="px-4 py-3 text-brand-600">{appointment.course}</td>
              <td className="px-4 py-3 text-brand-600">{appointment.topic}</td>
              <td className="px-4 py-3 text-brand-500">
                <div className="flex flex-col">
                  <span>{formatUTC(appointment.startAt)}</span>
                  <span className="text-xs text-brand-400">until {formatUTC(appointment.endAt, { variant: "time" })}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {statusLabels[appointment.status] ?? appointment.status}
                </span>
              </td>
              <td className="px-4 py-3 align-top">
                <Textarea
                  value={notesState[appointment.id] ?? ""}
                  onChange={(event) => setNotesState((state) => ({ ...state, [appointment.id]: event.target.value }))}
                  placeholder="Add notes for the instructor"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => handleAction(appointment.id, "ADD_NOTES")}
                  disabled={mutation.isPending}
                >
                  Save notes
                </Button>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(appointment.id, "RESCHEDULE")}
                    disabled={mutation.isPending}
                  >
                    Reschedule
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(appointment.id, "CONFIRM_DONE")}
                    disabled={mutation.isPending}
                  >
                    Mark as done
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleAction(appointment.id, "CANCEL")}
                    disabled={mutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
