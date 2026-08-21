import { useEffect, useRef, useState } from "react";
import CreativeEditorSDK from "@cesdk/cesdk-js";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { cx, formatBytes, showToast } from "../lib/utils";
import { takePendingFiles } from "../lib/pending";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("video-editor")!;

/* المحرك مستورد من الحزمة المثبتة محلياً — لا اعتماد على رابط خارجي للكود.
   فقط أصول المحرك (wasm/خطوط/وسائط) تُجلب من CDN الرسمي الخاص بـ img.ly. */
const SDK_VERSION =
  (CreativeEditorSDK as unknown as { version?: string }).version ?? "1.80.0";
const BASE_URL = `https://cdn.img.ly/packages/imgly/cesdk-js/${SDK_VERSION}/assets`;

type Status = "idle" | "loading" | "ready" | "error";

/* معرّف مستخدم ثابت للمتصفح — مطلوب لتشغيل المحرك في وضع التجربة بدون ترخيص */
function anonymousUserId(): string {
  try {
    let id = localStorage.getItem("kraftoox-uid");
    if (!id) {
      id = "kraftoox-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem("kraftoox-uid", id);
    }
    return id;
  } catch {
    return "kraftoox-" + Math.random().toString(36).slice(2, 10);
  }
}

/* مهلة زمنية حتى لا يعلق الإقلاع بصمت */
function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error(msg)), ms);
    p.then(
      (v) => {
        window.clearTimeout(t);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(t);
        reject(e);
      }
    );
  });
}

type EditorInstance = Awaited<ReturnType<typeof CreativeEditorSDK.create>>;

