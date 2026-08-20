/* أدوات عامة: تنسيق، نسخ، تنزيل، عدّاد المعالجة المحلية، توست */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} بايت`;
  const units = ["ك.ب", "م.ب", "ج.ب"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

export function percentSavings(before: number, after: number): string {
  if (before <= 0) return "0%";
  const p = ((before - after) / before) * 100;
  return `${p >= 0 ? "−" : "+"}${Math.abs(p).toFixed(0)}%`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  const copy = new Uint8Array(bytes);
  return new Blob([copy.buffer as ArrayBuffer], { type });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

let uidCounter = 0;
export function uid(): string {
  uidCounter += 1;
  return `${Date.now().toString(36)}-${uidCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/* عدّاد الملفات المعالجة محلياً — يُحفظ في جهاز الزائر فقط */
const COUNT_KEY = "ft-processed-count";

export function getProcessedCount(): number {
  try {
    return Number(localStorage.getItem(COUNT_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

export function bumpProcessedCount(n: number): void {
  try {
    localStorage.setItem(COUNT_KEY, String(getProcessedCount() + n));
    window.dispatchEvent(new CustomEvent("ft:count"));
  } catch {
    /* ignore */
  }
}

/* نظام توست خفيف عبر الأحداث */
export function showToast(message: string, kind: "ok" | "err" | "info" = "ok"): void {
  window.dispatchEvent(new CustomEvent("ft:toast", { detail: { message, kind, id: uid() } }));
}

/* تطبيع نص البحث العربي */
export function normalizeAr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

export function matchesQuery(text: string, q: string): boolean {
  const nq = normalizeAr(q);
  if (!nq) return true;
  return nq.split(/\s+/).every((w) => normalizeAr(text).includes(w));
}
