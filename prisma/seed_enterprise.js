const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Enterprise Data (Glossary, Plans, Settings, Demo Users)...");

  // 1. Seed VIP Subscription Plans
  const plans = [
    {
      id: "plan-monthly-vip",
      title: "اشتراک ۱ ماهه VIP",
      description: "دسترسی نامحدود به تمام دوره‌های دوبله‌شده + کیفیت 1080p و زیرنویس دوزبانه",
      priceToman: 199000,
      durationDays: 30,
      badge: "پرفروش‌ترین",
      featuresJson: JSON.stringify([
        "دسترسی نامحدود به تمام دوره‌ها و کارگاه‌ها",
        "کیفیت 1080p Full HD بدون قطعی و تبلیغات",
        "سوئیچ زنده بین صوت فارسی و انگلیسی اصلی",
        "زیرنویس همگام دو زبانه (فارسی و انگلیسی)",
        "پشتیبانی فنی اختصاصی"
      ])
    },
    {
      id: "plan-quarterly-vip",
      title: "اشتراک ۳ ماهه VIP (با ۲۰٪ تخفیف)",
      description: "محبوب‌ترین پلن برای توسعه‌دهندگان و یادگیری پیوسته",
      priceToman: 479000,
      durationDays: 90,
      badge: "تخفیف ویژه",
      featuresJson: JSON.stringify([
        "تمام امکانات پلن ماهانه",
        "۲۰٪ تخفیف نسبت به تمدید ماهانه",
        "دسترسی زودهنگام به دوره‌های جدید",
        "دانلود مستقیم سورس‌کدها و پروژه‌ها"
      ])
    },
    {
      id: "plan-yearly-vip",
      title: "اشتراک سالانه Pro Master (با ۴۰٪ تخفیف)",
      description: "دسترسی کامل ۱۲ ماهه به کارخانه دوبله و تمام دوره‌های آینده",
      priceToman: 1490000,
      durationDays: 365,
      badge: "بیشترین صرفه‌جویی",
      featuresJson: JSON.stringify([
        "دسترسی کامل ۳۶۵ روزه به همه دوره‌ها",
        "۴۰٪ تخفیف استثنایی",
        "امکان پیشنهاد دوره از دانلودلی جهت دوبله فوری",
        "سرور VIP با پهنای باند اختصاصی"
      ])
    }
  ];

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: p.id },
      update: p,
      create: p
    });
  }
  console.log("✅ Seeded 3 Subscription Plans");

  // 2. Seed AI IT Glossary Terms
  const glossary = [
    { sourceTerm: "Kubernetes", targetTerm: "کوبرنتیز (تلفظ تخصصی بدون ترجمه)", category: "DevOps" },
    { sourceTerm: "Docker", targetTerm: "داکر", category: "DevOps" },
    { sourceTerm: "Container", targetTerm: "کانتینر", category: "DevOps" },
    { sourceTerm: "Middleware", targetTerm: "میدل‌ور", category: "Backend" },
    { sourceTerm: "Props", targetTerm: "Props (پارامترهای ورودی کامپوننت)", category: "Frontend" },
    { sourceTerm: "State", targetTerm: "State (وضعیت)", category: "Frontend" },
    { sourceTerm: "Hydration", targetTerm: "هایدریشن (Hydration)", category: "Frontend" },
    { sourceTerm: "Backend", targetTerm: "بک‌اند", category: "General" },
    { sourceTerm: "Frontend", targetTerm: "فرانت‌اند", category: "General" },
    { sourceTerm: "Dependency Injection", targetTerm: "تزریق وابستگی (Dependency Injection)", category: "Architecture" },
    { sourceTerm: "Microservices", targetTerm: "میکروسرویس‌ها", category: "Architecture" },
    { sourceTerm: "Ducking", targetTerm: "داکینگ صدا (کاهش هوشمند صدای پس‌زمینه)", category: "Audio" }
  ];

  for (const g of glossary) {
    await prisma.glossaryTerm.upsert({
      where: { sourceTerm: g.sourceTerm },
      update: g,
      create: g
    });
  }
  console.log("✅ Seeded 12 Glossary Terms");

  // 3. Seed System Settings
  const settings = [
    { key: "GEMINI_MODEL", value: "gemini-2.5-flash", group: "AI", description: "مدل هوش مصنوعی ترجمه و تولید متن" },
    { key: "TELEGRAM_CHANNEL_ID", value: "-1004449817719", group: "TELEGRAM", description: "شناسه کانال فضای ابری تلگرام" },
    { key: "RATE_LIMIT_PER_MINUTE", value: "120", group: "SECURITY", description: "حداکثر درخواست مجاز هر IP در دقیقه" },
    { key: "DEFAULT_VOICE_GENDER", value: "male", group: "AI", description: "گوینده پیش‌فرض دوبله هوش مصنوعی" }
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s
    });
  }
  console.log("✅ Seeded 4 System Settings");

  // 4. Seed Demo Users
  const users = [
    {
      id: "user-admin",
      email: "admin@rpim.ir",
      name: "علیرضا (مدیر ارشد)",
      role: "ADMIN",
      isVip: true,
      vipExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000)
    },
    {
      id: "user-student-1",
      email: "student@rpim.ir",
      name: "محمد امینی",
      role: "USER",
      isVip: true,
      vipExpiresAt: new Date(Date.now() + 28 * 24 * 3600 * 1000)
    },
    {
      id: "user-student-2",
      email: "zahra@rpim.ir",
      name: "زهرا حسینی",
      role: "USER",
      isVip: false
    }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u
    });
  }
  console.log("✅ Seeded 3 Users");

  console.log("🎉 Enterprise Seeding Finished Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
