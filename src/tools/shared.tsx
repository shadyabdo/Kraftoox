import type { CSSProperties, ReactNode } from "react";
import type { ToolDef } from "../data/tools";
import { TOOLS } from "../data/tools";
import { Link } from "../lib/router";
import { usePageMeta, useToolJsonLd } from "../lib/seo";
import { Icon } from "../components/Icons";
import { Reveal } from "../components/Reveal";
import { Spinner } from "../components/bits";

/* ===== هيكل صفحة الأداة:breadcrumb + ترويسة + مميزات + روابط ذات صلة ===== */
export function ToolShell({ tool, children }: { tool: ToolDef; children: ReactNode }) {
  usePageMeta(`/tool/${tool.slug}`);
  useToolJsonLd({ slug: tool.slug, name: tool.name, desc: tool.long });

  const related = TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 3);
  const catLabel = tool.category === "image" ? "أدوات الصور" : "أدوات PDF";
  const catTo = tool.category === "image" ? "/tools" : "/tools";

  return (
    <main className="mx-auto max-w-4xl px-4 pb-10">
      {/* breadcrumb */}
      <nav className="flex items-center gap-1.5 py-5 text-xs c-muted" aria-label="مسار التنقل">
        <Link to="/" className="transition-colors hover:text-[var(--teal)]">الرئيسية</Link>
        <Icon name="arrow" size={12} className="opacity-50" />
        <Link to={catTo} className="transition-colors hover:text-[var(--teal)]">{catLabel}</Link>
        <Icon name="arrow" size={12} className="opacity-50" />
        <span className="font-semibold" style={{ color: tool.color }}>{tool.name}</span>
      </nav>

      {/* ترويسة الأداة */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start">
        <span
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl"
          style={{
            background: `color-mix(in srgb, ${tool.color} 13%, var(--surface))`,
            color: tool.color,
            boxShadow: `0 10px 30px -12px color-mix(in srgb, ${tool.color} 55%, transparent)`,
          }}
        >
          <Icon name={tool.icon} size={32} />
        </span>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{tool.name}</h1>
          <p className="c-muted mt-2 max-w-2xl text-sm leading-relaxed sm:text-[15px]">{tool.long}</p>
          <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {tool.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px]">
                <span className="mt-0.5 shrink-0" style={{ color: tool.color }}>
                  <Icon name="check" size={14} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <span
          className="font-mono hidden shrink-0 self-start rounded-lg px-2.5 py-1.5 text-[10.5px] font-medium tracking-wide sm:block"
          dir="ltr"
          style={{
            color: tool.color,
            background: `color-mix(in srgb, ${tool.color} 9%, transparent)`,
          }}
        >
          {tool.badge}
        </span>
      </header>

      {children}

      {/* أدوات ذات صلة */}
      <Reveal className="mt-14">
        <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold">
          <span className="c-amber"><Icon name="sparkle" size={18} /></span>
          أدوات قد تحتاجها أيضاً
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {related.map((t) => (
            <Link
              key={t.slug}
              to={`/tool/${t.slug}`}
              className="tool-card card group flex items-center gap-3 p-4"
              style={{ "--tc": t.color } as CSSProperties}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${t.color} 12%, var(--surface))`, color: t.color }}
              >
                <Icon name={t.icon} size={20} />
              </span>
              <span className="font-display text-sm font-bold leading-snug">{t.name}</span>
            </Link>
          ))}
        </div>
      </Reveal>
    </main>
  );
}

/* ===== صف ملف في قائمة المعالجة ===== */
export function FileRow({
  name,
  meta,
  thumb,
  status,
  color = "var(--teal)",
  actions,
}: {
  name: string;
  meta: ReactNode;
  thumb?: string;
  status: "idle" | "working" | "done" | "error";
  color?: string;
  actions?: ReactNode;
}) {
  return (
    <li className="anim-pop flex items-center gap-3 rounded-xl border bd-line bg-surface p-3">
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className="h-12 w-12 shrink-0 rounded-lg border bd-line object-cover"
        />
      ) : (
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg"
          style={{ background: `color-mix(in srgb, ${color} 10%, var(--surface))`, color }}
        >
          <Icon name="pdf" size={22} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" dir="ltr" style={{ textAlign: "end" }}>
          <bdi>{name}</bdi>
        </p>
        <p className="c-muted mt-0.5 text-xs">{meta}</p>
      </div>
      {status === "working" && (
        <span style={{ color }} aria-label="جارٍ المعالجة">
          <Spinner size={20} />
        </span>
      )}
      {status === "done" && (
        <span className="c-teal grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--teal-soft)]" aria-label="اكتمل">
          <Icon name="check" size={15} />
        </span>
      )}
      {status === "error" && (
        <span className="c-red grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--red-soft)]" aria-label="خطأ">
          <Icon name="alert" size={15} />
        </span>
      )}
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </li>
  );
}

/* ===== زر المعالجة الرئيسي ===== */
export function ProcessBtn({
  label,
  onClick,
  disabled,
  busy,
  color = "var(--teal)",
  icon = "wand",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  color?: string;
  icon?: "wand" | "merge" | "download" | "link" | "extract" | "img2pdf" | "resize" | "convert" | "image" | "pdf";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="btn w-full !py-3.5 !text-base text-white sm:w-auto sm:min-w-52"
      style={{ background: color }}
    >
      {busy ? <Spinner size={19} /> : <Icon name={icon} size={19} />}
      {busy ? "جارٍ المعالجة…" : label}
    </button>
  );
}

/* ===== لوحة خيارات ===== */
export function OptionsPanel({ title = "الخيارات", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="card mb-5 p-5">
      <h3 className="font-display mb-4 flex items-center gap-2 text-sm font-bold">
        <span className="c-amber"><Icon name="wand" size={16} /></span>
        {title}
      </h3>
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold c-muted">{children}</span>;
}
