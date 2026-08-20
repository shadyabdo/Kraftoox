import { useEffect, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, ProgressBar } from "../components/bits";
import { getTool } from "../data/tools";
import { loadVideoEl, processVideo, videoSupported, type NormRect } from "../lib/video";
import { bumpProcessedCount, formatBytes, showToast } from "../lib/utils";
import { ProcessBtn, ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("remove-watermark-video")!;

const PRESETS = [
  { id: "tl", label: "أعلى اليمين", rect: { x: 0.02, y: 0.03, w: 0.22, h: 0.09 } },
  { id: "tr", label: "أعلى اليسار", rect: { x: 0.76, y: 0.03, w: 0.22, h: 0.09 } },
  { id: "bl", label: "أسفل اليمين", rect: { x: 0.02, y: 0.86, w: 0.22, h: 0.1 } },
  { id: "br", label: "أسفل اليسار", rect: { x: 0.76, y: 0.86, w: 0.22, h: 0.1 } },
  { id: "center", label: "المنتصف", rect: { x: 0.35, y: 0.43, w: 0.3, h: 0.14 } },
];

export default function RemoveWatermarkVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<{ w: number; h: number; dur: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [rect, setRect] = useState<NormRect>({ x: 0.02, y: 0.86, w: 0.22, h: 0.1 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState("");
  const [resultInfo, setResultInfo] = useState<{ size: number; ext: string } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"move" | "resize" | null>(null);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const onFile = async (files: File[]) => {
    const f = files[0];
    try {
      const el = await loadVideoEl(f);
      setFile(f);
      setMeta({ w: el.videoWidth, h: el.videoHeight, dur: el.duration });
      setPreviewUrl(URL.createObjectURL(f));
      setResultUrl("");
      setResultInfo(null);
    } catch {
      showToast("تعذّر قراءة ملف الفيديو", "err");
    }
  };

  const toNorm = (clientX: number, clientY: number) => {
    const el = wrapRef.current!;
    const r = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (clientY - r.top) / r.height)),
    };
  };

  const onPointerDown = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = mode;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const p = toNorm(e.clientX, e.clientY);
    setRect((r) => {
      if (dragRef.current === "move") {
        return {
          ...r,
          x: Math.min(1 - r.w, Math.max(0, p.x - r.w / 2)),
          y: Math.min(1 - r.h, Math.max(0, p.y - r.h / 2)),
        };
      }
      return {
        ...r,
        w: Math.min(1 - r.x, Math.max(0.04, p.x - r.x)),
        h: Math.min(1 - r.y, Math.max(0.03, p.y - r.y)),
      };
    });
  };

  const stopDrag = () => (dragRef.current = null);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setResultUrl("");
    const ctrl = new AbortController();
    try {
      const res = await processVideo(file, {
        blurRect: rect,
        signal: ctrl.signal,
        onProgress: (p) => setProgress(p),
      });
      const url = URL.createObjectURL(res.blob);
      setResultUrl(url);
      setResultInfo({ size: res.blob.size, ext: res.mime.includes("mp4") ? "mp4" : "webm" });
      bumpProcessedCount(1);
      showToast("تمت إزالة العلامة المائية من الفيديو");
    } catch (err) {
      if ((err as Error).message !== "aborted") showToast("فشلت معالجة الفيديو", "err");
    } finally {
      setBusy(false);
    }
  };

  if (!videoSupported()) {
    return (
      <ToolShell tool={TOOL}>
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--red-soft)] c-red">
            <Icon name="alert" size={26} />
          </span>
          <p className="font-display text-lg font-bold">المتصفح لا يدعم معالجة الفيديو</p>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell tool={TOOL}>
      {!file ? (
        <Dropzone
          accept={TOOL.accept}
          multiple={false}
          onFiles={onFile}
          color={TOOL.color}
          title="اسحب الفيديو ثم حدّد مكان العلامة المائية"
          subtitle="حدّد المستطيل فوق العلامة — سيُستبدل محتواها بتمويه ذكي منطقي من محيطها"
        />
      ) : (
        <div className="anim-pop">
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display flex items-center gap-2 text-sm font-bold">
                <span className="c-teal"><Icon name="crop" size={17} /></span>
                ١. ضع المستطيل فوق العلامة المائية — اسحب للتحريك ومن الزاوية للتحجيم
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.id} type="button" onClick={() => setRect({ ...p.rect })} className="chip !px-2.5 !py-1 !text-[10.5px]">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={wrapRef}
              className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-xl border bd-line bg-black"
              onPointerMove={onPointerMove}
              onPointerUp={stopDrag}
            >
              <video src={previewUrl} controls muted loop className="block w-full" />
              {/* منطقة الإزالة */}
              <div
                className="ants absolute cursor-move rounded-md border-2 border-dashed border-[var(--red)] bg-[color-mix(in_srgb,var(--red)_18%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--red)_28%,transparent)]"
                style={{
                  insetInlineStart: `${rect.x * 100}%`,
                  top: `${rect.y * 100}%`,
                  width: `${rect.w * 100}%`,
                  height: `${rect.h * 100}%`,
                }}
                onPointerDown={onPointerDown("move")}
                role="button"
                aria-label="منطقة العلامة المائية — اسحب للتحريك"
              >
                <span className="absolute -top-6 start-0 rounded-md bg-[var(--red)] px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                  منطقة الإزالة
                </span>
                <span
                  className="absolute -bottom-1.5 -end-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-[var(--red)] shadow"
                  onPointerDown={onPointerDown("resize")}
                  role="button"
                  aria-label="تغيير حجم المنطقة"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ProcessBtn label="٢. أزل العلامة وصدّر الفيديو" onClick={run} busy={busy} color={TOOL.color} icon="eraser" />
              {resultUrl && resultInfo && (
                <a
                  href={resultUrl}
                  download={`${file.name.replace(/\.[^.]+$/, "")}-clean.${resultInfo.ext}`}
                  className="btn btn-teal"
                >
                  <Icon name="download" size={17} />
                  تحميل الفيديو النظيف
                </a>
              )}
              <button
                type="button"
                onClick={() => { setFile(null); setMeta(null); setResultUrl(""); }}
                className="btn btn-ghost !px-3"
              >
                <Icon name="refresh" size={16} />
                فيديو آخر
              </button>
            </div>

            {busy && (
              <div className="mt-4">
                <ProgressBar value={progress * 100} color={TOOL.color} />
                <p className="c-muted mt-2 text-xs">
                  التقدم: <b className="font-mono" dir="ltr">{Math.round(progress * 100)}%</b> — أبقِ التبويب مفتوحاً أثناء المعالجة.
                </p>
              </div>
            )}

            {resultUrl && resultInfo && !busy && (
              <div className="anim-pop mt-5">
                <video src={resultUrl} controls className="max-h-80 w-full rounded-xl border bd-line bg-black" />
                <p className="mt-2 flex items-center gap-2 text-xs font-semibold c-teal">
                  <Icon name="check" size={15} />
                  جاهز — الصوت الأصلي محفوظ · <span dir="ltr" className="font-mono">{formatBytes(resultInfo.size)}</span>
                </p>
              </div>
            )}
          </div>

          {meta && (
            <p className="c-muted mt-3 text-center font-mono text-xs" dir="ltr">
              {meta.w}×{meta.h} · {meta.dur.toFixed(1)}s · {formatBytes(file!.size)}
            </p>
          )}
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          تُستبدل المنطقة المحددة بتمويه منطقي يمتزج مع محتوى الإطار في كل لقطة — مثالي لعلامات
          القنوات والزوايا. للعلامات الكبيرة جداً جرّب أداة القص أو قلّل حجم المنطقة تدريجياً.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
