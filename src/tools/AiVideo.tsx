import { useEffect, useRef, useState } from "react";
import { InfoNote, ProgressBar } from "../components/bits";
import { getTool } from "../data/tools";
import { AI_STYLES, buildScenePrompt, fetchAiImage, generateArabicScript, type VideoScript } from "../lib/ai";
import { bumpProcessedCount, formatSeconds, showToast } from "../lib/utils";
import { ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";
import { cx } from "../lib/utils";

const TOOL = getTool("ai-video")!;

const FORMATS = [
  { id: "shorts", label: "يوتيوب شورتز", hint: "9:16", w: 720, h: 1280 },
  { id: "yt", label: "يوتيوب عادي", hint: "16:9", w: 1280, h: 720 },
];

const DURATIONS = [
  { s: 15, label: "15 ث" },
  { s: 30, label: "30 ث" },
  { s: 60, label: "دقيقة" },
  { s: 180, label: "3 دقائق" },
  { s: 600, label: "10 دقائق" },
  { s: 1800, label: "30 دقيقة" },
  { s: 3600, label: "ساعة" },
];

type Stage = "idle" | "script" | "images" | "recording" | "done";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function loadImageEl(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

function placeholderImage(w: number, h: number, hue: number): HTMLImageElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, `hsl(${hue} 45% 22%)`);
  g.addColorStop(1, `hsl(${(hue + 60) % 360} 50% 34%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const img = new Image();
  img.src = c.toDataURL();
  return img;
}

export default function AiVideo() {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<string>(AI_STYLES[0].id);
  const [format, setFormat] = useState("shorts");
  const [duration, setDuration] = useState(30);
  const [stage, setStage] = useState<Stage>("idle");
  const [script, setScript] = useState<VideoScript | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [imgProgress, setImgProgress] = useState({ done: 0, total: 0 });
  const [recProgress, setRecProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [resultUrl, setResultUrl] = useState("");
  const [resultSize, setResultSize] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const fmt = FORMATS.find((f) => f.id === format)!;

  const generateScript = async () => {
    if (!topic.trim()) {
      showToast("اكتب موضوع الفيديو أولاً", "info");
      return;
    }
    setStage("script");
    const sceneCount = Math.min(12, Math.max(3, Math.round(duration / 6)));
    const s = await generateArabicScript(topic.trim(), sceneCount);
    setScript(s);
    setCaptions(s.scenes);
  };

  const startGeneration = async () => {
    if (!captions.length) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStage("images");
    setResultUrl("");
    try {
      /* ١) توليد المشاهد المصورة */
      const unique = Math.min(captions.length, 12);
      setImgProgress({ done: 0, total: unique });
      const images: HTMLImageElement[] = [];
      const st = AI_STYLES.find((x) => x.id === style)!;
      for (let i = 0; i < unique; i++) {
        if (ctrl.signal.aborted) return;
        try {
          const blob = await fetchAiImage(buildScenePrompt(topic.trim(), st.en, i), {
            width: fmt.w >= 720 ? 896 : 768,
            height: fmt.h >= 1280 ? 896 : 768,
            seed: Math.floor(Math.random() * 1e9) + i,
            model: "flux",
          });
          images.push(await loadImageEl(blob));
        } catch {
          images.push(placeholderImage(fmt.w, fmt.h, (i * 47) % 360));
        }
        setImgProgress({ done: i + 1, total: unique });
      }

      /* ٢) التسجيل الحي على الكانفس */
      setStage("recording");
      setRecProgress(0);
      setElapsed(0);

      const sceneDur = Math.min(9, Math.max(3.5, duration / Math.max(3, Math.round(duration / 6))));
      const segments = Math.ceil(Math.max(1, duration - 5) / sceneDur);

      const blob = await recordOnCanvas({
        images,
        captions,
        title: script?.title ?? topic,
        w: fmt.w,
        h: fmt.h,
        duration,
        sceneDur,
        segments,
        signal: ctrl.signal,
        onProgress: (p, t) => {
          setRecProgress(p);
          setElapsed(t);
        },
      });

      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      setStage("done");
      bumpProcessedCount(1);
      showToast("فيديوك جاهز — بدون علامة مائية!");
    } catch (err) {
      if ((err as Error).message !== "aborted") {
        showToast("حدث خطأ أثناء التوليد — جرّب مدة أقصر أو أعد المحاولة", "err");
        setStage("script");
      }
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setStage(script ? "script" : "idle");
    showToast("أُلغي التوليد", "info");
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* الإعدادات */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-bold">
              <span className="c-amber"><Icon name="film" size={17} /></span>
              ١. ما موضوع الفيديو؟
            </h3>
            <textarea
              className="input min-h-20 resize-y leading-relaxed"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: عجائب العمارة الإسلامية في الأندلس"
              disabled={stage === "images" || stage === "recording"}
            />
            <div className="mt-3">
              <FieldLabel>النمط البصري</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {AI_STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStyle(s.id)}
                    disabled={stage === "images" || stage === "recording"}
                    className={cx("chip !px-3 !py-1.5 !text-xs", style === s.id && "!border-[var(--amber)] !bg-[var(--amber-soft)] !text-[var(--amber)]")}
                  >
                    {s.ar}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display mb-3 text-sm font-bold">٢. المنصة والمدة</h3>
            <FieldLabel>صيغة الفيديو</FieldLabel>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  disabled={stage === "images" || stage === "recording"}
                  className={cx(
                    "card !rounded-xl p-3 text-center transition-all",
                    format === f.id && "!border-[var(--amber)] shadow-[0_0_0_3px_var(--glow-amber)]"
                  )}
                >
                  <span className="font-display block text-sm font-bold">{f.label}</span>
                  <span className="font-mono text-[10px] c-muted" dir="ltr">{f.hint} · {f.w}×{f.h}</span>
                </button>
              ))}
            </div>
            <FieldLabel>المدة — من الشورتز حتى ساعة كاملة</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d.s}
                  type="button"
                  onClick={() => setDuration(d.s)}
                  disabled={stage === "images" || stage === "recording"}
                  className={cx("chip !px-3 !py-1.5 !text-xs", duration === d.s && "!border-[var(--amber)] !bg-[var(--amber-soft)] !text-[var(--amber)]")}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {stage === "idle" || stage === "script" ? (
            stage === "idle" ? (
              <button type="button" onClick={generateScript} className="btn btn-amber w-full !py-3.5 !text-base">
                <Icon name="wand" size={19} />
                اكتب السيناريو بالذكاء الاصطناعي
              </button>
            ) : (
              <button type="button" onClick={startGeneration} className="btn btn-teal w-full !py-3.5 !text-base">
                <Icon name="film" size={19} />
                ولّد الفيديو الآن
              </button>
            )
          ) : (
            <button type="button" onClick={cancel} className="btn btn-red w-full !py-3.5">
              <Icon name="close" size={18} />
              إلغاء التوليد
            </button>
          )}

          <div className="flex flex-wrap gap-1.5 text-[10.5px] font-semibold">
            <span className="rounded-md bg-[var(--teal-soft)] px-2 py-1 c-teal">✓ بلا حدود وبلا علامة مائية</span>
            <span className="rounded-md bg-[var(--amber-soft)] px-2 py-1 c-amber">✓ تعليق عربي كامل</span>
            <span className="rounded-md bg-[var(--teal-soft)] px-2 py-1 c-teal">✓ شورتز + فيديوهات طويلة</span>
          </div>
        </div>

        {/* سير العمل والنتيجة */}
        <div className="space-y-4">
          {stage === "idle" && (
            <div className="card grid place-items-center p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--amber-soft)] c-amber">
                  <Icon name="film" size={30} />
                </span>
                <p className="font-display text-lg font-bold">من فكرة إلى فيديو جاهز للنشر</p>
                <p className="c-muted max-w-md text-sm leading-relaxed">
                  يكتب الذكاء الاصطناعي سيناريو عربياً، يولّد مشاهد مصورة احترافية لكل جملة، ثم
                  يركّبها في فيديو بحركة سينمائية وتعليقات عربية — جاهزاً للرفع مباشرة.
                </p>
              </div>
            </div>
          )}

          {stage !== "idle" && script && (
            <div className="card anim-pop p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display flex items-center gap-2 text-sm font-bold">
                  <span className="c-teal"><Icon name="type" size={16} /></span>
                  السيناريو: {script.title}
                </h3>
                {stage === "script" && (
                  <button type="button" onClick={generateScript} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                    <Icon name="refresh" size={14} />
                    أعد الكتابة
                  </button>
                )}
              </div>
              <ul className="max-h-52 space-y-2 overflow-auto pe-1">
                {captions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="font-display mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[var(--amber-soft)] text-[11px] font-bold c-amber">
                      {i + 1}
                    </span>
                    {stage === "script" ? (
                      <input
                        className="input !py-1.5 !text-sm"
                        value={c}
                        onChange={(e) => setCaptions((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                        aria-label={`تعليق المشهد ${i + 1}`}
                      />
                    ) : (
                      <p className="pt-1 text-sm">{c}</p>
                    )}
                  </li>
                ))}
              </ul>
              {stage === "script" && (
                <p className="mt-2 text-[11px] c-muted">يمكنك تعديل أي تعليق قبل التوليد — كل تعليق يصبح مشهداً مصوراً.</p>
              )}
            </div>
          )}

          {stage === "images" && (
            <div className="card anim-pop p-6">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className="anim-spin inline-flex c-amber"><Icon name="ai" size={18} /></span>
                  توليد المشاهد المصورة…
                </span>
                <span className="font-mono text-xs" dir="ltr">{imgProgress.done}/{imgProgress.total}</span>
              </div>
              <ProgressBar value={(imgProgress.done / Math.max(1, imgProgress.total)) * 100} color="var(--amber)" />
              <p className="c-muted mt-2 text-xs">كل مشهد يُرسم بالذكاء الاصطناعي بالنمط الذي اخترته…</p>
            </div>
          )}

          {stage === "recording" && (
            <div className="card anim-pop p-6">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <span className="anim-spin inline-flex c-teal"><Icon name="film" size={18} /></span>
                  تسجيل الفيديو بالحركة السينمائية…
                </span>
                <span className="font-mono text-xs" dir="ltr">
                  {formatSeconds(elapsed)} / {formatSeconds(duration)}
                </span>
              </div>
              <ProgressBar value={recProgress * 100} />
              <p className="c-muted mt-2 text-xs">
                يُسجَّل الفيديو إطاراً بإطار في زمن حقيقي — أبقِ التبويب مفتوحاً. هذه هي الخطوة الأخيرة.
              </p>
            </div>
          )}

          {stage === "done" && resultUrl && (
            <div className="card anim-pop overflow-hidden">
              <div className="grid place-items-center bg-black p-3">
                <video src={resultUrl} controls className="max-h-[440px] w-auto rounded-lg" style={{ maxWidth: "100%" }} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bd-line p-4">
                <p className="text-xs c-muted">
                  <b className="c-teal">جاهز للنشر!</b> · {fmt.label} · {formatSeconds(duration)} ·{" "}
                  <span dir="ltr" className="font-mono">{(resultSize / 1048576).toFixed(1)} MB</span> · بدون علامة مائية
                </p>
                <div className="flex gap-2">
                  <a href={resultUrl} download={`kraftoox-${topic.slice(0, 24) || "video"}.webm`} className="btn btn-teal">
                    <Icon name="download" size={17} />
                    تحميل الفيديو
                  </a>
                  <button type="button" onClick={() => { setStage("idle"); setScript(null); setResultUrl(""); }} className="btn btn-ghost">
                    <Icon name="plus" size={16} />
                    فيديو جديد
                  </button>
                </div>
              </div>
            </div>
          )}

          {(stage === "recording" || stage === "images") && duration >= 600 && (
            <div className="flex items-start gap-2.5 rounded-xl border bd-line bg-[var(--amber-soft)] px-4 py-3 text-xs leading-relaxed">
              <span className="c-amber mt-0.5 shrink-0"><Icon name="timer" size={16} /></span>
              <span>
                للمدد الطويلة (10 دقائق فأكثر): زمن التوليد يساوي مدة الفيديو تقريباً لأن الرسم يتم
                بالحركة الحقيقية. اترك التبويب مفتوحاً ومتصلاً بالكهرباء — النتيجة تستحق الانتظار.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <InfoNote>
          الفيديو يُركّب محلياً في متصفحك (مشاهد AI + حركة Ken Burns سينمائية + تعليقات عربية)
          بصيغة WebM عالية الجودة بلا أي علامة مائية — ارفعه مباشرة إلى يوتيوب شورتز أو كفيديو طويل.
          الصوت: أضف تعليقك الصوتي أو موسيقى مجانية من مكتبة يوتيوب عند الرفع.
        </InfoNote>
      </div>
    </ToolShell>
  );
}

/* ===== محرك التركيب والتسجيل ===== */
interface RecordOptions {
  images: HTMLImageElement[];
  captions: string[];
  title: string;
  w: number;
  h: number;
  duration: number;
  sceneDur: number;
  segments: number;
  signal: AbortSignal;
  onProgress: (p: number, elapsed: number) => void;
}

function recordOnCanvas(opts: RecordOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { w, h } = opts;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;

    const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    );
    if (!mime) {
      reject(new Error("no recorder"));
      return;
    }
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

    const INTRO = 3.2;
    const OUTRO = 2.2;
    const start = performance.now();
    let raf = 0;
    let stopped = false;

    const finish = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      if (recorder.state !== "inactive") recorder.stop();
    };

    opts.signal.addEventListener("abort", () => {
      cancelAnimationFrame(raf);
      if (recorder.state !== "inactive") recorder.stop();
      reject(new Error("aborted"));
    });

    const drawCover = (img: HTMLImageElement, scale: number, ox: number, oy: number) => {
      const base = Math.max(w / img.width, h / img.height) * scale;
      const dw = img.width * base;
      const dh = img.height * base;
      ctx.drawImage(img, (w - dw) / 2 + ox, (h - dh) / 2 + oy, dw, dh);
    };

    const drawCaption = (text: string) => {
      const fs = Math.round(h * 0.038);
      ctx.font = `700 ${fs}px "IBM Plex Sans Arabic", Tahoma, sans-serif`;
      const lines = wrapText(ctx, text, w * 0.82);
      const lh = fs * 1.55;
      const boxH = lines.length * lh + fs * 0.9;
      const y0 = h * 0.86 - boxH;
      ctx.fillStyle = "rgba(8,14,12,0.62)";
      const bw = w * 0.9;
      ctx.beginPath();
      ctx.roundRect((w - bw) / 2, y0, bw, boxH, fs * 0.55);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, y0 + fs * 0.55 + lh * i + lh / 2);
      });
    };

    const drawTitleCard = (t: number, isOutro: boolean) => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0a3d33");
      g.addColorStop(1, "#12211d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      /* زخرفة نقاط */
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (let i = 0; i < 40; i++) {
        const x = ((i * 97) % w) + Math.sin(t + i) * 6;
        const y = ((i * 61) % h) + Math.cos(t + i) * 6;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      const fs = Math.round(h * 0.052);
      ctx.font = `800 ${fs}px "IBM Plex Sans Arabic", Tahoma, sans-serif`;
      ctx.fillStyle = "#f0a63b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = isOutro ? "شكراً للمشاهدة" : "يقدّم لكم";
      ctx.fillText(label, w / 2, h * 0.38);
      ctx.fillStyle = "#ffffff";
      const lines = wrapText(ctx, isOutro ? opts.title : opts.title, w * 0.8);
      const lh = fs * 1.4;
      lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, h * 0.5 + i * lh);
      });
      if (!isOutro) {
        ctx.font = `600 ${Math.round(fs * 0.5)}px "IBM Plex Sans Arabic", Tahoma, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText("فيديو مولّد بالذكاء الاصطناعي", w / 2, h * 0.5 + lines.length * lh + fs * 0.6);
      }
    };

    const frame = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= opts.duration) {
        drawTitleCard(t, true);
        finish();
        return;
      }

      if (t < INTRO) {
        drawTitleCard(t, false);
      } else if (t > opts.duration - OUTRO) {
        drawTitleCard(t, true);
      } else {
        const st = t - INTRO;
        const idx = Math.floor(st / opts.sceneDur) % opts.segments;
        const p = (st % opts.sceneDur) / opts.sceneDur;
        const img = opts.images[idx % opts.images.length];
        const variant = idx % 4;
        let scale = 1.08 + 0.16 * p;
        let ox = 0;
        let oy = 0;
        if (variant === 1) scale = 1.24 - 0.16 * p;
        if (variant === 2) ox = (p - 0.5) * w * 0.06;
        if (variant === 3) oy = (p - 0.5) * h * 0.05;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        drawCover(img, scale, ox, oy);
        /* تدرج سفلي لقراءة التعليق */
        const g = ctx.createLinearGradient(0, h * 0.55, 0, h);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,0.55)");
        ctx.fillStyle = g;
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        drawCaption(opts.captions[idx % opts.captions.length]);
      }

      opts.onProgress(Math.min(1, t / opts.duration), t);
      raf = requestAnimationFrame(frame);
    };

    recorder.start(500);
    frame();
  });
}
