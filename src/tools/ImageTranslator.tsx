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
const KEY_STORAGE = "kraftoox-openai-key";
const OPENAI_CHAT = "https://api.openai.com/v1/chat/completions";
const OPENAI_EDIT = "https://api.openai.com/v1/images/edits";

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
async function toPayloadDataUrl(file: File): Promise<string> {
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
  return c.toDataURL(isPng ? "image/png" : "image/jpeg", 0.92);
}

/* استخراج صورة من استجابة Chat Completions (gpt-4o بمخرج صور) */
function imageFromChatResponse(json: any): string | null {
  try {
    const content = json?.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part?.type === "image_url" && part?.image_url?.url) return part.image_url.url;
      }
    }
    if (typeof content === "string") {
      const m = content.match(/!\[[^\]]*\]\((data:image[^)]+)\)/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

/* استخراج صورة من استجابة images/edits (gpt-image-1) */
function imageFromEditResponse(json: any): string | null {
  try {
    const item = json?.data?.[0];
    if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
    if (item?.url) return item.url;
    return null;
  } catch {
    return null;
  }
}

export default function ImageTranslator() {
  const { t, isAr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [origUrl, setOrigUrl] = useState("");
  const [payload, setPayload] = useState("");
  const [apiKey, setApiKey] = useState(readKey);
  const [showKey, setShowKey] = useState(false);
  const [lang, setLang] = useState("ar");
  const [model, setModel] = useState<"gpt-4o" | "gpt-image-1">("gpt-4o");
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
      const dataUrl = await toPayloadDataUrl(f);
      setFile(f);
      setPayload(dataUrl);
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
          ? "أدخل مفتاح OpenAI API أولاً — احصل عليه مجاناً من منصة OpenAI."
          : "Enter your OpenAI API key first — get it from the OpenAI platform."
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
      let dataUrl: string | null = null;

      if (model === "gpt-image-1") {
        /* مسار gpt-image-1 عبر images/edits */
        setStage("rendering");
        const fd = new FormData();
        fd.append("model", "gpt-image-1");
        fd.append("image", file, file.name);
        fd.append("prompt", prompt);
        fd.append("size", "auto");
        const res = await fetch(OPENAI_EDIT, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
          body: fd,
          signal: ctrl.signal,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(apiErrorMessage(res.status, json, isAr));
        dataUrl = imageFromEditResponse(json);
      } else {
        /* مسار gpt-4o عبر Chat Completions مع مخرج صور */
        setStage("rendering");
        const res = await fetch(OPENAI_CHAT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          signal: ctrl.signal,
          body: JSON.stringify({
            model: "gpt-4o",
            modalities: ["text", "image"],
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: payload } },
                ],
              },
            ],
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(apiErrorMessage(res.status, json, isAr));
        dataUrl = imageFromChatResponse(json);
      }

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
    setPayload("");
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
              {t("١. مفتاح OpenAI", "1. OpenAI key")}
            </h3>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                className="input !pe-11 font-mono !text-xs"
                dir="ltr"
                style={{ textAlign: "left" }}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                aria-label="OpenAI API key"
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
                "يُحفظ في متصفحك فقط ويُرسل مباشرة إلى OpenAI — لا يمر على خوادمنا إطلاقاً.",
                "Stored in your browser only and sent straight to OpenAI — never through our servers."
              )}{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="linkish"
                dir="ltr"
              >
                platform.openai.com/api-keys
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
              onChange={(e) => setModel(e.target.value as "gpt-4o" | "gpt-image-1")}
              aria-label={t("نموذج الذكاء الاصطناعي", "AI model")}
            >
              <option value="gpt-4o">gpt-4o — {t("الأفضل للحفاظ على التخطيط", "best for keeping layout")}</option>
              <option value="gpt-image-1">gpt-image-1 — {t("تعديل صور متخصص", "specialized image editing")}</option>
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
            ? "الترجمة تتم عبر ChatGPT (GPT-4o) من OpenAI: يفهم النموذج الصورة، يترجم نصوصها، ويعيد رسمها بنفس الستايل. مفتاحك يُحفظ محلياً ويُرسل مباشرة إلى OpenAI. قد تحتاج الصور المعقدة إلى إعادة محاولة أو صياغة أوضح."
            : "Translation runs through OpenAI's ChatGPT (GPT-4o): the model reads the image, translates its text, and redraws it in the same style. Your key is stored locally and sent only to OpenAI. Complex images may need a retry or a clearer instruction."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}

function apiErrorMessage(status: number, json: any, isAr: boolean): string {
  const apiMsg: string | undefined = json?.error?.message;
  if (status === 401)
    return isAr ? "مفتاح API غير صالح — تحقق منه (401)" : "Invalid API key — double-check it (401)";
  if (status === 429)
    return isAr ? "تجاوزت حد الاستخدام أو نفدت الحصة — انتظر أو اشحن رصيدك (429)" : "Rate limit or quota exceeded — wait or top up (429)";
  if (status === 404)
    return isAr ? "النموذج غير متاح لحسابك — جرّب النموذج الآخر (404)" : "Model not available for your account — try the other model (404)";
  if (apiMsg) return apiMsg;
  return isAr ? `خطأ من OpenAI (${status})` : `OpenAI error (${status})`;
}
