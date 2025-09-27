export type BookingCourse = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  difficulties: {
    id: string;
    name: string;
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
    levelCheck: {
      title: string;
      description: string;
      knows: string;
      unsure: string;
    };
    course: {
      title: string;
      description: string;
    };
    difficulty: {
      title: string;
      description: string;
      priceLabel: string;
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
      notesLabel: string;
      notesPlaceholder: string;
      availability: {
        title: string;
        description: string;
        loading: string;
        empty: string;
        timezone: string;
        selected: string;
        sessionsNote: string;
        viewModes: {
          month: string;
          week: string;
        };
        navigation: {
          previous: string;
          next: string;
        };
        weekLabel: string;
      };
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
