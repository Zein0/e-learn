"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCatalogCourse, AdminCatalogDictionary, TranslatedField } from "@/lib/types/admin";

const COURSES_PER_PAGE = 6;
const TOPICS_PER_PAGE = 6;

type View = "list" | "course" | "difficulty" | "topics";

type CourseFormState = {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  type: AdminCatalogCourse["type"];
};

type DifficultyDraft = {
  label: AdminCatalogCourse["difficulties"][number]["label"] | "";
  price: string;
};

type TopicFormState = {
  name: string;
  description: string;
  sessionsRequired: string;
  estimatedHours: string;
  order: string;
};

const DEFAULT_COURSE_FORM: CourseFormState = {
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  category: "",
  type: "PRIVATE",
};

const DEFAULT_TOPIC_STATE: TopicFormState = {
  name: "",
  description: "",
  sessionsRequired: "",
  estimatedHours: "",
  order: "",
};

const DEFAULT_DIFFICULTY_DRAFT: DifficultyDraft = {
  label: "",
  price: "",
};

function formatCurrency(locale: string, value: number) {
  return value.toLocaleString(locale, { style: "currency", currency: "USD" });
}

function formatTemplate(template: string, replacements: Record<string, string | number>) {
  return template.replace(/{{(\w+)}}/g, (_, key) => {
    const replacement = replacements[key];
    return replacement === undefined ? "" : String(replacement);
  });
}

function getLocalized(field: TranslatedField, locale: string) {
  if (locale in field) {
    return field[locale as keyof TranslatedField];
  }
  return field.en;
}

function sortTopics(topics: AdminCatalogCourse["topics"]) {
  return [...topics].sort((a, b) => a.order - b.order);
}

function normalizeCourse(course: AdminCatalogCourse): AdminCatalogCourse {
  return {
    ...course,
    difficulties: [...course.difficulties].sort((a, b) => a.label.localeCompare(b.label)),
    topics: sortTopics(course.topics),
  };
}

function sortCourses(courses: AdminCatalogCourse[]) {
  return [...courses].sort((a, b) => a.title.en.localeCompare(b.title.en));
}


type CatalogManagerProps = {
  initialCourses: AdminCatalogCourse[];
  dictionary: AdminCatalogDictionary;
  locale: string;
};

