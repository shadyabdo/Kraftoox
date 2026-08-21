import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { CATEGORIES, TOOLS, getTool, toolsOf } from "../data/tools";
import { useI18n } from "../i18n";
import { Link, navigate } from "../lib/router";
import { usePageMeta } from "../lib/seo";
import { stashPendingFiles } from "../lib/pending";
import { formatBytes, showToast } from "../lib/utils";
import { Icon } from "../components/Icons";
import { Reveal } from "../components/Reveal";

type FileKind = "image" | "pdf" | "video";

const KIND_TOOLS: Record<FileKind, string[]> = {
  image: ["compress-image", "convert-image", "upscale-image", "photo-editor"],
  pdf: ["compress-pdf", "merge-pdf", "extract-pdf-images", "images-to-pdf"],
  video: ["video-editor", "upscale-video", "remove-watermark-video"],
};

function detectKind(f: File): FileKind | null {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (f.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "image";
  if (f.type === "application/pdf" || ext === "pdf") return "pdf";
  if (f.type.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes(ext)) return "video";
  return null;
}

/* ===== لوحة الإفلات الذكي: ملف يدخل → الأدوات المناسبة تظهر ===== */
function SmartDrop() {
  const { t, lang, isAr } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<FileKind | null>(null);
  const [live, setLive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const take = (f: File | undefined | null) => {
    if (!f) return;
    const k = detectKind(f);
    setFile(f);
    setKind(k);
    if (!k) showToast(t("صيغة غير مدعومة — جرّب صورة أو PDF أو فيديو", "Unsupported format — try an image, PDF or video"), "err");
  };

  const go = (slug: string) => {
    if (!file) return;
    stashPendingFiles([file]);
    navigate(`/tool/${slug}`);
  };

  const kindColor: Record<FileKind, string> = { image: "var(--teal)", pdf: "var(--red)", video: "var(--blue)" };
  const kindLabel: Record<FileKind, string> = {
    image: t("صورة", "Image"),
    pdf: "PDF",
    video: t("فيديو", "Video"),
  };

  return (
    <div className="card relative overflow-hidden !rounded-2xl">
      {/* رأس اللوحة */}
      <div className="flex items-center justify-between border-b bd-line px-5 py-3.5">
        <p className="font-display flex items-center gap-2 text-sm font-bold">
          <span className="anim-pulse-soft inline-block h-2 w-2 rounded-full" style={{ background: "var(--teal)" }} />
          {t("جرّبها الآن — أفلت أي ملف", "Try it now — drop any file")}
        </p>
        <span className="font-mono text-[10px] tracking-wider c-muted" dir="ltr">
          LOCAL · 0 UPLOADS
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setLive(true); }}
        onDragLeave={() => setLive(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setLive(false); take(e.dataTransfer.files?.[0]); }}
        className="relative m-4 grid min-h-52 cursor-pointer place-items-center rounded-xl bg-surface2 text-center outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--teal)]"
        style={{ border: `1.6px dashed ${live ? "var(--teal)" : "var(--line)"}` }}
        aria-label={t("منطقة إفلات الملفات", "File drop area")}
      >
        {!file ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8">
            <span className={`grid h-14 w-14 place-items-center rounded-xl transition-transform duration-300 ${live ? "scale-110" : ""}`}
              style={{ background: "var(--teal-soft)", color: "var(--teal)" }}>
              <Icon name="upload" size={26} />
            </span>
            <div>
              <p className="font-display font-bold">{t("اسحب ملفاً هنا أو انقر للاختيار", "Drag a file here or click to browse")}</p>
              <p className="c-muted mt-1 text-xs">
                {t("سنقترح الأدوات المناسبة لنوعه فوراً", "We'll instantly suggest the right tools for its type")}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {["JPG", "PNG", "WEBP", "PDF", "MP4", "WEBM"].map((f) => (
                <span key={f} className="font-mono rounded-md border bd-line bg-surface px-2 py-0.5 text-[10px] c-muted">{f}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="anim-pop w-full px-5 py-6">
            <div className="mx-auto flex max-w-sm items-center gap-3 rounded-xl border bd-line bg-surface p-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                style={{
                  background: kind ? `color-mix(in srgb, ${kindColor[kind]} 12%, var(--surface))` : "var(--amber-soft)",
                  color: kind ? kindColor[kind] : "var(--amber)",
                }}>
                <Icon name={kind === "pdf" ? "pdf" : kind === "video" ? "video" : "image"} size={22} />
              </span>
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-sm font-bold" dir="ltr" style={{ textAlign: "end" }}><bdi>{file.name}</bdi></p>
                <p className="c-muted font-mono text-[11px]" dir="ltr">
                  {formatBytes(file.size)}{kind ? ` · ${kindLabel[kind]}` : ""}
                </p>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setKind(null); }}
                className="c-muted rounded-lg p-1.5 transition-colors hover:text-[var(--red)]" aria-label={t("إزالة الملف", "Remove file")}>
                <Icon name="close" size={16} />
              </button>
            </div>

            {kind ? (
              <div className="mx-auto mt-4 max-w-sm">
                <p className="mb-2 text-center text-xs font-semibold c-muted">
                  {t("الأدوات المناسبة لهذا الملف:", "The right tools for this file:")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {KIND_TOOLS[kind].map((slug, i) => {
                    const tool = getTool(slug)!;
                    return (
                      <button key={slug} type="button" onClick={(e) => { e.stopPropagation(); go(slug); }}
                        className="menu-item-in flex items-center gap-2 rounded-xl border bd-line bg-surface px-3 py-2.5 text-start text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--teal)]"
                        style={{ animationDelay: `${i * 50}ms`, color: kindColor[kind] }}>
                        <Icon name={tool.icon} size={16} />
                        <span className="text-[var(--ink)]">{isAr ? tool.name : tool.nameEn}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-center text-[10.5px] c-muted">
                  {t("ملفك سينتظرك داخل الأداة المختارة", "Your file will be waiting inside the chosen tool")}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-center text-xs c-red">{t("جرّب صورة أو PDF أو فيديو", "Try an image, PDF or video")}</p>
            )}
          </div>
        )}
        <input ref={inputRef} type="file" className="hidden"
          accept="image/*,application/pdf,video/*,.jpg,.png,.webp,.pdf,.mp4,.webm"
          onChange={(e) => { take(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
    </div>
  );
}

/* ===== سطر "كيف تعمل" — تحرير رقمي ===== */
function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    {
      n: "01",
      title: t("تختار ملفك", "You pick a file"),
      desc: t("بلا حساب ولا تسجيل — الملف يُقرأ من جهازك مباشرة عبر واجهات المتصفح الآمنة.", "No account, no sign-up — the file is read straight from your device via secure browser APIs."),
      color: "var(--teal)",
    },
    {
      n: "02",
      title: t("تعمل المحركات محلياً", "Engines run locally"),
      desc: t("Canvas وWeb Workers وpdf-lib وMediaRecorder — كل بايت يُعالَج في متصفحك، وقطع الإنترنت لا يوقف العمل.", "Canvas, Web Workers, pdf-lib and MediaRecorder — every byte is processed in your browser; cutting the internet doesn't stop the work."),
      color: "var(--amber)",
    },
    {
      n: "03",
      title: t("تنزّل النتيجة فوراً", "You download instantly"),
      desc: t("روابط تنزيل حقيقية تُنشأ على جهازك. لا طوابير خادم، لا علامات مائية، لا حدود يومية.", "Real download links are created on your machine. No server queues, no watermarks, no daily limits."),
      color: "var(--red)",
    },
  ];
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border bd-line bg-[var(--line)] md:grid-cols-3">
      {steps.map((s, i) => (
        <Reveal key={s.n} delay={i * 90}>
          <div className="group h-full bg-surface p-7 transition-colors duration-300 hover:bg-surface2">
            <span className="font-mono text-3xl font-bold transition-colors duration-300" style={{ color: s.color }} dir="ltr">
              {s.n}
            </span>
            <h3 className="font-display mt-3 text-lg font-bold">{s.title}</h3>
            <p className="c-muted mt-2 text-[13px] leading-relaxed">{s.desc}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ===== لوحة الطرفية لاستوديو الذكاء الاصطناعي ===== */
function AiTerminal() {
  const { t } = useI18n();
  return (
    <div className="term shadow-2xl">
      <div className="term-head">
        <span className="term-dot" style={{ background: "#ef767b" }} />
        <span className="term-dot" style={{ background: "#f0a63b" }} />
        <span className="term-dot" style={{ background: "#38c49d" }} />
        <span className="ms-3 text-[11px] text-[#6b8078]">kraftoox — ai-studio</span>
      </div>
      <div className="p-5">
        <p><span className="term-prompt">$</span> kraftoox generate video --topic <span className="term-amber">"عجائب الأندلس"</span> --lang ar --format shorts</p>
        <p className="term-dim">→ writing script ............ <span className="text-[#38c49d]">8 scenes ✓</span></p>
        <p className="term-dim">→ painting scenes (FLUX) ..... <span className="text-[#38c49d]">8/8 ✓</span></p>
        <p className="term-dim">→ assembling · ken burns · arabic captions</p>
        <p className="cli-bar text-[#38c49d]">
          rendering 00:27 / 00:32 <span>▮</span><span>▮</span><span>▮</span><span>▮</span>
        </p>
        <p className="mt-1"><span className="text-[#38c49d]">✓ done</span> — youtube-shorts.webm · 9:16 · <span className="term-amber">no watermark</span><span className="caret" /></p>
      </div>
    </div>
  );
}

export default function Landing() {
  usePageMeta("/");
  const { t, isAr } = useI18n();
  const [q, setQ] = useState("");
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDrawn(true), 350);
    return () => clearTimeout(id);
  }, []);

  return (
    <main>
      {/* ===== الافتتاحية: الورشة نفسها ===== */}
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-14 pt-12 sm:pt-16 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14">
        <div>
          <Reveal>
            <p className="kicker c-teal">
              {t("ورشة ملفات محلية — 17 أداة", "A local file workshop — 17 tools")}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="font-display mt-5 text-[2.5rem] font-extrabold leading-[1.15] sm:text-6xl lg:text-[3.9rem]">
              {t("ملفاتك تُعالَج", "Your files, processed")}
              <br />
              <span className="relative inline-block c-teal">
                {t("حيث يجب أن تكون", "where they should be")}
                <svg className="absolute -bottom-2.5 start-0 w-full" viewBox="0 0 220 12" fill="none" aria-hidden="true">
                  <path d="M4 9 C60 2, 150 2, 216 7" stroke="var(--amber)" strokeWidth="4.5" strokeLinecap="round"
                    pathLength={1} strokeDasharray={1}
                    style={{ strokeDashoffset: drawn ? 0 : 1, transition: "stroke-dashoffset 1s ease 0.6s" }} />
                </svg>
              </span>
              <span className="c-muted"> — {t("في جهازك", "on your device")}</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-7 max-w-xl text-base leading-loose sm:text-[17px]" style={{ color: "var(--muted)" }}>
              {t(
                "ضغط صور وتكبيرها حتى 4K، إزالة علامات مائية، تحرير فيديو على خط زمني، تسجيل شاشة، وذكاء اصطناعي يولّد صوراً وفيديوهات يوتيوب بالعربية — كل ذلك دون أن يغادر ملف واحد جهازك.",
                "Compress and upscale images to 4K, remove watermarks, edit video on a timeline, record your screen, and let AI generate Arabic YouTube images and videos — all without a single file leaving your device."
              )}
            </p>
          </Reveal>

          <Reveal delay={240}>
            <form className="relative mt-8 max-w-xl" onSubmit={(e) => { e.preventDefault(); navigate(`/tools?q=${encodeURIComponent(q.trim())}`); }} role="search">
              <span className="absolute inset-y-0 start-4 grid place-items-center c-muted"><Icon name="search" size={18} /></span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("ما الذي تريد إنجازه؟ مثال: شورتز، ضغط، علامة مائية…", "What do you need done? e.g. shorts, compress, watermark…")}
                className="input !rounded-xl !border-2 !py-3.5 !pe-24 !ps-11"
                aria-label={t("ابحث عن أداة", "Search for a tool")}
              />
              <button type="submit" className="btn btn-teal absolute inset-y-1.5 end-1.5 !rounded-lg !px-4 !text-sm">
                {t("ابحث", "Search")}
              </button>
            </form>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="c-muted text-xs font-semibold">{t("الأكثر استخداماً:", "Most used:")}</span>
              {["ai-video", "screen-recorder", "video-editor", "compress-image"].map((s) => {
                const tool = getTool(s)!;
                return (
                  <Link key={s} to={`/tool/${s}`} className="chip !text-xs">
                    <span style={{ color: tool.color }}><Icon name={tool.icon} size={12} /></span>
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={360}>
            <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t bd-line pt-6">
              {[
                { v: String(TOOLS.length), l: t("أداة متخصصة", "specialized tools") },
                { v: "0", l: t("ملفات تُرفع لخوادمنا", "files uploaded to us") },
                { v: "100%", l: t("معالجة داخل المتصفح", "in-browser processing") },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="sr-only">{s.l}</dt>
                  <dd className="font-display text-3xl font-extrabold" dir="ltr">{s.v}</dd>
                  <dd className="c-muted mt-0.5 text-xs font-medium">{s.l}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <SmartDrop />
          <p className="mt-3 text-center text-[11px] c-muted">
            {t("هذه ليست واجهة تجريبية — الإفلات يعمل فعلاً وسيحمّل ملفك في الأداة.", "This isn't a mock — dropping really works and loads your file into the tool.")}
          </p>
        </Reveal>
      </section>

      {/* ===== شريط الصيغ ===== */}
      <div className="overflow-hidden border-y bd-line py-3" style={{ background: "var(--surface)" }} aria-hidden="true">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-1 px-4" dir="ltr">
          {["JPG", "PNG", "WEBP", "PDF", "MP4", "WEBM", "4K", "A4", "FLUX", "ZIP", "MD", "BBCode"].map((f) => (
            <span key={f} className="font-mono text-xs font-semibold tracking-[0.18em] c-muted">{f}</span>
          ))}
        </div>
      </div>

      {/* ===== الأقسام ===== */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <Reveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker c-amber">{t("أقسام الورشة", "Workshop sections")}</p>
              <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{t("أربع ورش تحت سقف واحد", "Four workshops, one roof")}</h2>
            </div>
            <Link to="/tools" className="linkish text-sm font-bold">{t("كل الأدوات في صفحة واحدة ←", "All tools on one page ←")}</Link>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {CATEGORIES.map((cat, i) => {
            const tools = toolsOf(cat.id);
            const wide = i === 0 || i === 3;
            return (
              <Reveal key={cat.id} delay={i * 80} className={wide ? "md:col-span-2" : ""}>
                <Link to={`/${cat.slug}`} className="tool-card card group flex h-full flex-col p-6" style={{ "--tc": cat.color } as CSSProperties}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `color-mix(in srgb, ${cat.color} 13%, var(--surface))`, color: cat.color }}>
                      <Icon name={cat.icon} size={24} />
                    </span>
                    <span className="font-mono text-[10px] font-semibold tracking-[0.15em] c-muted" dir="ltr">
                      {String(tools.length).padStart(2, "0")} {t("أدوات", "TOOLS")}
                    </span>
                  </div>
                  <h3 className="font-display mt-4 text-[22px] font-extrabold">{isAr ? cat.name : cat.nameEn}</h3>
                  <p className="mt-1 text-sm font-semibold" style={{ color: cat.color }}>{isAr ? cat.tagline : cat.taglineEn}</p>
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {tools.map((tool) => (
                      <span key={tool.slug} className="chip pointer-events-none !cursor-default !px-2.5 !py-1 !text-[10.5px]">
                        {isAr ? tool.name : tool.nameEn}
                      </span>
                    ))}
                  </div>
                  <span className="mt-5 flex items-center gap-1.5 text-xs font-bold transition-transform duration-300 group-hover:-translate-x-1.5" style={{ color: cat.color }}>
                    {t("ادخل القسم", "Enter section")}
                    <Icon name="arrow" size={14} />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ===== كيف تعمل ===== */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <Reveal>
          <p className="kicker c-teal">{t("المعمارية", "Architecture")}</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{t("لا خادم في المنتصف — وهذا مقصود", "No server in between — on purpose")}</h2>
        </Reveal>
        <div className="mt-8">
          <HowItWorks />
        </div>
      </section>

      {/* ===== استوديو الذكاء الاصطناعي ===== */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="kicker c-amber">{t("استوديو الذكاء الاصطناعي", "AI Studio")}</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold leading-snug sm:text-4xl">
              {t("من فكرة واحدة… إلى فيديو يوتيوب جاهز", "From one idea… to a ready YouTube video")}
            </h2>
            <p className="mt-4 max-w-lg leading-loose c-muted">
              {t(
                "مولّد الصور يفهم العربية ويعمل بنماذج FLUX وTurbo المفتوحة — بلا مفاتيح API وبلا علامات مائية. ومولّد الفيديو يكتب سيناريو عربياً، يرسم مشهداً لكل جملة، ويركّبها في شورتز أو فيديو طويل حتى ساعة.",
                "The image generator understands Arabic and runs on open FLUX and Turbo models — no API keys, no watermarks. The video generator writes an Arabic script, paints a scene per line, and assembles shorts or long-form videos up to an hour."
              )}
            </p>
            <ul className="mt-5 space-y-2">
              {[
                t("سيناريو عربي قابل للتعديل جملة جملة", "Arabic script, editable line by line"),
                t("شورتز 9:16 وفيديوهات حتى 60 دقيقة", "9:16 shorts and videos up to 60 minutes"),
                t("بلا حدود يومية وبلا علامة مائية", "No daily limits, no watermark"),
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <span className="c-amber mt-0.5 shrink-0"><Icon name="check" size={15} /></span>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/tool/ai-video" className="btn btn-amber">
                <Icon name="film" size={17} />
                {t("جرّب مولّد الفيديو", "Try the video generator")}
              </Link>
              <Link to="/tool/ai-image" className="btn btn-ghost">
                <Icon name="ai" size={17} />
                {t("مولّد الصور", "Image generator")}
              </Link>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <AiTerminal />
          </Reveal>
        </div>
      </section>

      {/* ===== أسئلة شائعة ===== */}
      <section className="mx-auto max-w-3xl px-4 pt-20">
        <Reveal>
          <p className="kicker c-red">{t("أسئلة شائعة", "FAQ")}</p>
          <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{t("قبل أن تسأل…", "Before you ask…")}</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {[
            {
              q: t("هل تُرفع ملفاتي إلى خوادمكم؟", "Are my files uploaded to your servers?"),
              a: t(
                "لا. كل أدوات المعالجة (ضغط، تحويل، دمج، تحرير، تسجيل شاشة) تعمل داخل متصفحك. الاستثناء الوحيد الاختياري هو زر النشر المؤقت في أداة الروابط والرندر السحابي عبر Shotstack، وكلاهما يتطلب موافقتك الصريحة.",
                "No. Every processing tool (compress, convert, merge, edit, screen record) runs inside your browser. The only optional exceptions are the temp-publish button in the link tool and Shotstack cloud rendering — both require your explicit action."
              ),
            },
            {
              q: t("هل الذكاء الاصطناعي مجاني فعلاً؟", "Is the AI really free?"),
              a: t(
                "نعم — نستخدم نماذج مفتوحة المصدر بواجهات مجانية بلا مفاتيح API وبلا حدود يومية وبلا علامات مائية على النتائج.",
                "Yes — we use open-source models through free endpoints with no API keys, no daily limits and no watermarks on the results."
              ),
            },
            {
              q: t("لماذا تسجيل الشاشة ينزّل تلقائياً؟", "Why does screen recording download automatically?"),
              a: t(
                "لأن هذه هي اللحظة التي تحتاجها: عند الضغط على «إنهاء» يُغلق المسجّل ويُحفَظ الفيديو بصيغة WebM على جهازك فوراً — تقبلها يوتيوب مباشرة.",
                "Because that's the moment you need it: pressing “Finish” closes the recorder and saves the WebM video to your device immediately — YouTube accepts it directly."
              ),
            },
            {
              q: t("كيف يعمل التصدير السحابي لمحرر الفيديو؟", "How does the video editor's cloud export work?"),
              a: t(
                "المحرر يعمل محلياً ومجاناً بالكامل. إن أردت MP4 من سحابة احترافية، اربط مفتاح Shotstack المجاني (20 دقيقة رندر شهرياً) — يُرسل مخططك الزمني ويعود رابط MP4.",
                "The editor is fully local and free. If you want MP4 from a professional cloud, connect a free Shotstack key (20 render minutes/month) — your timeline is sent and an MP4 link comes back."
              ),
            },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <details className="ft-acc card group overflow-hidden">
                <summary className="font-display flex items-center justify-between gap-3 px-5 py-4 text-sm font-bold transition-colors hover:bg-surface2">
                  {f.q}
                  <span className="acc-chev shrink-0 c-muted"><Icon name="chevron" size={17} /></span>
                </summary>
                <p className="c-muted border-t bd-line px-5 py-4 text-sm leading-loose">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== دعوة أخيرة ===== */}
      <section className="mx-auto max-w-6xl px-4 pt-20">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bd-line p-8 sm:flex-row sm:items-center sm:p-10" style={{ background: "var(--surface)" }}>
            <div>
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                {t("ابدأ بملفك — لا بحساب بريد", "Start with your file — not an email address")}
              </h2>
              <p className="c-muted mt-2 max-w-xl text-sm leading-relaxed">
                {t("اختر أداة من القائمة أعلاه، أو اسحب ملفك في لوحة التجربة وسنوجّهك للأداة الصحيحة.", "Pick a tool from the menu above, or drop your file into the try-panel and we'll route you to the right one.")}
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link to="/tools" className="btn btn-teal !px-6 !py-3">
                <Icon name="sparkle" size={17} />
                {t("كل الأدوات", "All tools")}
              </Link>
              <Link to="/about" className="btn btn-ghost !px-5 !py-3">{t("من نحن", "About")}</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
