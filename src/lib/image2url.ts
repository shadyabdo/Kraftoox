/* رفع الصور للحصول على رابط — سباق مزوّدين متوازٍ
   تُطلَق المحاولات متتابعة بفواصل قصيرة ويُعتمد أول نجاح فوراً (مع إلغاء البقية).
   الترتيب: الأوثق من المتصفح أولاً (Catbox رابط دائم) ثم Image2URL وبواباته ثم الاحتياطيات. */

const IMAGE2URL_UPLOAD = "https://www.image2url.com/api/upload";
const EXTERNAL_BASE = "https://www.image2url.com/api/external/v1";
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; /* حد نقطة رفع Image2URL العامة */

export type Provider =
  | "local"
  | "catbox"
  | "image2url"
  | "image2url-corsproxy"
  | "image2url-allorigins"
  | "tmpninja"
  | "tmpfiles"
  | "uguu"
  | "litterbox";

export interface UploadResult {
  url: string;
  provider: Provider;
}

export const PROVIDER_INFO: Record<Provider, { ar: string; en: string; permanent: boolean }> = {
  local: { ar: "رابط Data URL مضمون — يعمل دائماً بلا اتصال", en: "Guaranteed Data URL — always works, no network needed", permanent: true },
  catbox: { ar: "Catbox — رابط دائم لا ينتهي", en: "Catbox — permanent link, never expires", permanent: true },
  image2url: { ar: "Image2URL — رابط دائم لا ينتهي", en: "Image2URL — permanent link, never expires", permanent: true },
  "image2url-corsproxy": { ar: "Image2URL (بوابة ١) — رابط دائم", en: "Image2URL (gateway 1) — permanent link", permanent: true },
  "image2url-allorigins": { ar: "Image2URL (بوابة ٢) — رابط دائم", en: "Image2URL (gateway 2) — permanent link", permanent: true },
  tmpninja: { ar: "tmp.ninja — رابط مؤقت (احتياطي)", en: "tmp.ninja — temporary link (fallback)", permanent: false },
  tmpfiles: { ar: "tmpfiles.org — رابط مؤقت (احتياطي)", en: "tmpfiles.org — temporary link (fallback)", permanent: false },
  uguu: { ar: "uguu.se — رابط 48 ساعة (احتياطي)", en: "uguu.se — 48h link (fallback)", permanent: false },
  litterbox: { ar: "Litterbox — رابط 72 ساعة (احتياطي)", en: "Litterbox — 72h link (fallback)", permanent: false },
};

/* متحكم مرتبط بإشارة خارجية + مهلة زمنية */
function linkedController(outer: AbortSignal, ms: number) {
  const c = new AbortController();
  const timer = window.setTimeout(() => c.abort(new Error("timeout")), ms);
  const onOuter = () => c.abort(new Error("aborted"));
  if (outer.aborted) onOuter();
  else outer.addEventListener("abort", onOuter, { once: true });
  return {
    signal: c.signal,
    done: () => {
      window.clearTimeout(timer);
      outer.removeEventListener("abort", onOuter);
    },
  };
}

function classify(err: unknown): string {
  if (err instanceof Error) {
    if (err.message === "timeout") return "انتهت المهلة (timeout)";
    if (err.message === "aborted") return "أُلغي";
    if (err.message) return err.message;
  }
  if (err instanceof TypeError) return "network/CORS";
  return String(err);
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

/* ===== Catbox.moe: دائم، يدعم CORS من المتصفح، حتى 200MB ===== */
async function tryCatbox(blob: Blob, name: string, outer: AbortSignal): Promise<string> {
  const { signal, done } = linkedController(outer, 15000);
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", blob, name);
    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: form,
      signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const t = text.trim();
    if (t.startsWith("http")) return t;
    throw new Error(t.slice(0, 120) || "bad response");
  } finally {
    done();
  }
}

/* ===== Image2URL (مباشرة أو عبر بوابة) ===== */
async function tryImage2Url(endpoint: string, blob: Blob, name: string, outer: AbortSignal): Promise<string> {
  const { signal, done } = linkedController(outer, 14000);
  try {
    const form = new FormData();
    form.append("file", blob, name);
    const res = await fetch(endpoint, { method: "POST", body: form, signal });
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
    throw new Error("bad response");
  } finally {
    done();
  }
}

