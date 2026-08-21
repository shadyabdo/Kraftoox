import { useEffect, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { CopyBtn, BlobLink, InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { cx, formatBytes, showToast, bumpProcessedCount } from "../lib/utils";
import {
  uploadImageToUrl,
  vectorizeToSvg,
  needsDownscale,
  fitUnderLimit,
  PROVIDER_INFO,
  UPLOAD_LIMIT_LABEL,
  type Provider,
} from "../lib/image2url";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("image-to-url")!;
const KEY_STORAGE = "kx-image2url-key";

type Phase = "ready" | "compressing" | "uploading" | "done" | "error";
type SvgPhase = "idle" | "busy" | "done" | "error";
type Tab = "direct" | "html" | "md" | "bb";

export default function ImageToUrl() {
  const { t, isAr } = useI18n();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("ready");
  const [autoCompress, setAutoCompress] = useState(true);
  const [resultUrl, setResultUrl] = useState("");
  const [provider, setProvider] = useState<Provider>("image2url");
  const [tab, setTab] = useState<Tab>("direct");
  const [error, setError] = useState("");

  const [svgKey, setSvgKey] = useState(() => {
    try {
      return localStorage.getItem(KEY_STORAGE) ?? "";
    } catch {
      return "";
    }
  });
  const [showKey, setShowKey] = useState(false);
  const [svgPhase, setSvgPhase] = useState<SvgPhase>("idle");
  const [svgProgress, setSvgProgress] = useState(0);
  const [svgUrl, setSvgUrl] = useState("");
  const [svgBlob, setSvgBlob] = useState<Blob | null>(null);
  const [svgError, setSvgError] = useState("");
  const abortSvg = useRef(false);

  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);

  const onFile = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setPhase("ready");
    setResultUrl("");
    setProvider("image2url");
    setError("");
    setSvgPhase("idle");
    setSvgUrl("");
    setSvgBlob(null);
    setSvgError("");
  };

  const saveKey = (v: string) => {
    setSvgKey(v);
    try {
      localStorage.setItem(KEY_STORAGE, v);
    } catch {
      /* ignore */
    }
  };

  const upload = async () => {
    if (!file) return;
    setError("");
    try {
      let payload: Blob = file;
      if (needsDownscale(file)) {
        if (!autoCompress) {
          setError(
            t(
              `حجم الصورة يتجاوز حد الخدمة (${UPLOAD_LIMIT_LABEL}). فعّل الضغط التلقائي أو اختر صورة أصغر.`,
              `Image exceeds the service limit (${UPLOAD_LIMIT_LABEL}). Enable auto-compress or pick a smaller image.`
            )
          );
          setPhase("error");
          return;
        }
        setPhase("compressing");
        payload = await fitUnderLimit(file);
      }
      setPhase("uploading");
      const res = await uploadImageToUrl(payload, file.name);
      setResultUrl(res.url);
      setProvider(res.provider);
      setPhase("done");
      bumpProcessedCount(1);
      const info = PROVIDER_INFO[res.provider];
      showToast(
        t(
          info.permanent ? "تم الرفع — رابطك الدائم جاهز" : "تم الرفع — رابط احتياطي جاهز",
          info.permanent ? "Uploaded — your permanent link is ready" : "Uploaded — fallback link ready"
        )
      );
    } catch (e) {
      setPhase("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const snippets: Record<Tab, string> = {
    direct: resultUrl,
    html: `<img src="${resultUrl}" alt="${file?.name ?? "image"}" />`,
    md: `![${file?.name ?? "image"}](${resultUrl})`,
    bb: `[img]${resultUrl}[/img]`,
  };

  const runSvg = async () => {
    if (!resultUrl || !svgKey.trim()) {
      setSvgError(
        t(
          "أدخل مفتاح Image2URL API أولاً (من لوحة التحكم لديهم).",
          "Enter your Image2URL API key first (from their dashboard)."
        )
      );
      setSvgPhase("error");
      return;
    }
    abortSvg.current = false;
    setSvgPhase("busy");
    setSvgProgress(0);
    setSvgError("");
    setSvgUrl("");
    setSvgBlob(null);
    try {
      const url = await vectorizeToSvg(resultUrl, svgKey, (p) => {
        if (!abortSvg.current) setSvgProgress(p);
      });
      if (abortSvg.current) return;
      setSvgUrl(url);
      /* جلب الملف لتوفير تنزيل حقيقي */
      try {
        const r = await fetch(url);
        if (r.ok) setSvgBlob(await r.blob());
      } catch {
        setSvgBlob(null);
      }
      setSvgPhase("done");
      showToast(t("تم التحويل إلى SVG", "Converted to SVG"));
    } catch (e) {
      if (abortSvg.current) return;
      setSvgPhase("error");
      setSvgError(e instanceof Error ? e.message : String(e));
    }
  };

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "direct", label: t("رابط مباشر", "Direct") },
    { id: "html", label: "HTML" },
    { id: "md", label: "Markdown" },
    { id: "bb", label: "BBCode" },
  ];

  const busy = phase === "compressing" || phase === "uploading";

  return (
    <ToolShell tool={TOOL}>
      {!file ? (
        <>
          <Dropzone
            accept={TOOL.accept}
            multiple={false}
            onFiles={onFile}
            color={TOOL.color}
            title={t(TOOL.drop[0], TOOL.drop[1])}
            subtitle={t(TOOL.dropSub[0], TOOL.dropSub[1])}
          />
          <div className="mt-6">
            <InfoNote>
              {isAr
                ? "الرفع يتم مباشرة من متصفحك إلى Image2URL — رابط CDN دائم لا ينتهي، بدون تسجيل. إن منع متصفحك الوصول إليها (CORS أو مانع إعلانات) تُجرَّب تلقائياً: وكيل CORS ← tmpfiles.org ← uguu.se، وستعرف أي مزوّد نجح من شارة النتيجة. الصور الأكبر من 2MB تُضغط محلياً قبل الرفع."
                : "Uploads go straight from your browser to Image2URL — a permanent CDN link that never expires, no sign-up. If your browser blocks it (CORS or an ad-blocker), the tool automatically retries via: CORS proxy ← tmpfiles.org ← uguu.se, and the result badge shows which provider succeeded. Images over 2MB are compressed locally first."}
            </InfoNote>
          </div>
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* ===== عمود الصورة والتحكم ===== */}
          <div className="space-y-4">
            <div className="card overflow-hidden">
              <div className="grid place-items-center bg-surface2 p-3">
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="max-h-52 rounded-lg object-contain"
                />
              </div>
              <div className="border-t bd-line p-4">
                <p className="truncate text-sm font-semibold" dir="ltr" style={{ textAlign: "end" }}>
                  <bdi>{file.name}</bdi>
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs c-muted">
                  <span className="font-mono" dir="ltr">{formatBytes(file.size)}</span>
                  {needsDownscale(file) && (
                    <span className="rounded-md bg-[var(--amber-soft)] px-1.5 py-0.5 font-semibold c-amber">
                      {t("أكبر من الحد", "Over limit")}
                    </span>
                  )}
                </div>

                {needsDownscale(file) && (
                  <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs leading-relaxed">
                    <input
                      type="checkbox"
                      checked={autoCompress}
                      onChange={(e) => setAutoCompress(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--amber)]"
                    />
                    <span>
                      {t(
                        "ضغط تلقائي محلي ليتناسب مع حد الخدمة (2MB) قبل الرفع",
                        "Auto-compress locally to fit the service limit (2MB) before upload"
                      )}
                    </span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={upload}
                  disabled={busy}
                  className="btn btn-teal mt-4 w-full !py-3"
                >
                  {busy ? <Spinner size={18} /> : <Icon name="upload" size={18} />}
                  {phase === "compressing"
                    ? t("جارٍ الضغط…", "Compressing…")
                    : phase === "uploading"
                    ? t("جارٍ الرفع…", "Uploading…")
                    : resultUrl
                    ? t("إعادة الرفع", "Re-upload")
                    : t("ارفع واحصل على الرابط", "Upload & get link")}
                </button>

                {phase === "error" && error && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-xs leading-relaxed c-red">
                    <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setResultUrl("");
                    setPhase("ready");
                    setSvgPhase("idle");
                  }}
                  className="btn btn-ghost mt-3 w-full !py-2 !text-xs"
                >
                  <Icon name="refresh" size={14} />
                  {t("صورة أخرى", "Different image")}
                </button>
              </div>
            </div>
          </div>

          {/* ===== عمود النتائج ===== */}
          <div className="space-y-4">
            {phase !== "done" && !resultUrl && (
              <div className="card grid min-h-[220px] place-items-center p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <span className={cx("grid h-14 w-14 place-items-center rounded-2xl", busy ? "anim-pulse-soft" : "")} style={{ background: "color-mix(in srgb, var(--teal) 12%, var(--surface))", color: "var(--teal)" }}>
                    {busy ? <Spinner size={26} /> : <Icon name="link" size={26} />}
                  </span>
                  <p className="font-display text-base font-bold">
                    {busy
                      ? t("نجهّز رابطك الدائم…", "Preparing your permanent link…")
                      : t("رابطك الدائم سيظهر هنا", "Your permanent link will appear here")}
                  </p>
                  <p className="c-muted max-w-sm text-sm leading-relaxed">
                    {t(
                      "ارفع الصورة لتحصل على رابط CDN دائم مع أكواد جاهزة للمشاركة.",
                      "Upload the image to get a permanent CDN link with ready-made share codes."
                    )}
                  </p>
                </div>
              </div>
            )}

            {resultUrl && phase === "done" && (
              <>
                {/* معاينة الصورة المستضافة */}
                <div className="card anim-pop overflow-hidden">
                  <div className="grid place-items-center bg-surface2 p-3">
                    <img src={resultUrl} alt={t("النسخة المستضافة", "Hosted copy")} className="max-h-56 rounded-lg object-contain shadow-md" />
                  </div>
                  <div className="flex items-center justify-between border-t bd-line px-4 py-2.5">
                    <span
                      className={cx(
                        "flex items-center gap-1.5 text-xs font-bold",
                        PROVIDER_INFO[provider].permanent ? "c-teal" : "c-amber"
                      )}
                      title={provider}
                    >
                      <Icon name={PROVIDER_INFO[provider].permanent ? "check" : "info"} size={15} />
                      {isAr ? PROVIDER_INFO[provider].ar : PROVIDER_INFO[provider].en}
                    </span>
                    <a href={resultUrl} target="_blank" rel="noopener noreferrer" className="linkish text-xs font-semibold">
                      {t("فتح الرابط", "Open link")}
                    </a>
                  </div>
                </div>

                {/* الروابط والأكواد */}
                <div className="card anim-pop p-5">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {TABS.map((tb) => (
                      <button
                        key={tb.id}
                        type="button"
                        onClick={() => setTab(tb.id)}
                        className={cx(
                          "chip !px-3.5 !py-1.5 font-mono !text-[11px]",
                          tab === tb.id && "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]"
                        )}
                        dir="ltr"
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>

                  <div
                    className="max-h-32 overflow-auto rounded-xl border bd-line bg-surface2 p-3.5 font-mono text-xs leading-relaxed break-all"
                    dir="ltr"
                    style={{ textAlign: "left" }}
                  >
                    {snippets[tab]}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <CopyBtn text={snippets[tab]} label={t("نسخ", "Copy")} className="btn-teal" />
                    {tab === "direct" && (
                      <a href={resultUrl} download={file.name} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                        <Icon name="download" size={16} />
                        {t("تنزيل", "Download")}
                      </a>
                    )}
                  </div>
                </div>

                {/* ===== تحويل SVG عبر الواجهة الخارجية v1 ===== */}
                <div className="card anim-pop p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--amber) 12%, var(--surface))", color: "var(--amber)" }}>
                      <Icon name="code" size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-bold">
                        {t("تحويل إلى SVG (اختياري)", "Vectorize to SVG (optional)")}
                      </h3>
                      <p className="c-muted text-xs">
                        {t(
                          "عبر Image2URL API v1 — يتطلب مفتاحاً مجانياً من لوحتهم",
                          "Via Image2URL API v1 — needs a free key from their dashboard"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={svgKey}
                      onChange={(e) => saveKey(e.target.value)}
                      placeholder={t("مفتاح API (يُحفظ محلياً)", "API key (stored locally)")}
                      className="input !pe-11 font-mono !text-sm"
                      dir="ltr"
                      style={{ textAlign: "left" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((s) => !s)}
                      className="c-muted absolute inset-y-0 end-3 grid place-items-center transition-colors hover:text-[var(--teal)]"
                      aria-label={showKey ? t("إخفاء المفتاح", "Hide key") : t("إظهار المفتاح", "Show key")}
                    >
                      <Icon name={showKey ? "eye" : "eye"} size={17} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={runSvg}
                    disabled={svgPhase === "busy" || !resultUrl}
                    className="btn btn-amber mt-3 w-full !py-2.5"
                  >
                    {svgPhase === "busy" ? <Spinner size={17} /> : <Icon name="wand" size={17} />}
                    {svgPhase === "busy"
                      ? t("جارٍ التحويل…", "Converting…")
                      : t("حوّل الصورة إلى SVG", "Vectorize to SVG")}
                  </button>

                  {svgPhase === "busy" && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(4, svgProgress * 100)}%`, background: "var(--amber)" }}
                        />
                      </div>
                      <p className="c-muted mt-1.5 text-center text-[11px]">
                        {t("مهمة غير متزامنة — نتابعها حتى تكتمل", "Async job — polling until complete")}
                      </p>
                    </div>
                  )}

                  {svgPhase === "error" && svgError && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-soft)] px-3 py-2 text-xs leading-relaxed c-red">
                      <Icon name="alert" size={15} className="mt-0.5 shrink-0" />
                      {svgError}
                    </p>
                  )}

                  {svgPhase === "done" && svgUrl && (
                    <div className="anim-pop mt-3 rounded-xl border bd-line bg-surface2 p-3.5">
                      <div className="grid place-items-center rounded-lg bg-surface p-3">
                        <img src={svgUrl} alt="SVG" className="max-h-36 object-contain" />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <CopyBtn text={svgUrl} label={t("نسخ رابط SVG", "Copy SVG link")} small className="btn-teal" />
                        {svgBlob && (
                          <BlobLink blob={svgBlob} filename={(file.name.replace(/\.[^.]+$/, "") || "image") + ".svg"} label={t("تنزيل SVG", "Download SVG")} small />
                        )}
                        <a href={svgUrl} target="_blank" rel="noopener noreferrer" className="linkish text-xs font-semibold">
                          {t("فتح", "Open")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
