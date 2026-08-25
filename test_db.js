const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const item = await prisma.discoveredCourse.upsert({
    where: { url: 'https://downloadly.ir/elearning/video-tutorials/complete-generative-ai-bootcamp-2026/' },
    update: {
      titleFa: 'Udemy – Complete Generative AI Bootcamp 2026: LangChain, Agents, RAG',
      isHot: true,
      sourcePage: 1
    },
    create: {
      url: 'https://downloadly.ir/elearning/video-tutorials/complete-generative-ai-bootcamp-2026/',
      slug: 'complete-generative-ai-bootcamp-2026',
      titleFa: 'Udemy – Complete Generative AI Bootcamp 2026: LangChain, Agents, RAG',
      titleEn: 'Complete Generative AI Bootcamp 2026',
      instructor: 'Dr. Angela Yu',
      category: 'هوش مصنوعی و داده',
      totalParts: 4,
      isHot: true,
      sourcePage: 1,
      status: 'DISCOVERED'
    }
  });
  console.log('Upsert local success:', item.id);
  const all = await prisma.discoveredCourse.findMany();
  console.log('Total local count:', all.length);
  await prisma.$disconnect();
}

run();
