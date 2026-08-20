import { useEffect, useState } from "react";
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

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/tools", label: "الأدوات" },
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
              أدوات الملفات المجانية
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
          {NAV.map((n) => (
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
                <span
                  className="absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full"
                  style={{ background: "var(--amber)" }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/?focus=search")}
            className="c-muted hidden h-10 items-center gap-2 rounded-xl border bd-line bg-surface px-3 text-sm transition-all duration-200 hover:border-[var(--teal)] hover:text-[var(--teal)] sm:flex"
            aria-label="بحث سريع عن أداة"
          >
            <Icon name="search" size={16} />
            <span>ابحث عن أداة…</span>
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

      {/* قائمة الجوال */}
      <div
        className={cx(
          "overflow-hidden border-b bd-line transition-all duration-300 md:hidden",
          open ? "max-h-64 opacity-100" : "max-h-0 border-b-0 opacity-0"
        )}
        style={{ background: "var(--surface)" }}
      >
        <nav className="flex flex-col px-4 py-2" aria-label="قائمة الجوال">
          {NAV.map((n) => (
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