export default function VideoEditor() {
  const { isAr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [full, setFull] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<EditorInstance | null>(null);
  const fileRef = useRef<File | null>(null);

  /* التقاط ملف محوَّل من صفحة الهبوط أو ساحة الأدوات */
  useEffect(() => {
    const pending = takePendingFiles();
    if (pending && pending[0]) void openWith(pending[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* إدخال ملف فيديو إلى المشهد — محاولة مباشرة ثم مسار المحرك */
  const tryOpenVideo = async (instance: EditorInstance, f: File) => {
    try {
      const withBlob = instance as unknown as {
        createVideoFromBlob?: (b: Blob) => Promise<unknown>;
      };
      if (typeof withBlob.createVideoFromBlob === "function") {
        await withBlob.createVideoFromBlob(f);
        return true;
      }
    } catch {
      /* نجرب المسار البديل */
    }
    try {
      const engine = (instance as unknown as { engine: any }).engine;
      const url = URL.createObjectURL(f);
      const page = engine.scene.getCurrentPage();
      const video = engine.block.create("video");
      engine.block.appendChild(page, video);
      try {
        engine.block.setBool(video, "clip/autoPlay", true);
        engine.block.setString(video, "clip/loop", "INDEPENDENT");
      } catch {
        /* خصائص اختيارية */
      }
      const fill = engine.block.createFill("video", url);
      engine.block.setFill(video, fill);
      engine.block.setPosition(video, 0, 0);
      return true;
    } catch {
      return false;
    }
  };

  /* إقلاع المحرر */
  useEffect(() => {
    if (!opened || !containerRef.current) return;
    let disposed = false;
    const el = containerRef.current;

    const boot = async () => {
      setStatus("loading");
      setErrorMsg("");
      setPhase(isAr ? "تهيئة المحرك…" : "Initializing engine…");
      try {
        const isDark = document.documentElement.classList.contains("dark");
        const instance = await withTimeout(
          CreativeEditorSDK.create(el, {
            baseURL: BASE_URL,
            userId: anonymousUserId(),
          }),
          60000,
          isAr
            ? "انتهت مهلة تشغيل المحرك (60 ثانية) — تُجلب أصول المحرك من CDN الرسمي، تحقق من الاتصال ثم أعد المحاولة."
            : "Engine boot timed out (60s) — engine assets load from the official CDN. Check your connection and retry."
        );
        if (disposed) {
          try {
            instance.dispose();
          } catch {
            /* ignore */
          }
          return;
        }
        instanceRef.current = instance;

        try {
          instance.ui.setTheme(isDark ? "dark" : "light");
        } catch {
          /* الثيم اختياري */
        }

        setPhase(isAr ? "تحميل مكتبات الأصول…" : "Loading asset libraries…");
        await instance.addDefaultAssetSources().catch(() => undefined);
        await instance
          .addDemoAssetSources({
            baseURL: BASE_URL,
            sceneMode: "Video",
            withUploadAssetSources: true,
          })
          .catch(() => undefined);

        setPhase(isAr ? "إنشاء مشهد الفيديو…" : "Creating the video scene…");
        await instance.createVideoScene().catch(() => undefined);

        /* محاولة فتح الفيديو المُفلَت إن وُجد */
        const f = fileRef.current;
        if (f) {
          setPhase(isAr ? "فتح الفيديو داخل المحرر…" : "Opening your video…");
          const ok = await tryOpenVideo(instance, f);
          if (!ok) {
            showToast(
              isAr
                ? "افتح الفيديو من داخل المحرر: اسحبه إلى الخط الزمني أو استخدم زر الرفع"
                : "Import the video inside the editor: drag it to the timeline or use the upload button",
              "info"
            );
          }
        }

        if (!disposed) {
          setStatus("ready");
          setPhase("");
        }
      } catch (err) {
        if (disposed) return;
        const msg = err instanceof Error && err.message ? err.message : String(err);
        setErrorMsg(msg);
        setStatus("error");
        setPhase("");
      }
    };

    void boot();

    return () => {
      disposed = true;
      try {
        instanceRef.current?.dispose();
      } catch {
        /* ignore */
      }
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const openWith = async (f: File) => {
    setFile(f);
    fileRef.current = f;
    setStatus("idle");
    setErrorMsg("");
    setOpened(true);
  };

  const openEmpty = () => {
    setFile(null);
    fileRef.current = null;
    setStatus("idle");
    setErrorMsg("");
    setOpened(true);
  };

  const close = () => {
    exitFull();
    setOpened(false);
    setFile(null);
    fileRef.current = null;
    setStatus("idle");
    setErrorMsg("");
  };

  const retry = () => {
    setOpened(false);
    setStatus("idle");
    setErrorMsg("");
    window.setTimeout(() => setOpened(true), 60);
  };

  /* ملء الصفحة */
  const enterFull = () => {
    setFull(true);
    stageRef.current?.requestFullscreen?.().catch(() => undefined);
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

  return (
    <ToolShell tool={TOOL}>
      {!opened ? (
        <>
          <Dropzone
            accept={TOOL.accept}
            multiple={false}
            onFiles={(files) => void openWith(files[0])}
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
              {status === "loading" && (
                <span className="flex items-center gap-2 rounded-xl border bd-line bg-surface2 px-3 py-2 text-xs font-semibold c-muted">
                  <Spinner size={15} />
                  {isAr ? "جارٍ تشغيل المحرك…" : "Booting the engine…"}
                </span>
              )}
              {status === "ready" && (
                <span className="flex items-center gap-1.5 rounded-xl bg-[var(--teal-soft)] px-3 py-2 text-xs font-bold c-teal">
                  <Icon name="check" size={15} />
                  {isAr ? "المحرر جاهز" : "Editor ready"}
                </span>
              )}
              <button
                type="button"
                onClick={toggleFull}
                disabled={status !== "ready"}
                className={cx("btn !py-2 !text-sm", full ? "btn-amber" : "btn-ghost")}
                title={full ? (isAr ? "تصغير المحرر" : "Shrink editor") : (isAr ? "تشغيل المحرر بكامل الصفحة" : "Run the editor on the full page")}
              >
                <Icon name={full ? "shrink" : "expand"} size={16} />
                {full ? (isAr ? "تصغير" : "Shrink") : (isAr ? "كامل الصفحة" : "Full page")}
              </button>
              <button type="button" onClick={close} className="btn btn-ghost !py-2 !text-sm">
                <Icon name="refresh" size={15} />
                {isAr ? "فيديو آخر" : "Different video"}
              </button>
            </div>
          </div>

          {/* إطار المحرر — dir=ltr إلزامي لأن محرر الكانفس يفترض اتجاه LTR */}
          <div
            ref={stageRef}
            className={cx(
              "card relative overflow-hidden transition-all duration-300",
              full ? "fixed inset-0 z-[95] !rounded-none border-0" : "!rounded-xl"
            )}
            style={{
              height: full ? "100dvh" : "calc(100dvh - 262px)",
              minHeight: full ? "100dvh" : 560,
              background: "#101114",
            }}
          >
            <div dir="ltr" className="absolute inset-0">
              <div ref={containerRef} className="relative h-full w-full" />
            </div>

            {status === "loading" && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-[#101114]">
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <span className="c-teal"><Spinner size={34} /></span>
                  <p className="font-display text-sm font-semibold text-white/85">{phase}</p>
                  <p className="max-w-sm text-xs leading-relaxed text-white/50">
                    {isAr
                      ? "التحميل الأول يجلب أصول المحرك (محرك الرسوم والخطوط) من CDN الرسمي وقد يستغرق ثوانٍ حسب سرعتك."
                      : "First load fetches engine assets (render engine & fonts) from the official CDN — takes a few seconds."}
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-[#101114] p-6">
                <div className="flex max-w-md flex-col items-center gap-3 text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--red-soft)] c-red">
                    <Icon name="alert" size={26} />
                  </span>
                  <p className="font-display text-base font-bold text-white">
                    {isAr ? "تعذّر تشغيل المحرر" : "Could not start the editor"}
                  </p>
                  <p className="font-mono break-all text-[11px] leading-relaxed text-white/60" dir="ltr">
                    {errorMsg}
                  </p>
                  <p className="text-xs leading-relaxed text-white/70">
                    {isAr
                      ? "تأكد من اتصال الإنترنت (تُجلب أصول المحرك من CDN رسمي) ثم أعد المحاولة. جرّب متصفح كروم أو إيدج حديثاً."
                      : "Check your internet connection (engine assets load from the official CDN) and retry. A recent Chrome or Edge is recommended."}
                  </p>
                  <button type="button" onClick={retry} className="btn btn-red !py-2 !text-sm">
                    <Icon name="refresh" size={15} />
                    {isAr ? "إعادة المحاولة" : "Retry"}
                  </button>
                </div>
              </div>
            )}

            {full && status === "ready" && (
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
                  <b dir="ltr">Export</b> بصيغة MP4. لإدخال فيديو من جهازك استخدم زر الرفع داخل
                  لوحة الأصول أو اسحبه مباشرة إلى الخط الزمني. المحرك يعمل داخل متصفحك بالكامل —
                  ملفك لا يُرفع لأي خادم تابع لنا. وضع التشغيل الحالي تجريبي وقد تظهر علامة مائية
                  خفيفة على التصدير حتى ربط ترخيص دائم.
                </>
              ) : (
                <>
                  The frame fills the available space automatically, and <b>“Full page”</b> runs the
                  editor across your entire screen. Work on the timeline: add clips, images, text and
                  music, then export as MP4 via the <b dir="ltr">Export</b> button. To bring in a video
                  from your device, use the upload button inside the asset panel or drag it onto the
                  timeline. The engine runs entirely in your browser — your file is never uploaded to
                  our servers. The current mode is a trial and exports may carry a light watermark
                  until a permanent license is connected.
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
