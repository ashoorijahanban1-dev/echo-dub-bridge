import http from "http";
import fs from "fs";
import path from "path";

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
    const effectiveGender = (params.voice_gender && params.voice_gender.toLowerCase().includes("female")) ? "female" : "male";
    const payload = JSON.stringify({
      video_url: params.video_url,
      title: params.title,
      voice_gender: effectiveGender,
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

export async function uploadDubbingFileDirect({
  filePath,
  title,
  voice_gender = "male",
  preserve_bgm = true
}: {
  filePath: string;
  title: string;
  voice_gender?: string;
  preserve_bgm?: boolean;
}): Promise<{ job_id: string; status: string }> {
  return new Promise((resolve, reject) => {
    const effectiveGender = (voice_gender && voice_gender.toLowerCase().includes("female")) ? "female" : "male";
    const boundary = `----WebKitFormBoundary${Date.now().toString(16)}`;
    const filename = path.basename(filePath);
    const fileStream = fs.createReadStream(filePath);
    const stats = fs.statSync(filePath);

    let header = `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="title"\r\n\r\n${title}\r\n`;
    header += `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="voice_gender"\r\n\r\n${effectiveGender}\r\n`;
    header += `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="preserve_bgm"\r\n\r\n${preserve_bgm}\r\n`;
    header += `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    header += `Content-Type: video/mp4\r\n\r\n`;

    const footer = `\r\n--${boundary}--\r\n`;
    const totalLength = Buffer.byteLength(header) + stats.size + Buffer.byteLength(footer);

    const options: http.RequestOptions = {
      hostname: US_ENGINE_IP,
      port: 80,
      path: "/api/v1/dub/upload",
      method: "POST",
      headers: {
        "Host": US_ENGINE_HOST_HEADER,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": totalLength
      },
      timeout: 120000
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Invalid JSON response from US engine upload"));
          }
        } else {
          reject(new Error(`US engine upload returned HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("تایم‌اوت در آپلود ویدیو به سرور آمریکا"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(header);
    fileStream.pipe(req, { end: false });
    fileStream.on("end", () => {
      req.write(footer);
      req.end();
    });
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
