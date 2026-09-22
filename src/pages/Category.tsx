import type { CSSProperties } from "react";
import { CATEGORIES, getCategory, toolsOf } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { usePageMeta } from "../lib/seo";
import { Icon } from "../components/Icons";
import { ToolCard } from "../components/ToolCard";

export default function Category({ slug }: { slug: string }) {
  const cat = getCategory(slug);
  const { isAr } = useI18n();
  usePageMeta(`/${slug}`);

  if (!cat) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-2xl font-bold">{isAr ? "القسم غير موجود" : "Section not found"}</p>
        <Link to="/tools" className="btn btn-primary mt-6">{isAr ? "كل الأدوات" : "All tools"}</Link>
      </main>
    );
  }

  const tools = toolsOf(cat.id);
  const others = CATEGORIES.filter((c) => c.id !== cat.id);

  return (
    <main>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <nav className="flex items-center gap-2 text-sm c-muted mb-8" aria-label={isAr ? "مسار التنقل" : "Breadcrumb"}>
          <Link to="/" className="hover:c-primary transition-colors">{isAr ? "الرئيسية" : "Home"}</Link>
          <Icon name="arrow" size={12} className="opacity-50" />
          <span className="font-semibold" style={{ color: cat.color }}>{isAr ? cat.name : cat.nameEn}</span>
        </nav>

        <div className="flex items-start gap-6 mb-8">
          <span
            className="grid h-20 w-20 place-items-center rounded-2xl shrink-0"
            style={{
              background: `color-mix(in srgb, ${cat.color} 15%, var(--surface2))`,
              color: cat.color,
            }}
          >
            <Icon name={cat.icon} size={40} />
          </span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              {isAr ? cat.name : cat.nameEn}
            </h1>
            <p className="text-lg font-semibold mb-3" style={{ color: cat.color }}>
              {isAr ? cat.tagline : cat.taglineEn}
            </p>
            <p className="c-muted text-base leading-relaxed">
              {isAr ? cat.desc : cat.descEn}
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">
          {isAr ? `${tools.length} أداة متاحة` : `${tools.length} Available Tools`}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      {/* Other Sections */}
      <section className="mx-auto max-w-7xl px-4 pb-16 border-t border-[var(--line)] pt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">
          {isAr ? "أقسام أخرى" : "Other Sections"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((c) => (
            <Link
              key={c.id}
              to={`/${c.slug}`}
              className="card group flex items-center gap-4 p-6"
              style={{ "--tc": c.color } as CSSProperties}
            >
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-xl"
                style={{ background: `color-mix(in srgb, ${c.color} 15%, var(--surface2))`, color: c.color }}
              >
                <Icon name={c.icon} size={28} />
              </span>
              <span className="flex-1">
                <b className="block text-lg font-bold group-hover:text-[var(--primary)] transition-colors">
                  {isAr ? c.name : c.nameEn}
                </b>
                <span className="c-muted text-sm">{toolsOf(c.id).length} {isAr ? "أدوات" : "tools"}</span>
              </span>
              <Icon name="arrow" size={20} className="c-muted transition-transform group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
