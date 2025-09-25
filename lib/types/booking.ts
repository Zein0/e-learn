import type { DifficultyLabel } from "@prisma/client";

export type BookingCourse = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulties: {
    id: string;
    label: DifficultyLabel;
    pricePerSession: number;
  }[];
  topics: {
    id: string;
    name: string;
    sessionsRequired: number;
    estimatedHours: number;
    difficultyId: string;
  }[];
};
