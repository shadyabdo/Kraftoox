import { useState } from "react";
import { InfoNote } from "../components/bits";
import { getTool } from "../data/tools";
import { AI_STYLES, aiImageUrl, fetchAiImage } from "../lib/ai";
import { bumpProcessedCount, downloadBlob, showToast } from "../lib/utils";
import { ToolShell, FieldLabel } from "./shared";
import { BlobLink, CopyBtn } from "../components/bits";
import { Icon } from "../components/Icons";

const TOOL = getTool("ai-image")!;

const SIZES = [
  { id: "square", label: "مربع", w: 1024, h: 1024 },
  { id: "wide", label: "يوتيوب 16:9", w: 1280, h: 720 },
  { id: "tall", label: "شورتز 9:16", w: 768, h: 1344 },
];

interface Generated {
  id: string;
  prompt: string;
  url: string;
  blob: Blob;
  w: number;
  h: number;
}

const SAMPLES = [
  "مدينة عربية قديمة وقت الغروب بألوان ذهبية",
  "رائد فضاء يشرب القهوة على سطح المريخ",
  "خط عربي كوفي مضيء بخلفية زمرّدية داكنة",
  "غابة استوائية ممطرة بألوان مشبعة سينمائية",
];

export default function AiImage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>(AI_STYLES[0].id);
  const [size, setSize] = useState("square");
  const [model, setModel] = useState<"flux" | "turbo">("flux");
  const [busy, setBusy] = useState(false);
  const [gallery, setGallery] = useState<Generated[]>([]);
  const [current, setCurrent] = useState<Generated | null>(null);

  const generate = async () => {
    const p = prompt.trim();
    if (!p) {
      showToast("اكتب وصفاً للصورة أولاً", "info");
      return;
    }
    setBusy(true);
    try {
      const s = SIZES.find((x) => x.id === size)!;
      const st = AI_STYLES.find((x) => x.id === style)!;
      const fullPrompt = `${p}, ${st.en}, high quality, ultra detailed, no watermark, no text`;
      const seed = Math.floor(Math.random() * 1_000_000_000);
      const url = aiImageUrl(fullPrompt, { width: s.w, height: s.h, seed, model });
      const blob = await fetchAiImage(fullPrompt, { width: s.w, height: s.h, seed, model });
      const item: Generated = {
        id: `${seed}`,
        prompt: p,
        url: URL.createObjectURL(blob),
        blob,
        w: s.w,
        h: s.h,
      };
      setGallery((g) => [item, ...g]);
      setCurrent(item);
      bumpProcessedCount(1);
      showToast("تم توليد الصورة بنجاح");
    } catch {
      showToast("تعذّر التوليد — تحقق من اتصال الإنترنت وجرّب مجدداً", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        {/* لوحة الإدخال */}
        <div className="card h-fit p-5">
          <FieldLabel>صف الصورة التي تريدها — بالعربية أو الإنجليزية</FieldLabel>
          <textarea
            className="input min-h-28 resize-y leading-relaxed"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: مسجد تاريخي يعانق غروباً ذهبياً فوق ماء هادئ…"
          />

          <div className="mt-2 flex flex-wrap gap-1.5">
            {SAMPLES.map((s) => (
              <button key={s} type="button" onClick={() => setPrompt(s)} className="chip !px-2.5 !py-1 !text-[10.5px]">
                {s.length > 26 ? s.slice(0, 26) + "…" : s}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <FieldLabel>النمط الفني</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {AI_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`chip !px-3 !py-1.5 !text-xs ${style === s.id ? "!border-[var(--amber)] !bg-[var(--amber-soft)] !text-[var(--amber)]" : ""}`}
                >
                  {s.ar}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>الأبعاد</FieldLabel>
              <select className="input" value={size} onChange={(e) => setSize(e.target.value)} aria-label="أبعاد الصورة">
                {SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.w}×{s.h})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>النموذج</FieldLabel>
              <select className="input font-mono" dir="ltr" value={model} onChange={(e) => setModel(e.target.value as "flux" | "turbo")} aria-label="نموذج التوليد">
                <option value="flux">FLUX — أعلى جودة</option>
                <option value="turbo">Turbo — أسرع</option>
              </select>
            </div>
          </div>

          <button type="button" onClick={generate} disabled={busy} className="btn btn-amber mt-5 w-full !py-3.5 !text-base">
            {busy ? (
              <>
                <span className="anim-spin inline-flex"><Icon name="refresh" size={18} /></span>
                جارٍ التوليد… (10–25 ثانية)
              </>
            ) : (
              <>
                <Icon name="ai" size={19} />
                ولّد الصورة الآن
              </>
            )}
          </button>

          <div className="mt-4 flex flex-wrap gap-1.5 text-[10.5px] font-semibold">
            <span className="rounded-md bg-[var(--teal-soft)] px-2 py-1 c-teal">✓ مجاني بلا حدود</span>
            <span className="rounded-md bg-[var(--teal-soft)] px-2 py-1 c-teal">✓ بدون علامة مائية</span>
            <span className="rounded-md bg-[var(--amber-soft)] px-2 py-1 c-amber">✓ يفهم العربية</span>
          </div>
        </div>

        {/* النتيجة */}
        <div>
          {!current ? (
            <div className={`card grid place-items-center p-10 text-center transition-opacity ${busy ? "opacity-70" : ""}`}>
              <div className="flex flex-col items-center gap-3">
                <span className={`grid h-16 w-16 place-items-center rounded-2xl bg-[var(--amber-soft)] c-amber ${busy ? "anim-pulse-soft" : ""}`}>
                  <Icon name="ai" size={30} />
                </span>
                <p className="font-display text-lg font-bold">{busy ? "الفنان الرقمي يرسم الآن…" : "صورتك الأولى على بُعد وصف واحد"}</p>
                <p className="c-muted max-w-sm text-sm leading-relaxed">
                  {busy
                    ? "نموذج FLUX يحوّل كلماتك إلى صورة احترافية — تستغرق اللوحات المميزة وقتاً أطول."
                    : "اكتب وصفاً تفصيلياً بالعربية، اختر النمط، ودع الذكاء الاصطناعي يتولى الباقي."}
                </p>
                {busy && (
                  <div className="mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full" style={{ background: "var(--amber)", animation: "ft-bar 2.2s ease-in-out infinite alternate" }} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="anim-pop card overflow-hidden">
              <div className="grid place-items-center bg-surface2 p-3">
                <img src={current.url} alt={current.prompt} className="max-h-[480px] w-auto rounded-lg object-contain shadow-lg" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t bd-line p-4">
                <p className="max-w-md truncate text-xs c-muted" title={current.prompt}>
                  «{current.prompt}» · <span dir="ltr" className="font-mono">{current.w}×{current.h}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <BlobLink
                    blob={current.blob}
                    className="btn-teal !py-2 !text-sm"
                    iconSize={15}
                    label="تنزيل PNG"
                    filename={`kraftoox-ai-${current.id}.png`}
                  />
                  <a href={current.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2 !text-sm">
                    <Icon name="eye" size={15} />
                    فتح
                  </a>
                  <CopyBtn text={aiImageUrl(current.prompt, { width: current.w, height: current.h, seed: Number(current.id), model })} label="نسخ الرابط" small className="!py-2" />
                </div>
              </div>
            </div>
          )}

          {gallery.length > 1 && (
            <div className="mt-4">
              <h3 className="font-display mb-2 text-sm font-bold">سجل الجلسة ({gallery.length})</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                {gallery.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setCurrent(g)}
                    className={`overflow-hidden rounded-lg border-2 transition-all duration-200 hover:-translate-y-0.5 ${current?.id === g.id ? "border-[var(--amber)]" : "bd-line"}`}
                    aria-label={g.prompt}
                  >
                    <img src={g.url} alt={g.prompt} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <InfoNote>
          التوليد يتم عبر نماذج مفتوحة المصدر (FLUX وTurbo) بواجهة مجانية بلا مفاتيح API — بلا حدود
          يومية وبلا علامات مائية على الصور. جرّب الأوصاف التفصيلية (إضاءة، زاوية، ألوان) لنتائج أدق.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
