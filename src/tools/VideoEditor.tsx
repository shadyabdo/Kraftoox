import { useCallback, useEffect, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, Spinner, BlobLink } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { cx, formatBytes, formatSeconds, showToast } from "../lib/utils";
import { takePendingFiles } from "../lib/pending";
import { ToolShell } from "./shared";
import { Icon, type IconName } from "../components/Icons";

const TOOL = getTool("video-editor")!;

/* ===== فلاتر جاهزة ===== */
const FILTERS: Array<{ id: string; ar: string; en: string; css: string }> = [
  { id: "none", ar: "بدون", en: "None", css: "" },
  { id: "bw", ar: "أبيض وأسود", en: "B&W", css: "grayscale(1)" },
  { id: "sepia", ar: "سيبيا", en: "Sepia", css: "sepia(0.85)" },
  { id: "warm", ar: "دافئ", en: "Warm", css: "saturate(1.5) sepia(0.22) contrast(1.05) brightness(1.04)" },
  { id: "cool", ar: "بارد", en: "Cool", css: "saturate(0.9) hue-rotate(12deg) brightness(1.02)" },
  { id: "vivid", ar: "مشبع", en: "Vivid", css: "saturate(1.7) contrast(1.12)" },
  { id: "invert", ar: "معكوس", en: "Invert", css: "invert(1)" },
  { id: "vintage", ar: "كلاسيكي", en: "Vintage", css: "sepia(0.4) contrast(0.9) brightness(1.05) saturate(1.2)" },
];

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return (
    ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    ) ?? null
  );
}

