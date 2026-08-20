import { useEffect, useRef, useState } from "react";
import { CATEGORIES, toolsOf } from "../data/tools";
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

/* ===== قائمة الخدمات المنسدلة (ميجا منيو) ===== */
function ServicesMenu({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const isActive = route.parts.length === 1 && CATEGORIES.some((c) => c.slug === route.parts[0]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cx(
          "font-display flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200",
          isActive || open ? "c-teal" : "c-muted hover:text-[var(--ink)]"
        )}
      >
        الخدمات
        <span className={cx("transition-transform duration-300", open && "rotate-180")}>
          <Icon name="chevron" size={15} />
        </span>
      </button>

      <div
        className={cx(
          "absolute left-1/2 top-full z-50 mt-3 w-[680px] max-w-[94vw] -translate-x-1/2 origin-top transition-all",
          open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-2 scale-[0.97] opacity-0"
        )}
        style={{ transitionDuration: "220ms" }}
        role="menu"
      >
        <div className="card !rounded-2xl p-5 shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="rounded-xl p-3 transition-colors duration-200 hover:bg-surface2">
                <Link
                  to={`/${cat.slug}`}
                  className="flex items-center gap-2.5 rounded-lg py-1"
                  onClick={() => setOpen(false)}
                >
                  <span
                    className="grid h-9 w-9 place-items-center rounded-lg"
                    style={{ background: `color-mix(in srgb, ${cat.color} 13%, var(--surface))`, color: cat.color }}
                  >
                    <Icon name={cat.icon} size={18} />
                  </span>
                  <span>
                    <b className="font-display block text-sm leading-tight">{cat.name}</b>
                    <span className="c-muted text-[10.5px]">{toolsOf(cat.id).length} أدوات</span>
                  </span>
                  <span className="ms-auto c-muted"><Icon name="arrow" size={14} /></span>
                </Link>
                <ul className="mt-1.5 grid grid-cols-1 gap-0.5 border-t bd-line pt-2">
                  {toolsOf(cat.id).map((t) => (
                    <li key={t.slug}>
                      <Link
                        to={`/tool/${t.slug}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-all duration-150 hover:bg-surface hover:ps-3"
                        style={{ color: "var(--muted)" }}
                      >
                        <span style={{ color: cat.color }}><Icon name={t.icon} size={13} /></span>
                        {t.name}
                        {t.isNew && (
                          <span className="rounded bg-[var(--red)] px-1.5 py-px text-[8.5px] font-bold text-white">جديد</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t bd-line pt-3">
            <span className="c-muted text-[11px]">كل المعالجة داخل متصفحك — بدون رفع ملفات</span>
            <Link to="/tools" onClick={() => setOpen(false)} className="linkish text-xs font-bold">
              كل الأدوات ←
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/tools", label: "كل الأدوات" },
  { to: "/about", label: "من نحن" },
  { to: "/contact", label: "اتصل بنا" },
];

export function Header({ route }: { route: Route }) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [route.path]);

  const isActive = (to: string) =>
    route.path === to || (to === "/tools" && route.path.startsWith("/tool"));

  return (
    <header
      className="sticky top-0 z-50 border-b bd-line"
      style={{ background: "color-mix(in srgb, var(--bg) 86%, transparent)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="FileTools — الرئيسية">
          <LogoMark size={36} />
          <span className="leading-none">
            <span className="font-display block text-xl font-bold" dir="ltr">
              File<span className="c-teal">Tools</span>
            </span>
            <span className="c-muted mt-0.5 block text-[10.5px] font-medium">
              ورشة ملفاتك المجانية
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
          <Link
            to="/"
            className={cx(
              "font-display relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200",
              route.path === "/" ? "c-teal" : "c-muted hover:text-[var(--ink)]"
            )}
          >
            الرئيسية
            {route.path === "/" && (
              <span className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full" style={{ background: "var(--amber)" }} />
            )}
          </Link>

          <ServicesMenu route={route} />

          {NAV.slice(1).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cx(
                "font-display relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200",
                isActive(n.to) ? "c-teal" : "c-muted hover:text-[var(--ink)]"
              )}
            >
              {n.label}
              {isActive(n.to) && (
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
            <span>ابحث…</span>
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

      {/* قائمة الجوال مع أقسام قابلة للطي */}
      <div
        className={cx(
          "overflow-hidden border-b bd-line transition-all duration-300 md:hidden",
          open ? "max-h-[520px] overflow-y-auto opacity-100" : "max-h-0 border-b-0 opacity-0"
        )}
        style={{ background: "var(--surface)" }}
      >
        <nav className="flex flex-col px-4 py-2" aria-label="قائمة الجوال">
          <Link to="/" className={cx("font-display border-b bd-line py-3 text-sm font-semibold", route.path === "/" ? "c-teal" : "c-muted")}>
            الرئيسية
          </Link>

          {CATEGORIES.map((cat) => (
            <details key={cat.id} className="group border-b bd-line">
              <summary className="font-display flex list-none items-center gap-2.5 py-3 text-sm font-semibold c-muted">
                <span style={{ color: cat.color }}><Icon name={cat.icon} size={17} /></span>
                {cat.name}
                <span className="acc-chev ms-auto"><Icon name="chevron" size={15} /></span>
              </summary>
              <div className="grid grid-cols-2 gap-1 pb-3">
                {toolsOf(cat.id).map((t) => (
                  <Link key={t.slug} to={`/tool/${t.slug}`} className="c-muted flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs">
                    <span style={{ color: cat.color }}><Icon name={t.icon} size={12} /></span>
                    {t.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}

          {NAV.slice(1).map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cx(
                "font-display border-b bd-line py-3 text-sm font-semibold last:border-0",
                isActive(n.to) ? "c-teal" : "c-muted"
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
