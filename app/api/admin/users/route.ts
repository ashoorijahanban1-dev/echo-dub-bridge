import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, isVip, durationDays } = await request.json();
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

    const vipExpiresAt = isVip 
      ? new Date(Date.now() + (durationDays || 30) * 24 * 3600 * 1000)
      : null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVip, vipExpiresAt }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
