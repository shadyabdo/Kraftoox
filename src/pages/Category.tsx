import type { CSSProperties } from "react";
import { CATEGORIES, getCategory, toolsOf } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { usePageMeta } from "../lib/seo";
import { Icon } from "../components/Icons";
import { Reveal } from "../components/Reveal";
import { ToolCard } from "../components/ToolCard";

export default function Category({ slug }: { slug: string }) {
  const cat = getCategory(slug);
  const { isAr } = useI18n();
  usePageMeta(`/${slug}`);

  if (!cat) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold">{isAr ? "القسم غير موجود" : "Section not found"}</p>
        <Link to="/tools" className="btn btn-teal mt-6">{isAr ? "كل الأدوات" : "All tools"}</Link>
      </main>
    );
  }

  const tools = toolsOf(cat.id);
  const others = CATEGORIES.filter((c) => c.id !== cat.id);

  return (
    <main>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden border-b bd-line"
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${cat.color} 8%, var(--bg)), var(--bg))` }}
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <nav className="flex items-center gap-1.5 text-xs c-muted mb-8" aria-label={isAr ? "مسار التنقل" : "Breadcrumb"}>
            <Link to="/" className="transition-colors hover:c-teal">{isAr ? "الرئيسية" : "Home"}</Link>
            <Icon name="arrow" size={12} className="opacity-50" />
            <span className="font-semibold" style={{ color: cat.color }}>{isAr ? cat.name : cat.nameEn}</span>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <Reveal>
                <span
                  className="grid h-20 w-20 place-items-center rounded-3xl"
                  style={{
                    background: `color-mix(in srgb, ${cat.color} 14%, var(--surface))`,
                    color: cat.color,
                    boxShadow: `0 20px 50px -15px color-mix(in srgb, ${cat.color} 60%, transparent)`,
                  }}
                >
                  <Icon name={cat.icon} size={40} />
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="editorial-title mt-6">
                  <span style={{ color: cat.color }}>{isAr ? cat.name : cat.nameEn}</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="editorial-subtitle mt-3 font-semibold" style={{ color: cat.color }}>
                  {isAr ? cat.tagline : cat.taglineEn}
                </p>
              </Reveal>
              <Reveal delay={240}>
                <p className="c-muted mt-6 text-lg leading-relaxed">
                  {isAr ? cat.desc : cat.descEn}
                </p>
              </Reveal>
            </div>

            <Reveal delay={300}>
              <div className="card hidden w-64 p-8 text-center lg:block" style={{ "--tc": cat.color } as CSSProperties}>
                <p className="editorial-title font-extrabold" style={{ color: cat.color }} dir="ltr">
                  {String(tools.length).padStart(2, "0")}
                </p>
                <p className="c-muted mt-2 text-sm font-medium">
                  {isAr ? "أداة جاهزة" : "Ready tools"}
                </p>
                <div className="mt-4 flex justify-center gap-1">
                  {tools.map((tool) => (
                    <span key={tool.slug} className="h-2 w-6 rounded-full" style={{ background: `color-mix(in srgb, ${cat.color} 55%, transparent)` }} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* شبكة الأدوات */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="kicker mb-3" style={{ color: cat.color }}>
              {isAr ? "الأدوات المتاحة" : "Available Tools"}
            </p>
            <h2 className="editorial-subtitle font-bold">
              {isAr ? `${tools.length} أداة احترافية` : `${tools.length} Professional Tools`}
            </h2>
          </div>
        </Reveal>
        <div className="bento bento-3">
          {tools.map((tool, i) => (
            <ToolCard key={tool.slug} tool={tool} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* حالات الاستخدام */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="kicker mb-3" style={{ color: cat.color }}>
                {isAr ? "متى ستحتاجها؟" : "When you'll need it"}
              </p>
              <h2 className="editorial-subtitle font-bold">
                {isAr ? "مواقف يومية… وحلول جاهزة" : "Daily scenarios… and ready solutions"}
              </h2>
              <p className="c-muted mt-4 max-w-md leading-relaxed">
                {isAr
                  ? "كل أداة في هذا القسم بُنيت لمهمة واقعية محددة — بدون إعدادات معقدة وبدون حسابات."
                  : "Every tool in this section was built for a specific real-world task — no complex setup, no accounts."}
              </p>
            </div>
          </Reveal>
          <div className="space-y-3">
            {(isAr ? cat.useCases : cat.useCasesEn).map((u, i) => (
              <Reveal key={u} delay={i * 80}>
                <div className="card flex items-center gap-4 p-5 transition-transform duration-300 hover:-translate-y-1">
                  <span
                    className="font-display grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-extrabold"
                    style={{ background: `color-mix(in srgb, ${cat.color} 12%, var(--surface))`, color: cat.color }}
                  >
                    {["١", "٢", "٣", "٤"][i] ?? "•"}
                  </span>
                  <p className="text-sm font-semibold leading-relaxed">{u}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* أقسام أخرى */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Reveal>
          <h2 className="editorial-subtitle mb-8 font-bold text-center">
            {isAr ? "أقسام أخرى في الورشة" : "Other sections in the workshop"}
          </h2>
        </Reveal>
        <div className="bento bento-3">
          {others.map((c, i) => (
            <Reveal key={c.id} delay={i * 70}>
              <Link
                to={`/${c.slug}`}
                className="tool-card card group flex items-center gap-4 p-6"
                style={{ "--tc": c.color } as CSSProperties}
              >
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
                  style={{ background: `color-mix(in srgb, ${c.color} 12%, var(--surface))`, color: c.color }}
                >
                  <Icon name={c.icon} size={28} />
                </span>
                <span className="flex-1">
                  <b className="font-display block text-lg font-bold">{isAr ? c.name : c.nameEn}</b>
                  <span className="c-muted text-sm">{toolsOf(c.id).length} {isAr ? "أدوات" : "tools"}</span>
                </span>
                <span className="c-muted transition-transform duration-300 group-hover:-translate-x-2">
                  <Icon name="arrow" size={20} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
