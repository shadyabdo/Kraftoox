import { useRef, useState, type CSSProperties } from "react";
import { CATEGORIES, TOOLS, toolsOf } from "../data/tools";
import { Link, navigate } from "../lib/router";
import { usePageMeta } from "../lib/seo";
import { Icon } from "../components/Icons";
import { Reveal } from "../components/Reveal";
import { Counter, LiveStack } from "./Home";

const FORMATS = ["JPG", "PNG", "WEBP", "MP4", "WEBM", "PDF", "4K", "AI", "FLUX", "A4", "ZIP", "SVG", "BBCode", "Markdown"];

const QUOTES = [
  {
    text: "ضغطت صور المتجر كلها في دقيقتين، والأهم أن ملفات العملاء لم تغادر جهازي — هذا ما أقنعني.",
    name: "سارة م.",
    role: "صاحبة متجر إلكتروني",
    color: "var(--teal)",
  },
  {
    text: "ولّدت شورتز كاملاً من فكرة واحدة بالعربي. رفعتُه ليوتيوب في نفس الجلسة.",
    name: "أحمد ك.",
    role: "صانع محتوى",
    color: "var(--amber)",
  },
  {
    text: "مسجّل الشاشة مع التنزيل التلقائي وفّر عليّ تثبيت ثلاث برامج على الأقل.",
    name: "ليان ح.",
    role: "مدرّبة تقنية",
    color: "var(--blue)",
  },
];

const FAQS = [
  {
    q: "هل تُرفع ملفاتي إلى خوادمكم؟",
    a: "لا إطلاقاً في أدوات المعالجة (الضغط، التحويل، الدمج، المحرر المحلي، تسجيل الشاشة). المعالجة كلها داخل متصفحك — جرّب قطع الإنترنت بعد تحميل الصفحة وستواصل الأدوات عملها. الاستثناء الوحيد الاختياري هو زر النشر المؤقت في أداة الروابط والرندر السحابي عبر Shotstack الذي يتطلب موافقتك ومفتاحك الخاص.",
  },
  {
    q: "هل توليد الصور والفيديو بالذكاء الاصطناعي مجاني فعلاً؟",
    a: "نعم — نستخدم نماذج مفتوحة المصدر بواجهات مجانية بلا مفاتيح API وبلا حدود يومية وبلا علامات مائية على النتائج. التوليد يستهلك ثوانٍ لكل صورة، والفيديو يُركّب محلياً في متصفحك.",
  },
  {
    q: "كيف يعمل محرر الفيديو السحابي؟",
    a: "المحرر يعمل محلياً ومجاناً بالكامل. وإن أردت تصديراً بصيغة MP4 من سحابة احترافية، اربط مفتاح Shotstack المجاني (20 دقيقة رندر شهرياً) وسيُرسَل المخطط الزمني للخدمة الجاهزة ويرجع لك رابط MP4.",
  },
  {
    q: "ما صيغة تسجيل الشاشة ولماذا يبدأ التنزيل تلقائياً؟",
    a: "التسجيل بصيغة WebM عالية الجودة (تقبلها يوتيوب مباشرة). عند ضغط «إنهاء» يُغلَق المسجّل ويُحفَظ الملف على جهازك فوراً — بدون خطوات إضافية.",
  },
  {
    q: "هل يدعم الموقع اللغة العربية بالكامل؟",
    a: "نعم — الواجهة RTL بالكامل، والذكاء الاصطناعي يكتب سيناريوهات عربية ويولّد صوراً من أوصاف عربية، ومحرر الفيديو يدعم نصوصاً عربية على المقاطع.",
  },
];

