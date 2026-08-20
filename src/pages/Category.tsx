import type { CSSProperties } from "react";
import { CATEGORIES, getCategory, toolsOf } from "../data/tools";
import { Link } from "../lib/router";
import { usePageMeta } from "../lib/seo";
import { Icon } from "../components/Icons";
import { Reveal } from "../components/Reveal";
import { ToolCard } from "../components/ToolCard";

export default function Category({ slug }: { slug: string }) {
  const cat = getCategory(slug);
  usePageMeta(`/${slug}`);

  if (!cat) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold">القسم غير موجود</p>
        <Link to="/tools" className="btn btn-teal mt-6">كل الأدوات</Link>
      </main>
    );
  }

  const tools = toolsOf(cat.id);
  const others = CATEGORIES.filter((c) => c.id !== cat.id);

  return (
    <main>
      {/* ترويسة القسم */}
      <section
        className="border-b bd-line"
        style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${cat.color} 7%, var(--bg)), var(--bg))` }}
      >
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <nav className="flex items-center gap-1.5 text-xs c-muted" aria-label="مسار التنقل">
            <Link to="/" className="transition-colors hover:text-[var(--teal)]">الرئيسية</Link>
            <Icon name="arrow" size={12} className="opacity-50" />
            <span className="font-semibold" style={{ color: cat.color }}>{cat.name}</span>
          </nav>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <Reveal>
                <span
                  className="grid h-16 w-16 place-items-center rounded-2xl"
                  style={{
                    background: `color-mix(in srgb, ${cat.color} 14%, var(--surface))`,
                    color: cat.color,
                    boxShadow: `0 14px 36px -14px color-mix(in srgb, ${cat.color} 60%, transparent)`,
                  }}
                >
                  <Icon name={cat.icon} size={32} />
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display mt-5 text-4xl font-extrabold sm:text-5xl">{cat.name}</h1>
                <p className="font-display mt-2 text-lg font-semibold" style={{ color: cat.color }}>{cat.tagline}</p>
              </Reveal>
              <Reveal delay={160}>
                <p className="c-muted mt-4 leading-loose">{cat.desc}</p>
              </Reveal>
            </div>

            <Reveal delay={220}>
              <div className="card hidden w-56 p-5 text-center lg:block" style={{ "--tc": cat.color } as CSSProperties}>
                <p className="font-display text-4xl font-extrabold" style={{ color: cat.color }} dir="ltr">
                  {String(tools.length).padStart(2, "0")}
                </p>
                <p className="c-muted mt-1 text-xs">أداة جاهزة في هذا القسم</p>
                <div className="mt-3 flex justify-center gap-1">
                  {tools.map((t) => (
                    <span key={t.slug} className="h-1.5 w-4 rounded-full" style={{ background: `color-mix(in srgb, ${cat.color} 55%, transparent)` }} />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* شبكة الأدوات */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((t, i) => (
            <ToolCard key={t.slug} tool={t} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* حالات الاستخدام */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="font-display text-sm font-semibold" style={{ color: cat.color }}>
                متى ستحتاجها؟
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold leading-snug sm:text-4xl">
                مواقف يومية…
                <br />
                <span style={{ color: cat.color }}>وحلول جاهزة</span>
              </h2>
              <p className="c-muted mt-4 max-w-md leading-relaxed">
                كل أداة في هذا القسم بُنيت لمهمة واقعية محددة — بدون إعدادات معقدة وبدون حسابات.
              </p>
            </div>
          </Reveal>
          <div className="space-y-3">
            {cat.useCases.map((u, i) => (
              <Reveal key={u} delay={i * 80}>
                <div className="card flex items-center gap-4 p-5 transition-transform duration-300 hover:-translate-y-1">
                  <span
                    className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold"
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
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <Reveal>
          <h2 className="font-display mb-5 flex items-center gap-2 text-xl font-bold">
            <span className="c-amber"><Icon name="layers" size={19} /></span>
            أقسام أخرى في الورشة
          </h2>
        </Reveal>
        <div className="grid gap-3 sm:grid-cols-3">
          {others.map((c, i) => (
            <Reveal key={c.id} delay={i * 70}>
              <Link
                to={`/${c.slug}`}
                className="tool-card card group flex items-center gap-3.5 p-4"
                style={{ "--tc": c.color } as CSSProperties}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ background: `color-mix(in srgb, ${c.color} 12%, var(--surface))`, color: c.color }}
                >
                  <Icon name={c.icon} size={22} />
                </span>
                <span>
                  <b className="font-display block text-sm">{c.name}</b>
                  <span className="c-muted text-xs">{toolsOf(c.id).length} أدوات</span>
                </span>
                <span className="ms-auto c-muted transition-transform duration-300 group-hover:-translate-x-1">
                  <Icon name="arrow" size={16} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
