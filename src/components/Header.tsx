import { useEffect, useRef, useState } from "react";
import { CATEGORIES, toolsOf } from "../data/tools";
import { useI18n, type Lang } from "../i18n";
import { cx } from "../lib/utils";
import { Link, navigate, type Route } from "../lib/router";
import { Icon, LogoMark, type IconName } from "./Icons";

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

/* غلاف قائمة منسدلة موحّد: يفتح بالنقر ويغلق خارجه وبـ Escape */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

/* ===== دروب داون قسم: الرابط نفسه يفتح قائمة أدواته ===== */
function SectionDropdown({
  slug,
  name,
  icon,
  color,
  active,
  route,
}: {
  slug: string;
  name: string;
  icon: IconName;
  color: string;
  active: boolean;
  route: Route;
}) {
  const { open, setOpen, ref } = useDropdown();
  const { lang, t } = useI18n();
  const tools = toolsOf(CATEGORIES.find((c) => c.slug === slug)!.id);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cx(
          "font-display relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
          active || open ? "c-teal" : "c-muted hover:text-[var(--ink)]"
        )}
      >
        {name}
        <span className={cx("transition-transform duration-300", open && "rotate-180")}>
          <Icon name="chevron" size={14} />
        </span>
        {active && (
          <span className="absolute inset-x-2.5 -bottom-[13px] h-[3px] rounded-full" style={{ background: color }} />
        )}
      </button>

      {open && (
        <div
          className="menu-panel-in absolute start-0 top-full z-50 mt-3 w-64"
          style={lang === "en" ? { left: 0, right: "auto" } : undefined}
          role="menu"
        >
          <div className="card !rounded-xl overflow-hidden p-1.5 shadow-xl">
            <div className="h-1 w-full rounded-t-lg" style={{ background: color }} />
            <Link
              to={`/${slug}`}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-surface2"
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color }}
              >
                <Icon name={icon} size={16} />
              </span>
              <span className="flex-1">
                <b className="font-display block text-[13px] leading-tight">{name}</b>
                <span className="c-muted text-[10.5px]">
                  {t(`صفحة القسم — ${tools.length} أدوات`, `Section page — ${tools.length} tools`)}
                </span>
              </span>
              <span className="c-muted"><Icon name="arrow" size={14} /></span>
            </Link>
            <div className="my-1 border-t bd-line" />
            <ul>
              {tools.map((tool, i) => (
                <li key={tool.slug} className="menu-item-in" style={{ animationDelay: `${i * 25}ms` }}>
                  <Link
                    to={`/tool/${tool.slug}`}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all duration-150 hover:bg-surface2 hover:ps-4",
                      route.path === `/tool/${tool.slug}` ? "font-bold" : "c-muted"
                    )}
                    style={route.path === `/tool/${tool.slug}` ? { color } : undefined}
                  >
                    <span style={{ color }}><Icon name={tool.icon} size={15} /></span>
                    <span className="flex-1">{lang === "en" ? tool.nameEn : tool.name}</span>
                    {tool.isNew && (
                      <span className="rounded bg-[var(--red)] px-1.5 py-px text-[8.5px] font-bold text-white">
                        {t("جديد", "NEW")}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== دروب داون اللغة ===== */
function LangDropdown() {
  const { open, setOpen, ref } = useDropdown();
  const { lang, set, t } = useI18n();

  const OPTIONS: Array<{ id: Lang; label: string; hint: string }> = [
    { id: "ar", label: "العربية", hint: "AR · RTL" },
    { id: "en", label: "English", hint: "EN · LTR" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("تغيير اللغة", "Change language")}
        className={cx(
          "flex h-10 items-center gap-1.5 rounded-xl border bd-line bg-surface px-2.5 text-sm font-semibold transition-all duration-200",
          open ? "border-[var(--teal)] c-teal" : "c-muted hover:border-[var(--teal)] hover:text-[var(--teal)]"
        )}
      >
        <Icon name="globe" size={16} />
        <span className="font-mono text-xs">{lang === "ar" ? "AR" : "EN"}</span>
        <span className={cx("transition-transform duration-300", open && "rotate-180")}>
          <Icon name="chevron" size={13} />
        </span>
      </button>

      {open && (
        <div className="menu-panel-in absolute end-0 top-full z-50 mt-2 w-44" role="menu">
          <div className="card !rounded-xl p-1.5 shadow-xl">
            {OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  set(o.id);
                  setOpen(false);
                }}
                className={cx(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-surface2",
                  lang === o.id ? "font-bold c-teal" : "c-muted"
                )}
              >
                <span>{o.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[9.5px] opacity-70">{o.hint}</span>
                  {lang === o.id && <Icon name="check" size={15} />}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Header({ route }: { route: Route }) {
  const { theme, toggle } = useTheme();
  const { lang, t, isAr } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [route.path, lang]);

  const NAV = [
    { to: "/about", label: t("من نحن", "About") },
    { to: "/contact", label: t("اتصل بنا", "Contact") },
  ];

  const isActive = (to: string) =>
    route.path === to || (to === "/tools" && route.path.startsWith("/tool"));

  return (
    <header
      className="sticky top-0 z-50 border-b bd-line"
      style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(12px)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Kraftoox">
          <LogoMark size={34} />
          <span className="leading-none">
            <span className="font-display block text-[19px] font-extrabold tracking-tight" dir="ltr">
              Kraft<span className="c-teal">oox</span>
            </span>
            <span className="c-muted mt-0.5 block text-[10px] font-medium">
              {t("ورشة الملفات المحلية", "The local file workshop")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label={t("التنقل الرئيسي", "Main navigation")}>
          <Link
            to="/"
            className={cx(
              "font-display relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
              route.path === "/" ? "c-teal" : "c-muted hover:text-[var(--ink)]"
            )}
          >
            {t("الرئيسية", "Home")}
            {route.path === "/" && (
              <span className="absolute inset-x-2.5 -bottom-[13px] h-[3px] rounded-full" style={{ background: "var(--teal)" }} />
            )}
          </Link>

          {CATEGORIES.map((cat) => (
            <SectionDropdown
              key={cat.slug}
              slug={cat.slug}
              name={isAr ? cat.name : cat.nameEn}
              icon={cat.icon}
              color={cat.color}
              route={route}
              active={
                route.path === `/${cat.slug}` ||
                (route.parts[0] === "tool" &&
                  toolsOf(cat.id).some((tool) => route.parts[1] === tool.slug))
              }
            />
          ))}

          <Link
            to="/tools"
            className={cx(
              "font-display relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
              isActive("/tools") ? "c-teal" : "c-muted hover:text-[var(--ink)]"
            )}
          >
            {t("كل الأدوات", "All tools")}
          </Link>

          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cx(
                "font-display relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200",
                isActive(n.to) ? "c-teal" : "c-muted hover:text-[var(--ink)]"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/tools?focus=search")}
            className="c-muted hidden h-10 items-center gap-2 rounded-xl border bd-line bg-surface px-3 text-sm transition-all duration-200 hover:border-[var(--teal)] hover:text-[var(--teal)] xl:flex"
            aria-label={t("بحث سريع عن أداة", "Quick tool search")}
          >
            <Icon name="search" size={15} />
            <span className="text-[13px]">{t("ابحث…", "Search…")}</span>
            <kbd className="font-mono rounded-md border bd-line bg-surface2 px-1.5 py-0.5 text-[10px]">/</kbd>
          </button>

          <LangDropdown />

          <button
            type="button"
            onClick={toggle}
            className="grid h-10 w-10 place-items-center rounded-xl border bd-line bg-surface c-muted transition-all duration-200 hover:border-[var(--amber)] hover:text-[var(--amber)]"
            aria-label={theme === "dark" ? t("الوضع الفاتح", "Light mode") : t("الوضع الليلي", "Dark mode")}
          >
            <span
              className="grid place-items-center transition-transform duration-500"
              style={{ transform: theme === "dark" ? "rotate(360deg)" : "rotate(0deg)" }}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-xl border bd-line bg-surface lg:hidden"
            aria-label={t("القائمة", "Menu")}
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} size={18} />
          </button>
        </div>
      </div>

      {/* قائمة الجوال */}
      <div
        className={cx(
          "overflow-hidden border-b bd-line transition-all duration-300 lg:hidden",
          open ? "max-h-[560px] overflow-y-auto opacity-100" : "max-h-0 border-b-0 opacity-0"
        )}
        style={{ background: "var(--surface)" }}
      >
        <nav className="flex flex-col px-4 py-2" aria-label={t("قائمة الجوال", "Mobile menu")}>
          <Link to="/" className={cx("font-display border-b bd-line py-3 text-sm font-semibold", route.path === "/" ? "c-teal" : "c-muted")}>
            {t("الرئيسية", "Home")}
          </Link>

          {CATEGORIES.map((cat) => (
            <details key={cat.id} className="group border-b bd-line">
              <summary className="font-display flex list-none items-center gap-2.5 py-3 text-sm font-semibold c-muted">
                <span style={{ color: cat.color }}><Icon name={cat.icon} size={16} /></span>
                {isAr ? cat.name : cat.nameEn}
                <span className="font-mono ms-auto text-[10px] opacity-70">{toolsOf(cat.id).length}</span>
                <span className="acc-chev"><Icon name="chevron" size={14} /></span>
              </summary>
              <div className="grid gap-0.5 pb-3">
                <Link to={`/${cat.slug}`} className="font-semibold text-[13px] c-teal px-2 py-1.5">
                  {t("صفحة القسم ←", "Section page ←")}
                </Link>
                {toolsOf(cat.id).map((tool) => (
                  <Link key={tool.slug} to={`/tool/${tool.slug}`} className="c-muted flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] hover:bg-surface2">
                    <span style={{ color: cat.color }}><Icon name={tool.icon} size={13} /></span>
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                ))}
              </div>
            </details>
          ))}

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