export default function Landing() {
  usePageMeta("/");
  const [q, setQ] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const submit = () => navigate(`/tools?q=${encodeURIComponent(q.trim())}`);

  return (
    <main>
      {/* ===== الافتتاحية: ملف يدخل… وأدوات تعمل ===== */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <Reveal>
            <p className="inline-flex flex-wrap items-center gap-2 rounded-full border bd-line bg-surface px-3.5 py-1.5 text-xs font-semibold">
              <span className="anim-pulse-soft inline-block h-2 w-2 rounded-full" style={{ background: "var(--red)" }} />
              {TOOLS.length} أداة مجانية · ذكاء اصطناعي · تسجيل شاشة · محرر فيديو
            </p>
          </Reveal>

          <Reveal delay={90}>
            <h1 className="font-display mt-6 text-[2.6rem] font-extrabold leading-[1.12] sm:text-6xl lg:text-[4.1rem]">
              ملفاتك تحتاج
              <br />
              <span className="relative inline-block c-teal">
                ورشة كاملة
                <svg className="absolute -bottom-2 start-0 w-full" viewBox="0 0 220 14" fill="none" aria-hidden="true">
                  <path
                    d="M4 10 C60 2, 150 2, 216 8"
                    stroke="var(--amber)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1}
                    style={{ transition: "stroke-dashoffset 1.1s ease 0.8s" }}
                    className="underline-draw"
                  />
                </svg>
              </span>
              <span className="c-muted"> — هذه هي</span>
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-7 max-w-xl text-base leading-loose sm:text-lg" style={{ color: "var(--muted)" }}>
              اضغط صورك وكبّرها حتى 4K، أزل العلامات المائية، حرّر الفيديو على خط زمني، سجّل شاشتك،
              و<b style={{ color: "var(--ink)" }}>ولّد صوراً وفيديوهات يوتيوب بالذكاء الاصطناعي بالعربية</b> —
              كل ذلك في مكان واحد، وبلا علامة مائية.
            </p>
          </Reveal>

          {/* بحث يقود إلى ساحة الأدوات */}
          <Reveal delay={260}>
            <form
              className="relative mt-8 max-w-xl"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              role="search"
            >
              <span className="absolute inset-y-0 start-4 grid place-items-center c-muted">
                <Icon name="search" size={19} />
              </span>
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ما الذي تريد فعله؟ جرّب: شورتز، ضغط، إزالة علامة…"
                className="input !rounded-2xl !border-2 !py-4 !pe-28 !ps-11 !text-[15px]"
                aria-label="ابحث عن أداة"
              />
              <button type="submit" className="btn btn-teal absolute inset-y-2 end-2 !rounded-xl !px-4 !py-0 !text-sm">
                ابحث
                <Icon name="arrow" size={15} />
              </button>
            </form>
          </Reveal>

          <Reveal delay={330}>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="c-muted text-xs">الأكثر طلباً:</span>
              {[
                { s: "ai-video", n: "توليد فيديو AI" },
                { s: "screen-recorder", n: "تسجيل الشاشة" },
                { s: "video-editor", n: "محرر الفيديو" },
                { s: "remove-watermark", n: "إزالة العلامة المائية" },
              ].map((t) => (
                <Link key={t.s} to={`/tool/${t.s}`} className="chip !text-xs">
                  {t.n}
                </Link>
              ))}
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t bd-line pt-6">
              <Counter to={TOOLS.length} label="أداة متخصصة" />
              <Counter to={4} label="أقسام خدمات" />
              <Counter to={0} label="ملفات تُرفع لخوادمنا" />
            </div>
          </Reveal>
        </div>

        {/* المشهد الحي */}
        <Reveal delay={200} className="hidden lg:block">
          <LiveStack />
        </Reveal>
      </section>

      {/* ===== شريط الصيغ ===== */}
      <div className="marquee overflow-hidden border-y bd-line py-3.5" style={{ background: "var(--surface)", direction: "ltr" }} aria-hidden="true">
        <div className="marquee-track items-center gap-8">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center gap-8">
              {FORMATS.map((f) => (
                <span key={`${dup}-${f}`} className="flex items-center gap-8">
                  <span className="font-mono text-sm font-semibold tracking-widest c-muted">{f}</span>
                  <span className="c-amber"><Icon name="sparkle" size={13} /></span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===== أقسام الخدمات — شبكة Bento ===== */}
      <section className="mx-auto max-w-6xl px-4 pt-16" id="services">
        <Reveal>
          <div className="mb-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display flex items-center gap-2 text-sm font-semibold c-amber">
                <Icon name="layers" size={16} />
                أقسام الخدمات
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">أربع ورش… سقف واحد</h2>
            </div>
            <Link to="/tools" className="linkish self-start text-sm font-semibold sm:self-end">
              أو تصفح كل الأدوات دفعة واحدة ←
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {CATEGORIES.map((cat, i) => {
            const tools = toolsOf(cat.id);
            const big = i === 0 || i === 3;
            return (
              <Reveal key={cat.id} delay={i * 90} className={big ? "md:col-span-2" : ""}>
                <Link
                  to={`/${cat.slug}`}
                  className="tool-card card group relative flex h-full flex-col overflow-hidden p-6"
                  style={{ "--tc": cat.color } as CSSProperties}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl p-3 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: `color-mix(in srgb, ${cat.color} 13%, var(--surface))`, color: cat.color }}
                    >
                      <Icon name={cat.icon} size={26} />
                    </span>
                    <span className="font-mono text-[10px] font-semibold tracking-widest c-muted" dir="ltr">
                      {String(tools.length).padStart(2, "0")} أدوات
                    </span>
                  </div>

                  <h3 className="font-display mt-4 text-2xl font-bold">{cat.name}</h3>
                  <p className="mt-1 text-sm font-semibold" style={{ color: cat.color }}>{cat.tagline}</p>
                  <p className="c-muted mt-2 max-w-lg text-[13px] leading-relaxed">{cat.desc}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tools.map((t) => (
                      <span key={t.slug} className="chip pointer-events-none !cursor-default !px-2.5 !py-1 !text-[10.5px]">
                        {t.name}
                      </span>
                    ))}
                  </div>

                  <span
                    className="mt-5 flex items-center gap-1.5 text-xs font-bold transition-transform duration-300 group-hover:-translate-x-1.5"
                    style={{ color: cat.color }}
                  >
                    ادخل القسم
                    <Icon name="arrow" size={15} />
                  </span>

                  {/* توهج زاوية */}
                  <span
                    className="pointer-events-none absolute -top-16 -start-16 h-44 w-44 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `color-mix(in srgb, ${cat.color} 22%, transparent)` }}
                  />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ===== لماذا نحن — شريط مميزات متصل ===== */}
      <section className="mx-auto mt-20 max-w-6xl px-4">
        <Reveal>
          <div className="card grid divide-y overflow-hidden md:grid-cols-4 md:divide-x md:divide-y-0" style={{ borderColor: "var(--line)" }}>
            {[
              { icon: "shield" as const, color: "var(--teal)", title: "خصوصية بالمعمارية", desc: "المعالجة داخل متصفحك — لسنا «لطيفين»، نحن حرفياً لا نستطيع رؤية ملفاتك." },
              { icon: "ai" as const, color: "var(--amber)", title: "ذكاء اصطناعي حر", desc: "توليد بلا مفاتيح API وبلا حدود يومية وبلا علامات مائية على النتائج." },
              { icon: "bolt" as const, color: "var(--red)", title: "فوري بلا طوابير", desc: "لا رفع ولا انتظار معالجة — الأداة تعمل في اللحظة التي تختار فيها الملف." },
              { icon: "globe" as const, color: "var(--blue)", title: "عربي أصلاً", desc: "واجهة RTL وسيناريوهات AI عربية ونصوص عربية داخل محرر الفيديو." },
            ].map((f) => (
              <div key={f.title} className="group p-6 transition-colors duration-300 hover:bg-surface2" style={{ borderColor: "var(--line)" }}>
                <span className="grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                  style={{ background: `color-mix(in srgb, ${f.color} 12%, var(--surface))`, color: f.color }}>
                  <Icon name={f.icon} size={22} />
                </span>
                <h3 className="font-display mt-3 font-bold">{f.title}</h3>
                <p className="c-muted mt-1.5 text-[12.5px] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ===== شهادات — مبعثرة كبطاقات مكتب ===== */}
      <section className="mx-auto mt-20 max-w-6xl px-4">
        <Reveal>
          <p className="font-display flex items-center gap-2 text-sm font-semibold c-teal">
            <Icon name="heart" size={16} />
            مستخدمون يتحدثون
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold sm:text-4xl">وصلت بالفعل… إلى ورشهم</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {QUOTES.map((quote, i) => (
            <Reveal key={quote.name} delay={i * 110} className={i === 1 ? "md:translate-y-8" : i === 2 ? "md:-translate-y-2" : ""}>
              <figure
                className="card h-full p-6 transition-transform duration-300 hover:-translate-y-1.5"
                style={{ transform: `rotate(${i === 0 ? -1.2 : i === 1 ? 0.8 : -0.5}deg)` }}
              >
                <span className="font-display text-4xl leading-none" style={{ color: quote.color }}>”</span>
                <blockquote className="mt-1 text-sm leading-loose">{quote.text}</blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t bd-line pt-4">
                  <span className="font-display grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: quote.color }}>
                    {quote.name[0]}
                  </span>
                  <span>
                    <b className="font-display block text-sm">{quote.name}</b>
                    <span className="c-muted text-xs">{quote.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== أسئلة شائعة ===== */}
      <section className="mx-auto mt-20 max-w-3xl px-4">
        <Reveal>
          <h2 className="font-display text-center text-3xl font-bold sm:text-4xl">قبل أن تسأل…</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="ft-acc card group overflow-hidden">
                <summary className="flex items-center justify-between gap-3 px-5 py-4 text-sm font-bold transition-colors hover:bg-surface2">
                  {f.q}
                  <span className="acc-chev shrink-0 c-muted"><Icon name="chevron" size={18} /></span>
                </summary>
                <p className="c-muted border-t bd-line px-5 py-4 text-sm leading-loose">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== دعوة أخيرة ===== */}
      <section className="mx-auto mt-20 max-w-6xl px-4">
        <Reveal>
          <div className="card relative overflow-hidden p-10 text-center sm:p-14">
            <span className="pointer-events-none absolute -top-24 start-1/4 h-64 w-64 rounded-full blur-3xl" style={{ background: "var(--glow-teal)" }} />
            <span className="pointer-events-none absolute -bottom-24 end-1/4 h-64 w-64 rounded-full blur-3xl" style={{ background: "var(--glow-amber)" }} />
            <h2 className="font-display relative text-3xl font-extrabold leading-snug sm:text-5xl">
              ملفك القادم يستحق
              <span className="c-teal"> ورشةً </span>
              لا تنتهك خصوصيته
            </h2>
            <p className="c-muted relative mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base">
              ابدأ بأي أداة — لن نطلب تسجيلاً، ولن نرى ملفك، ولن نضع علامة مائية على نتيجتك.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/tools" className="btn btn-teal !px-7 !py-3.5 !text-base">
                <Icon name="sparkle" size={19} />
                افتح ساحة الأدوات
              </Link>
              <Link to="/ai" className="btn btn-amber !px-7 !py-3.5 !text-base">
                <Icon name="ai" size={19} />
                جرّب الذكاء الاصطناعي
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
