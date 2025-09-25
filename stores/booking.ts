import { create } from "zustand";

type PlacementChoice = "KNOWN_LEVEL" | "PLACEMENT_TEST" | "DISCOVERY_CALL";

type BookingState = {
  courseId?: string;
  difficultyId?: string;
  selectedTopicIds: string[];
  knowsLevel?: boolean;
  placementChoice: PlacementChoice;
  levelProvided?: string;
  slotStartAt?: string;
  pricingPreview?: {
    sessionsTotal: number;
    subtotal: number;
    discountAmount: number;
    finalAmount: number;
  };
  notes?: string;
};

type BookingActions = {
  setField: <K extends keyof BookingState>(field: K, value: BookingState[K]) => void;
  toggleTopic: (topicId: string) => void;
  reset: () => void;
};

const initialState: BookingState = {
  selectedTopicIds: [],
  knowsLevel: undefined,
  placementChoice: "PLACEMENT_TEST",
};

export const useBookingStore = create<BookingState & BookingActions>((set, get) => ({
  ...initialState,
  setField: (field, value) => set({ [field]: value } as Partial<BookingState>),
  toggleTopic: (topicId) => {
    const current = get().selectedTopicIds;
    const exists = current.includes(topicId);
    set({
      selectedTopicIds: exists ? current.filter((id) => id !== topicId) : [...current, topicId],
    });
  },
  reset: () => set(initialState),
}));
