import { useEffect, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, ProgressBar } from "../components/bits";
import { getTool } from "../data/tools";
import { loadVideoEl, processVideo, videoSupported } from "../lib/video";
import { bumpProcessedCount, downloadBlob, formatBytes, showToast } from "../lib/utils";
import { OptionsPanel, ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("upscale-video")!;

export default function UpscaleVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<{ w: number; h: number; dur: number } | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState("");
  const [resultInfo, setResultInfo] = useState<{ w: number; h: number; size: number; ext: string } | null>(null);
  const abortRef = useState<AbortController | null>(null);

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
      setProgress(0);
    } catch {
      showToast("تعذّر قراءة ملف الفيديو", "err");
    }
  };

  const run = async () => {
    if (!file || !meta) return;
    const ctrl = new AbortController();
    abortRef[1](ctrl);
    setBusy(true);
    setProgress(0);
    setResultUrl("");
    try {
      const res = await processVideo(file, {
        scale,
        signal: ctrl.signal,
        onProgress: (p) => setProgress(p),
      });
      const url = URL.createObjectURL(res.blob);
      setResultUrl(url);
      setResultInfo({
        w: res.width,
        h: res.height,
        size: res.blob.size,
        ext: res.mime.includes("mp4") ? "mp4" : "webm",
      });
      bumpProcessedCount(1);
      showToast(`تم التكبير إلى ${res.width}×${res.height}`);
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
          <p className="c-muted max-w-md text-sm">جرّب متصفحاً حديثاً مثل Chrome أو Edge أو Firefox.</p>
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
          title="اسحب فيديو لتكبير دقته"
          subtitle="MP4 · WebM · MOV — يُعاد ترميزه إطاراً بإطار مع الحفاظ على الصوت"
        />
      ) : (
        <div className="anim-pop grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="card h-fit p-5">
            <video src={previewUrl} controls className="w-full rounded-xl border bd-line bg-black" />
            <div className="mt-3 space-y-1.5 text-xs">
              <p className="truncate font-semibold" dir="ltr"><bdi>{file.name}</bdi></p>
              {meta && (
                <p className="c-muted font-mono" dir="ltr">
                  {meta.w}×{meta.h} · {meta.dur.toFixed(1)}s · {formatBytes(file.size)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setFile(null); setMeta(null); setResultUrl(""); setResultInfo(null); }}
              className="btn btn-ghost mt-3 w-full !py-2 !text-xs"
            >
              <Icon name="refresh" size={14} />
              فيديو آخر
            </button>
          </div>

          <div>
            <OptionsPanel title="إعدادات التكبير">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>معامل التكبير</FieldLabel>
                  <div className="flex gap-2">
                    {[1.5, 2, 3].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScale(s)}
                        className={`chip !px-4 !py-2 font-mono ${scale === s ? "!border-[var(--blue)] !text-[var(--blue)]" : ""}`}
                      >
                        ×{s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel>الدقة الناتجة</FieldLabel>
                  <p className="input !bg-surface2 font-mono !text-sm" dir="ltr">
                    {meta ? `${Math.min(3840, Math.round(meta.w * scale))}×${Math.min(3840, Math.round(meta.h * scale))}` : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ProcessBtn label={`كبّر الفيديو ×${scale}`} onClick={run} busy={busy} color={TOOL.color} icon="video" />
                {busy && (
                  <button type="button" className="btn btn-ghost" onClick={() => abortRef[0]?.abort()}>
                    <Icon name="close" size={16} />
                    إلغاء
                  </button>
                )}
                {resultUrl && resultInfo && (
                  <a href={resultUrl} download={`${file.name.replace(/\.[^.]+$/, "")}-${scale}x.${resultInfo.ext}`} className="btn btn-teal">
                    <Icon name="download" size={17} />
                    تحميل ({resultInfo.ext.toUpperCase()})
                  </a>
                )}
              </div>

              {busy && (
                <div className="mt-4">
                  <ProgressBar value={progress * 100} color={TOOL.color} />
                  <p className="c-muted mt-2 text-xs">
                    التقدم: <b className="font-mono" dir="ltr">{Math.round(progress * 100)}%</b> — أبقِ هذا التبويب مفتوحاً ونشطاً أثناء المعالجة للحفاظ على السرعة.
                  </p>
                </div>
              )}

              {resultUrl && resultInfo && !busy && (
                <div className="anim-pop mt-5">
                  <video src={resultUrl} controls className="max-h-80 w-full rounded-xl border bd-line bg-black" />
                  <p className="mt-2 flex items-center gap-2 text-xs font-semibold c-teal">
                    <Icon name="check" size={15} />
                    جاهز: {resultInfo.w}×{resultInfo.h} · <span dir="ltr" className="font-mono">{formatBytes(resultInfo.size)}</span> · الصوت الأصلي محفوظ
                  </p>
                </div>
              )}
            </OptionsPanel>
          </div>
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          تتم المعالجة إطاراً بإطار داخل متصفحك (Canvas + MediaRecorder) مع الحفاظ على المسار الصوتي.
          الناتج بصيغة WebM عالية الجودة، وزمن المعالجة يقارب مدة الفيديو — الفيديو لا يغادر جهازك إطلاقاً.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
