export const US_ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL || "http://75glmxpk5jxiudgaa1jzsny9.209.145.63.253.sslip.io";

export interface DubbingJobStatus {
  job_id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  current_stage: string;
  result?: {
    success: boolean;
    job_id: string;
    title: string;
    duration_seconds: number;
    elapsed_time_seconds: number;
    telegram?: {
      uploaded: boolean;
      telegram_link?: string;
      message_id?: number;
    };
    segments_count?: number;
  };
  error?: string;
}

export async function submitDubbingJobToEngine(videoUrl: string, title?: string, voiceGender: string = "male"): Promise<DubbingJobStatus> {
  const res = await fetch(`${US_ENGINE_URL}/api/v1/dub/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_url: videoUrl,
      title,
      voice_gender: voiceGender,
      preserve_bgm: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Engine request failed: ${res.statusText}`);
  }

  return res.json();
}

export async function getEngineJobStatus(jobId: string): Promise<DubbingJobStatus> {
  const res = await fetch(`${US_ENGINE_URL}/api/v1/dub/status/${jobId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch job status: ${res.statusText}`);
  }

  return res.json();
}
