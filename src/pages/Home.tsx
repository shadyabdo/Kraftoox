import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { TOOLS, IMAGE_TOOLS, PDF_TOOLS, VIDEO_TOOLS, DEVELOPER_TOOLS, TEXT_TOOLS, CONVERTER_TOOLS, getTool, type ToolDef } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { getProcessedCount, matchesQuery, copyText, showToast } from "../lib/utils";
import { Icon } from "../components/Icons";
import { ToolCard } from "../components/ToolCard";
import { Reveal } from "../components/Reveal";
import { SectionHead } from "../components/bits";

/* ===== عدّاد متحرك ===== */
export function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || to === 0) {
      setVal(to);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1100;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <div className="text-center sm:text-start">
      <span ref={ref} className="editorial-title gradient-text" dir="ltr">
        {val.toLocaleString("en")}
        {suffix}
      </span>
      <p className="c-muted mt-2 text-sm font-medium">{label}</p>
    </div>
  );
}

/* ===== المشهد الحي: بطاقات ملفات تُعالج ===== */
const LIVE_JOBS = [
  { file: "photo.jpg", task: "ضغط الصور", color: "#c8a460", icon: "image" as const },
  { file: "clip.mp4", task: "تنزيل يوتيوب", color: "#c04040", icon: "download" as const },
  { file: "report.pdf", task: "دمج ملفات PDF", color: "#3f6f57", icon: "merge" as const },
  { file: "idea.txt", task: "ترجمة AI", color: "#c8a460", icon: "ai" as const },
  { file: "scan.pdf", task: "استخراج الصور", color: "#96403f", icon: "extract" as const },
  { file: "shot.png", task: "إزالة العلامة المائية", color: "#3f6f57", icon: "eraser" as const },
];

export function LiveStack() {
  const [job, setJob] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const timers: number[] = [];
    const cycle = () => {
      if (cancelled) return;
      setDone(false);
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setDone(true);
          timers.push(
            window.setTimeout(() => {
              if (cancelled) return;
              setJob((j) => (j + 1) % LIVE_JOBS.length);
              cycle();
            }, 1300)
          );
        }, 2100)
      );
    };
    cycle();
    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const active = LIVE_JOBS[job];

  return (
    <div className="relative mx-auto flex h-72 w-full max-w-sm items-center justify-center sm:h-80" aria-hidden="true">
      {/* بطاقات الخلفية */}
      <div className="anim-float absolute -top-2 start-2 w-40 rotate-6 rounded-xl glass p-3" style={{ "--rot": "6deg" } as CSSProperties}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--red-soft)] c-red"><Icon name="pdf" size={17} /></span>
          <div>
            <p className="font-mono text-[10px] font-semibold" dir="ltr">report.pdf</p>
            <p className="c-muted text-[9px]" dir="ltr">2.4 MB</p>
          </div>
        </div>
      </div>
      <div className="anim-float absolute bottom-4 end-0 w-36 -rotate-6 rounded-xl glass p-3" style={{ "--rot": "-6deg", animationDelay: "1.2s" } as CSSProperties}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--teal-soft)] c-teal"><Icon name="image" size={17} /></span>
          <div>
            <p className="font-mono text-[10px] font-semibold" dir="ltr">logo.png</p>
            <p className="c-muted text-[9px]" dir="ltr">840 KB</p>
          </div>
        </div>
      </div>

      {/* البطاقة النشطة */}
      <div className="relative w-64 rounded-2xl glass p-5 shadow-2xl" key={job}>
        <div className="anim-pop flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${active.color} 13%, transparent)`, color: active.color }}>
            <Icon name={active.icon} size={22} />
          </span>
          <div className="min-w-0">
            <p className="font-mono truncate text-xs font-semibold" dir="ltr">{active.file}</p>
            <p className="c-muted text-[11px]">{active.task}…</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full"
            style={{
              background: active.color,
              animation: done ? "none" : "ft-bar 2s ease-in-out forwards",
              width: done ? "100%" : undefined,
            }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-[10px] c-muted" dir="ltr">{done ? "100%" : "processing…"}</span>
          {done && (
            <span className="anim-pop c-teal flex items-center gap-1 text-[11px] font-bold">
              <Icon name="check" size={13} />
              اكتمل
            </span>
          )}
        </div>
      </div>

      {/* شارات عائمة */}
      <span className="anim-float absolute -top-5 end-6 flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[11px] font-bold" style={{ animationDelay: "0.6s" }}>
        <span className="c-teal"><Icon name="shield" size={13} /></span>
        100% محلي
      </span>
      <span className="anim-float absolute bottom-10 -start-2 flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-[11px] font-bold" style={{ animationDelay: "1.8s" }}>
        <span className="c-amber"><Icon name="bolt" size={13} /></span>
        <span dir="ltr">−72%</span> حجم
      </span>
    </div>
  );
}

