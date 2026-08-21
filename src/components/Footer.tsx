import { useState } from "react";
import { IMAGE_TOOLS, PDF_TOOLS } from "../data/tools";
import { Link } from "../lib/router";
import { copyText, showToast } from "../lib/utils";
import { Icon, LogoMark } from "./Icons";

const SITE_URL = "https://kraftoox.app/";

export function Footer() {
  const [copied, setCopied] = useState(false);

  const shareLinks = [
    {
      label: "مشاركة على X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        "Kraftoox — ورشة مجانية: صور، فيديو، PDF، تسجيل شاشة وذكاء اصطناعي داخل المتصفح"
      )}&url=${encodeURIComponent(SITE_URL)}`,
    },
    {
      label: "مشاركة على واتساب",
      href: `https://wa.me/?text=${encodeURIComponent(
        "Kraftoox — ورشة مجانية للصور والفيديو وPDF والذكاء الاصطناعي داخل المتصفح: " + SITE_URL
      )}`,
    },
    {
      label: "مشاركة على فيسبوك",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}`,
    },
  ];

  return (
    <footer className="mt-20 border-t bd-line" style={{ background: "var(--surface)" }}>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <LogoMark size={38} />
              <span className="font-display text-xl font-bold" dir="ltr">
                Kraft<span className="c-teal">oox</span>
              </span>
            </Link>
            <p className="c-muted mt-3 max-w-xs text-sm leading-relaxed">
              سبع عشرة أداة مجانية لمعالجة الصور وملفات PDF والفيديو وتوليد المحتوى بالذكاء
              الاصطناعي — تعمل داخل متصفحك، بدون تسجيل، وبدون أن تغادر ملفاتك جهازك أبداً.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border bd-line bg-surface2 px-3 py-2 text-xs font-medium">
              <span className="c-teal">
                <Icon name="shield" size={16} />
              </span>
              <span>
                المعالجة محلية 100% — <Link to="/privacy" className="linkish">اقرأ سياسة الخصوصية</Link>
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {shareLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-9 w-9 place-items-center rounded-lg border bd-line c-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--teal)] hover:text-[var(--teal)]"
                >
                  <Icon name="send" size={15} />
                </a>
              ))}
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(SITE_URL);
                  if (ok) {
                    setCopied(true);
                    showToast("تم نسخ رابط الموقع");
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                aria-label="نسخ رابط الموقع"
                className="grid h-9 w-9 place-items-center rounded-lg border bd-line c-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--teal)] hover:text-[var(--teal)]"
              >
                <Icon name={copied ? "check" : "link"} size={15} />
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-display mb-3 flex items-center gap-1.5 text-sm font-bold">
              <span className="c-teal"><Icon name="image" size={15} /></span>
              أدوات الصور
            </h4>
            <ul className="space-y-2">
              {IMAGE_TOOLS.map((t) => (
                <li key={t.slug}>
                  <Link to={`/tool/${t.slug}`} className="c-muted text-sm transition-colors hover:text-[var(--teal)]">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display mb-3 flex items-center gap-1.5 text-sm font-bold">
              <span className="c-red"><Icon name="pdf" size={15} /></span>
              أدوات PDF
            </h4>
            <ul className="space-y-2">
              {PDF_TOOLS.map((t) => (
                <li key={t.slug}>
                  <Link to={`/tool/${t.slug}`} className="c-muted text-sm transition-colors hover:text-[var(--red)]">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display mb-3 flex items-center gap-1.5 text-sm font-bold">
              <span className="c-amber"><Icon name="layers" size={15} /></span>
              الموقع
            </h4>
            <ul className="space-y-2">
              <li><Link to="/" className="c-muted text-sm transition-colors hover:text-[var(--teal)]">الرئيسية</Link></li>
              <li><Link to="/tools" className="c-muted text-sm transition-colors hover:text-[var(--teal)]">كل الأدوات</Link></li>
              <li><Link to="/images" className="c-muted text-sm transition-colors hover:text-[var(--teal)]">قسم الصور</Link></li>
              <li><Link to="/pdf" className="c-muted text-sm transition-colors hover:text-[var(--teal)]">قسم PDF</Link></li>
              <li><Link to="/about" className="c-muted text-sm transition-colors hover:text-[var(--teal)]">من نحن</Link></li>
              <li><Link to="/privacy" className="c-muted text-sm transition-colors hover:text-[var(--teal)]">سياسة الخصوصية</Link></li>
              <li><Link to="/contact" className="c-muted text-sm transition-colors hover:text-[var(--teal)]">اتصل بنا</Link></li>
            </ul>
          </div>
        </div>

        <div className="c-muted mt-10 flex flex-col items-center justify-between gap-3 border-t bd-line pt-6 text-xs sm:flex-row">
          <p>© 2026 Kraftoox — جميع الحقوق محفوظة. صُنع بعناية للمستخدم العربي.</p>
          <p className="flex items-center gap-1.5">
            يعمل بأدوات مفتوحة المصدر:
            <span className="font-mono" dir="ltr">pdf-lib · pako · Canvas API</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
