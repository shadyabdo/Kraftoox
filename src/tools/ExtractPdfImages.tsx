import { useEffect, useState } from "react";
import JSZip from "jszip";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, IndeterminateBar } from "../components/bits";
import { getTool } from "../data/tools";
import { extractPdfImages, type ExtractedImage } from "../lib/pdf";
import { bumpProcessedCount, downloadBlob, formatBytes, showToast } from "../lib/utils";
import { ProcessBtn, ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("extract-pdf-images")!;

interface Found extends ExtractedImage {
  id: string;
  url: string;
}

export default function ExtractPdfImages() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<Found[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    return () => {
      images.forEach((i) => URL.revokeObjectURL(i.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setSearched(false);
    setImages((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url));
      return [];
    });
    try {
      const found = await extractPdfImages(file);
      setImages(
        found.map((f, i) => ({
          ...f,
          id: `img-${i}`,
          url: URL.createObjectURL(f.blob),
        }))
      );
      setSearched(true);
      if (found.length) {
        bumpProcessedCount(1);
        showToast(`تم استخراج ${found.length} صورة من الملف`);
      }
    } catch {
      showToast("تعذّرت قراءة ملف PDF — قد يكون محمياً أو تالفاً", "err");
      setSearched(true);
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    images.forEach((img, i) => {
      zip.file(`extracted-${String(i + 1).padStart(2, "0")}.${img.ext}`, img.blob);
    });
    downloadBlob(await zip.generateAsync({ type: "blob" }), "filetools-extracted-images.zip");
  };

  return (
    <ToolShell tool={TOOL}>
      {!file ? (
        <Dropzone
          accept={TOOL.accept}
          multiple={false}
          onFiles={(f) => {
            setFile(f[0]);
            setImages([]);
            setSearched(false);
          }}
          color={TOOL.color}
          title="اسحب ملف PDF لاستخراج صوره"
          subtitle="يفكك المحرك بنية الملف ويعثر على كل الصور المضمنة بدقة أصلية"
        />
      ) : (
        <div className="anim-pop">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--red-soft)] c-red">
                  <Icon name="pdf" size={22} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" dir="ltr" style={{ textAlign: "end" }}>
                    <bdi>{file.name}</bdi>
                  </p>
                  <p className="c-muted font-mono text-xs" dir="ltr">{formatBytes(file.size)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <ProcessBtn
                  label={searched ? "أعد الاستخراج" : "استخرج الصور الآن"}
                  onClick={run}
                  busy={busy}
                  color={TOOL.color}
                  icon="extract"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setImages([]);
                    setSearched(false);
                  }}
                  className="btn btn-ghost !px-3"
                >
                  <Icon name="refresh" size={16} />
                  ملف آخر
                </button>
              </div>
            </div>

            {busy && (
              <div className="mt-4">
                <IndeterminateBar color={TOOL.color} />
                <p className="c-muted mt-2 text-xs">يفك المحرك ضغط الصور المضمنة…</p>
              </div>
            )}
          </div>

          {searched && !busy && images.length === 0 && (
            <div className="anim-pop card mt-5 flex flex-col items-center gap-3 p-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--amber-soft)] c-amber">
                <Icon name="eye" size={26} />
              </span>
              <p className="font-display text-lg font-bold">لا توجد صور قابلة للاستخراج</p>
              <p className="c-muted max-w-md text-sm leading-relaxed">
                قد يكون الملف نصياً بلا صور، أو يستخدم صيغ ضغط متقدمة (مثل JPEG2000) لا يمكن
                فكها داخل المتصفح حالياً.
              </p>
            </div>
          )}

          {images.length > 0 && (
            <div className="anim-pop mt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-bold">
                  {images.length} صورة مستخرجة
                  <span className="c-muted text-sm font-normal"> — انقر أي صورة لتحميلها</span>
                </h3>
                <button type="button" onClick={downloadAll} className="btn btn-teal" style={{ background: TOOL.color }}>
                  <Icon name="zip" size={17} />
                  تحميل الكل ZIP
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((img, i) => (
                  <li key={img.id} className="anim-pop card group overflow-hidden !rounded-xl" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                    <button
                      type="button"
                      onClick={() => downloadBlob(img.blob, `extracted-${String(i + 1).padStart(2, "0")}.${img.ext}`)}
                      className="relative block w-full cursor-pointer"
                      aria-label={`تحميل الصورة ${i + 1}`}
                    >
                      <img src={img.url} alt={`صورة مستخرجة ${i + 1}`} className="h-28 w-full bg-surface2 object-contain p-1" />
                      <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--ink)_60%,transparent)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <span className="flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-xs font-bold">
                          <Icon name="download" size={14} />
                          تحميل
                        </span>
                      </span>
                    </button>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-mono text-[10px] c-muted" dir="ltr">
                        {img.width}×{img.height}
                      </span>
                      <span
                        className="rounded-md px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase"
                        style={{ color: TOOL.color, background: `color-mix(in srgb, ${TOOL.color} 10%, transparent)` }}
                      >
                        {img.ext}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          صور JPEG المضمنة تُستخرج كما هي بدون أي إعادة ترميز (فقدان صفر)، والصور المضغوطة
          بخوارزمية Flate تُفكّك وتُحفظ بصيغة PNG. الصور المتكررة في عدة صفحات تُستخرج مرة واحدة فقط.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
