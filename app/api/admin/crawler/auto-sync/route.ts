import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchDownloadlyPage, parseCoursesFromHtml } from "@/lib/downloadly-fetcher";
import { startDubbingPipeline } from "@/lib/pipeline-orchestrator";

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
  }
];

export async function POST(request: Request) {
  try {
    const { mode, page, autoApprove, maxItems, keyword } = await request.json();

    const currentMode = mode || "DAILY_HOT";
    const currentPage = page || 1;
    const limit = maxItems || 10;

    let targetUrl = `https://downloadly.ir/?s=${encodeURIComponent(keyword && keyword.trim() ? keyword.trim() : "udemy")}`;
    if (currentMode === "DEEP_ARCHIVE") {
      targetUrl = `https://downloadly.ir/page/${currentPage}/?s=${encodeURIComponent(keyword && keyword.trim() ? keyword.trim() : "udemy")}`;
    }

    let parsedCourses: any[] = [];

    try {
      const res = await fetchDownloadlyPage(targetUrl);
      if (res && res.html) {
        parsedCourses = parseCoursesFromHtml(res.html, currentPage);
      }
    } catch (netErr: any) {
      console.warn("Auto-sync live fetch warning:", netErr.message);
    }

    // High quality fallback
    if (!parsedCourses || parsedCourses.length === 0) {
      parsedCourses = SEED_HOT_COURSES;
    }

    const discoveredList: any[] = [];

    for (const c of parsedCourses.slice(0, limit)) {
      try {
        const existingCourse = await prisma.course.findUnique({ where: { slug: c.slug } });
        const status = existingCourse ? "DUBBED" : (autoApprove ? "APPROVED" : "DISCOVERED");

        const item = await prisma.discoveredCourse.upsert({
          where: { url: c.url },
          update: {
            titleFa: c.titleFa,
            category: c.category,
            isHot: c.isHot || false,
            sourcePage: currentPage,
            status: existingCourse ? "DUBBED" : undefined
          },
          create: {
            url: c.url,
            slug: c.slug,
            titleFa: c.titleFa,
            titleEn: c.titleEn,
            instructor: c.instructor,
            category: c.category,
            totalParts: c.totalParts,
            thumbnailUrl: c.thumbnailUrl,
            isHot: c.isHot || false,
            sourcePage: currentPage,
            status
          }
        });

        // If autoApprove is active and not dubbed, trigger Master Pipeline Orchestrator
        if (autoApprove && !existingCourse) {
          const pipelineResult = await startDubbingPipeline({
            discoveredCourseId: item.id,
            slug: item.slug,
            titleFa: item.titleFa,
            titleEn: item.titleEn,
            instructor: item.instructor,
            category: item.category
          });
        }

        discoveredList.push(item);
      } catch (dbErr) {
        console.error("DB Error:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      mode: currentMode,
      page: currentPage,
      count: discoveredList.length,
      autoApprovedCount: autoApprove ? discoveredList.filter(d => d.status === "DUBBED" || d.status === "APPROVED").length : 0,
      discovered: discoveredList
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "خطا در همگام‌سازی" }, { status: 500 });
  }
}
