/* تكامل Image2URL — رفع مباشر + تحويل SVG عبر الواجهة الخارجية v1
   سلسلة مزوّدين: Image2URL مباشرة ← عبر وكيل CORS ← tmpfiles.org ← uguu.se
   أي مزوّد ينجح تُعاد نتيجته مع اسمه ليُعرض للمستخدم بشفافية */

const UPLOAD_ENDPOINT = "https://www.image2url.com/api/upload";
const CORS_PROXY = "https://corsproxy.io/?url=";
const EXTERNAL_BASE = "https://www.image2url.com/api/external/v1";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; /* حد نقطة الرفع العامة */

export type Provider = "image2url" | "image2url-proxy" | "tmpfiles" | "uguu";

export interface UploadResult {
  url: string;
  provider: Provider;
}

export const PROVIDER_INFO: Record<Provider, { ar: string; en: string; permanent: boolean }> = {
  image2url: { ar: "Image2URL — رابط دائم لا ينتهي", en: "Image2URL — permanent link, never expires", permanent: true },
  "image2url-proxy": { ar: "Image2URL (عبر وكيل) — رابط دائم", en: "Image2URL (via proxy) — permanent link", permanent: true },
  tmpfiles: { ar: "tmpfiles.org — رابط مؤقت (احتياطي)", en: "tmpfiles.org — temporary link (fallback)", permanent: false },
  uguu: { ar: "uguu.se — رابط 48 ساعة (احتياطي)", en: "uguu.se — 48h link (fallback)", permanent: false },
};

function isNetworkFailure(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof Error && /fetch|network/i.test(err.message));
}

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

async function postForm(
  endpoint: string,
  blob: Blob,
  name: string,
  field: string,
  timeoutMs: number
): Promise<Response> {
  const form = new FormData();
  form.append(field, blob, name);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(endpoint, { method: "POST", body: form, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ===== المزوّد ١: Image2URL مباشرة ===== */
async function tryImage2Url(endpoint: string, blob: Blob, name: string): Promise<string> {
  const res = await postForm(endpoint, blob, name, "file", 25000);
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = JSON.parse(text);
      const e = (j as Record<string, unknown>).error;
      if (typeof e === "string") msg = e;
      else if (e && typeof e === "object") {
        const m = (e as Record<string, unknown>).message;
        if (typeof m === "string") msg = m;
      }
    } catch {
      if (text && text.length < 200) msg = text;
    }
    throw new Error(msg);
  }

  try {
    const url = extractUrl(JSON.parse(text));
    if (url) return url;
  } catch {
    const trimmed = text.trim();
    if (trimmed.startsWith("http")) return trimmed;
  }
  throw new Error("استجابة غير متوقعة من الخدمة");
}

/* ===== المزوّد ٢: tmpfiles.org (رابط مؤقت) ===== */
async function tryTmpfiles(blob: Blob, name: string): Promise<string> {
  const res = await postForm("https://tmpfiles.org/api/v1/upload", blob, name, "file", 20000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { status?: string; data?: { url?: string } };
  if (json.status === "success" && json.data?.url) {
    return json.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
  }
  throw new Error("bad response");
}

/* ===== المزوّد ٣: uguu.se (رابط 48 ساعة) ===== */
async function tryUguu(blob: Blob, name: string): Promise<string> {
  const form = new FormData();
  form.append("files[]", blob, name);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch("https://uguu.se/upload?output=json", {
      method: "POST",
      body: form,
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      success?: boolean;
      files?: Array<{ url?: string }>;
      description?: string;
    };
    const url = json.files?.[0]?.url;
    if (json.success && url) return url;
    throw new Error(json.description ?? "bad response");
  } finally {
    clearTimeout(timer);
  }
}

/* رفع صورة والحصول على رابط — يجرّب المزوّدين بالترتيب */
export async function uploadImageToUrl(blob: Blob, name: string): Promise<UploadResult> {
  const attempts: Array<{ provider: Provider; run: () => Promise<string> }> = [
    { provider: "image2url", run: () => tryImage2Url(UPLOAD_ENDPOINT, blob, name) },
    {
      provider: "image2url-proxy",
      run: () => tryImage2Url(CORS_PROXY + encodeURIComponent(UPLOAD_ENDPOINT), blob, name),
    },
    { provider: "tmpfiles", run: () => tryTmpfiles(blob, name) },
    { provider: "uguu", run: () => tryUguu(blob, name) },
  ];

  const failures: string[] = [];
  for (const attempt of attempts) {
    try {
      const url = await attempt.run();
      if (url) return { url, provider: attempt.provider };
    } catch (err) {
      failures.push(
        `${attempt.provider}: ${isNetworkFailure(err) ? "network/CORS" : err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  throw new Error(
    `فشلت كل مزوّدات الاستضافة — تحقق من اتصالك بالإنترنت أو أوقف مانع الإعلانات ثم أعد المحاولة. (${failures.join(" | ")})`
  );
}

/* ===== الواجهة الخارجية v1: تحويل الصورة المرفوعة إلى SVG ===== */

export async function vectorizeToSvg(
  imageUrl: string,
  apiKey: string,
  onProgress: (p: number) => void
): Promise<string> {
  const auth = `Bearer ${apiKey.trim()}`;

  let submit: Response;
  try {
    submit = await fetch(`${EXTERNAL_BASE}/image-to-svg/vectorize`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl, output_format: "svg", preset: "logo" }),
    });
  } catch {
    throw new Error(
      "تعذّر الاتصال بواجهة Image2URL الخارجية (قد تمنع CORS استدعاءها من المتصفح) — جرّب من خادمك أو عبر وكيل."
    );
  }
  const submitJson = await submit.json().catch(() => ({}));
  if (!submit.ok) {
    const e = (submitJson as Record<string, unknown>).error;
    const msg =
      typeof e === "string"
        ? e
        : e && typeof e === "object"
        ? String((e as Record<string, unknown>).message ?? `فشل الإرسال (${submit.status})`)
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
