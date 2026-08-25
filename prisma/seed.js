const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const COURSES_DATA = [
  {
    slug: "docker-mastery-course",
    titleFa: "دوره جامع مستری داکر و کانتینرها (۲۰۲۶)",
    titleEn: "Docker Mastery: with Kubernetes + Swarm from a Docker Captain",
    descriptionFa: "جامع‌ترین دوره آموزشی داکر و ارکستراسیون کانتینرها، ساخت ایمیج‌های بهینه، دیپلوی چندکانتینری با Docker Compose و پیاده‌سازی کلاسترهای ابری با صدای دوبله اختصاصی فارسی هوش مصنوعی.",
    instructor: "Bret Fisher",
    instructorRole: "Docker Captain & DevOps Consultant",
    category: "دواپس و کانتینرها",
    level: "مقدماتی تا پیشرفته",
    totalDurationMin: 540,
    thumbnailUrl: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=80",
    badgeText: "دوبله اختصاصی AI",
    rating: 4.9,
    studentsCount: 2450,
    chapters: [
      {
        titleFa: "فصل اول: مبانی کانتینرسازی و معماری داکر",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه اول: آشنایی با داکر و تفاوت آن با ماشین‌های مجازی",
            titleEn: "Introduction to Containers & Virtual Machines",
            episodeNumber: 1,
            durationSeconds: 480,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          },
          {
            titleFa: "جلسه دوم: کار با دستورات اصلی داکر (Run, Exec, Logs)",
            titleEn: "Essential Docker CLI Commands in Depth",
            episodeNumber: 2,
            durationSeconds: 620,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      },
      {
        titleFa: "فصل دوم: ساخت ایمیج‌های بهینه با Dockerfile",
        orderIndex: 2,
        episodes: [
          {
            titleFa: "جلسه سوم: ساخت لایه‌های کانتینر با Multi-Stage Builds",
            titleEn: "Optimizing Image Layers with Multi-Stage Builds",
            episodeNumber: 3,
            durationSeconds: 740,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          }
        ]
      }
    ]
  },
  {
    slug: "fastapi-microservices-masterclass",
    titleFa: "میکروسرویس‌های مقیاس‌پذیر با FastAPI و پایتون",
    titleEn: "Building Scalable Microservices with FastAPI & Python",
    descriptionFa: "طراحی و توسعه سیستم‌های توزیع‌شده با FastAPI، ارزیابی داده‌ها با Pydantic V2، ارتباط ناهمگام با RabbitMQ و پیاده‌سازی کشینگ با Redis.",
    instructor: "Tiangolo (Sebastián)",
    instructorRole: "Creator of FastAPI & Software Architect",
    category: "بک‌اند و پایتون",
    level: "متوسط",
    totalDurationMin: 420,
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    badgeText: "دوبله هوشمند",
    rating: 4.95,
    studentsCount: 1890,
    chapters: [
      {
        titleFa: "فصل اول: معماری ناهمگام و مبانی FastAPI",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه اول: راه‌اندازی سرور ناهمگام و Dependency Injection",
            titleEn: "Async Server Setup & Dependency Injection",
            episodeNumber: 1,
            durationSeconds: 510,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      }
    ]
  },
  {
    slug: "nextjs-fullstack-architecture",
    titleFa: "معماری فول‌استک با Next.js 16 و React Server Components",
    titleEn: "Fullstack Next.js 16, Server Actions & Tailwind Enterprise",
    descriptionFa: "پیاده‌سازی پروژه‌های شرکتی با Next.js 16، بهینه‌سازی سرعت با Server Components، پیاده‌سازی احراز هویت و پایگاه‌های داده مدرن.",
    instructor: "Lee Robinson",
    instructorRole: "VP of Product at Vercel",
    category: "فرانت‌اند و وب",
    level: "پیشرفته",
    totalDurationMin: 360,
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    badgeText: "جدیدترین انتشار",
    rating: 4.88,
    studentsCount: 3100,
    chapters: [
      {
        titleFa: "فصل اول: مبانی App Router و Server Actions",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه اول: طراحی روت‌ها و رندرینگ سمت سرور",
            titleEn: "App Router Fundamentals & Server-Side Rendering",
            episodeNumber: 1,
            durationSeconds: 430,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      }
    ]
  },
  {
    slug: "kubernetes-visual-cookbook-solve-build-scale-in-minutes",
    titleFa: "آموزش جامع و تصویری کوبرنتیز (۲۰۲۶)",
    titleEn: "Kubernetes Visual Cookbook: Solve, Build, Scale in Minutes 2026",
    descriptionFa: "حل چالش‌ها و پیاده‌سازی تصویری کلاسترهای کوبرنتیز در محیط پروداکشن، مدیریت Pods، Services، Ingress و اتواسکیلینگ به همراه دوبله استودیویی فارسی.",
    instructor: "Mumshad Mannambeth",
    instructorRole: "Certified Kubernetes Administrator & DevOps Lead",
    category: "دواپس و کلاود",
    level: "متوسط تا پیشرفته",
    totalDurationMin: 480,
    thumbnailUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80",
    badgeText: "۱۰۰٪ رایگان",
    rating: 4.92,
    studentsCount: 3400,
    chapters: [
      {
        titleFa: "فصل ۱: مفاهیم پایه، معماری کلاستر و راه‌اندازی",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه ۱: مقدمه، معماری کوبرنتیز و نقشه راه",
            titleEn: "01 - Introduction and Cluster Architecture",
            episodeNumber: 1,
            durationSeconds: 520,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          },
          {
            titleFa: "جلسه ۲: راه‌اندازی کلاستر محلی با Minikube و Kind",
            titleEn: "02 - Local Cluster Setup with Minikube",
            episodeNumber: 2,
            durationSeconds: 680,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      },
      {
        titleFa: "فصل ۲: استقرار عملی، سرویس‌ها و Ingress",
        orderIndex: 2,
        episodes: [
          {
            titleFa: "جلسه ۳: استقرار Pods و مدیریت Deployments",
            titleEn: "03 - Deployments, ReplicaSets and Pod Lifecycle",
            episodeNumber: 3,
            durationSeconds: 790,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          },
          {
            titleFa: "جلسه ۴: شبکه، Service Discovery و تنظیم Ingress Controller",
            titleEn: "04 - Networking, Services and Ingress Rules",
            episodeNumber: 4,
            durationSeconds: 850,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          }
        ]
      }
    ]
  },
  {
    slug: "complete-generative-ai-bootcamp-2026-langchain-agents-rag",
    titleFa: "بوت‌کمپ جامع هوش مصنوعی زاینده، LangChain و RAG (۲۰۲۶)",
    titleEn: "Complete Generative AI Bootcamp 2026: LangChain, Agents, RAG",
    descriptionFa: "ساخت سیستم‌های هوشمند مبتنی بر LLM، پیاده‌سازی Retrieval-Augmented Generation (RAG) با پایگاه‌های وکتوری و ساخت Autonomous Agents با پایتون و لنگ‌چین با دوبله فارسی اختصاصی.",
    instructor: "Dr. Angela Yu / AI Master",
    instructorRole: "AI Research Scientist & Lead Educator",
    category: "هوش مصنوعی و داده",
    level: "مقدماتی تا پیشرفته",
    totalDurationMin: 520,
    thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80",
    badgeText: "دوبله اختصاصی AI",
    rating: 4.96,
    studentsCount: 4200,
    chapters: [
      {
        titleFa: "فصل ۱: مبانی هوش مصنوعی زاینده، پرامپت‌نویسی و مدل‌های زبانی",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه ۱: مقدمه و نقشه راه جامع یادگیری Generative AI",
            titleEn: "01 - Introduction and GenAI Roadmap",
            episodeNumber: 1,
            durationSeconds: 480,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          },
          {
            titleFa: "جلسه ۲: نصب ابزارها و ساخت اولین چت‌بات با LangChain",
            titleEn: "02 - First Hands-on LangChain Project",
            episodeNumber: 2,
            durationSeconds: 640,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      },
      {
        titleFa: "فصل ۲: پیاده‌سازی RAG و پایگاه‌های برداری در سطح سازمانی",
        orderIndex: 2,
        episodes: [
          {
            titleFa: "جلسه ۳: معماری پیشرفته RAG با ChromaDB و Pinecone",
            titleEn: "03 - Advanced RAG Architecture",
            episodeNumber: 3,
            durationSeconds: 820,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          },
          {
            titleFa: "جلسه ۴: ساخت AI Agents خودکار با Function Calling",
            titleEn: "04 - Building Autonomous Agents",
            episodeNumber: 4,
            durationSeconds: 930,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          }
        ]
      }
    ]
  },
  {
    slug: "react-fullstack-bootcamp-build-job-portal-marketplace-app",
    titleFa: "بوت‌کمپ فول‌استک ری‌اکت: ساخت پورتال کاریابی و مارکت‌پلیس (۲۰۲۶)",
    titleEn: "React Fullstack Bootcamp - Build Job Portal & Marketplace App 2026",
    descriptionFa: "طراحی و توسعه پروژه‌های کامل سازمانی با React 19، مدیریت استیت با Redux Toolkit و Zustand، اتصال به REST & GraphQL APIs و استقرار ابری به همراه دوبله فارسی هوشمند.",
    instructor: "Maximilian Schwarzmüller",
    instructorRole: "Senior Fullstack Engineer & Author",
    category: "فرانت‌اند و وب",
    level: "متوسط تا پیشرفته",
    totalDurationMin: 450,
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
    badgeText: "۱۰۰٪ رایگان",
    rating: 4.89,
    studentsCount: 2900,
    chapters: [
      {
        titleFa: "فصل ۱: معماری کامپوننت‌ها، هوک‌های مدرن و استیت",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه ۱: مقدمه و راه‌اندازی پروژه پورتال کاریابی",
            titleEn: "01 - Project Setup & Architecture",
            episodeNumber: 1,
            durationSeconds: 460,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          },
          {
            titleFa: "جلسه ۲: ساخت رابط کاربری با Tailwind و Radix UI",
            titleEn: "02 - UI Components and Layouts",
            episodeNumber: 2,
            durationSeconds: 580,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      },
      {
        titleFa: "فصل ۲: اتصال به بک‌اند، احراز هویت و درگاه پرداخت",
        orderIndex: 2,
        episodes: [
          {
            titleFa: "جلسه ۳: پیاده‌سازی احراز هویت JWT و محافظت از روت‌ها",
            titleEn: "03 - Authentication and Route Guards",
            episodeNumber: 3,
            durationSeconds: 750,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          },
          {
            titleFa: "جلسه ۴: سیستم فیلترینگ پیشرفته مشاغل و پرداخت آنلاین",
            titleEn: "04 - Advanced Filtering and Checkout",
            episodeNumber: 4,
            durationSeconds: 880,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          }
        ]
      }
    ]
  },
  {
    slug: "fastapi-microservices-production-architecture-2026",
    titleFa: "معماری پروداکشن میکروسرویس‌ها با FastAPI، داکر و ردیس (۲۰۲۶)",
    titleEn: "FastAPI Microservices with Docker, Redis & PostgreSQL 2026",
    descriptionFa: "توسعه میکروسرویس‌های فوق‌سریع و توزیع‌شده با FastAPI، ارتباط ناهمگام با صف‌های پیام Kafka و RabbitMQ، کشینگ توزیع‌شده و تست‌های خودکار با دوبله فارسی.",
    instructor: "Jose Portilla",
    instructorRole: "Data Science & Backend Instructor",
    category: "بک‌اند و پایتون",
    level: "پیشرفته",
    totalDurationMin: 410,
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    badgeText: "دوبله اختصاصی AI",
    rating: 4.91,
    studentsCount: 2150,
    chapters: [
      {
        titleFa: "فصل ۱: طراحی معماری سرویس‌ها و قراردادهای داده",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه ۱: ساختار میکروسرویس و مدل‌سازی Pydantic",
            titleEn: "01 - Microservice Structure and Data Models",
            episodeNumber: 1,
            durationSeconds: 490,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          },
          {
            titleFa: "جلسه ۲: اتصال به PostgreSQL و مایگریشن با Alembic",
            titleEn: "02 - Database Integration and Migrations",
            episodeNumber: 2,
            durationSeconds: 610,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      },
      {
        titleFa: "فصل ۲: کشینگ توزیع‌شده و نظارت سیستم در پروداکشن",
        orderIndex: 2,
        episodes: [
          {
            titleFa: "جلسه ۳: لایه کشینگ سریع با Redis و Rate Limiting",
            titleEn: "03 - Caching Layer and Rate Limiting",
            episodeNumber: 3,
            durationSeconds: 740,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          },
          {
            titleFa: "جلسه ۴: لاگینگ متمرکز، پرومتئوس و گرافانا",
            titleEn: "04 - Observability and Monitoring",
            episodeNumber: 4,
            durationSeconds: 830,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          }
        ]
      }
    ]
  },
  {
    slug: "ci-cd-with-databricks-declarative-automation-bundles",
    titleFa: "پایپ‌لاین CI/CD و اتوماسیون با Databricks Bundles (۲۰۲۶)",
    titleEn: "CI/CD with Databricks (Declarative Automation Bundles) 2026",
    descriptionFa: "پیاده‌سازی چرخه خودکار توسعه و انتشار کدهای مهندسی داده و یادگیری ماشین روی پلتفرم Databricks با استفاده از Asset Bundles و GitHub Actions.",
    instructor: "Stephane Maarek",
    instructorRole: "AWS & Cloud Solutions Architect",
    category: "دواپس و کلاود",
    level: "متوسط تا پیشرفته",
    totalDurationMin: 380,
    thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
    badgeText: "۱۰۰٪ رایگان",
    rating: 4.88,
    studentsCount: 1750,
    chapters: [
      {
        titleFa: "فصل ۱: مبانی Databricks Asset Bundles (DABs)",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه ۱: مقدمه بر DABs و پیکربندی اولیه محیط",
            titleEn: "01 - Introduction to DABs and Workspace Setup",
            episodeNumber: 1,
            durationSeconds: 440,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          },
          {
            titleFa: "جلسه ۲: تعریف منابع به صورت Declarative (Jobs & Pipelines)",
            titleEn: "02 - Declarative Resource Definitions",
            episodeNumber: 2,
            durationSeconds: 560,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      },
      {
        titleFa: "فصل ۲: اتصال به GitHub Actions و استقرار چندمحیطی",
        orderIndex: 2,
        episodes: [
          {
            titleFa: "جلسه ۳: ساخت Workflow های خودکار CI/CD در GitHub",
            titleEn: "03 - Building Automated GitHub Actions Workflows",
            episodeNumber: 3,
            durationSeconds: 710,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          },
          {
            titleFa: "جلسه ۴: دیپلوی خودکار به محیط‌های Dev، Staging و Prod",
            titleEn: "04 - Multi-Environment Deployment Strategies",
            episodeNumber: 4,
            durationSeconds: 810,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          }
        ]
      }
    ]
  },
  {
    slug: "50-practical-chatgpt-use-cases-for-business-2026-hands-on",
    titleFa: "۵۰ سناریوی کاربردی و عملی ChatGPT و Claude برای مهندسان (۲۰۲۶)",
    titleEn: "50 Practical ChatGPT & Claude Use Cases for Engineers 2026",
    descriptionFa: "تکنیک‌های حرفه‌ای پرامپت‌نویسی پیشرفته، اتوماسیون کارهای روزمره برنامه‌نویسی، ریفکتورینگ کد، ساخت ابزارهای کمکی و تحلیل دیتا با هوش مصنوعی و دوبله فارسی.",
    instructor: "Kirill Eremenko",
    instructorRole: "Data Scientist & AI Entrepreneur",
    category: "هوش مصنوعی و داده",
    level: "همه سطوح",
    totalDurationMin: 490,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    badgeText: "دوبله اختصاصی AI",
    rating: 4.94,
    studentsCount: 3800,
    chapters: [
      {
        titleFa: "فصل ۱: مهندسی پرامپت پیشرفته و خودکارسازی کدنویسی",
        orderIndex: 1,
        episodes: [
          {
            titleFa: "جلسه ۱: تکنیک‌های فرمول‌بندی پرامپت برای برنامه‌نویسان",
            titleEn: "01 - Advanced Prompt Engineering for Developers",
            episodeNumber: 1,
            durationSeconds: 470,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          },
          {
            titleFa: "جلسه ۲: دیباگ، ریفکتورینگ و بهینه‌سازی کدهای پایتون و جاوااسکریپت",
            titleEn: "02 - Debugging and Code Optimization with AI",
            episodeNumber: 2,
            durationSeconds: 600,
            streamUrl: "/api/stream/video",
            isFreePreview: true,
          }
        ]
      },
      {
        titleFa: "فصل ۲: نوشتن تست خودکار، مستندسازی و معماری سیستم",
        orderIndex: 2,
        episodes: [
          {
            titleFa: "جلسه ۳: تولید خودکار Unit Tests و Integration Tests",
            titleEn: "03 - Automated Unit and Integration Test Generation",
            episodeNumber: 3,
            durationSeconds: 760,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          },
          {
            titleFa: "جلسه ۴: تحلیل داده‌های پیچیده و تولید گزارش‌های اجرایی",
            titleEn: "04 - Data Analysis and Executive Summary Reports",
            episodeNumber: 4,
            durationSeconds: 840,
            streamUrl: "/api/stream/video",
            isFreePreview: false,
          }
        ]
      }
    ]
  }
];

