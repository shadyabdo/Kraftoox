import { useEffect, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { CompareSlider, InfoNote, IndeterminateBar } from "../components/bits";
import { getTool } from "../data/tools";
import { bumpProcessedCount, downloadBlob, showToast } from "../lib/utils";
import { ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("remove-watermark")!;

/* ترميم انتشاري (Diffusion Inpainting): يملأ المنطقة المحددة من بكسلات الجوار تدريجياً */
async function inpaint(
  data: ImageData,
  mask: Uint8Array,
  onStep: () => Promise<void>
): Promise<void> {
  const { width: w, height: h, data: px } = data;
  const idx = (x: number, y: number) => (y * w + x) * 4;

  /* التهيئة: متوسط الجيران غير المقنّعين */
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!mask[i]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (mask[ni]) continue;
          const p = idx(nx, ny);
          r += px[p]; g += px[p + 1]; b += px[p + 2]; n++;
        }
      }
      const p = idx(x, y);
      if (n > 0) {
        px[p] = r / n; px[p + 1] = g / n; px[p + 2] = b / n;
      }
    }
    if (y % 24 === 0) await onStep();
  }

  /* تكرارات الانتشار */
  const PASSES = 90;
  for (let pass = 0; pass < PASSES; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!mask[i]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        if (x > 0) { const p = idx(x - 1, y); r += px[p]; g += px[p + 1]; b += px[p + 2]; n++; }
        if (x < w - 1) { const p = idx(x + 1, y); r += px[p]; g += px[p + 1]; b += px[p + 2]; n++; }
        if (y > 0) { const p = idx(x, y - 1); r += px[p]; g += px[p + 1]; b += px[p + 2]; n++; }
        if (y < h - 1) { const p = idx(x, y + 1); r += px[p]; g += px[p + 1]; b += px[p + 2]; n++; }
        if (n > 0) {
          const p = idx(x, y);
          px[p] = r / n; px[p + 1] = g / n; px[p + 2] = b / n;
        }
      }
      if (y % 40 === 0) await onStep();
    }
  }
}