/* ===== Bento Grid للأقسام ===== */
function BentoSections() {
  const { isAr } = useI18n();
  
  const sections = [
    {
      id: "image",
      tools: IMAGE_TOOLS,
      icon: "image" as const,
      color: "var(--teal)",
      name: isAr ? "أدوات الصور" : "Image Tools",
      desc: isAr ? "ضغط، تحويل، تكبير" : "Compress, convert, upscale",
    },
    {
      id: "pdf",
      tools: PDF_TOOLS,
      icon: "pdf" as const,
      color: "var(--red)",
      name: isAr ? "أدوات PDF" : "PDF Tools",
      desc: isAr ? "ضغط، دمج، تحويل، استخراج" : "Compress, merge, convert, extract",
    },
    {
      id: "video",
      tools: VIDEO_TOOLS,
      icon: "download" as const,
      color: "var(--red)",
      name: isAr ? "تنزيل يوتيوب" : "YouTube Downloader",
      desc: isAr ? "فيديو وصوت بجودات متعددة" : "Video & audio in multiple qualities",
    },
    {
      id: "developer",
      tools: DEVELOPER_TOOLS,
      icon: "code" as const,
      color: "#10b981",
      name: isAr ? "أدوات المطورين" : "Developer Tools",
      desc: isAr ? "JSON, Base64, Hash, Password, UUID" : "JSON, Base64, Hash, Password, UUID",
    },
    {
      id: "text",
      tools: TEXT_TOOLS,
      icon: "type" as const,
      color: "#8b5cf6",
      name: isAr ? "أدوات النصوص" : "Text Tools",
      desc: isAr ? "عداد كلمات، تحويل حالة، Lorem Ipsum" : "Word counter, case converter, Lorem Ipsum",
    },
    {
      id: "converter",
      tools: CONVERTER_TOOLS,
      icon: "convert" as const,
      color: "#f59e0b",
      name: isAr ? "أدوات التحويل" : "Converter Tools",
      desc: isAr ? "ألوان، أنظمة عددية" : "Colors, number bases",
    },
    {
      id: "ai",
      tools: [getTool("image-translator")!].filter(Boolean),
      icon: "ai" as const,
      color: "var(--teal)",
      name: isAr ? "ذكاء اصطناعي" : "AI Tools",
      desc: isAr ? "ترجمة صور بالذكاء الاصطناعي" : "AI image translation",
    },
  ];

  return (
    <div className="bento bento-2">
      {sections.map((section, i) => (
        <Reveal key={section.id} delay={i * 80} className={i === 0 || i === 3 ? "bento-span-2" : ""}>
          <Link
            to={`/${section.id === "ai" ? "tools" : section.id === "image" ? "images" : section.id}`}
            className="card group relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden p-8"
          >
            {/* خلفية متدرجة */}
            <div
              className="absolute inset-0 opacity-5 transition-opacity duration-500 group-hover:opacity-10"
              style={{ background: `radial-gradient(circle at 50% 0%, ${section.color}, transparent 70%)` }}
            />
            
            {/* المحتوى */}
            <div className="relative z-10">
              <div className="mb-6 flex items-start justify-between">
                <span
                  className="grid h-16 w-16 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
                  style={{ background: `color-mix(in srgb, ${section.color} 15%, var(--surface))`, color: section.color }}
                >
                  <Icon name={section.icon} size={32} />
                </span>
                <span className="font-mono text-xs font-bold opacity-50" dir="ltr">
                  {String(section.tools.length).padStart(2, "0")} {isAr ? "أدوات" : "TOOLS"}
                </span>
              </div>
              
              <h3 className="editorial-subtitle font-bold mb-3">{section.name}</h3>
              <p className="c-muted text-sm leading-relaxed">{section.desc}</p>
            </div>
            
            {/* قائمة الأدوات */}
            <div className="relative z-10 mt-6 flex flex-wrap gap-2">
              {section.tools.slice(0, 4).map((tool) => (
                <span key={tool.slug} className="chip !text-xs">
                  {isAr ? tool.name : tool.nameEn}
                </span>
              ))}
              {section.tools.length > 4 && (
                <span className="chip !text-xs opacity-60">+{section.tools.length - 4}</span>
              )}
            </div>
            
            {/* سهم */}
            <div className="absolute bottom-8 end-8 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-x-2">
              <Icon name="arrow" size={24} style={{ color: section.color }} />
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

/* ===== الصفحة الرئيسية ===== */
export default function Home({ query, focusSearch, scrollToTools }: { query: string; focusSearch: boolean; scrollToTools: boolean }) {
  const { isAr, t } = useI18n();
  const [q, setQ] = useState(query);
  const [processed, setProcessed] = useState(getProcessedCount());
  const searchRef = useRef<HTMLInputElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQ(query), [query]);

  useEffect(() => {
    if (focusSearch) setTimeout(() => searchRef.current?.focus(), 120);
  }, [focusSearch]);

  useEffect(() => {
    if (scrollToTools) setTimeout(() => toolsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, [scrollToTools]);

  useEffect(() => {
    const onCount = () => setProcessed(getProcessedCount());
    window.addEventListener("ft:count", onCount);
    return () => window.removeEventListener("ft:count", onCount);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(
    () =>
      q.trim()
        ? TOOLS.filter((t) => matchesQuery(`${t.name} ${t.nameEn} ${t.short} ${t.shortEn} ${t.keywords} ${t.keywordsEn} ${t.badge} ${t.badgeEn}`, q))
        : [],
    [q]
  );

  const searching = q.trim().length > 0;

  const QUICK = ["compress-image", "youtube-downloader", "photo-editor", "image-translator"]
    .map((s) => getTool(s))
    .filter((t): t is ToolDef => !!t);

  return (
    <main className="noise">
      {/* ===== Hero Section ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <p className="kicker c-teal mb-6">
                {isAr ? "ورشة ملفات احترافية" : "Professional File Workshop"}
              </p>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="editorial-title mb-6">
                <span className="gradient-text">{isAr ? "كل أدواتك" : "All Your Tools"}</span>
                <br />
                <span className="c-muted">{isAr ? "في مكان واحد" : "In One Place"}</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="editorial-subtitle c-muted mb-8 max-w-2xl">
                {isAr
                  ? "ضغط صور، تحرير فيديو، تنزيل يوتيوب، ترجمة AI — كل ذلك داخل متصفحك بدون رفع ملفاتك."
                  : "Image compression, video editing, YouTube downloading, AI translation — all in your browser without uploading your files."}
              </p>
            </Reveal>

            {/* البحث */}
            <Reveal delay={240}>
              <form
                className="relative mb-8 max-w-xl"
                onSubmit={(e) => {
                  e.preventDefault();
                  toolsRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="absolute inset-y-0 start-4 grid place-items-center c-muted">
                  <Icon name="search" size={20} />
                </span>
                <input
                  ref={searchRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={isAr ? "ابحث عن أداة… (اضغط /)" : "Search for a tool… (press /)"}
                  className="input !rounded-2xl !border-2 !py-4 !ps-12 !pe-4 !text-base"
                  aria-label={isAr ? "ابحث عن أداة" : "Search for a tool"}
                />
              </form>
            </Reveal>

            <Reveal delay={320}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-semibold c-muted">{isAr ? "الأكثر استخداماً:" : "Most used:"}</span>
                {QUICK.map((t) => (
                  <Link key={t.slug} to={`/tool/${t.slug}`} className="chip !text-sm">
                    <span style={{ color: t.color }}><Icon name={t.icon} size={14} /></span>
                    {isAr ? t.name : t.nameEn}
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={200}>
            <LiveStack />
          </Reveal>
        </div>

        {/* إحصائيات */}
        <Reveal delay={400}>
          <div className="mt-20 grid grid-cols-3 gap-8 border-t bd-line pt-12">
            <Counter to={TOOLS.length} label={isAr ? "أداة متخصصة" : "Specialized Tools"} />
            <Counter to={Math.max(processed, 0)} label={isAr ? "ملف تمت معالجته" : "Files Processed"} />
            <Counter to={0} label={isAr ? "ملفات رُفعت لخوادم" : "Files Uploaded to Servers"} />
          </div>
        </Reveal>
      </section>

      {/* ===== Bento Grid للأقسام ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <Reveal>
          <div className="mb-12 text-center">
            <p className="kicker c-amber mb-4">{isAr ? "أقسام الورشة" : "Workshop Sections"}</p>
            <h2 className="editorial-subtitle font-bold">
              {isAr ? "أربع ورش تحت سقف واحد" : "Four Workshops, One Roof"}
            </h2>
          </div>
        </Reveal>
        <BentoSections />
      </section>

      {/* ===== كيف يعمل ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <Reveal>
          <div className="mb-12 text-center">
            <p className="kicker c-teal mb-4">{isAr ? "المعمارية" : "Architecture"}</p>
            <h2 className="editorial-subtitle font-bold">
              {isAr ? "ثلاث خطوات بسيطة" : "Three Simple Steps"}
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              icon: "upload" as const,
              color: "var(--teal)",
              title: isAr ? "اختر ملفك" : "Pick Your File",
              desc: isAr ? "بلا حساب ولا تسجيل — الملف يُقرأ من جهازك مباشرة." : "No account, no sign-up — the file is read straight from your device.",
            },
            {
              n: "02",
              icon: "code" as const,
              color: "var(--amber)",
              title: isAr ? "المعالجة محلياً" : "Local Processing",
              desc: isAr ? "كل بايت يُعالَج في متصفحك، وقطع الإنترنت لا يوقف العمل." : "Every byte is processed in your browser; cutting the internet doesn't stop the work.",
            },
            {
              n: "03",
              icon: "download" as const,
              color: "var(--red)",
              title: isAr ? "تنزيل فوري" : "Instant Download",
              desc: isAr ? "روابط تنزيل حقيقية تُنشأ على جهازك. بلا طوابير، بلا علامات مائية." : "Real download links are created on your machine. No queues, no watermarks.",
            },
          ].map((step, i) => (
            <Reveal key={step.n} delay={i * 100}>
              <div className="card group relative h-full p-8">
                <span className="font-mono text-5xl font-bold opacity-10 transition-opacity duration-300 group-hover:opacity-20" style={{ color: step.color }} dir="ltr">
                  {step.n}
                </span>
                <span
                  className="mt-4 grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `color-mix(in srgb, ${step.color} 15%, var(--surface))`, color: step.color }}
                >
                  <Icon name={step.icon} size={28} />
                </span>
                <h3 className="editorial-subtitle mt-4 font-bold">{step.title}</h3>
                <p className="c-muted mt-3 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CTA نهائي ===== */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <Reveal>
          <div className="card relative overflow-hidden p-12 text-center sm:p-16">
            <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 50% 50%, var(--teal), transparent 70%)" }} />
            <div className="relative z-10">
              <h2 className="editorial-title mb-6">
                <span className="gradient-text">{isAr ? "ابدأ الآن" : "Start Now"}</span>
              </h2>
              <p className="editorial-subtitle c-muted mb-8 max-w-2xl mx-auto">
                {isAr
                  ? "ملفاتك لا تغادر جهازك. لا تسجيل، لا حدود، لا علامات مائية."
                  : "Your files never leave your device. No sign-up, no limits, no watermarks."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/tools" className="btn btn-teal !px-8 !py-4 !text-lg">
                  <Icon name="sparkle" size={20} />
                  {isAr ? "كل الأدوات" : "All Tools"}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyText("https://kraftoox.app/");
                    if (ok) showToast(isAr ? "تم نسخ الرابط" : "Link copied");
                  }}
                  className="btn btn-ghost !px-8 !py-4 !text-lg"
                >
                  <Icon name="link" size={20} />
                  {isAr ? "شارك الموقع" : "Share Site"}
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