export default function VideoEditor() {
  const { isAr, t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [vw, setVw] = useState(16);
  const [vh, setVh] = useState(9);

  /* القصّ */
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playhead, setPlayhead] = useState(0);

  /* الفلاتر */
  const [filter, setFilter] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  /* النص */
  const [text, setText] = useState("");
  const [textSize, setTextSize] = useState(7);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textPos, setTextPos] = useState({ x: 50, y: 50 });
  const draggingText = useRef(false);

  /* التحويل */
  const [speed, setSpeed] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  /* التصدير */
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; name: string; size: number } | null>(null);
  const abortExport = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  /* رسم صوتي دائم حتى لا ينكسر صوت المعاينة بين عمليات التصدير */
  const audioGraphRef = useRef<{ ctx: AudioContext; src: MediaElementAudioSourceNode } | null>(null);

  /* التقاط ملف محوَّل من صفحة الهبوط */
  useEffect(() => {
    const pending = takePendingFiles();
    if (pending && pending[0]) loadVideo(pending[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadVideo = (f: File) => {
    URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setLoaded(false);
    setResult(null);
    setExportProgress(0);
  };

  const onLoadedMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setTrimStart(0);
    setTrimEnd(v.duration);
    setVw(v.videoWidth || 16);
    setVh(v.videoHeight || 9);
    setLoaded(true);
  };

  /* شريط القصّ — سحب المقابض */
  const timeFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || !duration) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const startDrag = (which: "start" | "end" | "play") => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const time = timeFromClientX(ev.clientX);
      if (which === "start") setTrimStart(Math.min(time, trimEnd - 0.2));
      else if (which === "end") setTrimEnd(Math.max(time, trimStart + 0.2));
      else seekTo(time);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    move(e.nativeEvent);
  };

  const seekTo = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
    setPlayhead(time);
  };

  /* سحب النص على المعاينة */
  const startTextDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingText.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const moveText = (e: React.PointerEvent) => {
    if (!draggingText.current || !previewWrapRef.current) return;
    const rect = previewWrapRef.current.getBoundingClientRect();
    setTextPos({
      x: Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)),
    });
  };
  const endTextDrag = () => (draggingText.current = false);

  /* بناء سلسلة الفلاتر */
  const cssFilter = () => {
    const preset = FILTERS.find((f) => f.id === filter)?.css ?? "";
    const manual = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    return [preset, manual].filter(Boolean).join(" ");
  };

  const previewTransform = () =>
    `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`;

  /* ===== التصدير ===== */
  const exportVideo = async () => {
    const v = videoRef.current;
    const mime = pickMime();
    if (!v || !file) return;
    if (!mime) {
      showToast(t("متصفحك لا يدعم تصدير الفيديو — جرّب كروم أو إيدج", "Your browser can't export video — try Chrome or Edge"), "err");
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setResult(null);
    abortExport.current = false;

    const canvas = document.createElement("canvas");
    const swapped = rotation % 180 !== 0;
    canvas.width = swapped ? v.videoHeight : v.videoWidth;
    canvas.height = swapped ? v.videoWidth : v.videoHeight;
    const ctx = canvas.getContext("2d")!;

    const stream = canvas.captureStream(30);

    /* محاولة التقاط الصوت — رسم دائم يُعاد استخدامه */
    let destNode: MediaStreamAudioDestinationNode | null = null;
    try {
      if (!audioGraphRef.current) {
        const ctx = new AudioContext();
        const src = ctx.createMediaElementSource(v);
        /* نُبقي مخرجاً للمكبر حتى يظل صوت المعاينة مسموعاً */
        src.connect(ctx.destination);
        audioGraphRef.current = { ctx, src };
      }
      const { ctx, src } = audioGraphRef.current;
      await ctx.resume().catch(() => undefined);
      destNode = ctx.createMediaStreamDestination();
      src.connect(destNode);
      const track = destNode.stream.getAudioTracks()[0];
      if (track) stream.addTrack(track);
    } catch {
      /* بدون صوت */
    }

    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 9_000_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

    const finish = () => {
      if (recorder.state !== "inactive") recorder.stop();
    };
    recorder.onstop = () => {
      try {
        destNode?.disconnect();
      } catch {
        /* ignore */
      }
      setExporting(false);
      if (abortExport.current) {
        showToast(t("أُلغي التصدير", "Export cancelled"), "info");
        return;
      }
      const blob = new Blob(chunks, { type: "video/webm" });
      const name = (file.name.replace(/\.[^.]+$/, "") || "video") + "-edited.webm";
      setResult({ blob, name, size: blob.size });
      showToast(t("اكتمل التصدير — جاهز للتنزيل", "Export complete — ready to download"));
    };

    const drawText = () => {
      if (!text.trim()) return;
      const size = canvas.height * (textSize / 100);
      ctx.font = `700 ${size}px "Rubik", "IBM Plex Sans Arabic", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = size * 0.16;
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      const x = canvas.width * (textPos.x / 100);
      const y = canvas.height * (textPos.y / 100);
      ctx.strokeText(text, x, y, canvas.width * 0.92);
      ctx.fillStyle = textColor;
      ctx.fillText(text, x, y, canvas.width * 0.92);
    };

    const draw = () => {
      ctx.save();
      ctx.filter = cssFilter();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(v, -v.videoWidth / 2, -v.videoHeight / 2);
      ctx.restore();
      drawText();
    };

    /* الانتقال إلى نقطة البداية */
    v.pause();
    v.playbackRate = speed;
    await new Promise<void>((resolve) => {
      const onSeek = () => {
        v.removeEventListener("seeked", onSeek);
        resolve();
      };
      v.addEventListener("seeked", onSeek);
      v.currentTime = trimStart;
    });

    let stopped = false;
    const loop = () => {
      if (stopped) return;
      if (abortExport.current || v.currentTime >= trimEnd || v.ended) {
        stopped = true;
        v.pause();
        finish();
        return;
      }
      draw();
      const p = (v.currentTime - trimStart) / Math.max(0.01, trimEnd - trimStart);
      setExportProgress(Math.min(1, Math.max(0, p)));
      requestAnimationFrame(loop);
    };

    v.onended = () => {
      if (!stopped) {
        stopped = true;
        finish();
      }
    };

    recorder.start(300);
    await v.play().catch(() => undefined);
    loop();
  };

  const cancelExport = () => {
    abortExport.current = true;
  };

  const reset = () => {
    URL.revokeObjectURL(videoUrl);
    setFile(null);
    setVideoUrl("");
    setLoaded(false);
    setResult(null);
    setTrimStart(0);
    setTrimEnd(0);
    setExportProgress(0);
  };

  const pct = (v: number) => (duration ? (v / duration) * 100 : 0);

  return (
    <ToolShell tool={TOOL}>
      {!file ? (
        <>
          <Dropzone
            accept={TOOL.accept}
            multiple={false}
            onFiles={(files) => loadVideo(files[0])}
            color={TOOL.color}
            title={isAr ? TOOL.drop[0] : TOOL.drop[1]}
            subtitle={isAr ? TOOL.dropSub[0] : TOOL.dropSub[1]}
          />
          <div className="mt-8">
            <InfoNote>
              {isAr
                ? "محرر يعمل بالكامل داخل متصفحك — قصّ، فلاتر، نص، سرعة، تدوير وعكس، ثم تصدير بصيغة WebM مع الصوت. لا يُرفع ملفك لأي خادم."
                : "An editor that runs entirely in your browser — trim, filters, text, speed, rotate & flip, then export as WebM with audio. Your file is never uploaded."}
            </InfoNote>
          </div>
        </>
      ) : (
        <div className="anim-pop">
          {/* شريط علوي */}
          <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${TOOL.color} 12%, var(--surface))`, color: TOOL.color }}
            >
              <Icon name="timeline" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-sm font-extrabold">
                {isAr ? "محرر الفيديو — يعمل داخل متصفحك" : "Video Editor — runs in your browser"}
              </p>
              <p className="c-muted truncate text-xs" dir="ltr" style={{ textAlign: "end" }}>
                <bdi>
                  {file.name} · {formatBytes(file.size)}
                  {loaded && <> · {formatSeconds(duration)}</>}
                </bdi>
              </p>
            </div>
            <button type="button" onClick={reset} className="btn btn-ghost !py-2 !text-sm">
              <Icon name="refresh" size={15} />
              {isAr ? "فيديو آخر" : "Different video"}
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* ===== المعاينة + القصّ ===== */}
            <div className="space-y-4">
              <div className="card overflow-hidden !rounded-xl bg-black">
                <div className="grid place-items-center bg-black p-3">
                  <div
                    ref={previewWrapRef}
                    className="relative max-h-[52vh] w-full overflow-hidden"
                    style={{ aspectRatio: `${vw} / ${vh}` }}
                  >
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      onLoadedMetadata={onLoadedMeta}
                      onTimeUpdate={(e) => setPlayhead(e.currentTarget.currentTime)}
                      controls
                      playsInline
                      className="h-full w-full object-contain"
                      style={{ filter: cssFilter(), transform: previewTransform() }}
                    />
                    {/* طبقة النص القابلة للسحب */}
                    {loaded && text.trim() && (
                      <div
                        onPointerDown={startTextDrag}
                        onPointerMove={moveText}
                        onPointerUp={endTextDrag}
                        className="font-display absolute cursor-move select-none text-center font-extrabold leading-tight"
                        style={{
                          left: `${textPos.x}%`,
                          top: `${textPos.y}%`,
                          transform: "translate(-50%, -50%)",
                          color: textColor,
                          textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                          WebkitTextStroke: "1px rgba(0,0,0,0.5)",
                          whiteSpace: "pre-wrap",
                          maxWidth: "92%",
                          pointerEvents: "auto",
                        }}
                      >
                        <span style={{ fontSize: `clamp(12px, ${textSize * 0.6}vh, 90px)` }}>{text}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* شريط القصّ */}
                {loaded && (
                  <div className="border-t border-white/10 p-4">
                    <div
                      ref={trackRef}
                      className="relative h-12 cursor-pointer rounded-lg bg-white/10"
                      onPointerDown={startDrag("play")}
                    >
                      {/* المنطقة المختارة */}
                      <div
                        className="absolute inset-y-0 rounded-md"
                        style={{
                          left: `${pct(trimStart)}%`,
                          width: `${pct(trimEnd) - pct(trimStart)}%`,
                          background: "color-mix(in srgb, var(--blue) 30%, transparent)",
                          border: "1px solid var(--blue)",
                        }}
                      />
                      {/* مؤشر التشغيل */}
                      <div
                        className="absolute top-0 h-full w-0.5 bg-[var(--amber)]"
                        style={{ left: `${pct(playhead)}%` }}
                      />
                      {/* مقبض البداية */}
                      <div
                        onPointerDown={startDrag("start")}
                        className="absolute top-0 flex h-full w-4 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-l-md bg-[var(--blue)]"
                        style={{ left: `${pct(trimStart)}%` }}
                      >
                        <span className="h-5 w-0.5 rounded bg-white/80" />
                      </div>
                      {/* مقبض النهاية */}
                      <div
                        onPointerDown={startDrag("end")}
                        className="absolute top-0 flex h-full w-4 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-r-md bg-[var(--blue)]"
                        style={{ left: `${pct(trimEnd)}%` }}
                      >
                        <span className="h-5 w-0.5 rounded bg-white/80" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between font-mono text-[11px] c-muted" dir="ltr">
                      <span>{formatSeconds(trimStart)}</span>
                      <span className="font-bold c-teal">{formatSeconds(Math.max(0, trimEnd - trimStart))} {isAr ? "مقطع" : "clip"}</span>
                      <span>{formatSeconds(trimEnd)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* التصدير */}
              <div className="card p-4">
                {!exporting && !result && (
                  <button
                    type="button"
                    onClick={exportVideo}
                    disabled={!loaded}
                    className="btn btn-teal w-full !py-3.5 !text-base"
                  >
                    <Icon name="download" size={18} />
                    {isAr ? "تصدير الفيديو (WebM)" : "Export video (WebM)"}
                  </button>
                )}
                {exporting && (
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-2 c-teal">
                        <Spinner size={15} />
                        {isAr ? "جارٍ التصدير…" : "Exporting…"}
                      </span>
                      <span className="font-mono" dir="ltr">{Math.round(exportProgress * 100)}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
                      <div
                        className="h-full rounded-full transition-[width] duration-200"
                        style={{ width: `${exportProgress * 100}%`, background: "var(--teal)" }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[11px] c-muted">
                        {isAr ? "يُعاد ترميز الفيديو إطاراً بإطار مع التأثيرات…" : "Re-encoding frame by frame with effects…"}
                      </p>
                      <button type="button" onClick={cancelExport} className="btn btn-red !py-1.5 !text-xs">
                        <Icon name="close" size={13} />
                        {isAr ? "إلغاء" : "Cancel"}
                      </button>
                    </div>
                  </div>
                )}
                {result && !exporting && (
                  <div className="anim-pop flex flex-col gap-3">
                    <div className="flex items-center gap-2.5 rounded-xl bg-[var(--teal-soft)] px-4 py-3">
                      <Icon name="check" size={18} className="c-teal" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold c-teal" dir="ltr" style={{ textAlign: "end" }}>
                          <bdi>{result.name}</bdi>
                        </p>
                        <p className="font-mono text-[11px] c-muted" dir="ltr">{formatBytes(result.size)}</p>
                      </div>
                    </div>
                    <video src={URL.createObjectURL(result.blob)} controls className="w-full rounded-lg border border-[var(--line)]" />
                    <div className="flex gap-2">
                      <BlobLink
                        blob={result.blob}
                        filename={result.name}
                        className="btn-teal flex-1"
                        label={isAr ? "تنزيل الفيديو" : "Download video"}
                      />
                      <button type="button" onClick={exportVideo} className="btn btn-ghost">
                        <Icon name="refresh" size={15} />
                        {isAr ? "إعادة" : "Redo"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== لوحة التحكم ===== */}
            <div className="space-y-4">
              {/* الفلاتر */}
              <Panel title={isAr ? "الفلاتر" : "Filters"} icon="palette" color="var(--teal)">
                <div className="grid grid-cols-4 gap-1.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilter(f.id)}
                      className={cx(
                        "chip !justify-center !px-1 !py-2 !text-[11px]",
                        filter === f.id && "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]"
                      )}
                    >
                      {isAr ? f.ar : f.en}
                    </button>
                  ))}
                </div>
                <Slider label={isAr ? "السطوع" : "Brightness"} value={brightness} onChange={setBrightness} min={40} max={200} />
                <Slider label={isAr ? "التباين" : "Contrast"} value={contrast} onChange={setContrast} min={40} max={200} />
                <Slider label={isAr ? "التشبع" : "Saturation"} value={saturation} onChange={setSaturation} min={0} max={250} />
              </Panel>

              {/* النص */}
              <Panel title={isAr ? "النص" : "Text"} icon="type" color="var(--amber)">
                <input
                  className="input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={isAr ? "اكتب نصاً يظهر على الفيديو…" : "Type text to overlay…"}
                />
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-xs c-muted">{isAr ? "اللون" : "Color"}</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-lg border border-[var(--line)] bg-transparent"
                  />
                </div>
                <Slider label={isAr ? "حجم النص" : "Text size"} value={textSize} onChange={setTextSize} min={3} max={20} />
                <p className="text-[11px] c-muted">
                  {isAr ? "اسحب النص على المعاينة لتغيير مكانه." : "Drag the text on the preview to reposition."}
                </p>
              </Panel>

              {/* التحويل */}
              <Panel title={isAr ? "التحويل" : "Transform"} icon="wand" color="var(--blue)">
                <Field label={isAr ? "السرعة" : "Speed"}>
                  <div className="flex gap-1.5">
                    {[0.5, 1, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSpeed(s)}
                        className={cx(
                          "chip !px-3 !py-1.5 font-mono !text-xs",
                          speed === s && "!border-[var(--blue)] !text-[var(--blue)]"
                        )}
                      >
                        ×{s}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={isAr ? "التدوير والقلب" : "Rotate & flip"}>
                  <div className="flex gap-1.5">
                    <ToolBtn icon="rotateL" label={isAr ? "تدوير يساراً" : "Rotate left"} onClick={() => setRotation((r) => (r + 270) % 360)} />
                    <ToolBtn icon="rotateR" label={isAr ? "تدوير يميناً" : "Rotate right"} onClick={() => setRotation((r) => (r + 90) % 360)} />
                    <ToolBtn icon="flipH" label={isAr ? "قلب أفقي" : "Flip horizontal"} active={flipH} onClick={() => setFlipH((v) => !v)} />
                    <ToolBtn icon="flipV" label={isAr ? "قلب رأسي" : "Flip vertical"} active={flipV} onClick={() => setFlipV((v) => !v)} />
                  </div>
                </Field>
                {rotation !== 0 && (
                  <button type="button" onClick={() => setRotation(0)} className="chip !text-[11px]">
                    <Icon name="refresh" size={12} />
                    {isAr ? `إلغاء التدوير (${rotation}°)` : `Reset rotation (${rotation}°)`}
                  </button>
                )}
              </Panel>
            </div>
          </div>

          <div className="mt-6">
            <InfoNote>
              {isAr
                ? "التصدير يتم بإعادة ترميز الفيديو إطاراً بإطار داخل متصفحك مع كل التأثيرات المطبقة (قصّ، فلاتر، نص، سرعة، تدوير) وبالصوت الأصلي. الناتج بصيغة WebM يقبلها يوتيوب وتيك توك مباشرة."
                : "Export re-encodes the video frame by frame in your browser with all applied effects (trim, filters, text, speed, rotation) and the original audio. Output is WebM, accepted directly by YouTube and TikTok."}
            </InfoNote>
          </div>
        </div>
      )}
    </ToolShell>
  );
}

/* ===== عناصر مساعدة ===== */
function Panel({ title, icon, color, children }: { title: string; icon: IconName; color: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-extrabold">
        <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 12%, var(--surface))`, color }}>
          <Icon name={icon} size={15} />
        </span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Slider({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="c-muted">{label}</span>
        <span className="font-mono font-semibold" dir="ltr">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label={label}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="c-muted mb-1.5 text-xs">{label}</p>
      {children}
    </div>
  );
}

function ToolBtn({ icon, label, onClick, active }: { icon: IconName; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cx(
        "grid h-9 w-9 place-items-center rounded-lg border border-[var(--line)] c-muted transition-all duration-150 hover:border-[var(--blue)] hover:text-[var(--blue)]",
        active && "border-[var(--blue)] bg-[color-mix(in_srgb,var(--blue)_12%,transparent)] text-[var(--blue)]"
      )}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
