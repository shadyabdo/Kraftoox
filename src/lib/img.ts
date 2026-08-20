/* محرك معالجة الصور داخل المتصفح — Canvas API */

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export function loadImageEl(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذّر قراءة الصورة — قد تكون الصيغة غير مدعومة"));
    };
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: OutputFormat, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("فشل توليد الصورة"))),
      type,
      quality
    );
  });
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("المتصفح لا يدعم Canvas");
  return [canvas, ctx];
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  percent?: number;
  quality?: number;
}

/* تغيير الحجم — يحافظ على الصيغة الأصلية */
export async function resizeImage(file: File, opts: ResizeOptions): Promise<Blob> {
  const img = await loadImageEl(file);
  let { width, height } = computeSize(img.naturalWidth, img.naturalHeight, opts);
  width = Math.min(width, 8000);
  height = Math.min(height, 8000);
  const [canvas, ctx] = makeCanvas(width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  const type: OutputFormat = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
  return canvasToBlob(canvas, type, type === "image/png" ? undefined : opts.quality ?? 0.92);
}

export function computeSize(
  ow: number,
  oh: number,
  opts: ResizeOptions
): { width: number; height: number } {
  if (opts.percent && opts.percent > 0) {
    const k = opts.percent / 100;
    return { width: Math.max(1, Math.round(ow * k)), height: Math.max(1, Math.round(oh * k)) };
  }
  const ratio = ow / oh;
  if (opts.width && opts.height) return { width: opts.width, height: opts.height };
  if (opts.width) return { width: opts.width, height: Math.round(opts.width / ratio) };
  if (opts.height) return { width: Math.round(opts.height * ratio), height: opts.height };
  return { width: ow, height: oh };
}

export interface ConvertOptions {
  format: OutputFormat;
  quality?: number;
}

/* تحويل الصيغة — مع خلفية بيضاء عند التحويل من شفافية إلى JPG */
export async function convertImage(file: File, opts: ConvertOptions): Promise<Blob> {
  const img = await loadImageEl(file);
  const [canvas, ctx] = makeCanvas(img.naturalWidth, img.naturalHeight);
  if (opts.format === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0);
  return canvasToBlob(canvas, opts.format, opts.format === "image/png" ? undefined : opts.quality ?? 0.9);
}

export function extForFormat(format: OutputFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/webp") return "webp";
  return "png";
}

export function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
