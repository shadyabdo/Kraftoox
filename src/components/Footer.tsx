import { useState } from "react";
import { IMAGE_TOOLS, PDF_TOOLS, VIDEO_TOOLS, DEVELOPER_TOOLS, TEXT_TOOLS, CONVERTER_TOOLS, OFFICE_TOOLS } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { Icon, LogoMark } from "./Icons";

const SITE_URL = "https://kraftoox.app/";

export function Footer() {
  const { t, isAr } = useI18n();
  const [copied, setCopied] = useState(false);

  return (
    <footer className="mt-20 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <LogoMark size={32} />
              <span className="font-display text-xl font-bold" dir="ltr">
                Kraft<span className="c-primary">oox</span>
              </span>
            </Link>
            <p className="c-muted text-sm leading-relaxed mb-4">
              {isAr
                ? "أدوات مجانية عبر الإنترنت لمعالجة الصور والملفات والفيديو والذكاء الاصطناعي. كل شيء يعمل داخل متصفحك."
                : "Free online tools for images, files, video, and AI. Everything works in your browser."}
            </p>
            <div className="flex items-center gap-3">
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
                className="btn btn-secondary !py-2 !px-3 !text-xs"
              >
                <Icon name={copied ? "check" : "link"} size={14} />
                {isAr ? "نسخ الرابط" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* Image Tools */}
          <div>
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <span className="c-primary"><Icon name="image" size={16} /></span>
              {isAr ? "أدوات الصور" : "Image Tools"}
            </h4>
            <ul className="space-y-2">
              {IMAGE_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm hover:c-primary transition-colors">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* PDF Tools */}
          <div>
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <span className="c-error"><Icon name="pdf" size={16} /></span>
              {isAr ? "أدوات PDF" : "PDF Tools"}
            </h4>
            <ul className="space-y-2">
              {PDF_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm hover:c-primary transition-colors">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Video & AI Tools */}
          <div>
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <span className="c-error"><Icon name="download" size={16} /></span>
              {isAr ? "أدوات الفيديو" : "Video Tools"}
            </h4>
            <ul className="space-y-2 mb-6">
              {VIDEO_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm hover:c-primary transition-colors">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <span style={{ color: "#18a303" }}><Icon name="file" size={16} /></span>
              LibreOffice
            </h4>
            <ul className="space-y-2">
              {OFFICE_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm hover:c-primary transition-colors">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developer Tools */}
          <div>
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <span style={{ color: "#10b981" }}><Icon name="code" size={16} /></span>
              {isAr ? "أدوات المطورين" : "Developer Tools"}
            </h4>
            <ul className="space-y-2">
              {DEVELOPER_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm hover:c-primary transition-colors">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Text & Converter Tools */}
          <div>
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <span style={{ color: "#8b5cf6" }}><Icon name="type" size={16} /></span>
              {isAr ? "أدوات النصوص" : "Text Tools"}
            </h4>
            <ul className="space-y-2 mb-6">
              {TEXT_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm hover:c-primary transition-colors">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <span style={{ color: "#f59e0b" }}><Icon name="convert" size={16} /></span>
              {isAr ? "أدوات التحويل" : "Converter Tools"}
            </h4>
            <ul className="space-y-2">
              {CONVERTER_TOOLS.map((tool) => (
                <li key={tool.slug}>
                  <Link to={`/tool/${tool.slug}`} className="c-muted text-sm hover:c-primary transition-colors">
                    {isAr ? tool.name : tool.nameEn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="c-muted text-sm">
            © 2026 Kraftoox — {isAr ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/about" className="c-muted text-sm hover:c-primary transition-colors">
              {t("من نحن", "About")}
            </Link>
            <Link to="/privacy" className="c-muted text-sm hover:c-primary transition-colors">
              {t("الخصوصية", "Privacy")}
            </Link>
            <Link to="/contact" className="c-muted text-sm hover:c-primary transition-colors">
              {t("اتصل بنا", "Contact")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
