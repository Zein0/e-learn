import type { CourseType, DifficultyLabel } from "@prisma/client";

export type TranslatedField = {
  en: string;
  ar: string;
};

export type AdminCatalogCourse = {
  id: string;
  title: TranslatedField;
  description: TranslatedField;
  type: CourseType;
  category: string;
  difficulties: {
    id: string;
    label: DifficultyLabel;
    pricePerSession: number;
  }[];
  topics: {
    id: string;
    name: string;
    description: string | null;
    sessionsRequired: number;
    estimatedHours: number;
    order: number;
    difficultyId: string;
  }[];
};

export type AdminCatalogDictionary = {
  title: string;
  description: string;
  list: {
    searchPlaceholder: string;
    addAction: string;
    emptyTitle: string;
    emptyDescription: string;
    pageLabel: string;
    viewAction: string;
  };
  forms: {
    nameEnLabel: string;
    nameArLabel: string;
    descriptionEnLabel: string;
    descriptionArLabel: string;
    categoryLabel: string;
    typeLabel: string;
    typeOptions: Record<CourseType, string>;
    submit: string;
    cancel: string;
  };
  createCourse: {
    title: string;
    description: string;
  };
  updateCourse: {
    editAction: string;
    saveAction: string;
    cancelAction: string;
  };
  courseMeta: {
    type: string;
    category: string;
  };
  courseDetail: {
    backToList: string;
    overviewTitle: string;
    englishHeading: string;
    arabicHeading: string;
    descriptionHeading: string;
    metadataTitle: string;
    typeLabel: string;
    categoryLabel: string;
    summaryTitle: string;
    summaryDescription: string;
    difficultiesCountLabel: string;
    topicsCountLabel: string;
    manageDifficulties: string;
    editAction: string;
    saveAction: string;
    cancelAction: string;
  };
  difficulty: {
    title: string;
    description: string;
    existingTitle: string;
    priceLabel: string;
    addTitle: string;
    labelPlaceholder: string;
    pricePlaceholder: string;
    submit: string;
    labels: Record<DifficultyLabel, string>;
    backToCourse: string;
    manageTopics: string;
    empty: string;
    pageLabel: string;
  };
  topics: {
    title: string;
    empty: string;
    addButton: string;
    formTitle: string;
    editTitle: string;
    nameLabel: string;
    descriptionLabel: string;
    sessionsLabel: string;
    hoursLabel: string;
    orderLabel: string;
    submit: string;
    cancel: string;
    editAction: string;
    moveUp: string;
    moveDown: string;
    backToDifficulties: string;
    pageLabel: string;
  };
  feedback: {
    courseCreated: string;
    courseUpdated: string;
    difficultyCreated: string;
    difficultyUpdated: string;
    topicCreated: string;
    topicUpdated: string;
    reorderSuccess: string;
    errorGeneric: string;
  };
  table: {
    perSession: string;
  };
};

export type AdminLayoutDictionary = {
  greeting: string;
  role: string;
};

export type AdminDictionary = {
  nav: {
    overview: string;
    appointments: string;
    calendar: string;
    catalog: string;
    reports: string;
    cashBooking: string;
    users: string;
  };
  roles: Record<string, string>;
  layout: AdminLayoutDictionary;
  catalog: AdminCatalogDictionary;
  calendar: {
    title: string;
    description: string;
    weekView: string;
    monthView: string;
    previous: string;
    next: string;
    weekOf: string;
    monthOf: string;
    noSessions: string;
    sessionAt: string;
  };
  reports: {
    title: string;
    description: string;
    revenueCard: string;
    revenueDescription: string;
    bookedCard: string;
    bookedDescription: string;
    doneCard: string;
    doneDescription: string;
    canceledCard: string;
    canceledDescription: string;
    discountsCard: string;
    discountsDescription: string;
    utilizationCard: string;
    utilizationDescription: string;
    utilizationDetail: string;
  };
  overview: {
    title: string;
    description: string;
    stats: {
      courses: { title: string; description: string };
      bookings: { title: string; description: string };
      learners: { title: string; description: string };
      revenue: { title: string; description: string };
    };
    quickActionsTitle: string;
    quickActionsDescription: string;
    quickActions: {
      cashBooking: string;
      manageAppointments: string;
    };
  };
};
