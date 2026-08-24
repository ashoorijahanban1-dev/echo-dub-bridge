const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CMS Data (Articles, Banners)...");

  // 1. Seed Articles
  const articles = [
    {
      slug: "how-ai-video-dubbing-works",
      title: "پشت صحنه دوبله هوش مصنوعی: از Whisper تا ترجمه کانتکست با Gemini 3",
      excerpt: "بررسی فنی معماری پایپ‌لاین صوتی، داکینگ هوشمند، همگام‌سازی لب و سنتز گفتار عصبی فارسی.",
      content: "در این مقاله بررسی می‌کنیم که چگونه سیستم دوبله خودکار با استفاده از ترنسکریپشن زمانی و هوش مصنوعی مولد با کمترین تاخیر اجرا می‌شود...",
      category: "مهندسی هوش مصنوعی",
      author: "تیم فنی EchoDub",
      readTimeMin: 6,
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
    },
    {
      slug: "docker-kubernetes-guide-2026",
      title: "راهنمای جامع یادگیری کانتینرها در سال ۲۰۲۶ برای توسعه‌دهندگان",
      excerpt: "چرا داکر و کوبرنتیز تبدیل به مهارت‌های اجباری برای هر مهندس نرم‌افزار و دواپس شده‌اند؟",
      content: "با گسترش معماری‌های ابری و میکروسرویس‌ها، کانتینرسازی هسته اصلی توسعه چابک است...",
      category: "دواپس و کلود",
      author: "تیم فنی EchoDub",
      readTimeMin: 4,
      coverImage: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80"
    }
  ];

  for (const a of articles) {
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: a,
      create: a
    });
  }

  // 2. Seed Site Banner
  await prisma.siteBanner.upsert({
    where: { id: "banner-main-promo" },
    update: {
      type: "PROMO",
      title: "دسترسی ۱۰۰٪ رایگان به تمام دوره‌های دوبله‌شده",
      subtitle: "در دوره رونمایی، تمام جلسات بدون هیچ‌گونه قفل یا پرداخت در دسترس شماست.",
      badgeText: "🎉 ویژه لانچ",
      buttonText: "مشاهده کاتالوگ دوره‌ها",
      linkUrl: "/courses",
      isActive: true
    },
    create: {
      id: "banner-main-promo",
      type: "PROMO",
      title: "دسترسی ۱۰۰٪ رایگان به تمام دوره‌های دوبله‌شده",
      subtitle: "در دوره رونمایی، تمام جلسات بدون هیچ‌گونه قفل یا پرداخت در دسترس شماست.",
      badgeText: "🎉 ویژه لانچ",
      buttonText: "مشاهده کاتالوگ دوره‌ها",
      linkUrl: "/courses",
      isActive: true
    }
  });

  console.log("✅ Seeded CMS Articles & Banners successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