export default function RemoveWatermark() {
  const fileRef = useRef<File | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const painting = useRef(false);
  const [ready, setReady] = useState(false);
  const [origUrl, setOrigUrl] = useState("");
  const [brush, setBrush] = useState(24);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [hasMask, setHasMask] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => () => { URL.revokeObjectURL(origUrl); URL.revokeObjectURL(resultUrl); }, [origUrl, resultUrl]);

  const drawScene = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    if (maskCanvasRef.current) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(maskCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1;
    }
  };

  const onFile = (files: File[]) => {
    const f = files[0];
    const img = new Image();
    img.onload = () => {
      const maxDim = 1800;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = canvasRef.current!;
      canvas.width = w;
      canvas.height = h;
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      maskCanvasRef.current = mask;
      fileRef.current = f;
      imgRef.current = img;
      setOrigUrl(URL.createObjectURL(f));
      setResultUrl("");
      setHasMask(false);
      setReady(true);
      drawScene();
    };
    img.onerror = () => showToast("تعذّر قراءة الصورة", "err");
    img.src = URL.createObjectURL(f);
  };

  const pos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const paint = (e: React.PointerEvent) => {
    const mask = maskCanvasRef.current;
    if (!mask || !painting.current) return;
    const ctx = mask.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, brush / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasMask(true);
    drawScene();
  };

  const run = async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    const mask = maskCanvasRef.current;
    if (!canvas || !img || !mask) return;
    setBusy(true);
    setResultUrl("");
    try {
      const work = document.createElement("canvas");
      work.width = canvas.width;
      work.height = canvas.height;
      const wctx = work.getContext("2d")!;
      wctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = wctx.getImageData(0, 0, work.width, work.height);
      const mctx = mask.getContext("2d")!;
      const maskPx = mctx.getImageData(0, 0, mask.width, mask.height).data;
      const maskArr = new Uint8Array(mask.width * mask.height);
      for (let i = 0; i < maskArr.length; i++) maskArr[i] = maskPx[i * 4 + 3] > 40 ? 1 : 0;
      if (!maskArr.some((v) => v === 1)) {
        showToast("لوّن فوق العلامة المائية أولاً", "info");
        setBusy(false);
        return;
      }
      await inpaint(data, maskArr, () => new Promise((r) => setTimeout(r, 0)));
      wctx.putImageData(data, 0, 0);
      /* نسخ النتيجة فوق الأصل لعرض المقارنة */
      const finalC = document.createElement("canvas");
      finalC.width = canvas.width;
      finalC.height = canvas.height;
      finalC.getContext("2d")!.drawImage(work, 0, 0);
      const blob = await new Promise<Blob>((res) => finalC.toBlob((b) => res(b!), "image/png"));
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      (window as unknown as { __wmBlob?: Blob }).__wmBlob = blob;
      bumpProcessedCount(1);
      showToast("تمت إزالة العلامة المائية — اسحب للمقارنة");
    } catch {
      showToast("فشلت المعالجة", "err");
    } finally {
      setBusy(false);
    }
  };

  const resetMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    mask.getContext("2d")!.clearRect(0, 0, mask.width, mask.height);
    setHasMask(false);
    drawScene();
  };

  return (
    <ToolShell tool={TOOL}>
      {!ready ? (
        <Dropzone
          accept={TOOL.accept}
          multiple={false}
          onFiles={onFile}
          color={TOOL.color}
          title="اسحب الصورة ثم لوّن فوق العلامة المائية"
          subtitle="JPG · PNG · WebP — خوارزمية ترميم انتشاري تملأ المنطقة من محيطها"
        />
      ) : (
        <div className="anim-pop">
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display flex items-center gap-2 text-sm font-bold">
                <span className="c-teal"><Icon name="brush" size={17} /></span>
                ١. لوّن فوق العلامة المائية بدقة
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <span className="c-muted">حجم الفرشاة</span>
                  <input
                    type="range"
                    min={6}
                    max={80}
                    value={brush}
                    onChange={(e) => setBrush(Number(e.target.value))}
                    className="w-28"
                    aria-label="حجم الفرشاة"
                  />
                  <b className="font-mono w-7" dir="ltr">{brush}</b>
                </label>
                <button type="button" onClick={resetMask} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                  <Icon name="eraser" size={14} />
                  مسح التحديد
                </button>
              </div>
            </div>

            <div className="grid place-items-center overflow-hidden rounded-xl border bd-line bg-surface2">
              <canvas
                ref={canvasRef}
                className="max-h-[480px] w-auto max-w-full cursor-crosshair touch-none"
                onPointerDown={(e) => {
                  painting.current = true;
                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                  paint(e);
                }}
                onPointerMove={paint}
                onPointerUp={() => (painting.current = false)}
                onPointerLeave={() => (painting.current = false)}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ProcessBtn
                label="٢. أزل العلامة المائية"
                onClick={run}
                busy={busy}
                disabled={!hasMask}
                color={TOOL.color}
                icon="wand"
              />
              {!hasMask && !busy && <span className="c-muted text-xs">لم تحدد أي منطقة بعد — ارسم فوق العلامة أولاً</span>}
              {resultUrl && (
                <button
                  type="button"
                  className="btn btn-teal"
                  onClick={() => {
                    const b = (window as unknown as { __wmBlob?: Blob }).__wmBlob;
                    if (b) downloadBlob(b, `${fileRef.current?.name.replace(/\.[^.]+$/, "") ?? "image"}-clean.png`);
                  }}
                >
                  <Icon name="download" size={17} />
                  تحميل النتيجة
                </button>
              )}
              <button
                type="button"
                onClick={() => { setReady(false); setResultUrl(""); }}
                className="btn btn-ghost !px-3"
              >
                <Icon name="refresh" size={16} />
                صورة أخرى
              </button>
            </div>

            {busy && (
              <div className="mt-4">
                <IndeterminateBar color={TOOL.color} />
                <p className="c-muted mt-2 text-xs">يعيد خوارزمية الانتشار بناء البكسلات من محيط المنطقة — قد يستغرق ثوانٍ…</p>
              </div>
            )}
          </div>

          {resultUrl && (
            <div className="card anim-pop mt-5 p-5">
              <FieldLabel>المقارنة — اسحب المقبض</FieldLabel>
              <CompareSlider before={origUrl} after={resultUrl} />
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          أفضل النتائج مع العلامات المائية شبه الشفافة والخلفيات المتجانسة (سماء، جدران، تدرجات).
          حدّد المنطقة بدقة قريبة من حجم العلامة — التحديد الأكبر من اللازم يقلل جودة الترميم.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
