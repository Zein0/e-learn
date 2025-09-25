"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCatalogCourse, AdminCatalogDictionary } from "@/lib/types/admin";

type CatalogManagerProps = {
  initialCourses: AdminCatalogCourse[];
  dictionary: AdminCatalogDictionary;
  locale: string;
};

type CourseFormState = {
  title: string;
  description: string;
  category: string;
  type: AdminCatalogCourse["type"];
};

type TopicFormState = {
  name: string;
  description: string;
  sessionsRequired: string;
  estimatedHours: string;
  order: string;
  difficultyId: string;
};

function formatCurrency(locale: string, value: number) {
  return value.toLocaleString(locale, { style: "currency", currency: "USD" });
}

const DEFAULT_TOPIC_STATE: TopicFormState = {
  name: "",
  description: "",
  sessionsRequired: "",
  estimatedHours: "",
  order: "",
  difficultyId: "",
};

export function CatalogManager({ initialCourses, dictionary, locale }: CatalogManagerProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormState>({
    title: "",
    description: "",
    category: "",
    type: "PRIVATE",
  });
  const [courseEditForm, setCourseEditForm] = useState<Record<string, CourseFormState>>({});
  const [difficultyForm, setDifficultyForm] = useState<Record<string, { label: string; price: string }>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>(() => {
    const entries: Record<string, string> = {};
    initialCourses.forEach((course) => {
      course.difficulties.forEach((difficulty) => {
        entries[difficulty.id] = difficulty.pricePerSession.toString();
      });
    });
    return entries;
  });
  const [topicForm, setTopicForm] = useState<TopicFormState>(DEFAULT_TOPIC_STATE);
  const [activeTopicCourse, setActiveTopicCourse] = useState<string | null>(null);
  const [activeTopicDifficulty, setActiveTopicDifficulty] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicEdits, setTopicEdits] = useState<Record<string, TopicFormState>>({});

  const difficultyLabels = dictionary.difficulty.labels;

  const resetCourseForm = () => {
    setCourseForm({ title: "", description: "", category: "", type: "PRIVATE" });
  };

  const handleCreateCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreatingCourse(true);
    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const result = (await response.json()) as { course: AdminCatalogCourse };
      const newCourse: AdminCatalogCourse = {
        ...result.course,
        difficulties: [],
        topics: [],
      };
      setCourses((prev) => [...prev, newCourse]);
      resetCourseForm();
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
    setCourseEditForm((prev) => ({
      ...prev,
      [course.id]: {
        title: course.title,
        description: course.description,
        category: course.category,
        type: course.type,
      },
    }));
  };

  const handleUpdateCourse = async (courseId: string) => {
    const form = courseEditForm[courseId];
    if (!form) return;
    try {
      const response = await fetch("/api/admin/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: courseId, ...form }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const result = (await response.json()) as { course: AdminCatalogCourse };
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, ...result.course, difficulties: course.difficulties, topics: course.topics }
            : course,
        ),
      );
      toast.success(dictionary.feedback.courseUpdated);
      setEditingCourseId(null);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    }
  };

  const handleCreateDifficulty = async (courseId: string) => {
    const form = difficultyForm[courseId];
    if (!form || !form.label || !form.price) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/difficulties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: form.label, pricePerSession: Number(form.price) }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const result = await response.json();
      const newDifficulty = {
        ...result.difficulty,
        pricePerSession: Number(result.difficulty.pricePerSession),
      };
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, difficulties: [...course.difficulties, newDifficulty] }
            : course,
        ),
      );
      setPriceDrafts((prev) => ({ ...prev, [newDifficulty.id]: String(newDifficulty.pricePerSession) }));
      setDifficultyForm((prev) => ({ ...prev, [courseId]: { label: "", price: "" } }));
      toast.success(dictionary.feedback.difficultyCreated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    }
  };

  const handleUpdateDifficulty = async (courseId: string, difficultyId: string) => {
    const priceDraft = priceDrafts[difficultyId];
    if (!priceDraft) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/difficulties`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficultyId, pricePerSession: Number(priceDraft) }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const result = await response.json();
      const updated = {
        ...result.difficulty,
        pricePerSession: Number(result.difficulty.pricePerSession),
      };
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                difficulties: course.difficulties.map((item) => (item.id === difficultyId ? updated : item)),
              }
            : course,
        ),
      );
      toast.success(dictionary.feedback.difficultyUpdated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    }
  };

  const openTopicForm = (courseId: string, difficultyId: string) => {
    setActiveTopicCourse(courseId);
    setActiveTopicDifficulty(difficultyId);
    setTopicForm({ ...DEFAULT_TOPIC_STATE, difficultyId });
  };

  const handleCreateTopic = async (courseId: string) => {
    if (!activeTopicDifficulty) return;
    const body = {
      ...topicForm,
      sessionsRequired: Number(topicForm.sessionsRequired),
      estimatedHours: topicForm.estimatedHours ? Number(topicForm.estimatedHours) : undefined,
      order: topicForm.order ? Number(topicForm.order) : undefined,
    };

    if (!body.name || !body.sessionsRequired) {
      toast.error(dictionary.feedback.errorGeneric);
      return;
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, difficultyId: activeTopicDifficulty }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const result = await response.json();
      const topic = {
        ...result.topic,
        sessionsRequired: Number(result.topic.sessionsRequired),
        estimatedHours: Number(result.topic.estimatedHours),
        order: Number(result.topic.order),
      };
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId ? { ...course, topics: [...course.topics, topic] } : course,
        ),
      );
      setTopicForm(DEFAULT_TOPIC_STATE);
      setActiveTopicCourse(null);
      setActiveTopicDifficulty(null);
      toast.success(dictionary.feedback.topicCreated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    }
  };

  const startEditingTopic = (topic: AdminCatalogCourse["topics"][number]) => {
    setEditingTopicId(topic.id);
    setTopicEdits((prev) => ({
      ...prev,
      [topic.id]: {
        name: topic.name,
        description: topic.description ?? "",
        sessionsRequired: String(topic.sessionsRequired),
        estimatedHours: String(topic.estimatedHours),
        order: String(topic.order),
        difficultyId: topic.difficultyId,
      },
    }));
  };

  const handleUpdateTopic = async (courseId: string, topicId: string) => {
    const form = topicEdits[topicId];
    if (!form) return;
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/topics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          name: form.name,
          description: form.description,
          sessionsRequired: Number(form.sessionsRequired),
          estimatedHours: Number(form.estimatedHours),
          order: Number(form.order),
        }),
      });
      if (!response.ok) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      const result = await response.json();
      const updated = {
        ...result.topic,
        sessionsRequired: Number(result.topic.sessionsRequired),
        estimatedHours: Number(result.topic.estimatedHours),
        order: Number(result.topic.order),
      };
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? {
                ...course,
                topics: course.topics.map((topic) => (topic.id === topicId ? updated : topic)),
              }
            : course,
        ),
      );
      setEditingTopicId(null);
      toast.success(dictionary.feedback.topicUpdated);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    }
  };

  const handleReorder = async (courseId: string, difficultyId: string, topicId: string, direction: "up" | "down") => {
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;
    const sortedTopics = course.topics
      .filter((topic) => topic.difficultyId === difficultyId)
      .sort((a, b) => a.order - b.order);
    const index = sortedTopics.findIndex((topic) => topic.id === topicId);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedTopics.length) return;

    const current = sortedTopics[index];
    const swapWith = sortedTopics[targetIndex];

    try {
      const swapRequests = [
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
      ];
      const responses = await Promise.all(swapRequests);
      if (responses.some((res) => !res.ok)) {
        throw new Error(dictionary.feedback.errorGeneric);
      }
      setCourses((prev) =>
        prev.map((item) =>
          item.id === courseId
            ? {
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
              }
            : item,
        ),
      );
      toast.success(dictionary.feedback.reorderSuccess);
    } catch (error) {
      console.error(error);
      toast.error(dictionary.feedback.errorGeneric);
    }
  };

  const courseCards = useMemo(
    () =>
      courses.map((course) => {
        const isEditing = editingCourseId === course.id;
        const editForm = courseEditForm[course.id];
        const courseDifficulties = course.difficulties.sort((a, b) => a.label.localeCompare(b.label));
        const topicsByDifficulty = course.difficulties.reduce<Record<string, AdminCatalogCourse["topics"]>>(
          (acc, difficulty) => {
            acc[difficulty.id] = course.topics
              .filter((topic) => topic.difficultyId === difficulty.id)
              .sort((a, b) => a.order - b.order);
            return acc;
          },
          {},
        );

        return (
          <Card key={course.id} className="rounded-3xl border-brand-100 bg-white/90">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl text-brand-800">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
                <div className="flex flex-wrap gap-3 text-xs text-brand-500">
                  <span className="rounded-full bg-brand-100 px-3 py-1">
                    {dictionary.courseMeta.type}: {dictionary.createCourse.typeOptions[course.type]}
                  </span>
                  <span className="rounded-full bg-brand-100 px-3 py-1">
                    {dictionary.courseMeta.category}: {course.category}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setEditingCourseId(null)}>
                      {dictionary.updateCourse.cancelAction}
                    </Button>
                    <Button onClick={() => handleUpdateCourse(course.id)}>{dictionary.updateCourse.saveAction}</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => startEditingCourse(course)}>
                    {dictionary.updateCourse.editAction}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {isEditing && editForm && (
                <form
                  className="grid gap-4 rounded-2xl border border-dashed border-brand-200 p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleUpdateCourse(course.id);
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor={`title-${course.id}`}>{dictionary.createCourse.nameLabel}</Label>
                    <Input
                      id={`title-${course.id}`}
                      value={editForm.title}
                      onChange={(event) =>
                        setCourseEditForm((prev) => ({
                          ...prev,
                          [course.id]: { ...prev[course.id], title: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`description-${course.id}`}>{dictionary.createCourse.descriptionLabel}</Label>
                    <Textarea
                      id={`description-${course.id}`}
                      value={editForm.description}
                      onChange={(event) =>
                        setCourseEditForm((prev) => ({
                          ...prev,
                          [course.id]: { ...prev[course.id], description: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`category-${course.id}`}>{dictionary.createCourse.categoryLabel}</Label>
                    <Input
                      id={`category-${course.id}`}
                      value={editForm.category}
                      onChange={(event) =>
                        setCourseEditForm((prev) => ({
                          ...prev,
                          [course.id]: { ...prev[course.id], category: event.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{dictionary.createCourse.typeLabel}</Label>
                    <div className="flex gap-2">
                      {Object.entries(dictionary.createCourse.typeOptions).map(([value, label]) => (
                        <Button
                          key={value}
                          type="button"
                          variant={editForm.type === value ? "default" : "outline"}
                          onClick={() =>
                            setCourseEditForm((prev) => ({
                              ...prev,
                              [course.id]: { ...prev[course.id], type: value as AdminCatalogCourse["type"] },
                            }))
                          }
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              <section className="space-y-4">
                <h3 className="font-display text-xl text-brand-800">{dictionary.difficulty.title}</h3>
                <p className="text-sm text-brand-500">{dictionary.difficulty.existingTitle}</p>
                <div className="space-y-3">
                  {courseDifficulties.map((difficulty) => (
                    <div
                      key={difficulty.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-brand-700">
                          {difficultyLabels[difficulty.label] ?? difficulty.label}
                        </p>
                        <p className="text-xs text-brand-400">
                          {dictionary.table.perSession}: {formatCurrency(locale, difficulty.pricePerSession)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={priceDrafts[difficulty.id] ?? ""}
                          onChange={(event) =>
                            setPriceDrafts((prev) => ({ ...prev, [difficulty.id]: event.target.value }))
                          }
                        />
                        <Button onClick={() => handleUpdateDifficulty(course.id, difficulty.id)}>
                          {dictionary.updateCourse.saveAction}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-dashed border-brand-200 p-4">
                  <h4 className="font-semibold text-brand-700">{dictionary.difficulty.addTitle}</h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-[240px_1fr_auto]">
                    <div className="grid gap-2">
                      <Label>{dictionary.difficulty.labelPlaceholder}</Label>
                      <select
                        className="rounded-2xl border border-brand-200 bg-white px-3 py-2"
                        value={difficultyForm[course.id]?.label ?? ""}
                        onChange={(event) =>
                          setDifficultyForm((prev) => ({
                            ...prev,
                            [course.id]: {
                              ...(prev[course.id] ?? { label: "", price: "" }),
                              label: event.target.value,
                            },
                          }))
                        }
                      >
                        <option value="" disabled>
                          --
                        </option>
                        {Object.entries(difficultyLabels)
                          .filter(([value]) => !course.difficulties.some((item) => item.label === value))
                          .map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{dictionary.difficulty.priceLabel}</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={difficultyForm[course.id]?.price ?? ""}
                        onChange={(event) =>
                          setDifficultyForm((prev) => ({
                            ...prev,
                            [course.id]: {
                              ...(prev[course.id] ?? { label: "", price: "" }),
                              price: event.target.value,
                            },
                          }))
                        }
                        placeholder={dictionary.difficulty.pricePlaceholder}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={() => handleCreateDifficulty(course.id)}>{dictionary.difficulty.submit}</Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <h3 className="font-display text-xl text-brand-800">{dictionary.topics.title}</h3>
                  <Button
                    variant="outline"
                    onClick={() => openTopicForm(course.id, course.difficulties[0]?.id ?? "")}
                    disabled={!course.difficulties.length}
                  >
                    {dictionary.topics.addButton}
                  </Button>
                </div>
                {!course.topics.length && (
                  <p className="text-sm text-brand-500">{dictionary.topics.empty}</p>
                )}
                <div className="space-y-4">
                  {course.difficulties.map((difficulty) => {
                    const topics = topicsByDifficulty[difficulty.id] ?? [];
                    return (
                      <div key={difficulty.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-brand-700">
                            {difficultyLabels[difficulty.label] ?? difficulty.label}
                          </h4>
                          <Button
                            variant="ghost"
                            className="text-sm text-emerald-700 hover:bg-emerald-500/10"
                            onClick={() => openTopicForm(course.id, difficulty.id)}
                          >
                            {dictionary.topics.addButton}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {topics.map((topic) => {
                            const isEditingTopic = editingTopicId === topic.id;
                            const topicFormState = topicEdits[topic.id];
                            return (
                              <div
                                key={topic.id}
                                className="rounded-2xl border border-brand-100 bg-white p-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-brand-800">{topic.name}</p>
                                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-brand-500">
                                      <Badge className="cursor-default bg-brand-100 text-brand-700">
                                        {topic.sessionsRequired}
                                      </Badge>
                                      <Badge className="cursor-default bg-brand-100 text-brand-700">
                                        {topic.estimatedHours}
                                      </Badge>
                                      <span className="rounded-full bg-brand-100 px-3 py-1"># {topic.order}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditingTopic(topic)}
                                    >
                                      {dictionary.topics.editAction}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReorder(course.id, difficulty.id, topic.id, "up")}
                                    >
                                      {dictionary.topics.moveUp}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReorder(course.id, difficulty.id, topic.id, "down")}
                                    >
                                      {dictionary.topics.moveDown}
                                    </Button>
                                  </div>
                                </div>
                                {topic.description && !isEditingTopic && (
                                  <p className="mt-2 text-sm text-brand-600">{topic.description}</p>
                                )}
                                {isEditingTopic && topicFormState && (
                                  <form
                                    className="mt-4 grid gap-3"
                                    onSubmit={(event) => {
                                      event.preventDefault();
                                      handleUpdateTopic(course.id, topic.id);
                                    }}
                                  >
                                    <div className="grid gap-2">
                                      <Label>{dictionary.topics.nameLabel}</Label>
                                      <Input
                                        value={topicFormState.name}
                                        onChange={(event) =>
                                          setTopicEdits((prev) => ({
                                            ...prev,
                                            [topic.id]: { ...prev[topic.id], name: event.target.value },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>{dictionary.topics.descriptionLabel}</Label>
                                      <Textarea
                                        value={topicFormState.description}
                                        onChange={(event) =>
                                          setTopicEdits((prev) => ({
                                            ...prev,
                                            [topic.id]: { ...prev[topic.id], description: event.target.value },
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                                      <div className="grid gap-2">
                                        <Label>{dictionary.topics.sessionsLabel}</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={topicFormState.sessionsRequired}
                                          onChange={(event) =>
                                            setTopicEdits((prev) => ({
                                              ...prev,
                                              [topic.id]: {
                                                ...prev[topic.id],
                                                sessionsRequired: event.target.value,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label>{dictionary.topics.hoursLabel}</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={topicFormState.estimatedHours}
                                          onChange={(event) =>
                                            setTopicEdits((prev) => ({
                                              ...prev,
                                              [topic.id]: {
                                                ...prev[topic.id],
                                                estimatedHours: event.target.value,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                      <div className="grid gap-2">
                                        <Label>{dictionary.topics.orderLabel}</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          value={topicFormState.order}
                                          onChange={(event) =>
                                            setTopicEdits((prev) => ({
                                              ...prev,
                                              [topic.id]: {
                                                ...prev[topic.id],
                                                order: event.target.value,
                                              },
                                            }))
                                          }
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button type="submit">{dictionary.topics.submit}</Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingTopicId(null)}
                                      >
                                        {dictionary.topics.cancel}
                                      </Button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {activeTopicCourse === course.id && activeTopicDifficulty && (
                  <div className="rounded-2xl border border-dashed border-brand-200 p-4">
                    <h4 className="font-semibold text-brand-700">{dictionary.topics.formTitle}</h4>
                    <form
                      className="mt-4 grid gap-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleCreateTopic(course.id);
                      }}
                    >
                      <div className="grid gap-2">
                        <Label>{dictionary.topics.nameLabel}</Label>
                        <Input
                          value={topicForm.name}
                          onChange={(event) => setTopicForm((prev) => ({ ...prev, name: event.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>{dictionary.topics.descriptionLabel}</Label>
                        <Textarea
                          value={topicForm.description}
                          onChange={(event) =>
                            setTopicForm((prev) => ({ ...prev, description: event.target.value }))
                          }
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-3 md:gap-4">
                        <div className="grid gap-2">
                          <Label>{dictionary.topics.sessionsLabel}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={topicForm.sessionsRequired}
                            onChange={(event) =>
                              setTopicForm((prev) => ({ ...prev, sessionsRequired: event.target.value }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>{dictionary.topics.hoursLabel}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={topicForm.estimatedHours}
                            onChange={(event) =>
                              setTopicForm((prev) => ({ ...prev, estimatedHours: event.target.value }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>{dictionary.topics.orderLabel}</Label>
                          <Input
                            type="number"
                            min="1"
                            value={topicForm.order}
                            onChange={(event) =>
                              setTopicForm((prev) => ({ ...prev, order: event.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">{dictionary.topics.submit}</Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setActiveTopicCourse(null);
                            setActiveTopicDifficulty(null);
                            setTopicForm(DEFAULT_TOPIC_STATE);
                          }}
                        >
                          {dictionary.topics.cancel}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </section>
            </CardContent>
          </Card>
        );
      }),
    [courses, dictionary, difficultyLabels, editingCourseId, courseEditForm, priceDrafts, topicEdits, activeTopicCourse, activeTopicDifficulty, topicForm, locale],
  );

  return (
    <div className="space-y-8">
      <Card className="border-brand-200 bg-white/90">
        <CardHeader>
          <CardTitle>{dictionary.createCourse.title}</CardTitle>
          <CardDescription>{dictionary.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateCourse}>
            <div className="grid gap-2">
              <Label htmlFor="new-title">{dictionary.createCourse.nameLabel}</Label>
              <Input
                id="new-title"
                value={courseForm.title}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-category">{dictionary.createCourse.categoryLabel}</Label>
              <Input
                id="new-category"
                value={courseForm.category}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, category: event.target.value }))}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="new-description">{dictionary.createCourse.descriptionLabel}</Label>
              <Textarea
                id="new-description"
                value={courseForm.description}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>{dictionary.createCourse.typeLabel}</Label>
              <div className="flex gap-2">
                {Object.entries(dictionary.createCourse.typeOptions).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={courseForm.type === value ? "default" : "outline"}
                    onClick={() => setCourseForm((prev) => ({ ...prev, type: value as AdminCatalogCourse["type"] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-end justify-end md:col-span-2">
              <Button type="submit" disabled={isCreatingCourse}>
                {dictionary.createCourse.submit}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">{courseCards}</div>
    </div>
  );
}
