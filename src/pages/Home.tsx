import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { TOOLS, IMAGE_TOOLS, PDF_TOOLS, VIDEO_TOOLS, AI_TOOLS, getTool, type ToolDef } from "../data/tools";
import { Link } from "../lib/router";
import { getProcessedCount, matchesQuery, copyText, showToast } from "../lib/utils";
import { Icon, type IconName } from "../components/Icons";
import { ToolCard } from "../components/ToolCard";
import { Reveal } from "../components/Reveal";
import { SectionHead } from "../components/bits";

/* ===== عدّاد متحرك ===== */
function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
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
      <span ref={ref} className="font-display text-2xl font-bold sm:text-3xl" dir="ltr">
        {val.toLocaleString("en")}
        {suffix}
      </span>
      <p className="c-muted mt-0.5 text-xs">{label}</p>
    </div>
  );
}

/* ===== المشهد الحي: بطاقات ملفات تُعالج ===== */
const LIVE_JOBS = [
  { file: "photo.jpg", task: "ضغط الصور", color: "#0c7a63", icon: "image" as IconName },
  { file: "clip.mp4", task: "تكبير إلى 4K", color: "#1e7ec2", icon: "video" as IconName },
  { file: "report.pdf", task: "دمج ملفات PDF", color: "#e0762e", icon: "merge" as IconName },
  { file: "idea.txt", task: "توليد فيديو AI", color: "#c77a06", icon: "film" as IconName },
  { file: "scan.pdf", task: "استخراج الصور", color: "#9c4040", icon: "extract" as IconName },
  { file: "shot.png", task: "إزالة العلامة المائية", color: "#2f7d5c", icon: "eraser" as IconName },
];

function LiveStack() {
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
      <div className="anim-float absolute -top-2 start-2 w-40 rotate-6 rounded-xl border bd-line bg-surface p-3 shadow-lg" style={{ "--rot": "6deg" } as CSSProperties}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--red-soft)] c-red"><Icon name="pdf" size={17} /></span>
          <div>
            <p className="font-mono text-[10px] font-semibold" dir="ltr">report.pdf</p>
            <p className="c-muted text-[9px]" dir="ltr">2.4 MB</p>
          </div>
        </div>
      </div>
      <div className="anim-float absolute bottom-4 end-0 w-36 -rotate-6 rounded-xl border bd-line bg-surface p-3 shadow-lg" style={{ "--rot": "-6deg", animationDelay: "1.2s" } as CSSProperties}>
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--teal-soft)] c-teal"><Icon name="image" size={17} /></span>
          <div>
            <p className="font-mono text-[10px] font-semibold" dir="ltr">logo.png</p>
            <p className="c-muted text-[9px]" dir="ltr">840 KB</p>
          </div>
        </div>
      </div>

      {/* البطاقة النشطة */}
      <div className="relative w-64 rounded-2xl border bd-line bg-surface p-5 shadow-xl" key={job}>
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
      <span className="anim-float absolute -top-5 end-6 flex items-center gap-1.5 rounded-full border bd-line bg-surface px-3 py-1.5 text-[11px] font-bold shadow-md" style={{ animationDelay: "0.6s" }}>
        <span className="c-teal"><Icon name="shield" size={13} /></span>
        100% محلي
      </span>
      <span className="anim-float absolute bottom-10 -start-2 flex items-center gap-1.5 rounded-full border bd-line bg-surface px-3 py-1.5 text-[11px] font-bold shadow-md" style={{ animationDelay: "1.8s" }}>
        <span className="c-amber"><Icon name="bolt" size={13} /></span>
        <span dir="ltr">−72%</span> حجم
      </span>
    </div>
  );
}

