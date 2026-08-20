import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { BlobLink, InfoNote } from "../components/bits";
import { getTool } from "../data/tools";
import { bumpProcessedCount, downloadBlob, formatBytes, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon, type IconName } from "../components/Icons";
import { cx } from "../lib/utils";

const TOOL = getTool("photo-editor")!;

interface Adjust {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hue: number;
  blur: number;
}

const DEFAULT_ADJ: Adjust = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hue: 0, blur: 0 };

const PRESETS: Array<{ id: string; label: string; adj: Adjust }> = [
  { id: "none", label: "طبيعي", adj: DEFAULT_ADJ },
  { id: "warm", label: "دافئ", adj: { ...DEFAULT_ADJ, brightness: 105, saturate: 118, sepia: 22, contrast: 104 } },
  { id: "cold", label: "بارد", adj: { ...DEFAULT_ADJ, brightness: 102, saturate: 96, hue: 12, contrast: 106 } },
  { id: "bw", label: "أبيض وأسود", adj: { ...DEFAULT_ADJ, grayscale: 100, contrast: 112 } },
  { id: "vintage", label: "فينتاج", adj: { ...DEFAULT_ADJ, sepia: 48, contrast: 92, brightness: 106, saturate: 85 } },
  { id: "drama", label: "درامي", adj: { ...DEFAULT_ADJ, contrast: 128, saturate: 110, brightness: 96 } },
  { id: "soft", label: "ناعم", adj: { ...DEFAULT_ADJ, blur: 0.6, brightness: 106, saturate: 92 } },
];

function filterString(a: Adjust): string {
  return `brightness(${a.brightness}%) contrast(${a.contrast}%) saturate(${a.saturate}%) grayscale(${a.grayscale}%) sepia(${a.sepia}%) hue-rotate(${a.hue}deg) blur(${a.blur}px)`;
}

type ToolId = "brush" | "eraser" | "text" | "crop";

