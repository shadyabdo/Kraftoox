import { useEffect, useMemo, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { cx, formatBytes, showToast } from "../lib/utils";
import { takePendingFiles } from "../lib/pending";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("video-editor")!;

/* محرر الفيديو الاحترافي — محرك CreativeEditor (img.ly) يعمل داخل المتصفح */
const CESDK_SRC = "https://cdn.img.ly/packages/@creative-sdk/cesdk-web/1.74.2/umd/index.js";

function editorDocument(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>CreativeEditor — Kraftoox</title>
<style>
  html, body, #root { height: 100%; margin: 0; padding: 0; overflow: hidden; background: #101114; }
  #status {
    position: fixed; inset: 0; display: flex; flex-direction: column; gap: 12px;
    align-items: center; justify-content: center; color: #9aa3ad;
    font-family: "Rubik", "IBM Plex Sans Arabic", sans-serif; font-size: 14px;
  }
  #status .bar { width: 200px; height: 4px; border-radius: 99px; background: #23262c; overflow: hidden; }
  #status .bar span { display: block; height: 100%; width: 40%; border-radius: 99px; background: #5aa7e0; animation: slide 1.3s ease-in-out infinite alternate; }
  @keyframes slide { from { transform: translateX(-60%); } to { transform: translateX(160%); } }
</style>
<script src="${CESDK_SRC}"></script>
</head>
<body>
<div id="root"></div>
<div id="status">
  <div class="bar"><span></span></div>
  <div id="status-text">جارٍ تشغيل محرر الفيديو الاحترافي…</div>
</div>
<script>
(function () {
  var statusEl = document.getElementById("status");
  var textEl = document.getElementById("status-text");

  function fail(msg) {
    if (textEl) textEl.textContent = msg;
  }

  function waitForSdk(tries) {
    if (window.CreativeEditorSDK) return start();
    if (tries <= 0) return fail("تعذّر تحميل المحرر — تحقق من اتصال الإنترنت ثم أعد تحميل الصفحة.");
    setTimeout(function () { waitForSdk(tries - 1); }, 350);
  }

  function start() {
    window.CreativeEditorSDK.create("#root", {
      ui: { elements: { panels: { settings: true } } }
    })
      .then(function (instance) {
        if (statusEl && statusEl.parentNode) statusEl.parentNode.removeChild(statusEl);
        if (instance.ui && instance.ui.setTheme) instance.ui.setTheme("dark");
        window.__cesdk = instance;

        window.addEventListener("message", function (e) {
          var d = e.data;
          if (!d || d.type !== "kraftoox-open-video" || !d.buffer) return;
          try {
            var blob = new Blob([d.buffer], { type: d.mime || "video/mp4" });
            if (typeof instance.createVideoFromBlob === "function") {
              instance.createVideoFromBlob(blob).catch(function () {
                window.parent.postMessage({ type: "kraftoox-open-failed" }, "*");
              });
            } else {
              window.parent.postMessage({ type: "kraftoox-open-failed" }, "*");
            }
          } catch (err) {
            window.parent.postMessage({ type: "kraftoox-open-failed" }, "*");
          }
        });

        return instance.createVideo();
      })
      .then(function () {
        window.parent.postMessage({ type: "kraftoox-editor-ready" }, "*");
      })
      .catch(function () {
        fail("تعذّر تشغيل المحرر — جرّب متصفح كروم أو إيدج حديثاً.");
      });
  }

  waitForSdk(60);
})();
</script>
</body>
</html>`;
}

export default function VideoEditor() {
  const { isAr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState(false);
  const [ready, setReady] = useState(false);
  const [sent, setSent] = useState(false);
  const [full, setFull] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<ArrayBuffer | null>(null);

  const srcDoc = useMemo(() => editorDocument(), []);

  /* التقاط ملف محوَّل من صفحة الهبوط أو ساحة الأدوات */
  useEffect(() => {
    const pending = takePendingFiles();
    if (pending && pending[0]) {
      void onFile([pending[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* رسائل المحرر: جاهزية + فشل فتح الملف */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { type?: string } | null;
      if (!d || typeof d !== "object") return;
      if (d.type === "kraftoox-editor-ready") setReady(true);
      if (d.type === "kraftoox-open-failed") {
        showToast(
          isAr
            ? "افتح الفيديو من داخل المحرر: File → Import"
            : "Import the video from inside the editor: File → Import",
          "info"
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isAr]);

  /* ملء الصفحة — Fullscreen API مع وضع موسّع احتياطي */
  const enterFull = () => {
    setFull(true);
    const el = stageRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => undefined);
  };
  const exitFull = () => {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  };
  const toggleFull = () => (full ? exitFull() : enterFull());

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFull(false);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* إرسال الملف إلى المحرر بعد جاهزيته */
  const sendFile = () => {
    const win = iframeRef.current?.contentWindow;
    const buf = bufferRef.current;
    if (!win || !buf) return;
    win.postMessage(
      { type: "kraftoox-open-video", buffer: buf, mime: file?.type || "video/mp4" },
      "*"
    );
    setSent(true);
  };

  useEffect(() => {
    if (!opened || !bufferRef.current) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      if (!ready) {
        if (++tries > 40) window.clearInterval(timer);
        return;
      }
      sendFile();
      window.clearInterval(timer);
    }, 600);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, ready]);

  const onFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setSent(false);
    setReady(false);
    try {
      bufferRef.current = await f.arrayBuffer();
      setOpened(true);
    } catch {
      showToast(isAr ? "تعذّر قراءة الفيديو" : "Could not read the video", "err");
    }
  };

  const openEmpty = () => {
    setFile(null);
    bufferRef.current = null;
    setSent(false);
    setReady(false);
    setOpened(true);
  };

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
              {isAr ? "أو افتح المحرر فارغاً — مشروع جديد من الصفر" : "Or open the editor empty — start a new project"}
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
              <Icon name="timeline" size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-sm font-extrabold">
                {isAr ? "محرر الفيديو الاحترافي — CreativeEditor" : "Professional Video Editor — CreativeEditor"}
              </p>
              <p className="c-muted truncate text-xs" dir="ltr" style={{ textAlign: "end" }}>
                <bdi>{file ? `${file.name} · ${formatBytes(file.size)}` : isAr ? "مشروع جديد" : "New project"}</bdi>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!ready ? (
                <span className="flex items-center gap-2 rounded-xl border bd-line bg-surface2 px-3 py-2 text-xs font-semibold c-muted">
                  <Spinner size={15} />
                  {isAr ? "جارٍ تشغيل المحرر…" : "Starting the editor…"}
                </span>
              ) : file && !sent ? (
                <button type="button" onClick={sendFile} className="btn btn-teal !py-2 !text-sm">
                  <Icon name="upload" size={16} />
                  {isAr ? "افتح الفيديو داخل المحرر" : "Open video in editor"}
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
                  exitFull();
                  setOpened(false);
                  setFile(null);
                  bufferRef.current = null;
                }}
                className="btn btn-ghost !py-2 !text-sm"
              >
                <Icon name="refresh" size={15} />
                {isAr ? "فيديو آخر" : "Different video"}
              </button>
            </div>
          </div>

          {/* المحرر المدمج */}
          <div
            ref={stageRef}
            className={cx(
              "card overflow-hidden transition-all duration-300",
              full ? "fixed inset-0 z-[95] !rounded-none border-0" : "relative !rounded-xl"
            )}
            style={{
              height: full ? "100dvh" : "calc(100dvh - 262px)",
              minHeight: full ? "100dvh" : 560,
              background: "#101114",
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              title="CreativeEditor — Kraftoox"
              className="block h-full w-full border-0"
              allow="clipboard-read; clipboard-write; fullscreen"
            />
            {full && (
              <button
                type="button"
                onClick={exitFull}
                className="btn btn-ghost absolute bottom-4 end-4 z-20 !border-[#3d3d3d] !bg-[#262626] !py-2 !text-xs !text-white shadow-xl"
              >
                <Icon name="shrink" size={14} />
                {isAr ? "إنهاء ملء الصفحة" : "Exit full page"}
                <kbd className="font-mono opacity-60">Esc</kbd>
              </button>
            )}
          </div>

          {/* ملاحظات الاستخدام */}
          <div className="mt-4">
            <InfoNote>
              {isAr ? (
                <>
                  المحرر يملأ المساحة المتاحة تلقائياً، وزر <b>«كامل الصفحة»</b> يوسّعه لملء الشاشة.
                  اعمل على الخط الزمني: أضف مقاطع وصوراً ونصوصاً وموسيقى، ثم صدّر من زر{" "}
                  <b dir="ltr">Export</b> بصيغة MP4. المحرك يعمل داخل متصفحك بالكامل — ملفك لا يُرفع
                  لأي خادم تابع لنا. وضع التشغيل الحالي تجريبي وقد تظهر علامة مائية خفيفة على التصدير
                  حتى ربط ترخيص دائم.
                </>
              ) : (
                <>
                  The frame fills the available space automatically, and <b>“Full page”</b> runs the
                  editor across your entire screen. Work on the timeline: add clips, images, text and
                  music, then export as MP4 via the <b dir="ltr">Export</b> button. The engine runs
                  entirely in your browser — your file is never uploaded to our servers. The current
                  mode is a trial and exports may carry a light watermark until a permanent license
                  is connected.
                </>
              )}
            </InfoNote>
          </div>
        </div>
      )}

      {!opened && (
        <div className="mt-8">
          <InfoNote>
            {isAr
              ? "نعرض داخل المنصة محرك CreativeEditor الاحترافي من img.ly — قصّ ودمج ونصوص وعناوين متحركة وانتقالات وموسيقى، مع معالجة داخل المتصفح وتصدير MP4. للحصول على تصدير بلا علامة مائية لموقعك، أضف ترخيصك الخاص في ملف الأداة."
              : "We embed the professional CreativeEditor engine by img.ly — trimming, merging, animated text and titles, transitions and music, with in-browser processing and MP4 export. For watermark-free export on your own site, add your license key in the tool file."}
          </InfoNote>
        </div>
      )}
    </ToolShell>
  );
}