/* ===== الصفحة الرئيسية ===== */
export default function Home({ query, focusSearch, scrollToTools }: { query: string; focusSearch: boolean; scrollToTools: boolean }) {
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

  /* اختصار "/" للبحث */
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
        ? TOOLS.filter((t) => matchesQuery(`${t.name} ${t.short} ${t.keywords} ${t.badge}`, q))
        : [],
    [q]
  );

  const searching = q.trim().length > 0;

  const QUICK = ["compress-image", "ai-video", "photo-editor", "upscale-video"]
    .map((s) => getTool(s))
    .filter((t): t is ToolDef => !!t);

  return (
    <main>
      {/* ===== الافتتاحية ===== */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:pt-16 lg:grid-cols-[1.12fr_0.88fr]">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border bd-line bg-surface px-3.5 py-1.5 text-xs font-semibold">
              <span className="anim-pulse-soft inline-block h-2 w-2 rounded-full" style={{ background: "var(--teal)" }} />
              ١٥ أداة مجانية · ذكاء اصطناعي · بدون تسجيل · ملفاتك لا تغادر جهازك
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="font-display mt-5 text-4xl font-extrabold leading-[1.15] sm:text-5xl lg:text-[3.4rem]">
              كل أدوات ملفاتك…
              <br />
              <span className="relative inline-block c-teal">
                داخل متصفحك
                <svg className="absolute -bottom-2 start-0 w-full" viewBox="0 0 220 14" fill="none" aria-hidden="true">
                  <path
                    d="M4 10 C60 2, 150 2, 216 8"
                    stroke="var(--amber)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1}
                    style={{ transition: "stroke-dashoffset 1.1s ease 0.7s" }}
                    className="underline-draw"
                  />
                </svg>
              </span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="c-muted mt-6 max-w-xl text-base leading-relaxed sm:text-lg">
              اضغط صورك وكبّرها، أزل العلامات المائية، حرّر صورك كمحترف، ادمج ملفات PDF — بل
              و<b className="text-[var(--ink)]">ولّد صوراً وفيديوهات بالذكاء الاصطناعي بالعربية</b>.
              بسرعة المواقع الكبرى وخصوصية لا تضاهى: المعالجة كلها على جهازك، ولا يُرفع أي ملف.
            </p>
          </Reveal>

          {/* البحث */}
          <Reveal delay={260}>
            <div className="relative mt-7 max-w-xl">
              <span className="absolute inset-y-0 start-4 grid place-items-center c-muted">
                <Icon name="search" size={19} />
              </span>
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ما الذي تريد فعله؟ جرّب: ضغط، دمج، webp…"
                className="input !rounded-2xl !border-2 !py-3.5 !pe-14 !ps-11 !text-[15px]"
                aria-label="ابحث عن أداة"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute inset-y-0 end-4 grid place-items-center c-muted hover:text-[var(--red)]"
                  aria-label="مسح البحث"
                >
                  <Icon name="close" size={17} />
                </button>
              ) : (
                <kbd className="font-mono absolute inset-y-0 end-4 my-auto h-fit rounded-lg border bd-line bg-surface2 px-2 py-1 text-[11px] c-muted">/</kbd>
              )}
            </div>
          </Reveal>

          <Reveal delay={330}>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="c-muted text-xs">الأكثر استخداماً:</span>
              {QUICK.map((t) => (
                <Link key={t.slug} to={`/tool/${t.slug}`} className="chip">
                  <span style={{ color: t.color }}><Icon name={t.icon} size={13} /></span>
                  {t.name}
                </Link>
              ))}
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t bd-line pt-6">
              <Counter to={Math.max(processed, 0)} label={`ملفاً عولج على هذا الجهاز${processed === 0 ? " (ابدأ الآن!)" : ""}`} />
              <Counter to={TOOLS.length} label="أداة متخصصة" />
              <Counter to={0} label="ملفات رُفعت لخوادم" />
            </div>
          </Reveal>
        </div>

        <Reveal delay={200} className="hidden lg:block">
          <LiveStack />
        </Reveal>
      </section>

      {/* ===== شريط الصيغ المتحرك ===== */}
      <div className="marquee overflow-hidden border-y bd-line py-3" style={{ background: "var(--surface)", direction: "ltr" }} aria-hidden="true">
        <div className="marquee-track items-center gap-8">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-8">
              {["JPG", "PNG", "WEBP", "PDF", "MP4", "WEBM", "4K", "AI", "FLUX", "GIF", "SVG", "A4", "ZIP", "BBCode", "Markdown", "HTML"].map((f) => (
                <span key={`${dup}-${f}`} className="flex items-center gap-8">
                  <span className="font-mono text-sm font-semibold tracking-widest c-muted">{f}</span>
                  <span className="c-amber"><Icon name="sparkle" size={13} /></span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===== شبكة الأدوات ===== */}
      <section ref={toolsRef} className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-14">
        {searching ? (
          <div>
            <SectionHead
              kicker={`${filtered.length} نتيجة`}
              title={filtered.length ? `نتائج البحث عن «${q.trim()}»` : "لا توجد نتائج"}
              icon="search"
            />
            {filtered.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((t, i) => (
                  <ToolCard key={t.slug} tool={t} delay={i * 60} />
                ))}
              </div>
            ) : (
              <div className="card flex flex-col items-center gap-3 p-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--amber-soft)] c-amber">
                  <Icon name="search" size={26} />
                </span>
                <p className="font-display text-lg font-bold">لم نجد أداة تطابق «{q.trim()}»</p>
                <p className="c-muted max-w-md text-sm">
                  جرّب كلمات مثل: ضغط، تحويل، دمج، استخراج، رابط — أو تصفح كل الأدوات بالأسفل.
                </p>
                <button type="button" onClick={() => setQ("")} className="btn btn-ghost mt-2">
                  <Icon name="close" size={15} />
                  مسح البحث
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div id="image-tools">
              <SectionHead
                kicker="قسم الصور"
                title="أدوات الصور"
                desc="كل ما تحتاجه لصورك: ضغط ذكي، تغيير أبعاد، تحويل صيغ، وروابط مشاركة مباشرة."
                icon="image"
                color="var(--teal)"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {IMAGE_TOOLS.map((t, i) => (
                  <ToolCard key={t.slug} tool={t} delay={i * 70} />
                ))}
              </div>
            </div>

            <div id="pdf-tools" className="mt-14">
              <SectionHead
                kicker="قسم ملفات PDF"
                title="أدوات PDF"
                desc="ضغط ودمج وتحويل واستخراج — بمحرك pdf-lib يعمل بالكامل داخل متصفحك."
                icon="pdf"
                color="var(--red)"
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PDF_TOOLS.map((t, i) => (
                  <ToolCard key={t.slug} tool={t} delay={i * 70} />
                ))}
              </div>
            </div>

            <div id="video-tools" className="mt-14">
              <SectionHead
                kicker="قسم الفيديو — جديد"
                title="أدوات الفيديو"
                desc="تكبير الدقة وإزالة العلامات المائية — إعادة ترميز إطارية كاملة داخل متصفحك مع الحفاظ على الصوت."
                icon="video"
                color="var(--blue)"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {VIDEO_TOOLS.map((t, i) => (
                  <ToolCard key={t.slug} tool={t} delay={i * 70} />
                ))}
              </div>
            </div>

            <div id="ai-tools" className="mt-14">
              <SectionHead
                kicker="قسم الذكاء الاصطناعي — جديد"
                title="التوليد بالذكاء الاصطناعي"
                desc="صور احترافية وفيديوهات يوتيوب كاملة بالسيناريو العربي — بلا حدود، بلا علامات مائية، ومجاني للأبد."
                icon="ai"
                color="var(--amber)"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {AI_TOOLS.map((t, i) => (
                  <ToolCard key={t.slug} tool={t} delay={i * 70} />
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ===== كيف يعمل — عمودان أحدهما لاصق ===== */}
      <section className="mx-auto mt-24 max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <p className="font-display flex items-center gap-2 text-sm font-semibold c-amber">
                <Icon name="bolt" size={16} />
                كيف يعمل FileTools؟
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold leading-snug sm:text-4xl">
                ثلاث خطوات.
                <br />
                <span className="c-teal">صفر خوادم.</span>
              </h2>
              <p className="c-muted mt-4 max-w-md leading-relaxed">
                على عكس المواقع الأخرى التي ترفع ملفاتك لمعالجتها ثم تحذفها «بعد ساعتين» — نحن لا
                نراها أصلاً. مكتبات المعالجة تعمل داخل صفحة المتصفح نفسها.
              </p>
              <div className="mt-6 inline-flex items-center gap-2.5 rounded-xl border bd-line bg-surface px-4 py-3 text-sm font-semibold">
                <span className="c-teal"><Icon name="shield" size={19} /></span>
                حتى لو انقطع الإنترنت منتصف المعالجة — ملفاتك بأمان عندك
              </div>
            </Reveal>
          </div>

          <div className="space-y-5">
            {[
              {
                n: "٠١",
                icon: "upload" as IconName,
                color: "var(--teal)",
                title: "أضف ملفاتك",
                desc: "اسحب وأفلت أو الصق من الحافظة مباشرة. نقبل الدفعات المتعددة في معظم الأدوات، وتُقرأ أبعاد الصور وعدد صفحات PDF تلقائياً.",
              },
              {
                n: "٠٢",
                icon: "code" as IconName,
                color: "var(--amber)",
                title: "المعالجة تحدث عندك",
                desc: "تعمل محركات الضغط والتحويل (Canvas API وpdf-lib وpako) داخل متصفحك عبر Web Workers — لذلك السرعة تعتمد على جهازك فقط، ولا طوابير انتظار.",
              },
              {
                n: "٠٣",
                icon: "download" as IconName,
                color: "var(--red)",
                title: "حمّل أو شارك",
                desc: "حمّل كل نتيجة منفردة أو كملف ZIP واحد، أو انسخ روابط مشاركة جاهزة بصيغ HTML وMarkdown وBBCode.",
              },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 110}>
                <div className="card group flex gap-5 p-6 transition-transform duration-300 hover:-translate-y-1">
                  <span className="font-display text-4xl font-extrabold opacity-15 transition-opacity duration-300 group-hover:opacity-35" style={{ color: s.color }}>
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-display flex items-center gap-2 text-lg font-bold">
                      <span style={{ color: s.color }}><Icon name={s.icon} size={19} /></span>
                      {s.title}
                    </h3>
                    <p className="c-muted mt-2 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== لماذا FileTools — شبكة غير متماثلة ===== */}
      <section className="mx-auto mt-24 max-w-6xl px-4">
        <SectionHead
          kicker="لماذا نحن؟"
          title="مصمم ليكون الأداة الوحيدة التي تحتاجها"
          icon="sparkle"
          color="var(--amber)"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <div className="card group h-full p-7 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-md">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--teal-soft)] c-teal">
                    <Icon name="shield" size={24} />
                  </span>
                  <h3 className="font-display mt-4 text-xl font-bold">خصوصية مضمونة بالتصميم — لا بالوعود</h3>
                  <p className="c-muted mt-2 text-sm leading-relaxed">
                    لا نستطيع الاطلاع على ملفاتك حتى لو أردنا: المعالجة محلية بالكامل، ولا توجد
                    خوادم معالجة ولا قواعد بيانات ملفات. عقدك الطبي أو صورك الشخصية تبقى عندك. نقطة.
                  </p>
                </div>
                <div className="rounded-xl border bd-line bg-surface2 p-4 font-mono text-xs leading-loose" dir="ltr">
                  <p><span className="c-red">const</span> file = <span className="c-teal">yourDevice</span>;</p>
                  <p><span className="c-red">await</span> process(file); <span className="c-muted">// in-browser</span></p>
                  <p><span className="c-red">return</span> result; <span className="c-muted">// zero uploads</span></p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="card h-full p-7 transition-transform duration-300 hover:-translate-y-1">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--amber-soft)] c-amber">
                <Icon name="bolt" size={24} />
              </span>
              <h3 className="font-display mt-4 text-xl font-bold">سريع لأنه مباشر</h3>
              <p className="c-muted mt-2 text-sm leading-relaxed">
                لا وقت رفع، لا طابور معالجة، لا انتظار روابط تحميل. النتيجة تظهر بمجرد اكتمال
                المعالجة على جهازك.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="card h-full p-7 transition-transform duration-300 hover:-translate-y-1">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--red-soft)] c-red">
                <Icon name="heart" size={24} />
              </span>
              <h3 className="font-display mt-4 text-xl font-bold">مجاني. بلا حدود خفية</h3>
              <p className="c-muted mt-2 text-sm leading-relaxed">
                لا خطة «برو»، لا حد يومي، لا علامة مائية على نتائجك. كل الأدوات مفتوحة لكل الزوار.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100} className="md:col-span-2">
            <div className="card h-full p-7 transition-transform duration-300 hover:-translate-y-1">
              <div className="flex flex-wrap items-center gap-6">
                <div className="max-w-md">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--teal-soft)] c-teal">
                    <Icon name="device" size={24} />
                  </span>
                  <h3 className="font-display mt-4 text-xl font-bold">هاتف، جهاز لوحي، حاسوب</h3>
                  <p className="c-muted mt-2 text-sm leading-relaxed">
                    واجهة متجاوبة بالكامل مع دعم كامل للمس والسحب والإفلات، ووضعين فاتح وليلي
                    يتذكران تفضيلك. إن كان متصفحك حديثاً — فنحن نعمل.
                  </p>
                </div>
                <div className="flex flex-1 flex-wrap justify-center gap-2">
                  {["React", "Vite", "Tailwind CSS", "pdf-lib", "pako", "Canvas API", "Web Workers"].map((tch) => (
                    <span key={tch} className="font-mono chip !cursor-default !text-[11px]" dir="ltr">
                      {tch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== الأسئلة الشائعة ===== */}
      <section className="mx-auto mt-24 max-w-3xl px-4">
        <SectionHead
          kicker="أسئلة شائعة"
          title="كل ما تريد معرفته"
          icon="info"
        />
        <div className="space-y-3">
          {[
            {
              q: "هل تُرفع ملفاتي إلى خوادمكم؟",
              a: "لا، إطلاقاً. كل أدوات الضغط والتحويل والدمج والاستخراج تعمل داخل متصفحك عبر مكتبات JavaScript (pdf-lib وCanvas API). يمكنك التحقق بنفسك: افصل الإنترنت بعد فتح الموقع وستعمل الأدوات بشكل طبيعي.",
            },
            {
              q: "هل الخدمة مجانية فعلاً؟ أين الخدعة؟",
              a: "مجانية 100% وبلا حدود. لأن المعالجة تحدث على أجهزتكم فلا نتحمل تكاليف خوادم معالجة، ونموذج الاستدامة الوحيد هو الإعلانات غير المتطفلة مستقبلاً — ولن تكون على حساب ملفاتكم أبداً.",
            },
            {
              q: "ما الحد الأقصى لحجم الملفات؟",
              a: "الحد هو ذاكرة جهازك عملياً. صور حتى عشرات الميغابايت وملفات PDF حتى ~100MB تعمل عادة بسلاسة. للملفات الضخمة جداً ننصح بإغلاق التبويبات الأخرى لتوفير الذاكرة.",
            },
            {
              q: "كم يبقى رابط الصورة المباشر صالحاً؟",
              a: "الرابط المحلي يعمل خلال جلسة متصفحك الحالية. رابط النشر العام المؤقت (عبر خدمة مجانية) صالح لفترة محدودة قد تنتهي — لرابط دائم يمكنك تشغيل الخادم المرفق مجاناً مع خطة Supabase المجانية (التعليمات في مجلد server).",
            },
            {
              q: "لماذا لم يتغير حجم ملف PDF كثيراً بعد الضغط؟",
              a: "الملفات النصية البحتة مضغوطة أصلاً داخل صيغة PDF، لذا يكون التوفير فيها محدوداً. أفضل النتائج مع الملفات التي تضم صوراً ممسوحة أو لقطات شاشة — حيث يعيد محركنا ترميز الصور بجودة أقل وحجم أصغر بكثير.",
            },
            {
              q: "هل تدعمون اللغة العربية داخل ملفات PDF؟",
              a: "نعم — أدوات الدمج والتحويل والاستخراج تنقل المحتوى كما هو دون إعادة ترميز النص، لذا تبقى النصوص العربية سليمة تماماً في الملف الناتج.",
            },
          ].map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="ft-acc card group px-5 py-4" open={i === 0}>
                <summary className="flex items-center justify-between gap-3">
                  <span className="font-display text-[15px] font-bold">{f.q}</span>
                  <span className="acc-chev c-muted shrink-0">
                    <Icon name="chevron" size={18} />
                  </span>
                </summary>
                <p className="c-muted mt-3 border-t bd-line pt-3 text-sm leading-relaxed">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== نداء أخير ===== */}
      <section className="mx-auto mt-24 max-w-6xl px-4">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl border bd-line p-8 text-center sm:p-14"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--teal) 10%, var(--surface)), var(--surface) 55%, color-mix(in srgb, var(--amber) 12%, var(--surface)))",
            }}
          >
            <span className="pointer-events-none absolute -top-8 start-8 opacity-10" style={{ color: "var(--teal)" }}>
              <Icon name="image" size={120} />
            </span>
            <span className="pointer-events-none absolute -bottom-8 end-8 opacity-10" style={{ color: "var(--red)" }}>
              <Icon name="pdf" size={120} />
            </span>
            <h2 className="font-display relative mx-auto max-w-2xl text-3xl font-extrabold leading-snug sm:text-4xl">
              جاهز تبدأ؟ ملفاتك <span className="c-teal">لن تغادر جهازك</span> — والنتيجة خلال ثوانٍ
            </h2>
            <p className="c-muted relative mx-auto mt-3 max-w-xl text-sm sm:text-base">
              اختر أداة من الشبكة أعلاه، أو شارك الموقع مع من يحتاجه — كل أداة تستحق أن يعرفها الجميع.
            </p>
            <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => toolsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="btn btn-teal !px-6 !py-3 !text-base"
              >
                <Icon name="sparkle" size={18} />
                تصفح الأدوات
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText("https://filetools.app/");
                  if (ok) showToast("تم نسخ الرابط — شاركه مع من تحب");
                }}
                className="btn btn-ghost !px-6 !py-3 !text-base"
              >
                <Icon name="link" size={18} />
                شارك الموقع
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="h-6" />
    </main>
  );
}
