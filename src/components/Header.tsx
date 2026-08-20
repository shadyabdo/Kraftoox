import { useEffect, useRef, useState } from "react";
import { CATEGORIES, getTool, toolsOf, type CategoryDef } from "../data/tools";
import { cx } from "../lib/utils";
import { Link, navigate, type Route } from "../lib/router";
import { Icon, LogoMark } from "./Icons";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
  const toggle = () => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.style.colorScheme = next;
      try {
        localStorage.setItem("ft-theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return { theme, toggle };
}

/* ===== دروب داون مستقل لكل قسم خدمات ===== */
function SectionMenu({ cat, route }: { cat: CategoryDef; route: Route }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tools = toolsOf(cat.id);

  useEffect(() => setOpen(false), [route.path]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeToolCat = route.parts[0] === "tool" ? getTool(route.parts[1] ?? "")?.category : undefined;
  const isActive = route.parts[0] === cat.slug || activeToolCat === cat.id;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cx(
          "font-display flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition-colors duration-200 lg:px-3.5 lg:text-sm",
          isActive || open ? "" : "c-muted hover:text-[var(--ink)]"
        )}
        style={isActive || open ? { color: cat.color } : undefined}
      >
        <span className="hidden h-1.5 w-1.5 rounded-full lg:inline-block" style={{ background: cat.color }} />
        {cat.name}
        <span className={cx("transition-transform duration-300", open && "rotate-180")}>
          <Icon name="chevron" size={14} />
        </span>
      </button>

      {open && (
        <div
          className="menu-panel-in absolute start-0 top-full z-50 mt-2.5 w-72"
          role="menu"
          aria-label={cat.name}
        >
          <div className="card !rounded-xl overflow-hidden shadow-2xl">
            <span className="block h-1" style={{ background: cat.color }} />
            <div className="p-2">
              {tools.map((t, i) => (
                <Link
                  key={t.slug}
                  to={`/tool/${t.slug}`}
                  onClick={() => setOpen(false)}
                  className="menu-item-in group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 hover:bg-surface2 hover:ps-4"
                  style={{ color: "var(--ink)", animationDelay: `${i * 30}ms` }}
                  role="menuitem"
                >
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `color-mix(in srgb, ${t.color} 12%, var(--surface))`, color: t.color }}
                  >
                    <Icon name={t.icon} size={16} />
                  </span>
                  <span className="flex-1 leading-snug">{t.name}</span>
                  {t.isNew && (
                    <span className="rounded bg-[var(--red)] px-1.5 py-0.5 text-[9px] font-bold text-white">جديد</span>
                  )}
                </Link>
              ))}
            </div>
            <Link
              to={`/${cat.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-t bd-line px-4 py-2.5 text-xs font-bold transition-all duration-150 hover:bg-surface2"
              style={{ color: cat.color }}
              role="menuitem"
            >
              <span>كل أدوات {cat.name} — صفحة القسم</span>
              <Icon name="arrow" size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "اتصل بنا" },
];

export function Header({ route }: { route: Route }) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [route.path]);

  const isStaticActive = (to: string) => route.path === to;

  return (
    <header
      className="sticky top-0 z-50 border-b bd-line"
      style={{ background: "color-mix(in srgb, var(--bg) 86%, transparent)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Kraftoox — الرئيسية">
          <LogoMark size={36} />
          <span className="leading-none">
            <span className="font-display block text-xl font-bold" dir="ltr">
              Kraft<span className="c-teal">oox</span>
            </span>
            <span className="c-muted mt-0.5 block text-[10.5px] font-medium">
              ورشة ملفاتك المجانية
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="التنقل الرئيسي">
          <Link
            to="/"
            className={cx(
              "font-display relative rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition-colors duration-200 lg:px-3.5 lg:text-sm",
              route.path === "/" ? "c-teal" : "c-muted hover:text-[var(--ink)]"
            )}
          >
            الرئيسية
            {route.path === "/" && (
              <span className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full" style={{ background: "var(--amber)" }} />
            )}
          </Link>

          {/* كل قسم خدمات رابطٌ وهو دروب داون في الوقت نفسه */}
          {CATEGORIES.map((cat) => (
            <SectionMenu key={cat.id} cat={cat} route={route} />
          ))}

          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cx(
                "font-display relative rounded-lg px-2.5 py-2 text-[13.5px] font-semibold transition-colors duration-200 lg:px-3.5 lg:text-sm",
                isStaticActive(n.to) ? "c-teal" : "c-muted hover:text-[var(--ink)]"
              )}
            >
              {n.label}
              {isStaticActive(n.to) && (
                <span className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full" style={{ background: "var(--amber)" }} />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/tools?focus=search")}
            className="c-muted hidden h-10 items-center gap-2 rounded-xl border bd-line bg-surface px-3 text-sm transition-all duration-200 hover:border-[var(--teal)] hover:text-[var(--teal)] sm:flex"
            aria-label="بحث سريع عن أداة"
          >
            <Icon name="search" size={16} />
            <kbd className="font-mono rounded-md border bd-line bg-surface2 px-1.5 py-0.5 text-[10px]">/</kbd>
          </button>

          <button
            type="button"
            onClick={toggle}
            className="grid h-10 w-10 place-items-center rounded-xl border bd-line bg-surface c-muted transition-all duration-200 hover:border-[var(--amber)] hover:text-[var(--amber)]"
            aria-label={theme === "dark" ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الليلي"}
            title={theme === "dark" ? "الوضع الفاتح" : "الوضع الليلي"}
          >
            <span
              className="grid place-items-center transition-transform duration-500"
              style={{ transform: theme === "dark" ? "rotate(360deg)" : "rotate(0deg)" }}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-xl border bd-line bg-surface md:hidden"
            aria-label="القائمة"
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} size={19} />
          </button>
        </div>
      </div>

      {/* قائمة الجوال — أكورديون لكل قسم */}
      <div
        className={cx(
          "overflow-hidden border-b bd-line transition-all duration-300 md:hidden",
          open ? "max-h-[560px] overflow-y-auto opacity-100" : "max-h-0 border-b-0 opacity-0"
        )}
        style={{ background: "var(--surface)" }}
      >
        <nav className="flex flex-col px-4 py-2" aria-label="قائمة الجوال">
          <Link
            to="/"
            className={cx("font-display border-b bd-line py-3 text-sm font-semibold", route.path === "/" ? "c-teal" : "c-muted")}
          >
            الرئيسية
          </Link>

          {CATEGORIES.map((cat) => (
            <details key={cat.id} className="group border-b bd-line" open={route.parts[0] === cat.slug}>
              <summary className="font-display flex list-none items-center gap-2.5 py-3 text-sm font-semibold c-muted">
                <span style={{ color: cat.color }}><Icon name={cat.icon} size={17} /></span>
                {cat.name}
                <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-bold" style={{ color: cat.color, background: `color-mix(in srgb, ${cat.color} 10%, transparent)` }}>
                  {toolsOf(cat.id).length}
                </span>
                <span className="acc-chev ms-auto"><Icon name="chevron" size={15} /></span>
              </summary>
              <div className="pb-3">
                <Link
                  to={`/${cat.slug}`}
                  className="mb-2 flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-bold"
                  style={{ color: cat.color, background: `color-mix(in srgb, ${cat.color} 7%, transparent)` }}
                >
                  صفحة قسم {cat.name}
                  <Icon name="arrow" size={13} />
                </Link>
                <div className="grid grid-cols-2 gap-1">
                  {toolsOf(cat.id).map((t) => (
                    <Link key={t.slug} to={`/tool/${t.slug}`} className="c-muted flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:text-[var(--ink)]">
                      <span style={{ color: cat.color }}><Icon name={t.icon} size={12} /></span>
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            </details>
          ))}

          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cx(
                "font-display border-b bd-line py-3 text-sm font-semibold last:border-0",
                isStaticActive(n.to) ? "c-teal" : "c-muted"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
