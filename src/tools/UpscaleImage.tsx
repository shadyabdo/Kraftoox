import { useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { CompareSlider, InfoNote, IndeterminateBar } from "../components/bits";
import { getTool } from "../data/tools";
import { loadImageEl } from "../lib/img";
import { bumpProcessedCount, downloadBlob, formatBytes, showToast } from "../lib/utils";
import { OptionsPanel, ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("upscale-image")!;

/* تكبير متدرج: مضاعفات صغيرة متتالية تعطي تفاصيل أفضل من قفزة واحدة */
async function upscale(img: HTMLImageElement, factor: number): Promise<HTMLCanvasElement> {
  let src: CanvasImageSource = img;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  const targetW = Math.min(7680, Math.round(w * factor));
  const targetH = Math.min(7680, Math.round(h * factor));

  while (w < targetW) {
    const step = Math.min(2, targetW / w);
    const nw = Math.round(w * step);
    const nh = Math.round(h * step);
    const c = document.createElement("canvas");
    c.width = nw;
    c.height = nh;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, nw, nh);
    src = c;
    w = nw;
    h = nh;
    /* فسحة للتنفس بين المراحل */
    await new Promise((r) => setTimeout(r, 0));
  }
  return src as HTMLCanvasElement;
}

export default function UpscaleImage() {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [origUrl, setOrigUrl] = useState("");
  const [factor, setFactor] = useState(2);
  const [sharpen, setSharpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [result, setResult] = useState<{ w: number; h: number; size: number } | null>(null);

  const onFile = async (files: File[]) => {
    const f = files[0];
    try {
      const el = await loadImageEl(f);
      setFile(f);
      setImg(el);
      setOrigUrl(URL.createObjectURL(f));
      setResultUrl("");
      setResult(null);
    } catch {
      showToast("تعذّر قراءة الصورة", "err");
    }
  };

  const run = async () => {
    if (!img) return;
    setBusy(true);
    setResultUrl("");
    try {
      const canvas = await upscale(img, factor);
      const ctx = canvas.getContext("2d")!;
      if (sharpen) {
        /* تعزيز حواف خفيف عبر تركيب الصورة على نسخة مطموسة بوزن سالب */
        const blurC = document.createElement("canvas");
        blurC.width = canvas.width;
        blurC.height = canvas.height;
        const bctx = blurC.getContext("2d")!;
        bctx.filter = "blur(1.5px)";
        bctx.drawImage(canvas, 0, 0);
        ctx.globalAlpha = 0.22;
        ctx.globalCompositeOperation = "overlay";
        ctx.drawImage(blurC, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      const blob = await new Promise<Blob>((res) =>
        canvas.toBlob((b) => res(b!), file?.type.includes("png") ? "image/png" : "image/jpeg", 0.93)
      );
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResult({ w: canvas.width, h: canvas.height, size: blob.size });
      bumpProcessedCount(1);
      showToast(`تم التكبير إلى ${canvas.width}×${canvas.height}`);
      (window as unknown as { __lastBlob?: Blob }).__lastBlob = blob;
    } catch {
      showToast("فشلت عملية التكبير", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell tool={TOOL}>
      {!file ? (
        <Dropzone
          accept={TOOL.accept}
          multiple={false}
          onFiles={onFile}
          color={TOOL.color}
          title="اسحب صورة لتكبيرها حتى 4 أضعاف"
          subtitle="تكبير متدرج متعدد المراحل مع تعزيز للحواف — يصل حتى 7680 بكسل"
        />
      ) : (
        <div className="anim-pop">
          <OptionsPanel title="إعدادات التكبير">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <FieldLabel>معامل التكبير</FieldLabel>
                <div className="flex gap-2">
                  {[2, 3, 4].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFactor(f)}
                      className={`chip !px-4 !py-2 font-mono ${factor === f ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}
                    >
                      ×{f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>الأبعاد الناتجة</FieldLabel>
                <p className="input !bg-surface2 font-mono !text-sm" dir="ltr">
                  {img ? `${Math.min(7680, img.naturalWidth * factor)}×${Math.min(7680, img.naturalHeight * factor)}` : "—"}
                </p>
              </div>
              <label className="flex cursor-pointer items-end gap-2.5 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={sharpen}
                  onChange={(e) => setSharpen(e.target.checked)}
                  className="h-4 w-4 accent-[var(--teal)]"
                />
                تعزيز الحواف والتفاصيل
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProcessBtn label={`كبّر ×${factor} الآن`} onClick={run} busy={busy} color={TOOL.color} icon="expand" />
              {resultUrl && (
                <button
                  type="button"
                  className="btn btn-teal"
                  onClick={() => {
                    const b = (window as unknown as { __lastBlob?: Blob }).__lastBlob;
                    if (b) downloadBlob(b, `${file!.name.replace(/\.[^.]+$/, "")}-${factor}x.png`);
                  }}
                >
                  <Icon name="download" size={17} />
                  تحميل المكبّرة
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImg(null);
                  setResultUrl("");
                  setResult(null);
                }}
                className="btn btn-ghost !px-3"
              >
                <Icon name="refresh" size={16} />
                صورة أخرى
              </button>
            </div>

            {busy && (
              <div className="mt-4">
                <IndeterminateBar color={TOOL.color} />
                <p className="c-muted mt-2 text-xs">يعيد المحرك بناء الصورة على مراحل متتالية للحصول على أفضل تفاصيل…</p>
              </div>
            )}
          </OptionsPanel>

          <div className="card mt-5 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold">
                {file.name}
                {img && (
                  <span className="c-muted ms-2 font-mono text-xs font-normal" dir="ltr">
                    {img.naturalWidth}×{img.naturalHeight} · {formatBytes(file.size)}
                  </span>
                )}
              </h3>
              {result && (
                <span className="rounded-lg bg-[var(--teal-soft)] px-2.5 py-1 font-mono text-xs font-semibold c-teal" dir="ltr">
                  {result.w}×{result.h} · {formatBytes(result.size)}
                </span>
              )}
            </div>
            {resultUrl ? (
              <CompareSlider before={origUrl} after={resultUrl} />
            ) : (
              <img src={origUrl} alt={file.name} className="max-h-96 w-full rounded-xl border bd-line object-contain bg-surface2" />
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          اسحب المؤشر على الصورة للمقارنة بين الأصل والمكبّرة. التكبير المتدرج متعدد المراحل يحافظ
          على الحواف أفضل من التكبير المباشر — مثالي لتجهيز صور الطباعة والعروض الكبيرة.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
