import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding EchoDub Web Platform database...");

  // 1. Docker Mastery Course
  await prisma.course.upsert({
    where: { slug: "docker-mastery-course" },
    update: {},
    create: {
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
      chapters: {
        create: [
          {
            titleFa: "فصل اول: مبانی کانتینرسازی و معماری داکر",
            orderIndex: 1,
            episodes: {
              create: [
                {
                  titleFa: "جلسه اول: آشنایی با داکر و تفاوت آن با ماشین‌های مجازی",
                  titleEn: "Introduction to Containers & Virtual Machines",
                  episodeNumber: 1,
                  durationSeconds: 480,
                  streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                  isFreePreview: true,
                },
                {
                  titleFa: "جلسه دوم: کار با دستورات اصلی داکر (Run, Exec, Logs)",
                  titleEn: "Essential Docker CLI Commands in Depth",
                  episodeNumber: 2,
                  durationSeconds: 620,
                  streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                  isFreePreview: true,
                }
              ]
            }
          },
          {
            titleFa: "فصل دوم: ساخت ایمیج‌های بهینه با Dockerfile",
            orderIndex: 2,
            episodes: {
              create: [
                {
                  titleFa: "جلسه سوم: ساخت لایه‌های کانتینر با Multi-Stage Builds",
                  titleEn: "Optimizing Image Layers with Multi-Stage Builds",
                  episodeNumber: 3,
                  durationSeconds: 740,
                  streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                  isFreePreview: false,
                }
              ]
            }
          }
        ]
      }
    }
  });

  // 2. FastAPI Microservices Course
  await prisma.course.upsert({
    where: { slug: "fastapi-microservices-masterclass" },
    update: {},
    create: {
      slug: "fastapi-microservices-masterclass",
      titleFa: "میکروسرویس‌های مقیاس‌پذیر با FastAPI و پایتون",
      titleEn: "Building Scalable Microservices with FastAPI & Python",
      descriptionFa: "طراحی و توسعه سیستم‌های توزیع‌شده با FastAPI، ارزیابی داده‌ها با Pydantic V2، ارتباط ناهمگام با RabbitMQ و پیاده‌سازی کشینگ با Redis.",
      instructor: "Tiangolo (Sebastián Ramírez)",
      instructorRole: "Creator of FastAPI & Software Architect",
      category: "بک‌اند و پایتون",
      level: "متوسط",
      totalDurationMin: 420,
      thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      badgeText: "دوبله هوشمند",
      rating: 4.95,
      studentsCount: 1890,
      chapters: {
        create: [
          {
            titleFa: "فصل اول: معماری ناهمگام و مبانی FastAPI",
            orderIndex: 1,
            episodes: {
              create: [
                {
                  titleFa: "جلسه اول: راه‌اندازی سرور ناهمگام و Dependency Injection",
                  titleEn: "Async Server Setup & Dependency Injection",
                  episodeNumber: 1,
                  durationSeconds: 510,
                  streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                  isFreePreview: true,
                }
              ]
            }
          }
        ]
      }
    }
  });

  // 3. Next.js Fullstack Architecture Course
  await prisma.course.upsert({
    where: { slug: "nextjs-fullstack-architecture" },
    update: {},
    create: {
      slug: "nextjs-fullstack-architecture",
      titleFa: "معماری فول‌استک با Next.js 15 و React Server Components",
      titleEn: "Fullstack Next.js 15, Server Actions & Tailwind Enterprise",
      descriptionFa: "پیاده‌سازی پروژه‌های شرکتی با Next.js 15، بهینه‌سازی سرعت با Server Components، پیاده‌سازی احراز هویت و پایگاه‌های داده مدرن.",
      instructor: "Lee Robinson",
      instructorRole: "VP of Product at Vercel",
      category: "فرانت‌اند و وب",
      level: "پیشرفته",
      totalDurationMin: 360,
      thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
      badgeText: "جدیدترین انتشار",
      rating: 4.88,
      studentsCount: 3100,
      chapters: {
        create: [
          {
            titleFa: "فصل اول: مبانی App Router و Server Actions",
            orderIndex: 1,
            episodes: {
              create: [
                {
                  titleFa: "جلسه اول: طراحی روت‌ها و رندرینگ سمت سرور",
                  titleEn: "App Router Fundamentals & Server-Side Rendering",
                  episodeNumber: 1,
                  durationSeconds: 430,
                  streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
                  isFreePreview: true,
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
