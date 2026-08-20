/* تكامل الذكاء الاصطناعي — Pollinations.ai (مجاني، بدون مفتاح API، بدون علامة مائية) */

export interface AiImageOptions {
  width: number;
  height: number;
  seed: number;
  model: "flux" | "turbo";
}

export function aiImageUrl(prompt: string, opts: AiImageOptions): string {
  const p = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${p}?width=${opts.width}&height=${opts.height}&seed=${opts.seed}&model=${opts.model}&nologo=true&enhance=true&safe=true`;
}

/* تحميل الصورة المولدة كـ Blob للتنزيل المحلي */
export async function fetchAiImage(prompt: string, opts: AiImageOptions): Promise<Blob> {
  const res = await fetch(aiImageUrl(prompt, opts));
  if (!res.ok) throw new Error("تعذّر توليد الصورة — جرّب مرة أخرى");
  return res.blob();
}

export interface VideoScript {
  title: string;
  scenes: string[];
}

const FALLBACK_TEMPLATES = [
  "اكتشف {t} من زاوية لم تخطر على بالك من قبل",
  "إليك أقوى الحقائق المدهشة عن {t}",
  "لماذا يتحدث الجميع عن {t} في 2026؟",
  "أسرار {t} التي لا يعرفها إلا القلة",
  "رحلة بصرية مذهلة في عالم {t}",
  "{t}: القصة الكاملة في دقائق معدودة",
  "أغرب التفاصيل التي تخفيها {t} عنا",
  "كل ما تحتاج معرفته عن {t} في مشهد واحد",
  "من البداية إلى الاحتراف: عالم {t}",
  "حقائق عن {t} ستغيّر نظرتك للأبد",
  "الجانب الخفي من {t} الذي لم تره من قبل",
  "تأمل معي هذه اللقطة المذهلة من عالم {t}",
];

/* توليد سيناريو عربي عبر نموذج لغوي مجاني مع بديل محلي مضمون */
export async function generateArabicScript(topic: string, sceneCount: number): Promise<VideoScript> {
  const n = Math.min(Math.max(sceneCount, 3), 12);
  try {
    const prompt = `أنت كاتب سيناريو يوتيوب محترف. اكتب بالضبط ${n} جملة عربية قصيرة آسرة (6-10 كلمات لكل جملة) كتعليقات لمشاهد فيديو عن: "${topic}". ثم اقترح عنواناً جذاباً واحداً. أرجع JSON فقط بدون أي نص آخر بهذا الشكل بالضبط: {"title":"...","scenes":["...","..."]}`;
    const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error("bad status");
    const text = await res.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("no json");
    const parsed = JSON.parse(jsonMatch[0]) as { title?: string; scenes?: unknown };
    const scenes = Array.isArray(parsed.scenes)
      ? parsed.scenes.filter((s): s is string => typeof s === "string" && s.trim().length > 2).slice(0, n)
      : [];
    if (scenes.length < 2 || !parsed.title) throw new Error("incomplete");
    return { title: String(parsed.title).slice(0, 120), scenes };
  } catch {
    /* البديل المحلي: يعمل بدون إنترنت أو عند فشل النموذج */
    const shuffled = [...FALLBACK_TEMPLATES]
      .sort(() => Math.random() - 0.5)
      .slice(0, n)
      .map((t) => t.replace(/\{t\}/g, topic));
    return { title: `${topic} — قصة لم تُروَ من قبل`, scenes: shuffled };
  }
}

/* بناء برومبت صورة بالإنجليزية من موضوع عربي + نمط (النماذج تفهم الإنجليزية أفضل) */
export function buildScenePrompt(topic: string, style: string, index: number): string {
  const angles = [
    "wide cinematic establishing shot",
    "dramatic close-up detail",
    "golden hour atmospheric view",
    "aerial top-down perspective",
    "moody dramatic lighting",
    "vibrant colorful composition",
    "minimalist elegant framing",
    "epic scale landscape",
  ];
  const angle = angles[index % angles.length];
  return `${topic}, ${style}, ${angle}, professional photography, ultra detailed, 8k quality, no text, no watermark`;
}

export const AI_STYLES = [
  { id: "cinematic", ar: "سينمائي", en: "cinematic film style, dramatic lighting" },
  { id: "realistic", ar: "واقعي", en: "photorealistic, natural light" },
  { id: "anime", ar: "أنمي", en: "anime style, studio quality illustration" },
  { id: "3d", ar: "ثلاثي الأبعاد", en: "3d render, octane, pixar style" },
  { id: "oil", ar: "رسم زيتي", en: "oil painting, classical art, brush strokes" },
  { id: "cyber", ar: "مستقبلي", en: "futuristic cyberpunk, neon accents" },
] as const;
