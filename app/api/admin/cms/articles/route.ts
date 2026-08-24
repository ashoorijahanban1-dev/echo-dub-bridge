import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(articles);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, slug, excerpt, content, category, author, readTimeMin, coverImage } = await request.json();
    if (!title || !slug || !content) {
      return NextResponse.json({ error: "عنوان، نامک (slug) و محتوای مقاله الزامی است." }, { status: 400 });
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug: slug.toLowerCase().trim().replace(/[\s_]+/g, "-"),
        excerpt: excerpt || title,
        content,
        category: category || "عمومی",
        author: author || "تیم فنی EchoDub",
        readTimeMin: readTimeMin || 5,
        coverImage: coverImage || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80"
      }
    });

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "شناسه الزامی است." }, { status: 400 });

    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
