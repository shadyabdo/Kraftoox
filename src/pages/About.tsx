import { Link } from "../lib/router";
import { usePageMeta } from "../lib/seo";
import { Icon, type IconName } from "../components/Icons";
import { Reveal } from "../components/Reveal";
import { SectionHead } from "../components/bits";

export default function About() {
  usePageMeta("/about");

  const values: Array<{ icon: IconName; color: string; title: string; desc: string }> = [
    {
      icon: "shield",
      color: "var(--teal)",
      title: "الخصوصية أولاً",
      desc: "قرارنا المعماري الأساسي: الملفات لا تغادر الجهاز. ليس لأننا «لطيفون»، بل لأن الموقع مبني بحيث لا يستطيع الوصول إليها أصلاً.",
    },
    {
      icon: "bolt",
      color: "var(--amber)",
      title: "السرعة احترام",
      desc: "وقتك أثمن من أن تهدره في طوابير رفع ومعالجة. أدواتنا تبدأ العمل في اللحظة التي تختار فيها الملف.",
    },
    {
      icon: "heart",
      color: "var(--red)",
      title: "مجاني للجميع",
      desc: "لا خطط مدفوعة ولا ميزات مقفلة. الأداة التي تحتاجها اليوم ستجدها مجانية غداً أيضاً.",
    },
    {
      icon: "eye",
      color: "#1d8a8a",
      title: "شفافية كاملة",
      desc: "نخبرك بالضبط ماذا حدث لملفك: كم صورة عولجت، كم بايت وُفّر، ولماذا نجح الضغط أو فشل.",
    },
  ];

  const stack = [
    { name: "React 18 + Vite", role: "واجهة سريعة البناء والتحديث" },
    { name: "Tailwind CSS", role: "تصميم متجاوب مع وضعين فاتح وليلي" },
    { name: "Canvas API + Web Workers", role: "ضغط الصور وتحويلها دون تجميد الواجهة" },
    { name: "pdf-lib", role: "قراءة وكتابة ودمج ملفات PDF محلياً" },
    { name: "pako", role: "فك ضغط تيارات Flate داخل ملفات PDF" },
    { name: "JSZip", role: "تغليف النتائج في ملف ZIP واحد" },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 pb-10">
      <nav className="flex items-center gap-1.5 py-5 text-xs c-muted" aria-label="مسار التنقل">
        <Link to="/" className="transition-colors hover:text-[var(--teal)]">الرئيسية</Link>
        <Icon name="arrow" size={12} className="opacity-50" />
        <span className="font-semibold c-teal">من نحن</span>
      </nav>

      <Reveal>
        <header className="max-w-2xl">
          <p className="font-display flex items-center gap-2 text-sm font-semibold c-teal">
            <Icon name="sparkle" size={16} />
            من نحن
          </p>
          <h1 className="font-display mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
            فريق صغير،<br />
            <span className="c-teal">وفكرة بسيطة جداً</span>
          </h1>
        </header>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-8 max-w-3xl space-y-4 text-[15px] leading-loose">
          <p>
            بدأ FileTools من إحباط شخصي: كل مرة احتجنا فيها لضغط صورة أو دمج ملف PDF، كانت
            المواقع المتاحة تطلب منا <b>رفع ملفاتنا إلى خوادمها</b> — عقود عمل، صور عائلية،
            مستندات حساسة — ثم تعدنا بحذفها «قريباً». لم يعجبنا هذا العقد أبداً.
          </p>
          <p>
            فقررنا بناء البديل: موقع يعمل بنفس جودة الأدوات العالمية الكبرى وسرعتها، لكن بمعمارية
            مختلفة جذرياً — <b className="c-teal">كل بايت من المعالجة يحدث داخل متصفحك</b>. مكتبات
            JavaScript الحديثة (pdf-lib، Canvas API، Web Workers) تجعل هذا ممكناً اليوم، ونحن
            نستثمر كل جهدنا في إتقان هذه المكتبات بدل بناء خوادم لا نريدها.
          </p>
          <p>
            النتيجة: أدوات فورية، خصوصية مضمونة رياضياً لا بالوعود، وتكلفة تشغيل تجعل بقاء الخدمة
            <b> مجانية للأبد</b> قراراً سهلاً لا تضحية.
          </p>
        </div>
      </Reveal>

      <section className="mt-16">
        <SectionHead kicker="قيمنا" title="أربعة مبادئ لا نساوم عليها" icon="heart" color="var(--red)" />
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 80}>
              <div className="card group h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `color-mix(in srgb, ${v.color} 12%, var(--surface))`, color: v.color }}
                >
                  <Icon name={v.icon} size={22} />
                </span>
                <h3 className="font-display mt-3 text-lg font-bold">{v.title}</h3>
                <p className="c-muted mt-1.5 text-sm leading-relaxed">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionHead
          kicker="تحت الغطاء"
          title="ماذا يشغّل FileTools تقنياً؟"
          desc="موقع ثابت بالكامل — لا خوادم تطبيقية ولا قواعد بيانات ملفات. هذا كل ما في الأمر:"
          icon="code"
          color="var(--amber)"
        />
        <Reveal>
          <div className="card divide-y overflow-hidden" style={{ borderColor: "var(--line)" }}>
            {stack.map((s, i) => (
              <div
                key={s.name}
                className="flex flex-col gap-1 px-5 py-4 transition-colors duration-200 hover:bg-surface2 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "var(--line)", borderTopWidth: i === 0 ? 0 : 1 }}
              >
                <span className="font-mono text-sm font-semibold" dir="ltr">{s.name}</span>
                <span className="c-muted text-sm">{s.role}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="c-muted mt-4 text-sm leading-relaxed">
            ولمن يريد روابط صور <b>دائمة</b> بميزانية صفرية، أرفقنا في مستودع المشروع مجلد
            <span className="font-mono" dir="ltr"> server/ </span>
            يحتوي خادماً جاهزاً (Node.js + Express) مربوطاً بخطة Supabase المجانية — انشره مجاناً
            واربطه بأداة رفع الصور.
          </p>
        </Reveal>
      </section>

      <Reveal className="mt-16">
        <div className="card flex flex-col items-center gap-4 p-8 text-center sm:p-10">
          <h2 className="font-display text-2xl font-bold">جرّب بنفسك — الملفات تبقى عندك</h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/tools" className="btn btn-teal">
              <Icon name="sparkle" size={17} />
              كل الأدوات
            </Link>
            <Link to="/privacy" className="btn btn-ghost">
              <Icon name="shield" size={17} />
              سياسة الخصوصية
            </Link>
            <Link to="/contact" className="btn btn-ghost">
              <Icon name="mail" size={17} />
              تواصل معنا
            </Link>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
