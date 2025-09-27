import { PrismaClient, CourseType, Role } from "@prisma/client";

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
    where: { titleEn: "Intensive Conversation Program" },
    update: {
      titleAr: "دورة المحادثة المكثفة",
      descriptionEn:
        "Practical coaching that strengthens speaking fluency through real-life scenarios and guided workshops.",
      descriptionAr:
        "برنامج عملي يركز على تحسين الطلاقة في التحدث من خلال مواقف حياتية وورش عمل مع المدرب.",
      categoryEn: "Conversation Skills",
      categoryAr: "مهارات المحادثة",
      type: CourseType.PRIVATE,
    },
    create: {
      titleEn: "Intensive Conversation Program",
      titleAr: "دورة المحادثة المكثفة",
      descriptionEn:
        "Practical coaching that strengthens speaking fluency through real-life scenarios and guided workshops.",
      descriptionAr:
        "برنامج عملي يركز على تحسين الطلاقة في التحدث من خلال مواقف حياتية وورش عمل مع المدرب.",
      categoryEn: "Conversation Skills",
      categoryAr: "مهارات المحادثة",
      type: CourseType.PRIVATE,
    },
  });

  console.info(`✔️ Course ready: ${conversationCourse.titleEn} / ${conversationCourse.titleAr}`);

  const difficultyData = [
    { key: "BEGINNER", nameEn: "Beginner", nameAr: "مبتدئ", pricePerSession: "20.00" },
    { key: "INTERMEDIATE", nameEn: "Intermediate", nameAr: "متوسط", pricePerSession: "25.00" },
    { key: "ADVANCED", nameEn: "Advanced", nameAr: "متقدم", pricePerSession: "30.00" },
  ];

  const difficulties = [] as Array<{ id: string; key: string }>;

  for (const difficulty of difficultyData) {
    const record = await prisma.courseDifficulty.upsert({
      where: {
        courseId_nameEn: {
          courseId: conversationCourse.id,
          nameEn: difficulty.nameEn,
        },
      },
      update: {
        nameEn: difficulty.nameEn,
        nameAr: difficulty.nameAr,
        pricePerSession: difficulty.pricePerSession,
      },
      create: {
        courseId: conversationCourse.id,
        nameEn: difficulty.nameEn,
        nameAr: difficulty.nameAr,
        pricePerSession: difficulty.pricePerSession,
      },
    });

    difficulties.push({ id: record.id, key: difficulty.key });
  }

  console.info(`✔️ Difficulties prepared: ${difficulties.length}`);

  const topicsByDifficulty: Record<string, Array<{ nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string; sessions: number; hours: number; order: number }>> = {
    BEGINNER: [
      {
        nameEn: "Introductions",
        nameAr: "أساسيات التعارف",
        descriptionEn: "Introduce yourself and exchange personal details confidently.",
        descriptionAr: "كلمات وجمل للتعريف عن الذات وتبادل المعلومات الشخصية.",
        sessions: 3,
        hours: 4,
        order: 1,
      },
      {
        nameEn: "Everyday Vocabulary",
        nameAr: "مفردات الحياة اليومية",
        descriptionEn: "Key phrases for shopping, dining out, and navigating the city.",
        descriptionAr: "مفردات المشتريات، المطاعم، والتنقل داخل المدينة.",
        sessions: 4,
        hours: 5,
        order: 2,
      },
    ],
    INTERMEDIATE: [
      {
        nameEn: "Professional Discussions",
        nameAr: "نقاشات مهنية",
        descriptionEn: "Strengthen meeting participation and present opinions clearly.",
        descriptionAr: "تطوير القدرة على النقاش في الاجتماعات وتقديم الآراء بوضوح.",
        sessions: 4,
        hours: 6,
        order: 1,
      },
      {
        nameEn: "Business Email Writing",
        nameAr: "كتابة البريد المهني",
        descriptionEn: "Craft professional emails with the right tone and structure.",
        descriptionAr: "صياغة رسائل إلكترونية احترافية مع التركيز على النبرة والأسلوب.",
        sessions: 3,
        hours: 4,
        order: 2,
      },
    ],
    ADVANCED: [
      {
        nameEn: "Presentations",
        nameAr: "العروض التقديمية",
        descriptionEn: "Structure persuasive presentations and engage any audience.",
        descriptionAr: "هيكلة عرض متكامل مع أساليب الإقناع والتفاعل مع الجمهور.",
        sessions: 4,
        hours: 6,
        order: 1,
      },
      {
        nameEn: "Negotiations",
        nameAr: "المفاوضات",
        descriptionEn: "Negotiation techniques and handling objections fluently.",
        descriptionAr: "تقنيات التفاوض والرد على الاعتراضات باللغة الإنجليزية بطلاقة.",
        sessions: 5,
        hours: 7,
        order: 2,
      },
    ],
  };

  for (const difficulty of difficulties) {
    const topics = topicsByDifficulty[difficulty.key];
    if (!topics) continue;

    for (const topic of topics) {
      const existing = await prisma.topic.findFirst({
        where: {
          nameEn: topic.nameEn,
          courseId: conversationCourse.id,
          difficultyId: difficulty.id,
        },
      });

      if (existing) {
        await prisma.topic.update({
          where: { id: existing.id },
          data: {
            nameEn: topic.nameEn,
            nameAr: topic.nameAr,
            descriptionEn: topic.descriptionEn,
            descriptionAr: topic.descriptionAr,
            sessionsRequired: topic.sessions,
            estimatedHours: topic.hours,
            order: topic.order,
          },
        });
      } else {
        await prisma.topic.create({
          data: {
            nameEn: topic.nameEn,
            nameAr: topic.nameAr,
            descriptionEn: topic.descriptionEn,
            descriptionAr: topic.descriptionAr,
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
