import { useEffect, useRef, useState } from "react";
import { CATEGORIES, toolsOf } from "../data/tools";
import { useI18n, type Lang } from "../i18n";
import { cx } from "../lib/utils";
import { Link, type Route } from "../lib/router";
import { Icon, LogoMark, type IconName } from "./Icons";

/* غلاف قائمة منسدلة موحّد */
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

/* ===== دروب داون قسم ===== */
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
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
          active || open ? "c-primary" : "c-muted hover:text-[var(--ink)]"
        )}
      >
        {name}
        <span className={cx("transition-transform duration-200", open && "rotate-180")}>
          <Icon name="chevron" size={14} />
        </span>
      </button>

      {open && (
        <div
          className="absolute start-0 top-full z-50 mt-2 w-64 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl overflow-hidden"
          style={lang === "en" ? { left: 0, right: "auto" } : undefined}
          role="menu"
        >
          <div className="h-1 w-full" style={{ background: color }} />
          <Link
            to={`/${slug}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface2)] transition-colors"
          >
            <span
              className="grid h-10 w-10 place-items-center rounded-lg"
              style={{ background: `color-mix(in srgb, ${color} 15%, var(--surface2))`, color }}
            >
              <Icon name={icon} size={20} />
            </span>
            <span className="flex-1">
              <b className="block text-sm font-bold">{name}</b>
              <span className="c-muted text-xs">
                {t(`صفحة القسم — ${tools.length} أدوات`, `Section page — ${tools.length} tools`)}
              </span>
            </span>
          </Link>
          <div className="border-t border-[var(--line)]" />
          <ul className="max-h-80 overflow-y-auto">
            {tools.map((tool) => (
              <li key={tool.slug}>
                <Link
                  to={`/tool/${tool.slug}`}
                  onClick={() => setOpen(false)}
                  className={cx(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface2)]",
                    route.path === `/tool/${tool.slug}` ? "font-bold" : "c-muted"
                  )}
                  style={route.path === `/tool/${tool.slug}` ? { color } : undefined}
                >
                  <span style={{ color }}><Icon name={tool.icon} size={16} /></span>
                  <span className="flex-1">{lang === "en" ? tool.nameEn : tool.name}</span>
                  {tool.isNew && (
                    <span className="text-xs font-bold text-[var(--error)] bg-[var(--red-soft)] px-2 py-0.5 rounded">
                      {t("جديد", "NEW")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
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
    { id: "ar", label: "العربية", hint: "AR" },
    { id: "en", label: "English", hint: "EN" },
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
          "flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors",
          open ? "c-primary" : "c-muted hover:text-[var(--ink)]"
        )}
      >
        <Icon name="globe" size={16} />
        <span className="font-mono text-xs">{lang === "ar" ? "AR" : "EN"}</span>
        <span className={cx("transition-transform duration-200", open && "rotate-180")}>
          <Icon name="chevron" size={13} />
        </span>
      </button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-40 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-xl overflow-hidden" role="menu">
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
                "flex w-full items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-[var(--surface2)]",
                lang === o.id ? "font-bold c-primary" : "c-muted"
              )}
            >
              <span>{o.label}</span>
              {lang === o.id && <Icon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header({ route }: { route: Route }) {
  const { lang, t, isAr } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [route.path, lang]);

  const NAV = [
    { to: "/about", label: t("من نحن", "About") },
    { to: "/contact", label: t("اتصل بنا", "Contact") },
  ];

  const isActive = (to: string) =>
    route.path === to || (to === "/tools" && route.path.startsWith("/tool"));

  return (
    <header
      className={cx(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "bg-[var(--surface)] border-b border-[var(--line)]" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Kraftoox">
          <LogoMark size={32} />
          <span className="font-display text-xl font-bold" dir="ltr">
            Kraft<span className="c-primary">oox</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={t("التنقل الرئيسي", "Main navigation")}>
          <Link
            to="/"
            className={cx(
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              route.path === "/" ? "c-primary" : "c-muted hover:text-[var(--ink)]"
            )}
          >
            {t("الرئيسية", "Home")}
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
              "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              isActive("/tools") ? "c-primary" : "c-muted hover:text-[var(--ink)]"
            )}
          >
            {t("كل الأدوات", "All tools")}
          </Link>

          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cx(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                isActive(n.to) ? "c-primary" : "c-muted hover:text-[var(--ink)]"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LangDropdown />

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center rounded-lg lg:hidden"
            aria-label={t("القائمة", "Menu")}
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {/* قائمة الجوال */}
      <div
        className={cx(
          "overflow-hidden border-t border-[var(--line)] transition-all duration-300 lg:hidden bg-[var(--surface)]",
          open ? "max-h-[560px] overflow-y-auto" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col px-4 py-2" aria-label={t("قائمة الجوال", "Mobile menu")}>
          <Link to="/" className={cx("border-b border-[var(--line)] py-3 text-sm font-semibold", route.path === "/" ? "c-primary" : "c-muted")}>
            {t("الرئيسية", "Home")}
          </Link>

          {CATEGORIES.map((cat) => (
            <details key={cat.id} className="group border-b border-[var(--line)]">
              <summary className="flex list-none items-center gap-2.5 py-3 text-sm font-semibold c-muted">
                <span style={{ color: cat.color }}><Icon name={cat.icon} size={16} /></span>
                {isAr ? cat.name : cat.nameEn}
                <span className="font-mono ms-auto text-xs opacity-70">{toolsOf(cat.id).length}</span>
                <span className="acc-chev"><Icon name="chevron" size={14} /></span>
              </summary>
              <div className="grid gap-0.5 pb-3">
                <Link to={`/${cat.slug}`} className="font-semibold text-sm c-primary px-2 py-1.5">
                  {t("صفحة القسم ←", "Section page ←")}
                </Link>
                {toolsOf(cat.id).map((tool) => (
                  <Link key={tool.slug} to={`/tool/${tool.slug}`} className="c-muted flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface2)]">
                    <span style={{ color: cat.color }}><Icon name={tool.icon} size={14} /></span>
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
                "border-b border-[var(--line)] py-3 text-sm font-semibold last:border-0",
                isActive(n.to) ? "c-primary" : "c-muted"
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
