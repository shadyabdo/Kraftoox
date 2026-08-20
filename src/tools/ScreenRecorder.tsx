import { useEffect, useRef, useState } from "react";
import { InfoNote } from "../components/bits";
import { getTool } from "../data/tools";
import { pickMime } from "../lib/video";
import { bumpProcessedCount, downloadBlob, formatBytes, formatSeconds, showToast } from "../lib/utils";
import { ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";
import { cx } from "../lib/utils";

const TOOL = getTool("screen-recorder")!;

type Phase = "idle" | "requesting" | "recording" | "paused" | "saving" | "done" | "error";

export default function ScreenRecorder() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [withMic, setWithMic] = useState(false);
  const [withSystem, setWithSystem] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ url: string; size: number; dur: number } | null>(null);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const displayRef = useRef<MediaStream | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const baseRef = useRef(0);
  const markRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* تنظيف عند مغادرة الصفحة */
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      displayRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current?.getTracks().forEach((t) => t.stop());
      const rec = recorderRef.current;
      if (rec && rec.state !== "inactive") {
        rec.onstop = null;
        rec.stop();
      }
    };
  }, []);

  const startTimer = () => {
    markRef.current = performance.now();
    if (!timerRef.current) {
      timerRef.current = window.setInterval(() => {
        setElapsed(baseRef.current + (performance.now() - markRef.current) / 1000);
      }, 200);
    }
  };

  const pauseTimer = () => {
    baseRef.current += (performance.now() - markRef.current) / 1000;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = async () => {
    const nav = navigator as Navigator & {
      getDisplayMedia?: (opts?: Record<string, unknown>) => Promise<MediaStream>;
    };
    if (typeof nav.getDisplayMedia !== "function") {
      setError("متصفحك لا يدعم مشاركة الشاشة — جرّب Chrome أو Edge حديثاً.");
      setPhase("error");
      return;
    }
    setPhase("requesting");
    setError("");
    try {
      const display = await nav.getDisplayMedia({
        video: { frameRate: 30 },
        audio: withSystem,
      });
      displayRef.current = display;

      let combined = display;
      if (withMic) {
        try {
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
          micRef.current = mic;
          combined = new MediaStream([...display.getVideoTracks(), ...display.getAudioTracks(), ...mic.getAudioTracks()]);
        } catch {
          showToast("تعذّر فتح الميكروفون — سيُسجَّل بدون صوت الميكروفون", "info");
        }
      }

      const mime = pickMime();
      const recorder = new MediaRecorder(combined, {
        mimeType: mime ?? undefined,
        videoBitsPerSecond: 8_000_000,
      });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);

      /* إذا أنهى المستخدم المشاركة من شريط المتصفح → إنهاء تلقائي */
      display.getVideoTracks()[0].addEventListener("ended", () => {
        if (phaseRef.current === "recording" || phaseRef.current === "paused") finish();
      });

      if (previewRef.current) {
        previewRef.current.srcObject = combined;
        previewRef.current.play().catch(() => undefined);
      }

      baseRef.current = 0;
      setElapsed(0);
      recorder.start(1000);
      startTimer();
      setPhase("recording");
      showToast("بدأ التسجيل — عند الضغط على «إنهاء» سيُنزَّل الفيديو تلقائياً");
    } catch {
      setError("لم يُسمح بمشاركة الشاشة. اختر «شاشة كاملة» أو نافذة من نافذة المشاركة ثم أعد المحاولة.");
      setPhase("error");
    }
  };

  /* إنهاء التسجيل → تنزيل تلقائي فوري */
  const finish = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    pauseTimer();
    const dur = baseRef.current;
    setPhase("saving");

    recorder.onstop = () => {
      displayRef.current?.getTracks().forEach((t) => t.stop());
      micRef.current?.getTracks().forEach((t) => t.stop());
      displayRef.current = null;
      micRef.current = null;

      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, dur });
      setPhase("done");
      bumpProcessedCount(1);
      /* التنزيل التلقائي */
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadBlob(blob, `screen-recording-${stamp}.webm`);
      showToast("انتهى التسجيل وبدأ التنزيل التلقائي");
    };
    recorder.stop();
  };

  const pause = () => {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") {
      rec.pause();
      pauseTimer();
      setPhase("paused");
    }
  };

  const resume = () => {
    const rec = recorderRef.current;
    if (rec && rec.state === "paused") {
      rec.resume();
      startTimer();
      setPhase("recording");
    }
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setPhase("idle");
    setElapsed(0);
    if (previewRef.current) previewRef.current.srcObject = null;
  };

  const active = phase === "recording" || phase === "paused" || phase === "saving";

  return (
    <ToolShell tool={TOOL}>
      {/* المعاينة الحية — تختفي بعد الانتهاء لمصلحة بطاقة النتيجة */}
      {phase !== "done" && <div className="card relative overflow-hidden">
        <div className="grid place-items-center bg-black/90" style={{ aspectRatio: "16/9" }}>
          {!active ? (
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full border-2" style={{ borderColor: TOOL.color, color: TOOL.color }}>
                <Icon name="monitor" size={36} />
              </span>
              <div>
                <p className="font-display text-xl font-bold text-white">جاهز لتسجيل شاشتك</p>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/60">
                  اختر خيارات الصوت ثم اضغط «بدء التسجيل» — سيطلب المتصفح إذن مشاركة الشاشة.
                </p>
              </div>
            </div>
          ) : (
            <video ref={previewRef} muted playsInline className="h-full w-full object-contain" />
          )}
        </div>

        {/* شارة التسجيل الحي */}
        {active && (
          <div className="absolute top-4 start-4 flex items-center gap-2.5 rounded-xl bg-black/70 px-3.5 py-2 backdrop-blur">
            <span className={cx("h-3 w-3 rounded-full bg-[var(--red)]", phase === "recording" && "anim-pulse-soft")} />
            <span className="font-display text-sm font-bold text-white">
              {phase === "recording" ? "REC" : phase === "paused" ? "متوقف مؤقتاً" : "…"}
            </span>
            <span className="font-mono text-sm font-semibold text-white" dir="ltr">
              {formatSeconds(elapsed)}
            </span>
          </div>
        )}
      </div>}

      {/* التحكم */}
      <div className="card mt-5 p-5">
        {!active && phase !== "done" && (
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel>مصادر الصوت</FieldLabel>
              <div className="space-y-2.5">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={withSystem} onChange={(e) => setWithSystem(e.target.checked)} className="h-4 w-4 accent-[var(--blue)]" />
                  <Icon name="video" size={15} className="c-muted" />
                  صوت النظام — فعّل «مشاركة الصوت» في نافذة المتصفح
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" checked={withMic} onChange={(e) => setWithMic(e.target.checked)} className="h-4 w-4 accent-[var(--blue)]" />
                  <Icon name="mic" size={15} className="c-muted" />
                  الميكروفون — لتعليقك الصوتي أثناء الشرح
                </label>
              </div>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={start} disabled={phase === "requesting"} className="btn w-full !py-4 !text-base text-white" style={{ background: "var(--red)" }}>
                <Icon name="record" size={20} />
                {phase === "requesting" ? "بانتظار إذن المشاركة…" : "بدء تسجيل الشاشة"}
              </button>
            </div>
            {error && (
              <p className="flex items-start gap-2 rounded-xl bg-[var(--red-soft)] px-4 py-3 text-sm c-red md:col-span-2">
                <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
          </div>
        )}

        {active && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {phase === "recording" && (
              <button type="button" onClick={pause} className="btn btn-amber">
                <Icon name="pause" size={18} />
                إيقاف مؤقت
              </button>
            )}
            {phase === "paused" && (
              <button type="button" onClick={resume} className="btn btn-teal">
                <Icon name="play" size={18} />
                استئناف
              </button>
            )}
            <button type="button" onClick={finish} disabled={phase === "saving"} className="btn !py-3 !text-base text-white" style={{ background: "var(--red)" }}>
              <Icon name="stop" size={19} />
              {phase === "saving" ? "جارٍ الحفظ والتنزيل…" : "إنهاء وتنزيل تلقائي"}
            </button>
            <p className="w-full text-center text-xs c-muted">
              الضغط على «إنهاء» يوقف التسجيل ويبدأ <b>التنزيل التلقائي</b> للفيديو مباشرة.
            </p>
          </div>
        )}

        {phase === "done" && result && (
          <div className="anim-pop">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-bold c-teal">
                <Icon name="check" size={19} />
                تم حفظ التسجيل ونُزّل تلقائياً
              </p>
              <span className="font-mono text-xs c-muted" dir="ltr">
                {formatSeconds(result.dur)} · {formatBytes(result.size)} · WebM
              </span>
            </div>
            <video src={result.url} controls className="mx-auto max-h-80 rounded-xl border bd-line" style={{ maxWidth: "100%" }} />
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <a href={result.url} download="screen-recording.webm" className="btn btn-teal">
                <Icon name="download" size={17} />
                تنزيل مرة أخرى
              </a>
              <button type="button" onClick={reset} className="btn btn-ghost">
                <Icon name="record" size={17} />
                تسجيل جديد
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <InfoNote>
          التسجيل يتم محلياً بالكامل ولا يُرسل لأي خادم. في Chrome اختر «علامة تبويب» لمشاركة صوت
          النظام، أو «شاشة كاملة» مع تفعيل خيار «مشاركة الصوت». إذا أغلقت نافذة المشاركة من شريط
          المتصفح سينتهي التسجيل ويُحفَظ تلقائياً أيضاً.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
