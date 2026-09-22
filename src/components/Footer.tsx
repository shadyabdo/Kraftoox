import { useState } from "react";
import { IMAGE_TOOLS, PDF_TOOLS, VIDEO_TOOLS } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { Icon, LogoMark } from "./Icons";

const SITE_URL = "https://kraftoox.app/";

export function Footer() {
  const { t, isAr } = useI18n();
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        isAr ? "Kraftoox — ورشة ملفات احترافية" : "Kraftoox — Professional File Workshop"
      )}&url=${encodeURIComponent(SITE_URL)}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(
        (isAr ? "Kraftoox — ورشة ملفات احترافية: " : "Kraftoox — Professional File Workshop: ") + SITE_URL
      )}`,
    },
  ];

  return (
    <footer className="mt-20 border-t bd-line" style={{ background: "var(--surface)" }}>
      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* Bento Grid */}
        <div className="bento bento-4 mb-12">
          {/* العمود الأول - الشعار */}
          <div className="bento-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <LogoMark size={40} />
              <span className="font-display text-2xl font-extrabold" dir="ltr">
                Kraft<span className="gradient-text">oox</span>
              </span>
            </Link>
            <p className="c-muted mb-6 max-w-md text-sm leading-relaxed">
              {isAr
                ? "ورشة ملفات احترافية — 14 أداة مجانية تعمل بالكامل داخل متصفحك، بدون تسجيل، وبدون أن تغادر ملفاتك جهازك أبداً."
                : "Professional file workshop — 14 free tools running entirely in your browser, no sign-up, your files never leave your device."}
            </p>
            <div className="flex items-center gap-3">
              {shareLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-xl glass c-muted transition-all duration-200 hover:-translate-y-1 hover:c-teal"
                >
                  <Icon name="send" size={16} />
                </a>
              ))}
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(SITE_URL);
                  if (ok) {
                    setCopied(true);
                    showToast(isAr ? "تم نسخ الرابط" : "Link copied");
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                aria-label={isAr ? "نسخ رابط الموقع" : "Copy site link"}
                className="grid h-10 w-10 place-items-center rounded-xl glass c-muted transition-all duration-200 hover:-translate-y-1 hover:c-teal"
              >
                <Icon name={copied ? "check" : "link"} size={16} />
              </button>
            </div>
          </div>

          {/* أدوات الصور */}
          <div>
            <h4 className="font-display mb-4 flex items-center gap-1.5 text-sm font-bold">
              <span className="c-teal"><Icon name="image" size={15} /></span>
              {isAr ? "أدوات الصور" : "Image Tools"}
            </h4>
            <ul className="space-y-2">
              {IMAGE_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm transition-colors hover:c-teal">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* أدوات PDF */}
          <div>
            <h4 className="font-display mb-4 flex items-center gap-1.5 text-sm font-bold">
              <span className="c-red"><Icon name="pdf" size={15} /></span>
              {isAr ? "أدوات PDF" : "PDF Tools"}
            </h4>
            <ul className="space-y-2">
              {PDF_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm transition-colors hover:c-teal">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* الصف الثاني */}
        <div className="bento bento-4 mb-12">
          {/* أدوات الفيديو */}
          <div>
            <h4 className="font-display mb-4 flex items-center gap-1.5 text-sm font-bold">
              <span className="c-red"><Icon name="download" size={15} /></span>
              {isAr ? "أدوات الفيديو" : "Video Tools"}
            </h4>
            <ul className="space-y-2">
              {VIDEO_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm transition-colors hover:c-teal">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* الموقع */}
          <div className="bento-span-2">
            <h4 className="font-display mb-4 flex items-center gap-1.5 text-sm font-bold">
              <span className="c-teal"><Icon name="layers" size={15} /></span>
              {isAr ? "الموقع" : "Site"}
            </h4>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
              <Link to="/" className="c-muted text-sm transition-colors hover:c-teal">{t("الرئيسية", "Home")}</Link>
              <Link to="/tools" className="c-muted text-sm transition-colors hover:c-teal">{t("كل الأدوات", "All Tools")}</Link>
              <Link to="/images" className="c-muted text-sm transition-colors hover:c-teal">{t("قسم الصور", "Images")}</Link>
              <Link to="/pdf" className="c-muted text-sm transition-colors hover:c-teal">{t("قسم PDF", "PDF")}</Link>
              <Link to="/video" className="c-muted text-sm transition-colors hover:c-teal">{t("قسم الفيديو", "Video")}</Link>
              <Link to="/about" className="c-muted text-sm transition-colors hover:c-teal">{t("من نحن", "About")}</Link>
              <Link to="/privacy" className="c-muted text-sm transition-colors hover:c-teal">{t("الخصوصية", "Privacy")}</Link>
              <Link to="/contact" className="c-muted text-sm transition-colors hover:c-teal">{t("اتصل بنا", "Contact")}</Link>
            </div>
          </div>
        </div>

        {/* الشريط السفلي */}
        <div className="c-muted flex flex-col items-center justify-between gap-3 border-t bd-line pt-8 text-xs sm:flex-row">
          <p>© 2026 Kraftoox — {isAr ? "جميع الحقوق محفوظة" : "All rights reserved"}</p>
          <p className="flex items-center gap-1.5">
            {isAr ? "صُنع بـ" : "Made with"} <Icon name="heart" size={12} className="c-red" /> {isAr ? "للمستخدم العربي" : "for Arabic users"}
          </p>
          <p className="flex items-center gap-1.5">
            {isAr ? "يعمل بتقنيات" : "Powered by"}
            <span className="font-mono" dir="ltr">React · Tailwind · pdf-lib</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