/* ===== tmp.ninja (مؤقت، يدعم CORS) ===== */
async function tryTmpNinja(blob: Blob, name: string, outer: AbortSignal): Promise<string> {
  const { signal, done } = linkedController(outer, 15000);
  try {
    const form = new FormData();
    form.append("files[]", blob, name);
    const res = await fetch("https://tmp.ninja/upload.php?output=json", {
      method: "POST",
      body: form,
      signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let j: Record<string, unknown>;
    try {
      j = JSON.parse(text);
    } catch {
      /* بعض الاستجابات تبدأ بسطر حالة قبل الـ JSON */
      const idx = text.indexOf("{");
      if (idx === -1) throw new Error("bad response");
      j = JSON.parse(text.slice(idx));
    }
    const files = j.files as Array<Record<string, unknown>> | undefined;
    const url = files?.[0]?.url;
    if (typeof url === "string" && url.startsWith("http")) return url;
    const err = j.error as Record<string, unknown> | undefined;
    throw new Error(typeof err?.message === "string" ? err.message : "bad response");
  } finally {
    done();
  }
}

/* ===== tmpfiles.org (مؤقت) ===== */
async function tryTmpfiles(blob: Blob, name: string, outer: AbortSignal): Promise<string> {
  const { signal, done } = linkedController(outer, 15000);
  try {
    const form = new FormData();
    form.append("file", blob, name);
    const res = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: form, signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { status?: string; data?: { url?: string } };
    if (json.status === "success" && json.data?.url) {
      return json.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    }
    throw new Error("bad response");
  } finally {
    done();
  }
}

/* ===== uguu.se (48 ساعة) ===== */
async function tryUguu(blob: Blob, name: string, outer: AbortSignal): Promise<string> {
  const { signal, done } = linkedController(outer, 15000);
  try {
    const form = new FormData();
    form.append("files[]", blob, name);
    const res = await fetch("https://uguu.se/upload?output=json", { method: "POST", body: form, signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { success?: boolean; files?: Array<{ url?: string }>; description?: string };
    const url = json.files?.[0]?.url;
    if (json.success && url) return url;
    throw new Error(json.description ?? "bad response");
  } finally {
    done();
  }
}

/* ===== Litterbox من Catbox (72 ساعة، يدعم CORS) ===== */
async function tryLitterbox(blob: Blob, name: string, outer: AbortSignal): Promise<string> {
  const { signal, done } = linkedController(outer, 15000);
  try {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("time", "72h");
    form.append("fileToUpload", blob, name);
    const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: form,
      signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const t = text.trim();
    if (t.startsWith("http")) return t;
    throw new Error(t.slice(0, 120) || "bad response");
  } finally {
    done();
  }
}

/* ===== السباق: أول نجاح يفوز ===== */
export async function uploadImageToUrl(blob: Blob, name: string): Promise<UploadResult> {
  const attempts: Array<{ provider: Provider; run: (s: AbortSignal) => Promise<string> }> = [
    { provider: "catbox", run: (s) => tryCatbox(blob, name, s) },
    { provider: "image2url", run: (s) => tryImage2Url(IMAGE2URL_UPLOAD, blob, name, s) },
    {
      provider: "image2url-corsproxy",
      run: (s) => tryImage2Url(`https://corsproxy.io/?url=${encodeURIComponent(IMAGE2URL_UPLOAD)}`, blob, name, s),
    },
    {
      provider: "image2url-allorigins",
      run: (s) => tryImage2Url(`https://api.allorigins.win/raw?url=${encodeURIComponent(IMAGE2URL_UPLOAD)}`, blob, name, s),
    },
    { provider: "tmpninja", run: (s) => tryTmpNinja(blob, name, s) },
    { provider: "tmpfiles", run: (s) => tryTmpfiles(blob, name, s) },
    { provider: "uguu", run: (s) => tryUguu(blob, name, s) },
    { provider: "litterbox", run: (s) => tryLitterbox(blob, name, s) },
  ];

  const race = new AbortController();
  const STAGGER = 550; /* فاصل الإطلاق بين محاولتين */

  return new Promise<UploadResult>((resolve, reject) => {
    const failures: string[] = [];
    let settled = false;
    let pending = attempts.length;

    attempts.forEach((attempt, i) => {
      window.setTimeout(() => {
        if (settled) return;
        attempt
          .run(race.signal)
          .then((url) => {
            if (settled) return;
            settled = true;
            race.abort(); /* أوقف بقية المحاولات */
            resolve({ url, provider: attempt.provider });
          })
          .catch((err) => {
            failures.push(`${attempt.provider}: ${classify(err)}`);
            pending--;
            if (!settled && pending === 0) {
              settled = true;
              reject(
                new Error(
                  `فشلت كل مزوّدات الاستضافة — جرّب تعطيل مانع الإعلانات/الإضافات أو بدّل الشبكة ثم أعد المحاولة. (${failures.join(" | ")})`
                )
              );
            }
          });
      }, i * STAGGER);
    });
  });
}

/* ===== الواجهة الخارجية v1 من Image2URL: تحويل الصورة المرفوعة إلى SVG ===== */

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

  for (let i = 0; i < 80; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const statusRes = await fetch(`${EXTERNAL_BASE}/image-to-svg/status/${taskId}`, {
      headers: { Authorization: auth },
    });
    const statusJson = await statusRes.json().catch(() => ({}));
    if (!statusRes.ok) throw new Error(`تعذّر جلب حالة المهمة (${statusRes.status})`);
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

/* ===== الرابط المضمون: Data URL يعمل دائماً حتى بلا اتصال ===== */

/* تحويل مباشر لأي Blob إلى Data URL (لا يفشل أبداً) */
export function generateDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(blob);
  });
}

/* نسخة محسّنة من Data URL: تُصغَّر الأبعاد إلى حد أقصى حتى يبقى الرابط مريح النسخ،
   وتُحفظ الشفافية إن كانت PNG. تعمل محلياً بالكامل ولا تحتاج شبكة. */
export async function generateOptimizedDataUri(file: File): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
    el.src = URL.createObjectURL(file);
  });

  const MAX = 1600;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const isPng = file.type.includes("png");
  const dataUri = canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? undefined : 0.85);
  URL.revokeObjectURL(img.src);
  return dataUri;
}

/* ===== ضغط الصورة لتلائم حد رفع Image2URL (2MB) ===== */

export function needsDownscale(file: File): boolean {
  return file.size > MAX_UPLOAD_BYTES;
}

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

    if (quality > 0.55) quality -= 0.12;
    else scale *= 0.82;
  }
  throw new Error("تعذّر ضغط الصورة تحت حد 2MB");
}

export const UPLOAD_LIMIT_LABEL = "2MB";
