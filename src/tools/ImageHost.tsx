import { useEffect, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { CopyBtn, IndeterminateBar, InfoNote } from "../components/bits";
import { getTool } from "../data/tools";
import { fileToDataUrl, uploadToTmpfiles } from "../lib/host";
import { bumpProcessedCount, formatBytes, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("image-host")!;

type Tab = "direct" | "data" | "html" | "md" | "bb";

export default function ImageHost() {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [tab, setTab] = useState<Tab>("direct");
  const [pubState, setPubState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [publicUrl, setPublicUrl] = useState("");

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl]);

  const onFile = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setPubState("idle");
    setPublicUrl("");
    setObjectUrl(URL.createObjectURL(f));
    try {
      setDataUrl(await fileToDataUrl(f));
    } catch {
      setDataUrl("");
    }
    bumpProcessedCount(1);
  };

  const publish = async () => {
    if (!file) return;
    setPubState("busy");
    try {
      const url = await uploadToTmpfiles(file);
      setPublicUrl(url);
      setPubState("done");
      showToast("تم نشر الرابط المؤقت بنجاح");
    } catch {
      setPubState("error");
      showToast("تعذّر الوصول لخدمة النشر المجانية — استخدم الروابط المحلية أدناه", "err");
    }
  };

  const activeUrl = publicUrl || objectUrl;
  const links: Record<Tab, string> = {
    direct: activeUrl,
    data: dataUrl,
    html: `<img src="${activeUrl}" alt="${file?.name ?? "image"}" />`,
    md: `![${file?.name ?? "image"}](${activeUrl})`,
    bb: `[img]${activeUrl}[/img]`,
  };

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "direct", label: "رابط مباشر" },
    { id: "html", label: "HTML" },
    { id: "md", label: "Markdown" },
    { id: "bb", label: "BBCode" },
    { id: "data", label: "Data URL" },
  ];

  return (
    <ToolShell tool={TOOL}>
      {!file ? (
        <Dropzone
          accept={TOOL.accept}
          multiple={false}
          onFiles={onFile}
          color={TOOL.color}
          title="اسحب صورتك للحصول على رابط مباشر"
          subtitle="ستحصل فوراً على رابط مباشر وأكواد جاهزة للمشاركة"
        />
      ) : (
        <div className="anim-pop grid gap-5 lg:grid-cols-[280px_1fr]">
          {/* المعاينة */}
          <div className="card flex flex-col items-center gap-3 p-5">
            <div className="grid w-full place-items-center overflow-hidden rounded-xl border bd-line bg-surface2 p-2">
              <img src={objectUrl} alt={file.name} className="max-h-56 rounded-lg object-contain" />
            </div>
            <p className="w-full truncate text-center text-sm font-semibold" dir="ltr">
              <bdi>{file.name}</bdi>
            </p>
            <p className="c-muted -mt-2 font-mono text-xs" dir="ltr">{formatBytes(file.size)}</p>

            <button type="button" onClick={() => publish()} disabled={pubState === "busy"} className="btn btn-amber w-full">
              {pubState === "busy" ? (
                <>
                  <span className="anim-spin inline-block">
                    <Icon name="refresh" size={16} />
                  </span>
                  جارٍ النشر…
                </>
              ) : (
                <>
                  <Icon name="globe" size={16} />
                  {pubState === "done" ? "إعادة النشر" : "نشر رابط مؤقت عام"}
                </>
              )}
            </button>
            {pubState === "busy" && <IndeterminateBar color={TOOL.color} />}
            {pubState === "done" && (
              <p className="flex items-center gap-1.5 text-xs c-teal">
                <Icon name="check" size={14} />
                رابط عام مؤقت جاهز (قد ينتهي بعد مدة)
              </p>
            )}
            {pubState === "error" && (
              <p className="flex items-start gap-1.5 text-xs c-red">
                <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
                خدمة النشر المجانية غير متاحة الآن — الروابط المحلية ما تزال تعمل.
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setFile(null);
                setObjectUrl("");
                setDataUrl("");
              }}
              className="btn btn-ghost w-full !py-2 !text-xs"
            >
              <Icon name="refresh" size={14} />
              صورة أخرى
            </button>
          </div>

          {/* الروابط */}
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`chip !px-3.5 !py-2 font-mono !text-[11px] ${
                    tab === t.id ? "!border-[var(--amber)] !text-[var(--amber)]" : ""
                  }`}
                  dir="ltr"
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div
              className="max-h-40 overflow-auto rounded-xl border bd-line bg-surface2 p-3.5 font-mono text-xs leading-relaxed break-all"
              dir="ltr"
              style={{ textAlign: "left" }}
            >
              {links[tab] || "جارٍ التوليد…"}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopyBtn text={links[tab] || ""} label="نسخ الكود" className="btn-amber" />
              {tab === "direct" && activeUrl && (
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  <Icon name="eye" size={16} />
                  فتح الرابط
                </a>
              )}
            </div>

            <div className="mt-5 space-y-2.5">
              <InfoNote>
                <b>الرابط المحلي</b> يعمل فوراً في جلسة متصفحك الحالية. للحصول على رابط عام قابل
                للمشاركة نستخدم خدمة <span dir="ltr" className="font-mono">tmpfiles.org</span> المجانية
                (روابط مؤقتة). لرابط دائم بميزانية صفرية، شغّل الخادم المرفق في مجلد
                <span dir="ltr" className="font-mono"> /server</span> مع خطة Supabase المجانية —
                التعليمات في <span dir="ltr" className="font-mono">server/README.md</span>.
              </InfoNote>
            </div>
          </div>
        </div>
      )}

      {!file && (
        <div className="mt-8">
          <InfoNote>
            صورك لا تُرفع إلى خوادمنا إطلاقاً — الروابط المحلية تُولّد داخل متصفحك، والنشر العام
            الاختياري يتم مباشرة من جهازك إلى خدمة الاستضافة المجانية.
          </InfoNote>
        </div>
      )}
    </ToolShell>
  );
}
