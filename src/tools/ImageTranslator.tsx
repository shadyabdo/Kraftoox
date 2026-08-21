import { useEffect, useMemo, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { BlobLink, CompareSlider, InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { loadImageEl } from "../lib/img";
import { bumpProcessedCount, cx, formatBytes, showToast } from "../lib/utils";
import { takePendingFiles } from "../lib/pending";
import { ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("image-translator")!;
const KEY_STORAGE = "kraftoox-gemini-key";
/* واجهة Gemini من Google AI Studio — تعمل مباشرة من المتصفح بمفتاح مجاني */
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type GeminiModel = "gemini-2.5-flash-image-preview" | "gemini-2.0-flash-preview-image-generation";

const LANGS = [
  { code: "ar", ar: "العربية", en: "Arabic", instruction: "Arabic" },
  { code: "en", ar: "الإنجليزية", en: "English", instruction: "English" },
  { code: "fr", ar: "الفرنسية", en: "French", instruction: "French" },
  { code: "es", ar: "الإسبانية", en: "Spanish", instruction: "Spanish" },
  { code: "de", ar: "الألمانية", en: "German", instruction: "German" },
  { code: "tr", ar: "التركية", en: "Turkish", instruction: "Turkish" },
];

type Stage = "idle" | "sending" | "rendering" | "done" | "error";

function readKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}
function writeKey(k: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, k);
  } catch {
    /* ignore */
  }
}

/* تصغير الصورة لحد أقصى يريح الطلب ويحافظ على وضوح النص */
async function toPayloadParts(file: File): Promise<{ b64: string; mime: string }> {
  const img = await loadImageEl(file);
  const MAX = 2048;
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  const isPng = file.type.includes("png");
  const mime = isPng ? "image/png" : "image/jpeg";
  const dataUrl = c.toDataURL(mime, 0.92);
  return { b64: dataUrl.split(",")[1], mime };
}

