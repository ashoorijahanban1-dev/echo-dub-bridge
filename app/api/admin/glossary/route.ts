import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const terms = await prisma.glossaryTerm.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(terms);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sourceTerm, targetTerm, category } = await request.json();
    if (!sourceTerm || !targetTerm) {
      return NextResponse.json({ error: "کلمه انگلیسی و معادل فارسی الزامی است." }, { status: 400 });
    }

    const term = await prisma.glossaryTerm.upsert({
      where: { sourceTerm: sourceTerm.trim() },
      update: { targetTerm: targetTerm.trim(), category: category || "General" },
      create: { sourceTerm: sourceTerm.trim(), targetTerm: targetTerm.trim(), category: category || "General" }
    });

    return NextResponse.json({ success: true, term });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "شناسه الزامی است." }, { status: 400 });

    await prisma.glossaryTerm.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
