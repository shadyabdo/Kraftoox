import { useEffect, useMemo, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { BlobLink, InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { cx, formatBytes, showToast } from "../lib/utils";
import { ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("photo-editor")!;
const PHOTOPEA_ORIGIN = "https://www.photopea.com";

/* تحديد نوع الملف الناتج من بايتاته الأولى */
function sniff(buf: ArrayBuffer): { mime: string; ext: string } {
  const b = new Uint8Array(buf.slice(0, 8));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
    return { mime: "image/png", ext: "png" };
  if (b[0] === 0xff && b[1] === 0xd8) return { mime: "image/jpeg", ext: "jpg" };
  if (b[0] === 0x38 && b[1] === 0x42 && b[2] === 0x50 && b[3] === 0x53)
    return { mime: "image/vnd.adobe.photoshop", ext: "psd" };
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { mime: "image/gif", ext: "gif" };
  return { mime: "image/vnd.adobe.photoshop", ext: "psd" };
}

interface Result {
  blob: Blob;
  ext: string;
  size: number;
  at: number;
  version: number;
}

export default function PhotoEditor() {
  const { isAr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [full, setFull] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<ArrayBuffer | null>(null);

  /* بيئة Photopea: لغة الواجهة + صيغة الحفظ الافتراضية */
  const env = useMemo(
    () =>
      `${PHOTOPEA_ORIGIN}/?p=${encodeURIComponent(
        JSON.stringify({
          language: isAr ? "ar" : "en",
          output: "psd",
          photoshopUI: 1,
        })
      )}`,
    [isAr]
  );

  /* استقبال النتائج من Photopea عبر postMessage */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== PHOTOPEA_ORIGIN) return;
      if (e.data instanceof ArrayBuffer && e.data.byteLength > 8) {
        const { mime, ext } = sniff(e.data);
        setResult((prev) => ({
          blob: new Blob([e.data as ArrayBuffer], { type: mime }),
          ext,
          size: (e.data as ArrayBuffer).byteLength,
          at: Date.now(),
          version: prev ? prev.version + 1 : 1,
        }));
        showToast(isAr ? "وصلتك نتيجة جديدة من المحرر — جاهزة للتنزيل" : "New result received from the editor — ready to download");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isAr]);

  /* إرسال الملف إلى المحرر بعد جاهزيته */
  const sendFile = () => {
    const win = iframeRef.current?.contentWindow;
    const buf = bufferRef.current;
    if (!win || !buf) return;
    win.postMessage(buf, PHOTOPEA_ORIGIN);
    setSent(true);
  };

  useEffect(() => {
    if (!opened || !bufferRef.current) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries++;
      sendFile();
      if (tries >= 3) window.clearInterval(timer);
    }, 1400);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, frameReady]);

  /* ===== وضع ملء الصفحة للمحرر ===== */
  /* مزامنة مع ملء الشاشة الأصلي للمتصفح */
  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* الخروج بـ Esc عند استخدام الوضع الموسّع الاحتياطي */
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const toggleFull = () => {
    const el = stageRef.current;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => setFull(false));
      return;
    }
    if (el?.requestFullscreen) {
      /* ملء شاشة أصلي — وإن رفضه المتصفح ننتقل للوضع الموسّع */
      el.requestFullscreen().catch(() => setFull(true));
      setFull(true);
    } else {
      setFull((v) => !v);
    }
  };

  const onFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setSent(false);
    setFrameReady(false);
    try {
      bufferRef.current = await f.arrayBuffer();
      setOpened(true);
    } catch {
      showToast(isAr ? "تعذّر قراءة الملف" : "Could not read the file", "err");
    }
  };

  const openEmpty = () => {
    setFile(null);
    bufferRef.current = null;
    setResult(null);
    setSent(false);
    setFrameReady(false);
    setOpened(true);
  };

  const baseName = (file?.name ?? (isAr ? "تصميم" : "design")).replace(/\.[^.]+$/, "");

  return (
    <ToolShell tool={TOOL}>
      {!opened ? (
        <>
          <Dropzone
            accept={TOOL.accept}
            multiple={false}
            onFiles={onFile}
            color={TOOL.color}
            title={isAr ? TOOL.drop[0] : TOOL.drop[1]}
            subtitle={isAr ? TOOL.dropSub[0] : TOOL.dropSub[1]}
          />
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={openEmpty} className="btn btn-ghost">
              <Icon name="plus" size={17} />
              {isAr ? "أو افتح المحرر بدون ملف — مشروع جديد من الصفر" : "Or open the editor empty — start a new project"}
            </button>
          </div>
        </>
      ) : (
        <div className="anim-pop">
          {/* شريط المحرر */}
          <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${TOOL.color} 12%, var(--surface))`, color: TOOL.color }}
            >
              <Icon name="brush" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-sm font-extrabold">
                {isAr ? "محرر Photopea — فوتوشوب الويب" : "Photopea Editor — Photoshop for the web"}
              </p>
              <p className="c-muted truncate text-xs" dir="ltr" style={{ textAlign: "end" }}>
                <bdi>{file ? `${file.name} · ${formatBytes(file.size)}` : isAr ? "مشروع جديد" : "New project"}</bdi>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!frameReady ? (
                <span className="flex items-center gap-2 rounded-xl border bd-line bg-surface2 px-3 py-2 text-xs font-semibold c-muted">
                  <Spinner size={15} />
                  {isAr ? "جارٍ تشغيل المحرر…" : "Starting the editor…"}
                </span>
              ) : file && !sent ? (
                <button type="button" onClick={sendFile} className="btn btn-teal !py-2 !text-sm">
                  <Icon name="upload" size={16} />
                  {isAr ? "افتح الملف داخل المحرر" : "Open file in editor"}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 rounded-xl bg-[var(--teal-soft)] px-3 py-2 text-xs font-bold c-teal">
                  <Icon name="check" size={15} />
                  {isAr ? "المحرر جاهز" : "Editor ready"}
                </span>
              )}
              <button
                type="button"
                onClick={toggleFull}
                className={cx("btn !py-2 !text-sm", full ? "btn-amber" : "btn-ghost")}
                title={full ? (isAr ? "تصغير المحرر" : "Shrink editor") : (isAr ? "تشغيل المحرر بكامل الصفحة" : "Run the editor on the full page")}
              >
                <Icon name={full ? "shrink" : "expand"} size={16} />
                {full ? (isAr ? "تصغير" : "Shrink") : (isAr ? "كامل الصفحة" : "Full page")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
                  setFull(false);
                  setOpened(false);
                  setFile(null);
                  setResult(null);
                  bufferRef.current = null;
                }}
                className="btn btn-ghost !py-2 !text-sm"
              >
                <Icon name="refresh" size={15} />
                {isAr ? "ملف آخر" : "Different file"}
              </button>
            </div>
          </div>

          {/* المحرر المدمج — إطار Photopea الطبيعي يملأ كامل المساحة المتاحة،
              مع زر ملء الصفحة الكامل */}
          <div
            ref={stageRef}
            className={cx(
              "card overflow-hidden transition-all duration-300",
              full ? "fixed inset-0 z-[95] !rounded-none border-0" : "relative !rounded-xl"
            )}
            style={
              full
                ? { height: "100dvh", background: "#1d1d1d" }
                : { height: "calc(100dvh - 262px)", minHeight: 560, background: "#1d1d1d" }
            }
          >
            <iframe
              ref={iframeRef}
              src={env}
              title="Photopea — Kraftoox"
              className="absolute inset-0 h-full w-full border-0"
              style={{ background: "#1d1d1d" }}
              allow="clipboard-read; clipboard-write; fullscreen"
              onLoad={() => setFrameReady(true)}
            />
            {full && (
              <button
                type="button"
                onClick={toggleFull}
                className="btn btn-ghost absolute bottom-4 end-4 z-20 !border-[#3d3d3d] !bg-[#262626] !py-2 !text-xs !text-white shadow-xl"
              >
                <Icon name="shrink" size={14} />
                {isAr ? "إنهاء ملء الصفحة" : "Exit full page"}
                <kbd className="font-mono opacity-60">Esc</kbd>
              </button>
            )}
          </div>

          {/* النتيجة */}
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_330px]">
            <InfoNote>
              {isAr ? (
                <>
                  عدّل بحرية داخل المحرر: طبقات، أقنعة، فرشاة الاستنساخ، أدوات التحديد الذكية وأكثر.
                  الإطار يملأ المساحة المتاحة تلقائياً، واضغط <b>«كامل الصفحة»</b> ليعمل بملء شاشتك
                  بالكامل. عند الانتهاء اضغط <b dir="ltr" className="font-mono">Ctrl+S</b> أو{" "}
                  <b dir="ltr">File → Save as</b> — وسيصلك الملف الناتج في البطاقة المجاورة جاهزاً
                  للتنزيل، ويتجدد مع كل حفظ.
                </>
              ) : (
                <>
                  Edit freely: layers, masks, clone stamp, smart selection tools and more.
                  The frame fills the available space automatically, and hitting <b>“Full page”</b> runs
                  the editor across your entire screen. When done, press{" "}
                  <b dir="ltr" className="font-mono">Ctrl+S</b> or <b dir="ltr">File → Save as</b> —
                  the output file lands in the side card, ready to download, refreshed on every save.
                </>
              )}
            </InfoNote>

            <div className="card flex flex-col justify-center gap-3 p-5">
              <FieldLabel>{isAr ? "نتيجتك" : "Your result"}</FieldLabel>
              {result ? (
                <div className="anim-pop flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--teal-soft)] c-teal">
                      <Icon name="file" size={19} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold" dir="ltr" style={{ textAlign: "end" }}>
                        <bdi>{baseName}.{result.ext}</bdi>
                      </p>
                      <p className="c-muted font-mono text-[11px]" dir="ltr">
                        {formatBytes(result.size)} ·{" "}
                        {new Date(result.at).toLocaleTimeString(isAr ? "ar" : "en")}
                      </p>
                    </div>
                  </div>
                  <BlobLink
                    blob={result.blob}
                    className="btn-teal"
                    iconSize={17}
                    label={isAr ? "تنزيل النتيجة" : "Download result"}
                    filename={`kraftoox-${baseName}.${result.ext}`}
                  />
                  <p className="c-muted text-center text-[10.5px]">
                    {isAr
                      ? `نسخة #${result.version} — تُحدَّث تلقائياً مع كل حفظ`
                      : `Version #${result.version} — updates automatically on every save`}
                  </p>
                </div>
              ) : (
                <p className="c-muted flex items-start gap-2 text-xs leading-relaxed">
                  <span className="c-amber mt-0.5 shrink-0"><Icon name="info" size={15} /></span>
                  {isAr
                    ? "لم تصل نتيجة بعد. احفظ من داخل المحرر (Ctrl+S) وستظهر هنا فوراً."
                    : "No result yet. Save inside the editor (Ctrl+S) and it will appear here instantly."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!opened && (
        <div className="mt-8">
          <InfoNote>
            {isAr
              ? "Photopea خدمة مستقلة مجانية تدعم العربية، تعمل داخل نافذة مدمجة في منصتنا بواجهة Photopea البرمجية الرسمية — ملفك يُرسل مباشرة من جهازك إلى نافذة المحرر ولا يمر بأي خادم تابع لنا."
              : "Photopea is an independent free service with Arabic support, running inside an embedded window via Photopea's official API — your file goes directly from your device to the editor window, never through our servers."}
          </InfoNote>
        </div>
      )}
    </ToolShell>
  );
}
