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

export type BookingDictionary = {
  title: string;
  description: string;
  summaryButton: string;
  emptyCourses: {
    title: string;
    description: string;
  };
  placementOptions: Record<string, string>;
  form: {
    course: {
      title: string;
      description: string;
    };
    difficulty: {
      title: string;
      description: string;
    };
    topics: {
      title: string;
      description: string;
      empty: string;
      chipTemplate: string;
    };
    details: {
      title: string;
      description: string;
      placementQuestion: string;
      levelLabel: string;
      levelPlaceholder: string;
      slotLabel: string;
      notesLabel: string;
      notesPlaceholder: string;
    };
    summary: {
      title: string;
      description: string;
      sessionsLabel: string;
      subtotalLabel: string;
      discountLabel: string;
      finalLabel: string;
      couponLabel: string;
      couponPlaceholder: string;
      couponCheck: string;
      upsellTemplate: string;
    };
    actions: {
      confirm: string;
      confirming: string;
    };
  };
  toast: {
    success: string;
    reference: string;
  };
  errors: {
    pricingFailed: string;
    bookingFailed: string;
  };
};