export function CatalogManager({ initialCourses, dictionary, locale }: CatalogManagerProps) {
  const [courses, setCourses] = useState(() => sortCourses(initialCourses.map((course) => normalizeCourse(course))));
  const [view, setView] = useState<View>("list");
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeDifficultyId, setActiveDifficultyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const [topicPage, setTopicPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState<CourseFormState>(DEFAULT_COURSE_FORM);
  const [courseEditForm, setCourseEditForm] = useState<Record<string, CourseFormState>>({});
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null);
  const [difficultyDrafts, setDifficultyDrafts] = useState<Record<string, DifficultyDraft>>({});
  const [creatingDifficultyFor, setCreatingDifficultyFor] = useState<string | null>(null);
  const [updatingDifficultyId, setUpdatingDifficultyId] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>(() => {
    const entries: Record<string, string> = {};
    initialCourses.forEach((course) => {
      course.difficulties.forEach((difficulty) => {
        entries[difficulty.id] = String(difficulty.pricePerSession);
      });
    });
    return entries;
  });
  const [topicForm, setTopicForm] = useState<TopicFormState>(DEFAULT_TOPIC_STATE);
  const [isTopicFormOpen, setIsTopicFormOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);
  const [topicEdits, setTopicEdits] = useState<Record<string, TopicFormState>>({});
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const filteredCourses = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return courses;
    }
    return courses.filter((course) => course.title.en.toLowerCase().includes(normalized));
  }, [courses, searchTerm]);

  const totalCoursePages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const paginatedCourses = useMemo(() => {
    const start = (coursePage - 1) * COURSES_PER_PAGE;
    return filteredCourses.slice(start, start + COURSES_PER_PAGE);
  }, [filteredCourses, coursePage]);

  useEffect(() => {
    if (coursePage > totalCoursePages) {
      setCoursePage(totalCoursePages);
    }
  }, [coursePage, totalCoursePages]);

  const activeCourse = activeCourseId ? courses.find((course) => course.id === activeCourseId) ?? null : null;
  const activeDifficulty = activeCourse && activeDifficultyId ? activeCourse.difficulties.find((difficulty) => difficulty.id === activeDifficultyId) ?? null : null;
  const topicsForDifficulty = activeCourse && activeDifficulty ? sortTopics(activeCourse.topics.filter((topic) => topic.difficultyId === activeDifficulty.id)) : [];
  const totalTopicPages = Math.max(1, Math.ceil(topicsForDifficulty.length / TOPICS_PER_PAGE));
  const paginatedTopics = useMemo(() => {
    const start = (topicPage - 1) * TOPICS_PER_PAGE;
    return topicsForDifficulty.slice(start, start + TOPICS_PER_PAGE);
  }, [topicsForDifficulty, topicPage]);

  useEffect(() => {
    if (topicPage > totalTopicPages) {
      setTopicPage(totalTopicPages);
    }
  }, [topicPage, totalTopicPages]);

  useEffect(() => {
    setTopicPage(1);
    setIsTopicFormOpen(false);
    setEditingTopicId(null);
    setTopicForm(DEFAULT_TOPIC_STATE);
  }, [activeDifficultyId]);

  const resetCourseForm = () => {
    setCourseForm(DEFAULT_COURSE_FORM);
  };

  const updateCourseState = (courseId: string, updater: (course: AdminCatalogCourse) => AdminCatalogCourse) => {
    setCourses((previous) =>
      sortCourses(
        previous.map((course) => (course.id === courseId ? normalizeCourse(updater(course)) : course)),
      ),
    );
  };

  const handleCreateCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !courseForm.titleEn.trim() ||
      !courseForm.titleAr.trim() ||
      !courseForm.descriptionEn.trim() ||
      !courseForm.descriptionAr.trim() ||
      !courseForm.category.trim()
    ) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    setIsCreatingCourse(true);
    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleEn: courseForm.titleEn.trim(),
          titleAr: courseForm.titleAr.trim(),
          descriptionEn: courseForm.descriptionEn.trim(),
          descriptionAr: courseForm.descriptionAr.trim(),
          category: courseForm.category.trim(),
          type: courseForm.type,
        }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const data = (await response.json()) as {
        course: {
          id: string;
          titleEn: string;
          titleAr: string;
          descriptionEn: string;
          descriptionAr: string;
          type: AdminCatalogCourse["type"];
          category: string;
        };
      };
      const newCourse: AdminCatalogCourse = normalizeCourse({
        id: data.course.id,
        title: { en: data.course.titleEn, ar: data.course.titleAr },
        description: { en: data.course.descriptionEn, ar: data.course.descriptionAr },
        type: data.course.type,
        category: data.course.category,
        difficulties: [],
        topics: [],
      });
      setCourses((previous) => sortCourses([...previous, newCourse]));
      resetCourseForm();
      setIsCreateOpen(false);
      toast.success(dictionary.feedback.courseCreated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  const startEditingCourse = (course: AdminCatalogCourse) => {
    setEditingCourseId(course.id);
    setCourseEditForm((previous) => ({
      ...previous,
      [course.id]: {
        titleEn: course.title.en,
        titleAr: course.title.ar,
        descriptionEn: course.description.en,
        descriptionAr: course.description.ar,
        category: course.category,
        type: course.type,
      },
    }));
  };

  const handleUpdateCourse = async (courseId: string) => {
    const form = courseEditForm[courseId];
    if (!form) return;
    if (
      !form.titleEn.trim() ||
      !form.titleAr.trim() ||
      !form.descriptionEn.trim() ||
      !form.descriptionAr.trim() ||
      !form.category.trim()
    ) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    setUpdatingCourseId(courseId);
    try {
      const response = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: courseId,
          titleEn: form.titleEn.trim(),
          titleAr: form.titleAr.trim(),
          descriptionEn: form.descriptionEn.trim(),
          descriptionAr: form.descriptionAr.trim(),
          category: form.category.trim(),
          type: form.type,
        }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const data = (await response.json()) as {
        course: {
          id: string;
          titleEn: string;
          titleAr: string;
          descriptionEn: string;
          descriptionAr: string;
          type: AdminCatalogCourse["type"];
          category: string;
        };
      };
      updateCourseState(courseId, (course) => ({
        ...course,
        title: { en: data.course.titleEn, ar: data.course.titleAr },
        description: { en: data.course.descriptionEn, ar: data.course.descriptionAr },
        category: data.course.category,
        type: data.course.type,
      }));
      setEditingCourseId(null);
      toast.success(dictionary.feedback.courseUpdated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const handleCreateDifficulty = async (courseId: string) => {
    const draft = difficultyDrafts[courseId] ?? DEFAULT_DIFFICULTY_DRAFT;
    if (!draft.label || !draft.price.trim()) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    const priceValue = Number(draft.price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    setCreatingDifficultyFor(courseId);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/difficulties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label,
          pricePerSession: priceValue,
        }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const data = (await response.json()) as {
        difficulty: {
          id: string;
          label: AdminCatalogCourse["difficulties"][number]["label"];
          pricePerSession: number | string;
        };
      };
      const difficulty = {
        id: data.difficulty.id,
        label: data.difficulty.label,
        pricePerSession: Number(data.difficulty.pricePerSession),
      };
      updateCourseState(courseId, (course) => ({
        ...course,
        difficulties: [...course.difficulties, difficulty],
      }));
      setPriceDrafts((previous) => ({ ...previous, [difficulty.id]: String(difficulty.pricePerSession) }));
      setDifficultyDrafts((previous) => ({ ...previous, [courseId]: DEFAULT_DIFFICULTY_DRAFT }));
      toast.success(dictionary.feedback.difficultyCreated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    } finally {
      setCreatingDifficultyFor(null);
    }
  };

  const handleUpdateDifficulty = async (courseId: string, difficultyId: string) => {
    const draft = priceDrafts[difficultyId];
    if (!draft) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    const priceValue = Number(draft);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    setUpdatingDifficultyId(difficultyId);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/difficulties`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficultyId,
          pricePerSession: priceValue,
        }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const data = (await response.json()) as {
        difficulty: {
          id: string;
          label: AdminCatalogCourse["difficulties"][number]["label"];
          pricePerSession: number | string;
        };
      };
      const difficulty = {
        id: data.difficulty.id,
        label: data.difficulty.label,
        pricePerSession: Number(data.difficulty.pricePerSession),
      };
      updateCourseState(courseId, (course) => ({
        ...course,
        difficulties: course.difficulties.map((item) => (item.id === difficultyId ? difficulty : item)),
      }));
      toast.success(dictionary.feedback.difficultyUpdated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    } finally {
      setUpdatingDifficultyId(null);
    }
  };

  const handleCreateTopic = async (courseId: string) => {
    if (!activeDifficultyId) {
      return;
    }
    if (!topicForm.name.trim() || !topicForm.sessionsRequired.trim()) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    const sessions = Number(topicForm.sessionsRequired);
    const hours = topicForm.estimatedHours ? Number(topicForm.estimatedHours) : undefined;
    const order = topicForm.order ? Number(topicForm.order) : undefined;

    if (!Number.isFinite(sessions) || sessions <= 0) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }
    if (hours !== undefined && (!Number.isFinite(hours) || hours <= 0)) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }
    if (order !== undefined && (!Number.isFinite(order) || order <= 0)) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    setIsCreatingTopic(true);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficultyId: activeDifficultyId,
          name: topicForm.name.trim(),
          description: topicForm.description.trim() || undefined,
          sessionsRequired: sessions,
          estimatedHours: hours,
          order,
        }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const data = (await response.json()) as {
        topic: {
          id: string;
          name: string;
          description: string | null;
          sessionsRequired: number | string;
          estimatedHours: number | string;
          order: number | string;
          difficultyId: string;
        };
      };
      const topic = {
        id: data.topic.id,
        name: data.topic.name,
        description: data.topic.description,
        sessionsRequired: Number(data.topic.sessionsRequired),
        estimatedHours: Number(data.topic.estimatedHours),
        order: Number(data.topic.order),
        difficultyId: data.topic.difficultyId,
      };
      updateCourseState(courseId, (course) => ({
        ...course,
        topics: [...course.topics, topic],
      }));
      setIsTopicFormOpen(false);
      setTopicForm(DEFAULT_TOPIC_STATE);
      toast.success(dictionary.feedback.topicCreated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const startEditingTopic = (topicId: string) => {
    const course = activeCourse;
    if (!course) return;
    const topic = course.topics.find((item) => item.id === topicId);
    if (!topic) return;
    setEditingTopicId(topic.id);
    setTopicEdits((previous) => ({
      ...previous,
      [topic.id]: {
        name: topic.name,
        description: topic.description ?? "",
        sessionsRequired: String(topic.sessionsRequired),
        estimatedHours: String(topic.estimatedHours),
        order: String(topic.order),
      },
    }));
  };

  const handleUpdateTopic = async (courseId: string, topicId: string) => {
    const form = topicEdits[topicId];
    if (!form) return;
    if (!form.name.trim() || !form.sessionsRequired.trim()) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    const sessions = Number(form.sessionsRequired);
    const hours = form.estimatedHours ? Number(form.estimatedHours) : undefined;
    const order = form.order ? Number(form.order) : undefined;

    if (!Number.isFinite(sessions) || sessions <= 0) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }
    if (hours !== undefined && (!Number.isFinite(hours) || hours <= 0)) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }
    if (order !== undefined && (!Number.isFinite(order) || order <= 0)) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    setUpdatingTopicId(topicId);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/topics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          sessionsRequired: sessions,
          estimatedHours: hours,
          order,
        }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const data = (await response.json()) as {
        topic: {
          id: string;
          name: string;
          description: string | null;
          sessionsRequired: number | string;
          estimatedHours: number | string;
          order: number | string;
          difficultyId: string;
        };
      };
      const topic = {
        id: data.topic.id,
        name: data.topic.name,
        description: data.topic.description,
        sessionsRequired: Number(data.topic.sessionsRequired),
        estimatedHours: Number(data.topic.estimatedHours),
        order: Number(data.topic.order),
        difficultyId: data.topic.difficultyId,
      };
      updateCourseState(courseId, (course) => ({
        ...course,
        topics: course.topics.map((item) => (item.id === topicId ? topic : item)),
      }));
      setEditingTopicId(null);
      toast.success(dictionary.feedback.topicUpdated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const handleReorderTopic = async (courseId: string, topicId: string, direction: "up" | "down") => {
    const course = activeCourse;
    const difficultyId = activeDifficultyId;
    if (!course || !difficultyId) return;

    const sortedTopics = sortTopics(course.topics.filter((topic) => topic.difficultyId === difficultyId));
    const index = sortedTopics.findIndex((topic) => topic.id === topicId);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedTopics.length) {
      return;
    }

    const current = sortedTopics[index];
    const swapWith = sortedTopics[targetIndex];

    try {
      const responses = await Promise.all([
        fetch(`/api/admin/courses/${courseId}/topics`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: current.id, order: swapWith.order }),
        }),
        fetch(`/api/admin/courses/${courseId}/topics`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: swapWith.id, order: current.order }),
        }),
      ]);
      if (responses.some((response) => !response.ok)) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      updateCourseState(courseId, (item) => ({
        ...item,
        topics: item.topics.map((topic) => {
          if (topic.id === current.id) {
            return { ...topic, order: swapWith.order };
          }
          if (topic.id === swapWith.id) {
            return { ...topic, order: current.order };
          }
          return topic;
        }),
      }));
      toast.success(dictionary.feedback.reorderSuccess);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    }
  };

  const handleViewCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setView("course");
    setIsCreateOpen(false);
    setEditingCourseId(null);
  };

  const handleBackToList = () => {
    setView("list");
    setActiveCourseId(null);
    setActiveDifficultyId(null);
    setEditingCourseId(null);
    setIsTopicFormOpen(false);
    setEditingTopicId(null);
    setTopicPage(1);
  };

  const handleBackToCourse = () => {
    setView("course");
    setActiveDifficultyId(null);
    setIsTopicFormOpen(false);
    setEditingTopicId(null);
    setTopicPage(1);
  };

  const handleBackToDifficulties = () => {
    setView("difficulty");
    setIsTopicFormOpen(false);
    setEditingTopicId(null);
    setTopicPage(1);
  };

  const renderCourseList = () => {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="font-display text-2xl text-brand-800">{dictionary.title}</h2>
              <p className="text-sm text-brand-600">{dictionary.description}</p>
            </div>
            <Button type="button" onClick={() => setIsCreateOpen((value) => !value)}>
              {dictionary.list.addAction}
            </Button>
          </div>

          {isCreateOpen && (
            <form className="mt-6 space-y-6" onSubmit={handleCreateCourse}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="titleEn">{dictionary.forms.nameEnLabel}</Label>
                  <Input
                    id="titleEn"
                    value={courseForm.titleEn}
                    onChange={(event) => setCourseForm((previous) => ({ ...previous, titleEn: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="titleAr">{dictionary.forms.nameArLabel}</Label>
                  <Input
                    id="titleAr"
                    value={courseForm.titleAr}
                    onChange={(event) => setCourseForm((previous) => ({ ...previous, titleAr: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="descriptionEn">{dictionary.forms.descriptionEnLabel}</Label>
                  <Textarea
                    id="descriptionEn"
                    value={courseForm.descriptionEn}
                    onChange={(event) =>
                      setCourseForm((previous) => ({ ...previous, descriptionEn: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="descriptionAr">{dictionary.forms.descriptionArLabel}</Label>
                  <Textarea
                    id="descriptionAr"
                    value={courseForm.descriptionAr}
                    onChange={(event) =>
                      setCourseForm((previous) => ({ ...previous, descriptionAr: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">{dictionary.forms.categoryLabel}</Label>
                  <Input
                    id="category"
                    value={courseForm.category}
                    onChange={(event) => setCourseForm((previous) => ({ ...previous, category: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{dictionary.forms.typeLabel}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dictionary.forms.typeOptions).map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        variant={courseForm.type === value ? "default" : "outline"}
                        onClick={() => setCourseForm((previous) => ({ ...previous, type: value as AdminCatalogCourse["type"] }))}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isCreatingCourse}>
                  {dictionary.forms.submit}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetCourseForm();
                  }}
                >
                  {dictionary.forms.cancel}
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder={dictionary.list.searchPlaceholder}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCoursePage(1);
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end">
              <span className="text-sm text-brand-500">
                {formatTemplate(dictionary.list.pageLabel, { current: coursePage, total: totalCoursePages })}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCoursePage((page) => Math.max(1, page - 1))}
                  disabled={coursePage === 1}
                >
                  <span aria-hidden>‹</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCoursePage((page) => Math.min(totalCoursePages, page + 1))}
                  disabled={coursePage === totalCoursePages}
                >
                  <span aria-hidden>›</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {paginatedCourses.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-brand-200 bg-white/70 text-center">
            <CardHeader>
              <CardTitle>{dictionary.list.emptyTitle}</CardTitle>
              <CardDescription>{dictionary.list.emptyDescription}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginatedCourses.map((course) => {
              const localizedTitle = getLocalized(course.title, locale);
              const localizedDescription = getLocalized(course.description, locale);
              return (
                <Card key={course.id} className="flex h-full flex-col justify-between rounded-3xl border-brand-100 bg-white/90">
                  <CardHeader className="space-y-3">
                    <div>
                      <CardTitle className="text-xl text-brand-800">{localizedTitle}</CardTitle>
                      <CardDescription>{localizedDescription}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-brand-500">
                      <span className="rounded-full bg-brand-100 px-3 py-1">
                        {dictionary.courseMeta.type}: {dictionary.forms.typeOptions[course.type]}
                      </span>
                      <span className="rounded-full bg-brand-100 px-3 py-1">
                        {dictionary.courseMeta.category}: {course.category}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-brand-500">
                      <span>
                        {formatTemplate(dictionary.courseDetail.difficultiesCountLabel, {
                          count: course.difficulties.length,
                        })}
                      </span>
                      <span>
                        {formatTemplate(dictionary.courseDetail.topicsCountLabel, {
                          count: course.topics.length,
                        })}
                      </span>
                    </div>
                    <Button type="button" className="w-full" onClick={() => handleViewCourse(course.id)}>
                      {dictionary.list.viewAction}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  const renderCourseDetail = () => {
    if (!activeCourse) {
      return null;
    }

    const editForm = courseEditForm[activeCourse.id];
    const difficultySummary = activeCourse.difficulties.map((difficulty) => ({
      ...difficulty,
      topicsCount: activeCourse.topics.filter((topic) => topic.difficultyId === difficulty.id).length,
    }));

    return (
      <section className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleBackToList}>
            {dictionary.courseDetail.backToList}
          </Button>
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h2 className="font-display text-3xl text-brand-800">{getLocalized(activeCourse.title, locale)}</h2>
              <p className="text-sm text-brand-600">{dictionary.courseDetail.overviewTitle}</p>
            </div>
            {editingCourseId === activeCourse.id ? (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingCourseId(null)}>
                  {dictionary.courseDetail.cancelAction}
                </Button>
                <Button type="button" onClick={() => handleUpdateCourse(activeCourse.id)} disabled={updatingCourseId === activeCourse.id}>
                  {dictionary.courseDetail.saveAction}
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" onClick={() => startEditingCourse(activeCourse)}>
                {dictionary.courseDetail.editAction}
              </Button>
            )}
          </div>

          {editingCourseId === activeCourse.id && editForm ? (
            <form
              className="mt-6 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                handleUpdateCourse(activeCourse.id);
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="editTitleEn">{dictionary.forms.nameEnLabel}</Label>
                  <Input
                    id="editTitleEn"
                    value={editForm.titleEn}
                    onChange={(event) =>
                      setCourseEditForm((previous) => ({
                        ...previous,
                        [activeCourse.id]: { ...previous[activeCourse.id], titleEn: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editTitleAr">{dictionary.forms.nameArLabel}</Label>
                  <Input
                    id="editTitleAr"
                    value={editForm.titleAr}
                    onChange={(event) =>
                      setCourseEditForm((previous) => ({
                        ...previous,
                        [activeCourse.id]: { ...previous[activeCourse.id], titleAr: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="editDescriptionEn">{dictionary.forms.descriptionEnLabel}</Label>
                  <Textarea
                    id="editDescriptionEn"
                    value={editForm.descriptionEn}
                    onChange={(event) =>
                      setCourseEditForm((previous) => ({
                        ...previous,
                        [activeCourse.id]: { ...previous[activeCourse.id], descriptionEn: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="editDescriptionAr">{dictionary.forms.descriptionArLabel}</Label>
                  <Textarea
                    id="editDescriptionAr"
                    value={editForm.descriptionAr}
                    onChange={(event) =>
                      setCourseEditForm((previous) => ({
                        ...previous,
                        [activeCourse.id]: { ...previous[activeCourse.id], descriptionAr: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editCategory">{dictionary.forms.categoryLabel}</Label>
                  <Input
                    id="editCategory"
                    value={editForm.category}
                    onChange={(event) =>
                      setCourseEditForm((previous) => ({
                        ...previous,
                        [activeCourse.id]: { ...previous[activeCourse.id], category: event.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{dictionary.forms.typeLabel}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dictionary.forms.typeOptions).map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        variant={editForm.type === value ? "default" : "outline"}
                        onClick={() =>
                          setCourseEditForm((previous) => ({
                            ...previous,
                            [activeCourse.id]: { ...previous[activeCourse.id], type: value as AdminCatalogCourse["type"] },
                          }))
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-brand-50/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
                    {dictionary.courseDetail.englishHeading}
                  </p>
                  <p className="mt-2 text-brand-800">{activeCourse.title.en}</p>
                  <p className="mt-2 text-sm text-brand-600">{activeCourse.description.en}</p>
                </div>
                <div className="rounded-2xl bg-brand-50/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
                    {dictionary.courseDetail.arabicHeading}
                  </p>
                  <p className="mt-2 text-brand-800">{activeCourse.title.ar}</p>
                  <p className="mt-2 text-sm text-brand-600">{activeCourse.description.ar}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-brand-100 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
                    {dictionary.courseDetail.metadataTitle}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-brand-600">
                    <p>
                      {dictionary.courseDetail.typeLabel}: {dictionary.forms.typeOptions[activeCourse.type]}
                    </p>
                    <p>
                      {dictionary.courseDetail.categoryLabel}: {activeCourse.category}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-brand-100 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
                    {dictionary.courseDetail.summaryTitle}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-brand-600">
                    <p>
                      {formatTemplate(dictionary.courseDetail.difficultiesCountLabel, {
                        count: activeCourse.difficulties.length,
                      })}
                    </p>
                    <p>
                      {formatTemplate(dictionary.courseDetail.topicsCountLabel, {
                        count: activeCourse.topics.length,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-display text-xl text-brand-800">{dictionary.courseDetail.summaryTitle}</h3>
              <p className="text-sm text-brand-600">{dictionary.courseDetail.summaryDescription}</p>
            </div>
            <Button type="button" onClick={() => setView("difficulty")}>
              {dictionary.courseDetail.manageDifficulties}
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {difficultySummary.length === 0 ? (
              <p className="text-sm text-brand-500">{dictionary.difficulty.empty}</p>
            ) : (
              difficultySummary.map((difficulty) => (
                <div
                  key={difficulty.id}
                  className="flex flex-col gap-3 rounded-2xl border border-brand-100 bg-white/90 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-brand-700">
                      {dictionary.difficulty.labels[difficulty.label] ?? difficulty.label}
                    </p>
                    <p className="text-sm text-brand-500">
                      {formatCurrency(locale, difficulty.pricePerSession)} · {dictionary.table.perSession}
                    </p>
                  </div>
                  <div className="text-sm text-brand-500">
                    {formatTemplate(dictionary.courseDetail.topicsCountLabel, {
                      count: difficulty.topicsCount,
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderDifficultyView = () => {
    if (!activeCourse) {
      return null;
    }
    const draft = difficultyDrafts[activeCourse.id] ?? DEFAULT_DIFFICULTY_DRAFT;

    return (
      <section className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleBackToCourse}>
            {dictionary.difficulty.backToCourse}
          </Button>
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
          <div className="space-y-3">
            <h2 className="font-display text-2xl text-brand-800">{dictionary.difficulty.title}</h2>
            <p className="text-sm text-brand-600">{dictionary.difficulty.description}</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <h3 className="font-semibold text-brand-700">{dictionary.difficulty.existingTitle}</h3>
              {activeCourse.difficulties.length === 0 ? (
                <p className="text-sm text-brand-500">{dictionary.difficulty.empty}</p>
              ) : (
                activeCourse.difficulties.map((difficulty) => (
                  <div
                    key={difficulty.id}
                    className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white/90 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-brand-700">
                        {dictionary.difficulty.labels[difficulty.label] ?? difficulty.label}
                      </p>
                      <p className="text-sm text-brand-500">
                        {formatCurrency(locale, difficulty.pricePerSession)} · {dictionary.table.perSession}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="grid gap-2">
                        <Label className="text-xs text-brand-500">{dictionary.difficulty.priceLabel}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={priceDrafts[difficulty.id] ?? ""}
                          onChange={(event) =>
                            setPriceDrafts((previous) => ({
                              ...previous,
                              [difficulty.id]: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleUpdateDifficulty(activeCourse.id, difficulty.id)}
                          disabled={updatingDifficultyId === difficulty.id}
                        >
                          {dictionary.updateCourse.saveAction}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setActiveDifficultyId(difficulty.id);
                            setView("topics");
                          }}
                        >
                          {dictionary.difficulty.manageTopics}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-4 rounded-2xl border border-dashed border-brand-200 bg-white/70 p-4">
              <h3 className="font-semibold text-brand-700">{dictionary.difficulty.addTitle}</h3>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label>{dictionary.difficulty.labelPlaceholder}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dictionary.difficulty.labels).map(([value, label]) => (
                      <Button
                        key={value}
                        type="button"
                        variant={draft.label === value ? "default" : "outline"}
                        onClick={() =>
                          setDifficultyDrafts((previous) => ({
                            ...previous,
                            [activeCourse.id]: { ...(previous[activeCourse.id] ?? DEFAULT_DIFFICULTY_DRAFT), label: value as DifficultyDraft["label"] },
                          }))
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="difficultyPrice">{dictionary.difficulty.priceLabel}</Label>
                  <Input
                    id="difficultyPrice"
                    type="number"
                    min="0"
                    value={draft.price}
                    onChange={(event) =>
                      setDifficultyDrafts((previous) => ({
                        ...previous,
                        [activeCourse.id]: { ...(previous[activeCourse.id] ?? DEFAULT_DIFFICULTY_DRAFT), price: event.target.value },
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => handleCreateDifficulty(activeCourse.id)}
                  disabled={creatingDifficultyFor === activeCourse.id}
                >
                  {dictionary.difficulty.submit}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderTopicsView = () => {
    if (!activeCourse || !activeDifficulty) {
      return null;
    }
    const topicFormState = editingTopicId ? topicEdits[editingTopicId] : undefined;

    return (
      <section className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={handleBackToDifficulties}>
            {dictionary.topics.backToDifficulties}
          </Button>
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-soft ring-1 ring-brand-100">
          <div className="space-y-3">
            <h2 className="font-display text-2xl text-brand-800">{dictionary.topics.title}</h2>
            <p className="text-sm text-brand-600">
              {dictionary.difficulty.labels[activeDifficulty.label] ?? activeDifficulty.label} · {formatCurrency(locale, activeDifficulty.pricePerSession)}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Button type="button" onClick={() => {
              setIsTopicFormOpen(true);
              setTopicForm(DEFAULT_TOPIC_STATE);
            }}>
              {dictionary.topics.addButton}
            </Button>
            <div className="flex items-center gap-2 text-sm text-brand-500">
              {formatTemplate(dictionary.topics.pageLabel, { current: topicPage, total: totalTopicPages })}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTopicPage((page) => Math.max(1, page - 1))}
                  disabled={topicPage === 1}
                >
                  <span aria-hidden>‹</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTopicPage((page) => Math.min(totalTopicPages, page + 1))}
                  disabled={topicPage === totalTopicPages}
                >
                  <span aria-hidden>›</span>
                </Button>
              </div>
            </div>
          </div>

          {isTopicFormOpen && (
            <form
              className="mt-6 space-y-4 rounded-2xl border border-dashed border-brand-200 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleCreateTopic(activeCourse.id);
              }}
            >
              <h3 className="font-semibold text-brand-700">{dictionary.topics.formTitle}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="topicName">{dictionary.topics.nameLabel}</Label>
                  <Input
                    id="topicName"
                    value={topicForm.name}
                    onChange={(event) => setTopicForm((previous) => ({ ...previous, name: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="topicDescription">{dictionary.topics.descriptionLabel}</Label>
                  <Textarea
                    id="topicDescription"
                    value={topicForm.description}
                    onChange={(event) => setTopicForm((previous) => ({ ...previous, description: event.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topicSessions">{dictionary.topics.sessionsLabel}</Label>
                  <Input
                    id="topicSessions"
                    type="number"
                    min="1"
                    value={topicForm.sessionsRequired}
                    onChange={(event) =>
                      setTopicForm((previous) => ({ ...previous, sessionsRequired: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topicHours">{dictionary.topics.hoursLabel}</Label>
                  <Input
                    id="topicHours"
                    type="number"
                    min="1"
                    value={topicForm.estimatedHours}
                    onChange={(event) =>
                      setTopicForm((previous) => ({ ...previous, estimatedHours: event.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topicOrder">{dictionary.topics.orderLabel}</Label>
                  <Input
                    id="topicOrder"
                    type="number"
                    min="1"
                    value={topicForm.order}
                    onChange={(event) => setTopicForm((previous) => ({ ...previous, order: event.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isCreatingTopic}>
                  {dictionary.topics.submit}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsTopicFormOpen(false);
                    setTopicForm(DEFAULT_TOPIC_STATE);
                  }}
                >
                  {dictionary.topics.cancel}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 space-y-4">
            {paginatedTopics.length === 0 ? (
              <p className="text-sm text-brand-500">{dictionary.topics.empty}</p>
            ) : (
              paginatedTopics.map((topic) => {
                const isEditing = editingTopicId === topic.id;
                const state = isEditing ? topicFormState ?? topicEdits[topic.id] : null;
                return (
                  <div key={topic.id} className="space-y-3 rounded-2xl border border-brand-100 bg-white/90 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-brand-800">{topic.name}</p>
                        <p className="text-sm text-brand-600">{topic.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-brand-500">
                        <span>
                          {dictionary.topics.sessionsLabel}: {topic.sessionsRequired}
                        </span>
                        <span>
                          {dictionary.topics.hoursLabel}: {topic.estimatedHours}
                        </span>
                        <span>
                          {dictionary.topics.orderLabel}: {topic.order}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleReorderTopic(activeCourse.id, topic.id, "up")}
                        disabled={topic.order === 1}
                      >
                        {dictionary.topics.moveUp}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleReorderTopic(activeCourse.id, topic.id, "down")}
                      >
                        {dictionary.topics.moveDown}
                      </Button>
                      <Button type="button" onClick={() => startEditingTopic(topic.id)}>
                        {dictionary.topics.editAction}
                      </Button>
                    </div>
                    {isEditing && state && (
                      <form
                        className="space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleUpdateTopic(activeCourse.id, topic.id);
                        }}
                      >
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="grid gap-2 md:col-span-2">
                            <Label>{dictionary.topics.nameLabel}</Label>
                            <Input
                              value={state.name}
                              onChange={(event) =>
                                setTopicEdits((previous) => ({
                                  ...previous,
                                  [topic.id]: { ...previous[topic.id], name: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2 md:col-span-2">
                            <Label>{dictionary.topics.descriptionLabel}</Label>
                            <Textarea
                              value={state.description}
                              onChange={(event) =>
                                setTopicEdits((previous) => ({
                                  ...previous,
                                  [topic.id]: { ...previous[topic.id], description: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{dictionary.topics.sessionsLabel}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={state.sessionsRequired}
                              onChange={(event) =>
                                setTopicEdits((previous) => ({
                                  ...previous,
                                  [topic.id]: { ...previous[topic.id], sessionsRequired: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{dictionary.topics.hoursLabel}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={state.estimatedHours}
                              onChange={(event) =>
                                setTopicEdits((previous) => ({
                                  ...previous,
                                  [topic.id]: { ...previous[topic.id], estimatedHours: event.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>{dictionary.topics.orderLabel}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={state.order}
                              onChange={(event) =>
                                setTopicEdits((previous) => ({
                                  ...previous,
                                  [topic.id]: { ...previous[topic.id], order: event.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button type="submit" disabled={updatingTopicId === topic.id}>
                            {dictionary.topics.submit}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setEditingTopicId(null)}>
                            {dictionary.topics.cancel}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    );
  };

  if (view === "course") {
    return renderCourseDetail();
  }

  if (view === "difficulty") {
    return renderDifficultyView();
  }

  if (view === "topics") {
    return renderTopicsView();
  }

  return renderCourseList();
}