export default function PhotoEditor() {
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const history = useRef<string[]>([]);
  const histIdx = useRef(-1);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const cropStart = useRef<{ x: number; y: number } | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [tool, setTool] = useState<ToolId>("brush");
  const [adj, setAdj] = useState<Adjust>(DEFAULT_ADJ);
  const [preset, setPreset] = useState("none");
  const [brushSize, setBrushSize] = useState(16);
  const [brushColor, setBrushColor] = useState("#d64550");
  const [textVal, setTextVal] = useState("نصّك هنا");
  const [textSize, setTextSize] = useState(72);
  const [textColor, setTextColor] = useState("#ffffff");
  const [cropSel, setCropSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(0.92);
  const [version, setVersion] = useState(0);
  const [exported, setExported] = useState<{ blob: Blob; name: string } | null>(null);

  const render = useCallback(() => {
    const base = baseRef.current;
    const pv = previewRef.current;
    if (!base || !pv) return;
    pv.width = base.width;
    pv.height = base.height;
    const ctx = pv.getContext("2d")!;
    ctx.filter = filterString(adj);
    ctx.drawImage(base, 0, 0);
    ctx.filter = "none";
  }, [adj]);

  useEffect(() => {
    if (loaded) render();
  }, [loaded, render]);

  const commit = useCallback(() => {
    const base = baseRef.current;
    if (!base) return;
    const snap = base.toDataURL("image/png");
    history.current = history.current.slice(0, histIdx.current + 1);
    history.current.push(snap);
    if (history.current.length > 25) history.current.shift();
    histIdx.current = history.current.length - 1;
    setVersion((v) => v + 1);
    render();
  }, [render]);

  const loadSnapshot = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const base = baseRef.current!;
      base.width = img.width;
      base.height = img.height;
      base.getContext("2d")!.drawImage(img, 0, 0);
      render();
    };
    img.src = dataUrl;
  };

  const onFile = (files: File[]) => {
    const f = files[0];
    const img = new Image();
    img.onload = () => {
      const maxDim = 2000;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const base = document.createElement("canvas");
      base.width = Math.round(img.naturalWidth * scale);
      base.height = Math.round(img.naturalHeight * scale);
      base.getContext("2d")!.drawImage(img, 0, 0, base.width, base.height);
      baseRef.current = base;
      history.current = [base.toDataURL("image/png")];
      histIdx.current = 0;
      setFileName(f.name);
      setFileSize(f.size);
      setAdj(DEFAULT_ADJ);
      setPreset("none");
      setCropSel(null);
      setLoaded(true);
      setVersion((v) => v + 1);
    };
    img.onerror = () => showToast("تعذّر قراءة الصورة", "err");
    img.src = URL.createObjectURL(f);
  };

  const coords = (e: React.PointerEvent) => {
    const pv = previewRef.current!;
    const rect = pv.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * pv.width,
      y: ((e.clientY - rect.top) / rect.height) * pv.height,
    };
  };

  const onDown = (e: React.PointerEvent) => {
    if (!loaded) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = coords(e);
    if (tool === "brush" || tool === "eraser") {
      drawing.current = true;
      lastPt.current = p;
      const ctx = baseRef.current!.getContext("2d")!;
      ctx.save();
      if (tool === "eraser") ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = brushColor;
      ctx.fillStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      render();
    } else if (tool === "text") {
      const base = baseRef.current!;
      const ctx = base.getContext("2d")!;
      const px = Math.max(14, (textSize / 1000) * base.width);
      ctx.save();
      ctx.font = `700 ${px}px "IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = px / 8;
      ctx.fillStyle = textColor;
      ctx.fillText(textVal || "نص", p.x, p.y);
      ctx.restore();
      commit();
      showToast("أُضيف النص — انقر في مكان آخر لإضافة المزيد");
    } else if (tool === "crop") {
      cropStart.current = p;
      setCropSel({ x: p.x, y: p.y, w: 0, h: 0 });
    }
  };

  const onMove = (e: React.PointerEvent) => {
    if (!loaded) return;
    if (tool === "brush" || tool === "eraser") {
      if (!drawing.current || !lastPt.current) return;
      const p = coords(e);
      const ctx = baseRef.current!.getContext("2d")!;
      ctx.save();
      if (tool === "eraser") ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
      lastPt.current = p;
      render();
    } else if (tool === "crop" && cropStart.current) {
      const p = coords(e);
      const s = cropStart.current;
      setCropSel({
        x: Math.min(s.x, p.x),
        y: Math.min(s.y, p.y),
        w: Math.abs(p.x - s.x),
        h: Math.abs(p.y - s.y),
      });
    }
  };

  const onUp = () => {
    if (tool === "brush" || tool === "eraser") {
      if (drawing.current) commit();
      drawing.current = false;
      lastPt.current = null;
    } else if (tool === "crop") {
      cropStart.current = null;
      if (cropSel && (cropSel.w < 8 || cropSel.h < 8)) setCropSel(null);
    }
  };

  const applyCrop = () => {
    if (!cropSel) return;
    const base = baseRef.current!;
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(cropSel.w));
    c.height = Math.max(2, Math.round(cropSel.h));
    c.getContext("2d")!.drawImage(
      base,
      Math.round(cropSel.x),
      Math.round(cropSel.y),
      c.width,
      c.height,
      0,
      0,
      c.width,
      c.height
    );
    baseRef.current = c;
    setCropSel(null);
    commit();
    showToast("تم القص");
  };

  const rotate = (dir: 1 | -1) => {
    const base = baseRef.current!;
    const c = document.createElement("canvas");
    c.width = base.height;
    c.height = base.width;
    const ctx = c.getContext("2d")!;
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((dir * Math.PI) / 2);
    ctx.drawImage(base, -base.width / 2, -base.height / 2);
    baseRef.current = c;
    commit();
  };

  const flip = (axis: "h" | "v") => {
    const base = baseRef.current!;
    const c = document.createElement("canvas");
    c.width = base.width;
    c.height = base.height;
    const ctx = c.getContext("2d")!;
    if (axis === "h") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, c.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(base, 0, 0);
    baseRef.current = c;
    commit();
  };

  const undo = () => {
    if (histIdx.current > 0) {
      histIdx.current--;
      loadSnapshot(history.current[histIdx.current]);
      setVersion((v) => v + 1);
    }
  };
  const redo = () => {
    if (histIdx.current < history.current.length - 1) {
      histIdx.current++;
      loadSnapshot(history.current[histIdx.current]);
      setVersion((v) => v + 1);
    }
  };
  const resetAll = () => {
    if (history.current.length) {
      histIdx.current = 0;
      loadSnapshot(history.current[0]);
      setAdj(DEFAULT_ADJ);
      setPreset("none");
      setCropSel(null);
      setVersion((v) => v + 1);
    }
  };

  const exportImage = () => {
    const base = baseRef.current!;
    const c = document.createElement("canvas");
    c.width = base.width;
    c.height = base.height;
    const ctx = c.getContext("2d")!;
    if (exportFormat === "jpeg") {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
    }
    ctx.filter = filterString(adj);
    ctx.drawImage(base, 0, 0);
    c.toBlob(
      (b) => {
        if (!b) return;
        const name = `${fileName.replace(/\.[^.]+$/, "")}-edited.${exportFormat === "jpeg" ? "jpg" : exportFormat}`;
        downloadBlob(b, name);
        setExported({ blob: b, name });
        bumpProcessedCount(1);
        showToast("تم تنزيل الصورة المعدّلة");
      },
      `image/${exportFormat}`,
      exportFormat === "png" ? undefined : quality
    );
  };

  const TOOLS: Array<{ id: ToolId; icon: IconName; label: string }> = [
    { id: "brush", icon: "brush", label: "فرشاة" },
    { id: "eraser", icon: "eraser", label: "ممحاة" },
    { id: "text", icon: "type", label: "نص" },
    { id: "crop", icon: "crop", label: "قص" },
  ];

  const SLIDERS: Array<{ key: keyof Adjust; label: string; min: number; max: number; unit: string }> = [
    { key: "brightness", label: "السطوع", min: 30, max: 200, unit: "%" },
    { key: "contrast", label: "التباين", min: 30, max: 200, unit: "%" },
    { key: "saturate", label: "التشبع", min: 0, max: 250, unit: "%" },
    { key: "hue", label: "تدرج اللون", min: -180, max: 180, unit: "°" },
    { key: "grayscale", label: "رمادي", min: 0, max: 100, unit: "%" },
    { key: "sepia", label: "بني قديم", min: 0, max: 100, unit: "%" },
    { key: "blur", label: "ضبابية", min: 0, max: 10, unit: "px" },
  ];

  return (
    <ToolShell tool={TOOL}>
      {!loaded ? (
        <Dropzone
          accept={TOOL.accept}
          multiple={false}
          onFiles={onFile}
          color={TOOL.color}
          title="افتح صورة في المحرر"
          subtitle="فرشاة ونصوص وقص وتدوير وفلاتر وتعديلات لونية كاملة — كل شيء محلي"
        />
      ) : (
        <div className="anim-pop grid gap-5 xl:grid-cols-[1fr_300px]">
          {/* منطقة التحرير */}
          <div className="card flex flex-col p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setTool(t.id); setCropSel(null); }}
                    className={cx(
                      "chip !px-3 !py-2 !text-xs",
                      tool === t.id && "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]"
                    )}
                    aria-pressed={tool === t.id}
                  >
                    <Icon name={t.icon} size={15} />
                    {t.label}
                  </button>
                ))}
                <span className="mx-1 h-6 w-px bg-[var(--line)]" />
                <button type="button" onClick={undo} disabled={histIdx.current <= 0} className="chip !px-2.5 !py-2 disabled:opacity-40" title="تراجع" aria-label="تراجع">
                  <Icon name="undo" size={15} />
                </button>
                <button type="button" onClick={redo} disabled={histIdx.current >= history.current.length - 1} className="chip !px-2.5 !py-2 disabled:opacity-40" title="إعادة" aria-label="إعادة">
                  <Icon name="redo" size={15} />
                </button>
                <button type="button" onClick={() => rotate(-1)} className="chip !px-2.5 !py-2" title="تدوير لليسار" aria-label="تدوير لليسار">
                  <Icon name="rotateL" size={15} />
                </button>
                <button type="button" onClick={() => rotate(1)} className="chip !px-2.5 !py-2" title="تدوير لليمين" aria-label="تدوير لليمين">
                  <Icon name="rotateR" size={15} />
                </button>
                <button type="button" onClick={() => flip("h")} className="chip !px-2.5 !py-2" title="قلب أفقي" aria-label="قلب أفقي">
                  <Icon name="flipH" size={15} />
                </button>
                <button type="button" onClick={() => flip("v")} className="chip !px-2.5 !py-2" title="قلب رأسي" aria-label="قلب رأسي">
                  <Icon name="flipV" size={15} />
                </button>
                <button type="button" onClick={resetAll} className="chip !px-2.5 !py-2 c-red" title="إعادة تعيين" aria-label="إعادة تعيين">
                  <Icon name="refresh" size={15} />
                </button>
              </div>
              <span className="c-muted font-mono text-[10.5px]" dir="ltr">
                {baseRef.current?.width}×{baseRef.current?.height}
              </span>
            </div>

            <div
              ref={wrapRef}
              className="checker relative grid flex-1 place-items-center overflow-hidden rounded-xl border bd-line p-2"
              style={{ background: "var(--surface2)" }}
            >
              <div className="relative inline-block max-w-full">
                <canvas
                  ref={previewRef}
                  className="block max-h-[540px] w-auto max-w-full touch-none rounded-md"
                  style={{ cursor: tool === "text" ? "text" : tool === "crop" ? "crosshair" : "crosshair" }}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerLeave={onUp}
                />
                {cropSel && tool === "crop" && baseRef.current && (
                  <div
                    className="ants pointer-events-none absolute border-2 border-dashed border-[var(--teal)] bg-[color-mix(in_srgb,var(--teal)_12%,transparent)]"
                    style={{
                      insetInlineStart: `${(cropSel.x / baseRef.current.width) * 100}%`,
                      top: `${(cropSel.y / baseRef.current.height) * 100}%`,
                      width: `${(cropSel.w / baseRef.current.width) * 100}%`,
                      height: `${(cropSel.h / baseRef.current.height) * 100}%`,
                    }}
                  />
                )}
              </div>
            </div>

            {tool === "crop" && cropSel && (
              <div className="anim-pop mt-3 flex items-center gap-2">
                <button type="button" onClick={applyCrop} className="btn btn-teal !py-2 !text-sm">
                  <Icon name="check" size={15} />
                  تطبيق القص ({Math.round(cropSel.w)}×{Math.round(cropSel.h)})
                </button>
                <button type="button" onClick={() => setCropSel(null)} className="btn btn-ghost !py-2 !text-sm">
                  إلغاء
                </button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t bd-line pt-3">
              <p className="truncate text-xs c-muted">
                <b className="c-muted">{fileName}</b> · <span dir="ltr" className="font-mono">{formatBytes(fileSize)}</span>
              </p>
              <button type="button" onClick={() => { setLoaded(false); setCropSel(null); }} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                <Icon name="refresh" size={14} />
                صورة جديدة
              </button>
            </div>
          </div>

          {/* لوحة التحكم */}
          <div className="space-y-4">
            {(tool === "brush" || tool === "eraser") && (
              <div className="card anim-pop p-4">
                <h3 className="font-display mb-3 text-sm font-bold">{tool === "brush" ? "الفرشاة" : "الممحاة"}</h3>
                {tool === "brush" && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs c-muted">اللون</span>
                    <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border bd-line bg-surface" aria-label="لون الفرشاة" />
                    {["#d64550", "#0c7a63", "#e8930c", "#12211d", "#ffffff"].map((c) => (
                      <button key={c} type="button" onClick={() => setBrushColor(c)} className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110" style={{ background: c, borderColor: brushColor === c ? "var(--teal)" : "var(--line)" }} aria-label={`لون ${c}`} />
                    ))}
                  </div>
                )}
                <label className="block text-xs c-muted">
                  الحجم: <b className="font-mono" dir="ltr">{brushSize}px</b>
                  <input type="range" min={2} max={120} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="mt-1.5 w-full" />
                </label>
              </div>
            )}

            {tool === "text" && (
              <div className="card anim-pop space-y-3 p-4">
                <h3 className="font-display text-sm font-bold">النص</h3>
                <input className="input" value={textVal} onChange={(e) => setTextVal(e.target.value)} placeholder="اكتب النص هنا ثم انقر على الصورة" />
                <div className="flex items-center gap-2">
                  <span className="text-xs c-muted">اللون</span>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border bd-line bg-surface" aria-label="لون النص" />
                </div>
                <label className="block text-xs c-muted">
                  الحجم النسبي: <b className="font-mono">{textSize}</b>
                  <input type="range" min={20} max={220} value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="mt-1.5 w-full" />
                </label>
                <p className="text-[11px] c-muted">انقر في أي مكان على الصورة لوضع النص — يدعم العربية بالكامل.</p>
              </div>
            )}

            <div className="card p-4">
              <h3 className="font-display mb-3 flex items-center gap-1.5 text-sm font-bold">
                <span className="c-amber"><Icon name="palette" size={15} /></span>
                فلاتر جاهزة
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setAdj(p.adj); setPreset(p.id); }}
                    className={cx("chip !px-3 !py-1.5 !text-xs", preset === p.id && "!border-[var(--amber)] !text-[var(--amber)]")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-display mb-3 flex items-center gap-1.5 text-sm font-bold">
                <span className="c-teal"><Icon name="wand" size={15} /></span>
                التعديلات اللونية
              </h3>
              <div className="space-y-3">
                {SLIDERS.map((s) => (
                  <label key={s.key} className="block text-xs c-muted">
                    <span className="flex justify-between">
                      {s.label}
                      <b className="font-mono" dir="ltr">{adj[s.key]}{s.unit}</b>
                    </span>
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.key === "blur" ? 0.2 : 1}
                      value={adj[s.key]}
                      onChange={(e) => { setAdj((a) => ({ ...a, [s.key]: Number(e.target.value) })); setPreset("custom"); }}
                      className="mt-1 w-full"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-display mb-3 flex items-center gap-1.5 text-sm font-bold">
                <span className="c-teal"><Icon name="download" size={15} /></span>
                التصدير
              </h3>
              <div className="mb-3 flex gap-1.5">
                {(["png", "jpeg", "webp"] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setExportFormat(f)} className={cx("chip flex-1 justify-center !py-2 font-mono !text-[11px]", exportFormat === f && "!border-[var(--teal)] !text-[var(--teal)]")}>
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
              {exportFormat !== "png" && (
                <label className="mb-3 block text-xs c-muted">
                  الجودة: <b className="font-mono">{Math.round(quality * 100)}%</b>
                  <input type="range" min={0.4} max={1} step={0.02} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="mt-1 w-full" />
                </label>
              )}
              <button type="button" onClick={exportImage} className="btn btn-teal w-full">
                <Icon name="download" size={17} />
                تنزيل الصورة المعدّلة
              </button>
              {exported && (
                <BlobLink
                  blob={exported.blob}
                  filename={exported.name}
                  className="btn-amber mt-2 w-full !text-sm"
                  iconSize={15}
                  label="لم يبدأ التنزيل؟ احفظ من هنا"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          التعديلات اللونية والفلاتر غير مدمّرة (تُطبَّق عند التصدير) أما الرسم والقص والتدوير
          فتُدمج في الصورة — استخدم «تراجع» للتراجع عنها. يعمل المحرر بأداء أفضل مع صور حتى 2000 بكسل.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
