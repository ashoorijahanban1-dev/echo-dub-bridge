import { NextResponse } from "next/server";
import { submitDubbingJobToEngine } from "@/lib/api-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { video_url, title, voice_gender } = body;

    if (!video_url) {
      return NextResponse.json({ error: "video_url is required" }, { status: 400 });
    }

    const job = await submitDubbingJobToEngine(video_url, title, voice_gender || "male-warm");
    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