async function main() {
  console.log("Seeding and updating EchoDub Web Platform database with full rich courses...");

  for (const courseData of COURSES_DATA) {
    const { chapters, ...cFields } = courseData;

    const course = await prisma.course.upsert({
      where: { slug: cFields.slug },
      update: {
        titleFa: cFields.titleFa,
        titleEn: cFields.titleEn,
        descriptionFa: cFields.descriptionFa,
        instructor: cFields.instructor,
        instructorRole: cFields.instructorRole,
        category: cFields.category,
        level: cFields.level,
        totalDurationMin: cFields.totalDurationMin,
        thumbnailUrl: cFields.thumbnailUrl,
        badgeText: cFields.badgeText,
        rating: cFields.rating,
        studentsCount: cFields.studentsCount,
        isPublished: true,
      },
      create: {
        slug: cFields.slug,
        titleFa: cFields.titleFa,
        titleEn: cFields.titleEn,
        descriptionFa: cFields.descriptionFa,
        instructor: cFields.instructor,
        instructorRole: cFields.instructorRole,
        category: cFields.category,
        level: cFields.level,
        totalDurationMin: cFields.totalDurationMin,
        thumbnailUrl: cFields.thumbnailUrl,
        badgeText: cFields.badgeText,
        rating: cFields.rating,
        studentsCount: cFields.studentsCount,
        isPublished: true,
      }
    });

    // Clean old chapters & recreate structured chapters with valid stream URLs
    await prisma.chapter.deleteMany({ where: { courseId: course.id } });

    for (const chData of chapters) {
      const chapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          titleFa: chData.titleFa,
          orderIndex: chData.orderIndex
        }
      });

      for (const epData of chData.episodes) {
        await prisma.episode.create({
          data: {
            chapterId: chapter.id,
            titleFa: epData.titleFa,
            titleEn: epData.titleEn,
            episodeNumber: epData.episodeNumber,
            durationSeconds: epData.durationSeconds,
            streamUrl: "/api/stream/video",
            isFreePreview: epData.isFreePreview,
          }
        });
      }
    }
  }

  // Update any existing episode whose streamUrl has commondatastorage or sample-video.mp4
  await prisma.episode.updateMany({
    where: {
      OR: [
        { streamUrl: { contains: "commondatastorage" } },
        { streamUrl: { contains: "sample-video.mp4" } },
        { streamUrl: null }
      ]
    },
    data: {
      streamUrl: "/api/stream/video"
    }
  });

  console.log("Database successfully seeded & updated with all 9 comprehensive courses!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
