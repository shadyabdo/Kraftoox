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

/* المحرك يُحمَّل من الحزمة المثبتة محلياً — لا اعتماد على رابط خارجي للكود.
   فقط أصول المحرك (wasm/خطوط/وسائط) تُجلب من CDN الرسمي الخاص بـ img.ly. */
const SDK_VERSION =
  (CreativeEditorSDK as unknown as { version?: string }).version ?? "1.80.0";
const BASE_URL = `https://cdn.img.ly/packages/imgly/cesdk-js/${SDK_VERSION}/assets`;

type Status = "idle" | "loading" | "ready" | "error";

export default function VideoEditor() {
  const { isAr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [opened, setOpened] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [full, setFull] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<Awaited<ReturnType<typeof CreativeEditorSDK.create>> | null>(null);
  const fileRef = useRef<File | null>(null);

  /* التقاط ملف محوَّل من صفحة الهبوط أو ساحة الأدوات */
  useEffect(() => {
    const pending = takePendingFiles();
    if (pending && pending[0]) void openWith(pending[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* إنشاء المحرر عند الفتح */
  useEffect(() => {
    if (!opened || !containerRef.current) return;
    let disposed = false;

    const boot = async () => {
      setStatus("loading");
      setErrorMsg("");
      try {
        const instance = await CreativeEditorSDK.create(containerRef.current!, {
          baseURL: BASE_URL,
          ui: { elements: { panels: { settings: true } } },
        });
        if (disposed) {
          instance.dispose();
          return;
        }
        instanceRef.current = instance;

        try {
          instance.ui.setTheme("dark");
        } catch {
          /* الثيم اختياري */
        }

        /* مصادر الأصول: الافتراضية + التجريبية مع تفعيل رفع الفيديو والصور */
        try {
          await instance.addDefaultAssetSources();
        } catch {
          /* غير حرج */
        }
        try {
          await instance.addDemoAssetSources({
            sceneMode: "Video",
            withUploadAssetSources: true,
          });
        } catch {
          /* غير حرج */
        }

        await instance.createVideoScene();

        /* محاولة فتح الفيديو المُفلَت إن وُجد */
        const f = fileRef.current;
        if (f) await tryOpenVideo(instance, f);

        if (!disposed) setStatus("ready");
      } catch (err) {
        if (disposed) return;
        const msg =
          err instanceof Error && err.message
            ? err.message
            : String(err);
        setErrorMsg(msg);
        setStatus("error");
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

  /* إدخال ملف فيديو إلى المشهد — أفضل محاولة مع مسار بديل آمن */
  const tryOpenVideo = async (instance: NonNullable<typeof instanceRef.current>, f: File) => {
    try {
      const anyInstance = instance as unknown as {
        createVideoFromBlob?: (b: Blob) => Promise<unknown>;
      };
      if (typeof anyInstance.createVideoFromBlob === "function") {
        await anyInstance.createVideoFromBlob(f);
        return;
      }
      /* مسار المحرك: إنشاء مقطع فيديو من الملف على الصفحة الحالية */
      const engine = (instance as unknown as { engine: any }).engine;
      const url = URL.createObjectURL(f);
      const page = engine.scene.getCurrentPage();
      const video = engine.block.create("video");
      engine.block.appendChild(page, video);
      try {
        const fill = engine.block.getFill(video);
        engine.block.setString(fill, "fill/video/fileURI", url);
      } catch {
        /* إن اختلف اسم الخاصية نترك المقطع ويستورد المستخدم الملف من الواجهة */
      }
    } catch {
      showToast(
        isAr
          ? "اسحب الفيديو إلى الخط الزمني داخل المحرر أو استخدم زر الرفع"
          : "Drag the video onto the timeline inside the editor or use its upload button",
        "info"
      );
    }
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

  const openWith = async (f: File) => {
    fileRef.current = f;
    setFile(f);
    setOpened(true);
  };

  const openEmpty = () => {
    fileRef.current = null;
    setFile(null);
    setOpened(true);
  };

  const close = () => {
    exitFull();
    setOpened(false);
    setStatus("idle");
    setFile(null);
    fileRef.current = null;
  };

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
                title={full ? (isAr ? "تصغير المحرر" : "Shrink editor") : (isAr ? "كامل الصفحة" : "Full page")}
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

          {/* إطار المحرر */}
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
            <div ref={containerRef} className="h-full w-full" />

            {status === "loading" && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-[#101114]">
                <div className="flex flex-col items-center gap-3">
                  <span className="c-teal"><Spinner size={34} /></span>
                  <p className="font-display text-sm font-semibold text-white/80">
                    {isAr ? "نُشغّل محرك الفيديو الاحترافي… قد يستغرق التحميل الأول ثوانٍ" : "Booting the pro video engine… first load takes a few seconds"}
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
                  <button type="button" onClick={() => { setStatus("idle"); setOpened(false); setTimeout(() => setOpened(true), 30); }} className="btn btn-red !py-2 !text-sm">
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
                  اعمل على الخط الزمني: قصّ ودمج، نصوص وعناوين متحركة، موسيقى، فلاتر وانتقالات، ثم
                  صدّر من زر <b dir="ltr">Export</b> بصيغة MP4. لإدخال فيديو: اسحبه إلى الخط الزمني
                  أو استخدم زر الرفع داخل المحرر. الوضع الحالي تجريبي وقد تظهر علامة مائية خفيفة على
                  التصدير حتى ربط ترخيص دائم.
                </>
              ) : (
                <>
                  Work on the timeline: trim & merge, animated text and titles, music, filters and
                  transitions, then export as MP4 via the <b dir="ltr">Export</b> button. To bring a
                  video in, drag it onto the timeline or use the editor's upload button. The current
                  mode is a trial — exports may carry a light watermark until a license is connected.
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
              ? "نعرض داخل المنصة محرك CreativeEditor الاحترافي من img.ly — يعمل داخل متصفحك بالكامل، وملفك لا يُرفع لأي خادم تابع لنا. للحصول على تصدير بلا علامة مائية لموقعك، أضف ترخيصك الخاص في ملف الأداة."
              : "We embed the professional CreativeEditor engine by img.ly — it runs entirely in your browser and your file is never uploaded to our servers. For watermark-free export on your own site, add your license key in the tool file."}
          </InfoNote>
        </div>
      )}
    </ToolShell>
  );
}
