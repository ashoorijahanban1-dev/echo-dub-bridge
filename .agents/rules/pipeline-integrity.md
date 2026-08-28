# EchoDub Pipeline Integrity & Media Processing Invariants

## 1. Zero Mock Fallbacks in Production
- Never use simulated timer loops (`setTimeout` or sleep) to fake job completion in error handlers or pipeline orchestrators.
- If an AI transcription, translation, voice synthesis, or Telegram upload step fails, immediately mark the batch as `FAILED` with detailed diagnostic stack traces and logs.

## 2. Downloadly Live Scraping Invariants
- Always scrape `https://downloadly.ir/download/elearning/video-tutorials/` and `/download/elearning/video-tutorials/page/{N}/` for real-time educational course ingestion.
- Parse clean HTML entity titles and filter out WordPress UI boilerplate (`ادامه مطلب`, `دیدگاه‌ها`, `صفحه‌بندی`, `آموزش‌های`).

## 3. Direct Binary Ingestion to AI Engine
- Stream actual course video files directly to the engine's `/api/v1/dub/upload` endpoint as `multipart/form-data`.
- In the audio extraction stage, ensure silent video fallbacks exist so FFmpeg does not crash if an input file lacks an audio stream.
- Track every Telegram upload `file_id` and `message_id` directly in database episode schemas.
