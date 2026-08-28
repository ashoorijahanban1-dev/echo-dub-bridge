/**
 * Voice Tuning & Speech Synthesis Configuration
 * Provides studio-grade acoustic profiles, IT glossary phonetics, and prosody controls.
 */

export interface VoiceProfile {
  id: string;
  nameFa: string;
  gender: "male" | "female";
  engineType: "edge-neural" | "google-gemini" | "azure-custom";
  voiceName: string;
  description: string;
  badge: string;
  color: string;
  defaultRate: string; // e.g. "-4%"
  defaultPitch: string; // e.g. "-1.5Hz"
  audioDuckingVolume: number; // e.g. 0.12 (12% background music/audio)
  tags: string[];
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "male-warm",
    nameFa: "گوینده صمیمی آموزشی (فرید - تیون پادکستی)",
    gender: "male",
    engineType: "edge-neural",
    voiceName: "fa-IR-FaridNeural",
    description: "لحن گرم، صمیمی و رسا با مکث‌های طبیعی؛ بهینه‌شده برای دوره‌های برنامه‌نویسی و پادکست‌های تخصصی.",
    badge: "محبوب‌ترین",
    color: "cyan",
    defaultRate: "-4%",
    defaultPitch: "-1.5Hz",
    audioDuckingVolume: 0.12,
    tags: ["صمیمی", "آموزشی", "تخصصی IT", "بدون لهجه"]
  },
  {
    id: "male-formal",
    nameFa: "گوینده رسمی و مستند (مردانه آکادمیک)",
    gender: "male",
    engineType: "edge-neural",
    voiceName: "fa-IR-FaridNeural",
    description: "لحن جدی، شمرده و آکادمیک؛ مناسب دوره‌های مدیریت، مهندسی داده و مستندات سازمانی.",
    badge: "رسمی",
    color: "blue",
    defaultRate: "-6%",
    defaultPitch: "-2Hz",
    audioDuckingVolume: 0.10,
    tags: ["رسمی", "آکادمیک", "عمیق"]
  },
  {
    id: "female-energetic",
    nameFa: "گوینده شفاف و پرانرژی (دل‌آرا - تیون مدرن)",
    gender: "female",
    engineType: "edge-neural",
    voiceName: "fa-IR-DilaraNeural",
    description: "صدای واضح، شفاف و باانرژی با تلفظ کریستالی حروف؛ ایده‌آل برای هوش مصنوعی و فرانت‌اند.",
    badge: "پرانرژی",
    color: "emerald",
    defaultRate: "-3%",
    defaultPitch: "+0Hz",
    audioDuckingVolume: 0.14,
    tags: ["شفاف", "مدرن", "پرانرژی", "زنانه"]
  },
  {
    id: "gemini-studio",
    nameFa: "گوینده هوش مصنوعی جمنای (Google Neural)",
    gender: "male",
    engineType: "google-gemini",
    voiceName: "fa-IR-Neural2-A",
    description: "صدای نسل جدید هوش مصنوعی گوگل با پردازش محتوای چندحالته و تلفظ بین‌المللی واژگان.",
    badge: "هوشمند",
    color: "purple",
    defaultRate: "-2%",
    defaultPitch: "+0Hz",
    audioDuckingVolume: 0.15,
    tags: ["Google AI", "مدرن", "جمنای"]
  }
];

/**
 * Common IT & Computer Science phonetic mappings for natural Persian speech
 */
export const IT_PHONETIC_GLOSSARY: Record<string, string> = {
  "kubernetes": "کوبرنتیز",
  "k8s": "کوبرنتیز",
  "docker": "داکر",
  "python": "پایتون",
  "javascript": "جاوااسکریپت",
  "typescript": "تایپ‌اسکریپت",
  "react": "ری‌اکت",
  "next.js": "نکست‌جی‌اس",
  "nextjs": "نکست‌جی‌اس",
  "node.js": "نودجی‌اس",
  "nodejs": "نودجی‌اس",
  "fastapi": "فست‌ای‌پی‌آی",
  "api": "ای‌پی‌آی",
  "rest api": "رِست ای‌پی‌آی",
  "graphql": "گراف‌کیواِل",
  "database": "دیتابیس",
  "postgresql": "پُست‌گِرِس",
  "postgres": "پُست‌گِرِس",
  "mongodb": "مانگودی‌بی",
  "redis": "رِدیس",
  "gemini": "جمنای",
  "chatgpt": "چت‌جی‌پی‌تی",
  "claude": "کلود",
  "notebooklm": "نوت‌بوک اِل‌اِم",
  "langchain": "لَنگ‌چِین",
  "rag": "رَگ",
  "pipeline": "پایپ‌لاین",
  "deploy": "دیپلوی",
  "deployment": "دیپلویمنت",
  "frontend": "فرانت‌اند",
  "backend": "بک‌اند",
  "fullstack": "فول‌استک",
  "github": "گیت‌هاب",
  "git": "گیت",
  "ci/cd": "سی‌آی‌سی‌دی",
  "microservices": "میکروسرویس‌ها",
  "devops": "دواپس",
  "machine learning": "یادگیری ماشین",
  "deep learning": "یادگیری عمیق",
  "artificial intelligence": "هوش مصنوعی",
  "prompt": "پرامپت",
  "prompt engineering": "مهندسی پرامپت"
};

/**
 * Normalizes text and applies phonetic replacements for technical terms
 */
export function normalizeTextForSpeech(text: string): string {
  if (!text) return "";
  let processed = text;

  // Replace English terms with natural Persian phonetics
  for (const [enTerm, faPhonetic] of Object.entries(IT_PHONETIC_GLOSSARY)) {
    const regex = new RegExp(`\\b${enTerm}\\b`, "gi");
    processed = processed.replace(regex, faPhonetic);
  }

  // Replace years like 2026 with Persian words
  processed = processed.replace(/\b2026\b/g, "بیست بیست و شش");
  processed = processed.replace(/\b2025\b/g, "بیست بیست و پنج");
  processed = processed.replace(/\b2024\b/g, "بیست بیست و چهار");

  // Normalize punctuation for natural SSML breathing pauses
  processed = processed.replace(/([.?!])\s+/g, "$1 ... ");
  processed = processed.replace(/([،,])\s+/g, "$1 ");

  return processed;
}

export function getVoiceProfileById(id: string): VoiceProfile {
  return VOICE_PROFILES.find((v) => v.id === id) || VOICE_PROFILES[0];
}
