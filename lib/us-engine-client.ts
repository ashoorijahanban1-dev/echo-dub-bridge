import http from "http";

const US_ENGINE_IP = "209.145.63.253";
const US_ENGINE_HOST_HEADER = "75glmxpk5jxiudgaa1jzsny9.209.145.63.253.sslip.io";

export interface SubmitJobParams {
  video_url: string;
  title: string;
  voice_gender?: string;
  preserve_bgm?: boolean;
}

export async function submitDubbingJobDirect(params: SubmitJobParams): Promise<{ job_id: string; status: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      video_url: params.video_url,
      title: params.title,
      voice_gender: params.voice_gender || "male",
      preserve_bgm: params.preserve_bgm !== false
    });

    const options: http.RequestOptions = {
      hostname: US_ENGINE_IP,
      port: 80,
      path: "/api/v1/dub/submit",
      method: "POST",
      headers: {
        "Host": US_ENGINE_HOST_HEADER,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Invalid JSON response from US engine"));
          }
        } else {
          reject(new Error(`US engine returned HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("اتصال به سرور آمریکا با تایم‌اوت ۳۰ ثانیه‌ای مواجه شد."));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

export async function getDubbingJobStatusDirect(jobId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: US_ENGINE_IP,
      port: 80,
      path: `/api/v1/dub/status/${jobId}`,
      method: "GET",
      headers: {
        "Host": US_ENGINE_HOST_HEADER
      },
      timeout: 15000
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Invalid JSON response from US engine status"));
          }
        } else {
          reject(new Error(`US engine status HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("تایم‌اوت در دریافت وضعیت از سرور آمریکا"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}
