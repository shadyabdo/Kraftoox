/* محرك معالجة ملفات PDF داخل المتصفح — pdf-lib + pako */

import {
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFArray,
  PDFDict,
} from "pdf-lib";
import { inflate } from "pako";

export interface ExtractedImage {
  blob: Blob;
  ext: "jpg" | "png";
  width: number;
  height: number;
}

function num(d: PDFDict, key: string): number {
  const v = d.get(PDFName.of(key));
  const n = Number(String(v));
  return Number.isFinite(n) ? n : 0;
}

function filtersOf(d: PDFDict): string[] {
  const f = d.get(PDFName.of("Filter"));
  if (!f) return [];
  if (f instanceof PDFArray) return f.asArray().map((x) => String(x));
  return [String(f)];
}

function isImageStream(obj: unknown): obj is PDFRawStream {
  if (!(obj instanceof PDFRawStream)) return false;
  const sub = obj.dict.get(PDFName.of("Subtype"));
  return !!sub && String(sub).includes("/Image");
}

/* تحويل بايتات خام (RGB / Gray / RGBA) إلى PNG عبر Canvas */
async function rawToPngBlob(raw: Uint8Array, w: number, h: number): Promise<Blob | null> {
  if (!w || !h || w > 6000 || h > 6000) return null;
  const px = w * h;
  const rgba = new Uint8ClampedArray(px * 4);
  if (raw.length === px * 4) {
    rgba.set(raw.length === rgba.length ? raw : raw.slice(0, rgba.length));
  } else if (raw.length === px * 3) {
    for (let i = 0, j = 0; i < px; i++, j += 3) {
      rgba[i * 4] = raw[j];
      rgba[i * 4 + 1] = raw[j + 1];
      rgba[i * 4 + 2] = raw[j + 2];
      rgba[i * 4 + 3] = 255;
    }
  } else if (raw.length === px) {
    for (let i = 0; i < px; i++) {
      rgba[i * 4] = raw[i];
      rgba[i * 4 + 1] = raw[i];
      rgba[i * 4 + 2] = raw[i];
      rgba[i * 4 + 3] = 255;
    }
  } else {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}

async function rawToCanvas(raw: Uint8Array, w: number, h: number): Promise<HTMLCanvasElement | null> {
  const blob = await rawToPngBlob(raw, w, h);
  if (!blob) return null;
  const bmp = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return canvas;
}

async function canvasToJpeg(
  source: CanvasImageSource,
  w: number,
  h: number,
  quality: number
): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", quality));
  return new Uint8Array(await blob.arrayBuffer());
}

/* ===== استخراج الصور من PDF ===== */
export async function extractPdfImages(file: File): Promise<ExtractedImage[]> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const results: ExtractedImage[] = [];
  for (const [, obj] of pdf.context.enumerateIndirectObjects()) {
    if (!isImageStream(obj)) continue;
    const w = num(obj.dict, "Width");
    const h = num(obj.dict, "Height");
    const filters = filtersOf(obj.dict);
    try {
      if (filters.some((f) => f.includes("DCTDecode"))) {
        const bytes = obj.contents instanceof Uint8Array ? obj.contents.slice() : new Uint8Array(obj.contents);
        results.push({
          blob: new Blob([bytes], { type: "image/jpeg" }),
          ext: "jpg",
          width: w,
          height: h,
        });
      } else if (
        !obj.dict.get(PDFName.of("DecodeParms")) &&
        filters.every((f) => f.includes("FlateDecode"))
      ) {
        const raw = inflate(obj.contents as Uint8Array);
        const blob = await rawToPngBlob(raw, w, h);
        if (blob) results.push({ blob, ext: "png", width: w, height: h });
      }
    } catch {
      /* نتجاوز الصورة غير القابلة للفك */
    }
  }
  return results;
}

/* ===== ضغط PDF: إعادة ترميز الصور المضمنة + تحسين البنية ===== */
export interface CompressResult {
  bytes: Uint8Array;
  replacedImages: number;
  skippedImages: number;
}

function replaceStreamWithJpeg(
  obj: PDFRawStream,
  jpeg: Uint8Array,
  w: number,
  h: number
): void {
  const d = obj.dict;
  d.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
  d.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
  d.set(PDFName.of("BitsPerComponent"), PDFNumber.of(8));
  d.set(PDFName.of("Width"), PDFNumber.of(w));
  d.set(PDFName.of("Height"), PDFNumber.of(h));
  d.delete(PDFName.of("DecodeParms"));
  d.delete(PDFName.of("SMask"));
  d.set(PDFName.of("Length"), PDFNumber.of(jpeg.length));
  (obj as unknown as { contents: Uint8Array }).contents = jpeg;
}