/* استخراج الصورة المولدة من استجابة Gemini (جزء inlineData داخل candidates) */
function imageFromGeminiResponse(json: any): string | null {
  try {
    const parts: any[] = json?.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      const inline = part?.inlineData ?? part?.inline_data;
      if (inline?.data) {
        const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
        return `data:${mime};base64,${inline.data}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* سبب حظر إن وُجد في استجابة Gemini */
function geminiBlockReason(json: any): string | null {
  try {
    const reason = json?.promptFeedback?.blockReason;
    return reason ? String(reason) : null;
  } catch {
    return null;
  }
}

export default function ImageTranslator() {
  const { t, isAr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [origUrl, setOrigUrl] = useState("");
  const [payload, setPayload] = useState<{ b64: string; mime: string } | null>(null);
  const [apiKey, setApiKey] = useState(readKey);
  const [showKey, setShowKey] = useState(false);
  const [lang, setLang] = useState("ar");
  const [model, setModel] = useState<GeminiModel>("gemini-2.5-flash-image-preview");
  const [custom, setCustom] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const langObj = LANGS.find((l) => l.code === lang)!;

  const defaultPrompt = useMemo(
    () =>
      isAr
        ? `هات نسخة ${langObj.ar} من هذه الصورة. حافظ بالضبط على نفس التصميم والتخطيط والألوان وستايل الكتابة وكل شيء — فقط استبدل النصوص بترجمتها إلى ${langObj.ar} بنفس نمط الخط والموضع.`
        : `Give me a ${langObj.en} version of this image. Keep the exact same design, layout, colors, and typography style — only replace the text with its ${langObj.en} translation, matching the original font style and placement.`,
    [langObj, isAr]
  );

  const prompt = custom.trim() || defaultPrompt;

  useEffect(() => () => URL.revokeObjectURL(origUrl), [origUrl]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => abortRef.current?.abort(), []);

  /* التقاط صورة محوّلة من صفحة الهبوط */
  useEffect(() => {
    const pending = takePendingFiles();
    if (pending && pending[0]) void onFile([pending[0]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = async (files: File[]) => {
    const f = files[0];
    try {
      const parts = await toPayloadParts(f);
      setFile(f);
      setPayload(parts);
      setOrigUrl(URL.createObjectURL(f));
      setResult(null);
      setStage("idle");
      setError("");
    } catch {
      showToast(t("تعذّر قراءة الصورة", "Could not read the image"), "err");
    }
  };

  const translate = async () => {
    if (!file || !payload) return;
    if (!apiKey.trim()) {
      setError(
        isAr
          ? "أدخل مفتاح Gemini API أولاً — احصل عليه مجاناً من Google AI Studio."
          : "Enter your Gemini API key first — get it free from Google AI Studio."
      );
      setStage("error");
      return;
    }
    writeKey(apiKey.trim());
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStage("sending");
    setError("");
    setResult(null);

    try {
      setStage("rendering");

      /* Gemini: صورة + أمر داخل parts، ومخرج صور مفعّل في generationConfig */
      const res = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: payload.mime, data: payload.b64 } },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(apiErrorMessage(res.status, json, isAr));

      const blocked = geminiBlockReason(json);
      if (blocked) {
        throw new Error(
          isAr
            ? `رفض النموذج معالجة الصورة لأسباب سلامة المحتوى (${blocked}).`
            : `The model refused the image for content-safety reasons (${blocked}).`
        );
      }

      const dataUrl = imageFromGeminiResponse(json);
      if (!dataUrl) {
        throw new Error(
          isAr
            ? "لم يُرجِع النموذج صورة — جرّب النموذج الآخر أو أعد الصياغة."
            : "The model returned no image — try the other model or rephrase."
        );
      }

      const blob = await dataUrlToBlob(dataUrl);
      const url = URL.createObjectURL(blob);
      setResult({ blob, url });
      setStage("done");
      bumpProcessedCount(1);
      showToast(t("تمت ترجمة الصورة بنجاح", "Image translated successfully"));
    } catch (err) {
      if ((err as Error).message === "aborted") return;
      setError(err instanceof Error && err.message ? err.message : String(err));
      setStage("error");
    }
  };

  const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
    if (dataUrl.startsWith("data:")) {
      const res = await fetch(dataUrl);
      return res.blob();
    }
    const res = await fetch(dataUrl);
    return res.blob();
  };

  const reset = () => {
    setFile(null);
    setPayload(null);
    setResult(null);
    setStage("idle");
    setError("");
  };

  const busy = stage === "sending" || stage === "rendering";

  return (
    <ToolShell tool={TOOL}>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* لوحة الإدخال */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-extrabold">
              <span className="c-teal"><Icon name="globe" size={17} /></span>
              {t("١. مفتاح Gemini AI Studio", "1. Gemini AI Studio key")}
            </h3>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                className="input !pe-11 font-mono !text-xs"
                dir="ltr"
                style={{ textAlign: "left" }}
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                aria-label="Gemini API key"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="c-muted absolute inset-y-0 end-3 grid place-items-center transition-colors hover:text-[var(--teal)]"
                aria-label={showKey ? t("إخفاء المفتاح", "Hide key") : t("إظهار المفتاح", "Show key")}
              >
                <Icon name={showKey ? "close" : "eye"} size={17} />
              </button>
            </div>
            <p className="c-muted mt-2 text-[11px] leading-relaxed">
              {t(
                "مجاني من Google AI Studio، يُحفظ في متصفحك فقط ويُرسل مباشرة إلى Google — لا يمر على خوادمنا إطلاقاً.",
                "Free from Google AI Studio, stored in your browser only and sent straight to Google — never through our servers."
              )}{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="linkish"
                dir="ltr"
              >
                aistudio.google.com/apikey
              </a>
            </p>
          </div>

          <div className="card p-5">
            <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-extrabold">
              <span className="c-amber"><Icon name="wand" size={17} /></span>
              {t("٢. إعدادات الترجمة", "2. Translation settings")}
            </h3>

            <FieldLabel>{t("اللغة المستهدفة", "Target language")}</FieldLabel>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={cx("chip !px-3 !py-1.5 !text-xs", lang === l.code && "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]")}
                >
                  {isAr ? l.ar : l.en}
                </button>
              ))}
            </div>

            <FieldLabel>{t("النموذج", "Model")}</FieldLabel>
            <select
              className="input font-mono"
              dir="ltr"
              style={{ textAlign: "left" }}
              value={model}
              onChange={(e) => setModel(e.target.value as GeminiModel)}
              aria-label={t("نموذج الذكاء الاصطناعي", "AI model")}
            >
              <option value="gemini-2.5-flash-image-preview">
                gemini-2.5-flash-image — {t("الأفضل للحفاظ على الستايل", "best for keeping style")}
              </option>
              <option value="gemini-2.0-flash-preview-image-generation">
                gemini-2.0-flash-image — {t("بديل أسرع", "faster alternative")}
              </option>
            </select>

            <button
              type="button"
              onClick={() => setShowPrompt((s) => !s)}
              className="linkish mt-4 flex items-center gap-1.5 text-xs font-semibold"
            >
              <span className={cx("transition-transform duration-200", showPrompt && "rotate-180")}><Icon name="chevron" size={14} /></span>
              {showPrompt ? t("إخفاء نص الأمر", "Hide the instruction") : t("تخصيص نص الأمر (اختياري)", "Customize the instruction (optional)")}
            </button>
            {showPrompt && (
              <div className="anim-pop mt-2">
                <textarea
                  className="input min-h-24 resize-y !text-xs leading-relaxed"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder={defaultPrompt}
                />
                <p className="c-muted mt-1 text-[10.5px]">
                  {t("اتركه فارغاً لاستخدام الأمر الافتراضي الذكي.", "Leave empty to use the smart default instruction.")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* الصورة والنتيجة */}
        <div className="space-y-4">
          {!file ? (
            <Dropzone
              accept={TOOL.accept}
              multiple={false}
              onFiles={onFile}
              color={TOOL.color}
              title={isAr ? TOOL.drop[0] : TOOL.drop[1]}
              subtitle={isAr ? TOOL.dropSub[0] : TOOL.dropSub[1]}
            />
          ) : (
            <div className="anim-pop card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bd-line p-4">
                <p className="truncate text-sm font-bold" dir="ltr" style={{ textAlign: "end" }}>
                  <bdi>{file.name}</bdi>
                </p>
                <span className="font-mono text-[11px] c-muted" dir="ltr">{formatBytes(file.size)}</span>
              </div>

              <div className="grid place-items-center bg-surface2 p-4">
                <img src={origUrl} alt={file.name} className="max-h-96 w-auto rounded-lg object-contain shadow-lg" />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 border-t bd-line p-4">
                <button
                  type="button"
                  onClick={translate}
                  disabled={busy}
                  className="btn btn-teal flex-1 !py-3 !text-base sm:flex-none"
                >
                  {busy ? (
                    <>
                      <Spinner size={18} />
                      {stage === "sending" ? t("جارٍ الإرسال…", "Uploading…") : t("النموذج يعيد رسم الصورة…", "Model is redrawing…")}
                    </>
                  ) : (
                    <>
                      <Icon name="globe" size={18} />
                      {t(`ترجم إلى ${langObj.ar}`, `Translate to ${langObj.en}`)}
                    </>
                  )}
                </button>
                {busy && (
                  <button type="button" onClick={() => abortRef.current?.abort()} className="btn btn-ghost !py-3">
                    <Icon name="close" size={16} />
                    {t("إلغاء", "Cancel")}
                  </button>
                )}
                <button type="button" onClick={reset} className="btn btn-ghost !py-3">
                  <Icon name="refresh" size={16} />
                  {t("صورة أخرى", "Different image")}
                </button>
              </div>
            </div>
          )}

          {stage === "rendering" && (
            <div className="card anim-pop flex items-center gap-3 p-5">
              <span className="anim-pulse-soft grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--amber-soft)] c-amber">
                <Icon name="ai" size={22} />
              </span>
              <div>
                <p className="font-display text-sm font-bold">{t("الذكاء الاصطناعي يعمل الآن…", "AI is working now…")}</p>
                <p className="c-muted mt-0.5 text-xs leading-relaxed">
                  {t(
                    "يفهم النموذج التصميم ويستبدل النصوص بالترجمة مع الحفاظ على الستايل — قد يستغرق ذلك ثوانٍ.",
                    "The model reads the design and swaps the text for the translation, keeping the style — takes a few seconds."
                  )}
                </p>
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="card anim-pop flex items-start gap-3 border-2 p-5" style={{ borderColor: "var(--red)" }}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--red-soft)] c-red">
                <Icon name="alert" size={20} />
              </span>
              <div>
                <p className="font-display text-sm font-bold c-red">{t("تعذّرت الترجمة", "Translation failed")}</p>
                <p className="c-muted mt-1 font-mono text-[11px] leading-relaxed" dir="ltr" style={{ textAlign: "end" }}>
                  <bdi>{error}</bdi>
                </p>
              </div>
            </div>
          )}

          {stage === "done" && result && (
            <div className="card anim-pop overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bd-line p-4">
                <p className="flex items-center gap-2 text-sm font-bold c-teal">
                  <Icon name="check" size={18} />
                  {t("النسخة المعرَّبة جاهزة — اسحب المقبض للمقارنة", "Translated version ready — drag to compare")}
                </p>
                <BlobLink
                  blob={result.blob}
                  className="btn-teal"
                  iconSize={16}
                  label={t("تنزيل النسخة المترجمة", "Download translated")}
                  filename={`kraftoox-${lang}-${(file?.name ?? "image").replace(/\.[^.]+$/, "")}.png`}
                />
              </div>
              <div className="p-4">
                <CompareSlider before={origUrl} after={result.url} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <InfoNote>
          {isAr
            ? "الترجمة تتم عبر نماذج Gemini لتوليد الصور من Google: يفهم النموذج الصورة، يترجم نصوصها، ويعيد رسمها بنفس الستايل والتخطيط. مفتاحك مجاني من AI Studio ويُحفظ محلياً ويُرسل مباشرة إلى Google. قد تحتاج الصور المعقدة إلى إعادة محاولة أو صياغة أوضح."
            : "Translation runs through Google's Gemini image models: the model reads the image, translates its text, and redraws it in the same style and layout. Your key is free from AI Studio, stored locally and sent only to Google. Complex images may need a retry or a clearer instruction."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}

function apiErrorMessage(status: number, json: any, isAr: boolean): string {
  const apiMsg: string | undefined = json?.error?.message;
  if (status === 400 && /api key/i.test(apiMsg ?? ""))
    return isAr ? "مفتاح Gemini API غير صالح — تحقق منه" : "Invalid Gemini API key — double-check it";
  if (status === 400)
    return apiMsg ?? (isAr ? "طلب غير صالح — جرّب صورة أخرى (400)" : "Bad request — try another image (400)");
  if (status === 403)
    return isAr ? "المفتاح لا يملك صلاحية هذا النموذج — فعّله من AI Studio (403)" : "Key lacks access to this model — enable it in AI Studio (403)";
  if (status === 404)
    return isAr ? "النموذج غير متاح — جرّب النموذج الآخر (404)" : "Model not available — try the other model (404)";
  if (status === 429)
    return isAr ? "تجاوزت حد الاستخدام المجاني — انتظر قليلاً ثم أعد المحاولة (429)" : "Free quota exceeded — wait a moment and retry (429)";
  if (apiMsg) return apiMsg;
  return isAr ? `خطأ من Gemini (${status})` : `Gemini error (${status})`;
}
