import { PrismaClient, CourseType, DifficultyLabel, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@learnenglish.com" },
    update: {
      name: "مشرف المنصة",
      role: Role.ADMIN,
    },
    create: {
      email: "admin@learnenglish.com",
      firebaseUid: "MPJp8uDukvMebwkFTBoUkhtRiYe2",
      name: "مشرف المنصة",
      phone: "+96100000000",
      role: Role.ADMIN,
    },
  });

  console.info(`✔️ Admin user ready: ${admin.email}`);

  const conversationCourse = await prisma.course.upsert({
    where: { title: "دورة المحادثة المكثفة" },
    update: {
      description:
        "برنامج عملي يركز على تحسين الطلاقة في التحدث من خلال مواقف حياتية وورش عمل مع المدرب.",
      category: "مهارات المحادثة",
      type: CourseType.PRIVATE,
    },
    create: {
      title: "دورة المحادثة المكثفة",
      description:
        "برنامج عملي يركز على تحسين الطلاقة في التحدث من خلال مواقف حياتية وورش عمل مع المدرب.",
      category: "مهارات المحادثة",
      type: CourseType.PRIVATE,
    },
  });

  console.info(`✔️ Course ready: ${conversationCourse.title}`);

  const difficultyData = [
    { label: DifficultyLabel.BEGINNER, pricePerSession: "20.00" },
    { label: DifficultyLabel.INTERMEDIATE, pricePerSession: "25.00" },
    { label: DifficultyLabel.ADVANCED, pricePerSession: "30.00" },
  ];

  const difficulties = [] as Array<{ id: string; label: DifficultyLabel }>;

  for (const difficulty of difficultyData) {
    const record = await prisma.courseDifficulty.upsert({
      where: {
        courseId_label: {
          courseId: conversationCourse.id,
          label: difficulty.label,
        },
      },
      update: {
        pricePerSession: difficulty.pricePerSession,
      },
      create: {
        courseId: conversationCourse.id,
        label: difficulty.label,
        pricePerSession: difficulty.pricePerSession,
      },
    });

    difficulties.push({ id: record.id, label: record.label });
  }

  console.info(`✔️ Difficulties prepared: ${difficulties.length}`);

  const topicsByDifficulty: Record<DifficultyLabel, Array<{ name: string; description: string; sessions: number; hours: number; order: number }>> = {
    [DifficultyLabel.BEGINNER]: [
      {
        name: "أساسيات التعارف",
        description: "كلمات وجمل للتعريف عن الذات وتبادل المعلومات الشخصية.",
        sessions: 3,
        hours: 4,
        order: 1,
      },
      {
        name: "مفردات الحياة اليومية",
        description: "مفردات المشتريات، المطاعم، والتنقل داخل المدينة.",
        sessions: 4,
        hours: 5,
        order: 2,
      },
    ],
    [DifficultyLabel.INTERMEDIATE]: [
      {
        name: "نقاشات مهنية",
        description: "تطوير القدرة على النقاش في الاجتماعات وتقديم الآراء بوضوح.",
        sessions: 4,
        hours: 6,
        order: 1,
      },
      {
        name: "كتابة البريد المهني",
        description: "صياغة رسائل إلكترونية احترافية مع التركيز على النبرة والأسلوب.",
        sessions: 3,
        hours: 4,
        order: 2,
      },
    ],
    [DifficultyLabel.ADVANCED]: [
      {
        name: "العروض التقديمية",
        description: "هيكلة عرض متكامل مع أساليب الإقناع والتفاعل مع الجمهور.",
        sessions: 4,
        hours: 6,
        order: 1,
      },
      {
        name: "المفاوضات",
        description: "تقنيات التفاوض والرد على الاعتراضات باللغة الإنجليزية بطلاقة.",
        sessions: 5,
        hours: 7,
        order: 2,
      },
    ],
  };

  for (const difficulty of difficulties) {
    const topics = topicsByDifficulty[difficulty.label];
    if (!topics) continue;

    for (const topic of topics) {
      const existing = await prisma.topic.findFirst({
        where: {
          name: topic.name,
          courseId: conversationCourse.id,
          difficultyId: difficulty.id,
        },
      });

      if (existing) {
        await prisma.topic.update({
          where: { id: existing.id },
          data: {
            description: topic.description,
            sessionsRequired: topic.sessions,
            estimatedHours: topic.hours,
            order: topic.order,
          },
        });
      } else {
        await prisma.topic.create({
          data: {
            name: topic.name,
            description: topic.description,
            sessionsRequired: topic.sessions,
            estimatedHours: topic.hours,
            order: topic.order,
            courseId: conversationCourse.id,
            difficultyId: difficulty.id,
          },
        });
      }
    }
  }

  console.info("✔️ Topics synchronized");

  const discountRules = [
    { minSessions: 6, percentOff: "5.00" },
    { minSessions: 12, percentOff: "10.00" },
    { minSessions: 20, percentOff: "15.00" },
  ];

  for (const rule of discountRules) {
    const existing = await prisma.discountRule.findFirst({
      where: {
        courseId: conversationCourse.id,
        minSessions: rule.minSessions,
      },
    });

    if (existing) {
      await prisma.discountRule.update({
        where: { id: existing.id },
        data: { percentOff: rule.percentOff, isActive: true },
      });
    } else {
      await prisma.discountRule.create({
        data: {
          courseId: conversationCourse.id,
          minSessions: rule.minSessions,
          percentOff: rule.percentOff,
          isActive: true,
        },
      });
    }
  }

  console.info("✔️ Discount rules updated");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