export async function compressPdf(file: File, quality: number, maxDim = 1800): Promise<CompressResult> {
  const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  let replacedImages = 0;
  let skippedImages = 0;

  for (const [, obj] of pdf.context.enumerateIndirectObjects()) {
    if (!isImageStream(obj)) continue;
    const w = num(obj.dict, "Width");
    const h = num(obj.dict, "Height");
    const filters = filtersOf(obj.dict);
    try {
      if (filters.some((f) => f.includes("DCTDecode"))) {
        const origBytes = obj.contents instanceof Uint8Array ? obj.contents.slice() : new Uint8Array(obj.contents);
        const bmp = await createImageBitmap(new Blob([origBytes], { type: "image/jpeg" }));
        const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
        const nw = Math.max(1, Math.round(bmp.width * scale));
        const nh = Math.max(1, Math.round(bmp.height * scale));
        const jpeg = await canvasToJpeg(bmp, nw, nh, quality);
        bmp.close();
        if (jpeg.length < origBytes.length) {
          replaceStreamWithJpeg(obj, jpeg, nw, nh);
          replacedImages++;
        } else {
          skippedImages++;
        }
      } else if (
        !obj.dict.get(PDFName.of("DecodeParms")) &&
        filters.every((f) => f.includes("FlateDecode"))
      ) {
        const raw = inflate(obj.contents as Uint8Array);
        const canvas = await rawToCanvas(raw, w, h);
        if (!canvas) {
          skippedImages++;
          continue;
        }
        const scale = Math.min(1, maxDim / Math.max(canvas.width, canvas.height));
        const nw = Math.max(1, Math.round(canvas.width * scale));
        const nh = Math.max(1, Math.round(canvas.height * scale));
        const jpeg = await canvasToJpeg(canvas, nw, nh, quality);
        const origLen = (obj.contents as Uint8Array).length;
        if (jpeg.length < origLen) {
          replaceStreamWithJpeg(obj, jpeg, nw, nh);
          replacedImages++;
        } else {
          skippedImages++;
        }
      } else {
        skippedImages++;
      }
    } catch {
      skippedImages++;
    }
  }

  pdf.setTitle("");
  pdf.setAuthor("");
  pdf.setSubject("");
  pdf.setKeywords([]);
  pdf.setProducer("Kraftoox");
  pdf.setCreator("Kraftoox");

  const bytes = await pdf.save({ useObjectStreams: true });
  return { bytes, replacedImages, skippedImages };
}

/* ===== دمج ملفات PDF ===== */
export async function mergePdfs(files: File[]): Promise<{ bytes: Uint8Array; pages: number }> {
  const out = await PDFDocument.create();
  let pages = 0;
  for (const f of files) {
    const src = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const copied = await out.copyPages(src, src.getPageIndices());
    copied.forEach((p) => out.addPage(p));
    pages += copied.length;
  }
  const bytes = await out.save({ useObjectStreams: true });
  return { bytes, pages };
}

export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    return src.getPageCount();
  } catch {
    return 0;
  }
}

/* ===== تحويل الصور إلى PDF ===== */
export interface ImagesToPdfOptions {
  pageSize: "a4" | "fit";
  orientation: "auto" | "portrait" | "landscape";
  margin: number;
}

export async function imagesToPdf(files: File[], opts: ImagesToPdfOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (const f of files) {
    const bytes = new Uint8Array(await f.arrayBuffer());
    let img;
    if (/jpe?g/i.test(f.type)) img = await pdf.embedJpg(bytes);
    else if (/png/i.test(f.type)) img = await pdf.embedPng(bytes);
    else {
      // WebP وغيره: نمر عبر Canvas
      const bmp = await createImageBitmap(new Blob([bytes], { type: f.type || "image/*" }));
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      canvas.getContext("2d")!.drawImage(bmp, 0, 0);
      bmp.close();
      const png = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
      img = await pdf.embedPng(new Uint8Array(await png.arrayBuffer()));
    }

    const iw = img.width;
    const ih = img.height;
    let pw: number;
    let ph: number;
    let scale: number;

    if (opts.pageSize === "fit") {
      scale = 0.75;
      pw = iw * scale + opts.margin * 2;
      ph = ih * scale + opts.margin * 2;
    } else {
      const landscape =
        opts.orientation === "landscape" || (opts.orientation === "auto" && iw > ih);
      pw = landscape ? 841.89 : 595.28;
      ph = landscape ? 595.28 : 841.89;
      const m = opts.margin;
      scale = Math.min((pw - m * 2) / iw, (ph - m * 2) / ih);
    }

    const page = pdf.addPage([pw, ph]);
    const dw = iw * scale;
    const dh = ih * scale;
    page.drawImage(img, { x: (pw - dw) / 2, y: (ph - dh) / 2, width: dw, height: dh });
  }
  pdf.setProducer("Kraftoox");
  pdf.setCreator("Kraftoox");
  return pdf.save({ useObjectStreams: true });
}
