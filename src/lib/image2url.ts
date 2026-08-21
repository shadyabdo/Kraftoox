/* تكامل Image2URL — رفع مباشر + تحويل SVG عبر الواجهة الخارجية v1 */

const UPLOAD_ENDPOINT = "https://www.image2url.com/api/upload";
const EXTERNAL_BASE = "https://www.image2url.com/api/external/v1";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; /* حد نقطة الرفع العامة */

export interface UploadResult {
  url: string;
  provider: string;
}

/* استخراج الرابط من أشكال استجابة محتملة */
function extractUrl(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  const candidates = [
    j.url,
    j.link,
    j.imageUrl,
    (j.data as Record<string, unknown> | undefined)?.url,
    (j.data as Record<string, unknown> | undefined)?.link,
    (j.result as Record<string, unknown> | undefined)?.url,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.startsWith("http")) return c;
  }
  return null;
}

/* رفع صورة إلى Image2URL والحصول على رابط دائم */
export async function uploadImageToUrl(blob: Blob, name: string): Promise<UploadResult> {
  const form = new FormData();
  form.append("file", blob, name);
  form.append("image", blob, name); /* بعض النسخ تقرأ هذا الحقل */

  const res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body: form });
  const text = await res.text();

  if (!res.ok) {
    let msg = `فشل الرفع (${res.status})`;
    try {
      const j = JSON.parse(text);
      const e = (j as Record<string, unknown>).error;
      if (typeof e === "string") msg = e;
      else if (e && typeof e === "object") {
        const m = (e as Record<string, unknown>).message;
        if (typeof m === "string") msg = m;
      }
    } catch {
      if (text) msg = text.slice(0, 140);
    }
    throw new Error(msg);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    /* قد يرجع الرابط نصاً صريحاً */
    const trimmed = text.trim();
    if (trimmed.startsWith("http")) return { url: trimmed, provider: "image2url" };
    throw new Error("استجابة غير متوقعة من الخدمة");
  }

  const url = extractUrl(json);
  if (!url) throw new Error("لم ترجع الخدمة رابطاً — جرّب صورة أخرى");
  return { url, provider: "image2url" };
}

/* ===== الواجهة الخارجية v1: تحويل الصورة المرفوعة إلى SVG ===== */

export async function vectorizeToSvg(
  imageUrl: string,
  apiKey: string,
  onProgress: (p: number) => void
): Promise<string> {
  const auth = `Bearer ${apiKey.trim()}`;

  const submit = await fetch(`${EXTERNAL_BASE}/image-to-svg/vectorize`, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify({ url: imageUrl, output_format: "svg", preset: "logo" }),
  });
  const submitJson = await submit.json().catch(() => ({}));
  if (!submit.ok) {
    const e = (submitJson as Record<string, unknown>).error;
    const msg =
      typeof e === "string"
        ? e
        : e && typeof e === "object"
        ? String((e as Record<string, unknown>).message ?? "فشل الإرسال")
        : `فشل الإرسال (${submit.status})`;
    throw new Error(msg);
  }

  const taskId = (submitJson as Record<string, unknown>).taskId;
  if (typeof taskId !== "string" || !taskId) throw new Error("لم ترجع الخدمة معرّف مهمة");

  /* متابعة المهمة حتى الانتهاء */
  for (let i = 0; i < 80; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await fetch(`${EXTERNAL_BASE}/image-to-svg/status/${taskId}`, {
      headers: { Authorization: auth },
    });
    const statusJson = await statusRes.json().catch(() => ({}));
    if (!statusRes.ok) {
      throw new Error(`تعذّر جلب حالة المهمة (${statusRes.status})`);
    }
    const s = statusJson as Record<string, unknown>;
    const status = String(s.status ?? "");
    if (typeof s.progress === "number") onProgress(s.progress / 100);
    if (status === "completed") {
      const resultUrl = s.resultUrl;
      if (typeof resultUrl === "string" && resultUrl) return resultUrl;
      throw new Error("اكتملت المهمة بدون رابط نتيجة");
    }
    if (status === "failed") {
      throw new Error(typeof s.error === "string" ? s.error : "فشلت مهمة التحويل");
    }
  }
  throw new Error("انتهت مهلة انتظار التحويل");
}

/* ===== ضغط الصورة لتلائم حد الرفع (2MB) ===== */

export function needsDownscale(file: File): boolean {
  return file.size > MAX_UPLOAD_BYTES;
}

/* يعيد نسخة من الصورة لا تتجاوز 2MB عبر تقليل الأبعاد والجودة تدريجياً */
export async function fitUnderLimit(file: File): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
    el.src = URL.createObjectURL(file);
  });

  let scale = 1;
  let quality = 0.9;
  const isPng = file.type.includes("png");

  for (let attempt = 0; attempt < 8; attempt++) {
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    const type = isPng && attempt === 0 ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob>((res) =>
      canvas.toBlob((b) => res(b!), type, type === "image/png" ? undefined : quality)
    );
    if (blob.size <= MAX_UPLOAD_BYTES) return blob;

    /* خفّض أكثر في المحاولة التالية */
    if (quality > 0.55) quality -= 0.12;
    else scale *= 0.82;
  }
  throw new Error("تعذّر ضغط الصورة تحت حد 2MB");
}

export const UPLOAD_LIMIT_LABEL = "2MB";
