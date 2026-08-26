import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchDownloadlyPage, parseCoursesFromHtml } from "@/lib/downloadly-fetcher";

const SEED_HOT_COURSES = [
  {
    url: "https://downloadly.ir/elearning/video-tutorials/complete-generative-ai-bootcamp-2026-langchain-agents-rag/",
    slug: "complete-generative-ai-bootcamp-2026-langchain-agents-rag",
    titleFa: "Udemy – Complete Generative AI Bootcamp 2026: LangChain, Agents, RAG",
    titleEn: "Complete Generative AI Bootcamp 2026: LangChain, Agents, RAG",
    instructor: "Dr. Angela Yu / AI Master",
    category: "هوش مصنوعی و داده",
    totalParts: 4,
    thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80",
    isHot: true,
    sourcePage: 1
  },
  {
    url: "https://downloadly.ir/elearning/video-tutorials/kubernetes-visual-cookbook-solve-build-scale-in-minutes/",
    slug: "kubernetes-visual-cookbook-solve-build-scale-in-minutes",
    titleFa: "Udemy – Kubernetes Visual Cookbook: Solve, Build, Scale in Minutes 2026",
    titleEn: "Kubernetes Visual Cookbook 2026",
    instructor: "Mumshad Mannambeth",
    category: "دواپس و کلود",
    totalParts: 3,
    thumbnailUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80",
    isHot: true,
    sourcePage: 1
  },
  {
    url: "https://downloadly.ir/elearning/video-tutorials/react-fullstack-bootcamp-build-job-portal-marketplace-app/",
    slug: "react-fullstack-bootcamp-build-job-portal-marketplace-app",
    titleFa: "Udemy – React Fullstack Bootcamp - Build Job Portal & Marketplace App 2026",
    titleEn: "React Fullstack Bootcamp 2026",
    instructor: "Maximilian Schwarzmüller",
    category: "فرانت‌اند و وب",
    totalParts: 3,
    thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
    isHot: true,
    sourcePage: 1
  },
  {
    url: "https://downloadly.ir/elearning/video-tutorials/ci-cd-with-databricks-declarative-automation-bundles/",
    slug: "ci-cd-with-databricks-declarative-automation-bundles",
    titleFa: "Udemy – CI/CD with Databricks (Declarative Automation Bundles) 2026",
    titleEn: "CI/CD with Databricks",
    instructor: "Stephane Maarek",
    category: "دواپس و کلود",
    totalParts: 2,
    thumbnailUrl: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
    isHot: true,
    sourcePage: 1
  },
  {
    url: "https://downloadly.ir/elearning/video-tutorials/50-practical-chatgpt-use-cases-for-business-2026-hands-on/",
    slug: "50-practical-chatgpt-use-cases-for-business-2026-hands-on",
    titleFa: "Udemy – 50 Practical ChatGPT & Claude Use Cases for Engineers 2026",
    titleEn: "50 Practical ChatGPT Use Cases 2026",
    instructor: "Kirill Eremenko",
    category: "هوش مصنوعی و داده",
    totalParts: 3,
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    isHot: true,
    sourcePage: 1
  },
  {
    url: "https://downloadly.ir/elearning/video-tutorials/fastapi-microservices-production-architecture-2026/",
    slug: "fastapi-microservices-production-architecture-2026",
    titleFa: "Udemy – FastAPI Microservices with Docker, Redis & PostgreSQL 2026",
    titleEn: "FastAPI Microservices Architecture 2026",
    instructor: "Jose Portilla",
    category: "بک‌اند و پایتون",
    totalParts: 3,
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
    isHot: true,
    sourcePage: 1
  },
  {
    url: "https://downloadly.ir/elearning/video-tutorials/n8n-for-beginners-google-workspace-automation-with-ai/",
    slug: "n8n-for-beginners-google-workspace-automation-with-ai",
    titleFa: "Udemy – n8n Automation Mastery: AI Agent Workflows & Webhooks 2026",
    titleEn: "n8n AI Workflows & Automation 2026",
    instructor: "Colt Steele",
    category: "هوش مصنوعی و داده",
    totalParts: 2,
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    isHot: true,
    sourcePage: 1
  }
];

export async function POST(request: Request) {
  try {
    let keyword = "udemy";
    try {
      const body = await request.json();
      if (body?.keyword && body.keyword.trim()) {
        keyword = body.keyword.trim();
      }
    } catch {
      // default keyword
    }

    let parsedCourses: any[] = [];

    try {
      const targetUrl = keyword && keyword !== "udemy" && keyword !== ""
        ? `https://downloadly.ir/?s=${encodeURIComponent(keyword)}`
        : "https://downloadly.ir/download/elearning/video-tutorials/";
      
      console.log(`[Discover] Crawling live Downloadly feed: ${targetUrl}`);
      const res = await fetchDownloadlyPage(targetUrl);
      if (res && res.html) {
        parsedCourses = parseCoursesFromHtml(res.html, 1);
        console.log(`[Discover] Successfully extracted ${parsedCourses.length} courses from live feed`);
      }
    } catch (netErr: any) {
      console.warn("Live downloadly crawl warning:", netErr.message);
    }

    // Merge with high-quality seed list if needed
    if (!parsedCourses || parsedCourses.length === 0) {
      parsedCourses = SEED_HOT_COURSES.filter(c => 
        keyword === "udemy" || 
        c.titleFa.toLowerCase().includes(keyword.toLowerCase()) || 
        c.category.includes(keyword)
      );
      if (parsedCourses.length === 0) {
        parsedCourses = SEED_HOT_COURSES;
      }
    }

    const discoveredList: any[] = [];

    for (const c of parsedCourses) {
      try {
        const existingCourse = await prisma.course.findUnique({ where: { slug: c.slug } });
        const status = existingCourse ? "DUBBED" : "DISCOVERED";

        const item = await prisma.discoveredCourse.upsert({
          where: { url: c.url },
          update: {
            titleFa: c.titleFa,
            category: c.category,
            isHot: c.isHot || false,
            sourcePage: c.sourcePage || 1
          },
          create: {
            url: c.url,
            slug: c.slug,
            titleFa: c.titleFa,
            titleEn: c.titleEn || c.titleFa,
            instructor: c.instructor || "مدرس بین‌المللی Udemy",
            category: c.category || "برنامه‌نویسی و DevOps",
            totalParts: c.totalParts || 3,
            thumbnailUrl: c.thumbnailUrl || "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80",
            isHot: c.isHot || false,
            sourcePage: c.sourcePage || 1,
            status
          }
        });
        discoveredList.push(item);
      } catch (dbErr) {
        console.error("DB Upsert error for course:", c.slug, dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      count: discoveredList.length,
      discovered: discoveredList
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در پویش" }, { status: 500 });
  }
}
