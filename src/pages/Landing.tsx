import { useEffect, useMemo, useRef, useState } from "react";
import { TOOLS, IMAGE_TOOLS, PDF_TOOLS, VIDEO_TOOLS, DEVELOPER_TOOLS, TEXT_TOOLS, CONVERTER_TOOLS, getTool, type ToolDef } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { getProcessedCount, matchesQuery, copyText, showToast } from "../lib/utils";
import { Icon } from "../components/Icons";
import { ToolCard } from "../components/ToolCard";
import { Reveal } from "../components/Reveal";

export default function Landing() {
  const { isAr, t } = useI18n();
  const [q, setQ] = useState("");
  const [processed, setProcessed] = useState(getProcessedCount());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onCount = () => setProcessed(getProcessedCount());
    window.addEventListener("ft:count", onCount);
    return () => window.removeEventListener("ft:count", onCount);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(
    () =>
      q.trim()
        ? TOOLS.filter((tool) => matchesQuery(`${tool.name} ${tool.nameEn} ${tool.short} ${tool.shortEn} ${tool.keywords} ${tool.keywordsEn}`, q))
        : [],
    [q]
  );

  const searching = q.trim().length > 0;

  const QUICK = ["compress-image", "youtube-downloader", "image-translator", "upscale-image"]
    .map((s) => getTool(s))
    .filter((tool): tool is ToolDef => !!tool);

  return (
    <main>
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="c-primary">{isAr ? "Kraftoox" : "Kraftoox"}</span>
          </h1>
          <p className="text-xl sm:text-2xl text-[var(--ink-secondary)] mb-4">
            {isAr 
              ? "أدوات مجانية عبر الإنترنت"
              : "Free Online Tools"}
          </p>
          <p className="text-base sm:text-lg c-muted max-w-2xl mx-auto">
            {isAr
              ? "أدوات مجانية لمعالجة الصور والملفات والفيديو والذكاء الاصطناعي. كل شيء يعمل داخل متصفحك بدون رفع ملفاتك."
              : "Free tools for images, files, video, and AI. Everything works in your browser without uploading your files."}
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) {
                window.location.hash = `/tools?q=${encodeURIComponent(q.trim())}`;
              }
            }}
            className="relative"
          >
            <span className="absolute inset-y-0 start-4 grid place-items-center c-muted">
              <Icon name="search" size={20} />
            </span>
            <input
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isAr ? "ابحث عن أداة… (اضغط /)" : "Search for a tool… (press /)"}
              className="input !rounded-xl !py-4 !ps-12 !pe-4 !text-base"
              aria-label={isAr ? "ابحث عن أداة" : "Search for a tool"}
            />
          </form>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {QUICK.map((tool) => (
            <Link key={tool.slug} to={`/tool/${tool.slug}`} className="chip">
              <span style={{ color: tool.color }}><Icon name={tool.icon} size={16} /></span>
              {isAr ? tool.name : tool.nameEn}
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-16">
          <div className="text-center">
            <p className="text-3xl font-bold c-primary">{TOOLS.length}</p>
            <p className="c-muted text-sm mt-1">{isAr ? "أداة" : "Tools"}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold c-primary">{processed}</p>
            <p className="c-muted text-sm mt-1">{isAr ? "ملف معالج" : "Files Processed"}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold c-primary">0</p>
            <p className="c-muted text-sm mt-1">{isAr ? "رفع للخوادم" : "Uploads to Servers"}</p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        {searching ? (
          <div>
            <h2 className="text-2xl font-bold mb-8 text-center">
              {filtered.length > 0 
                ? (isAr ? `${filtered.length} نتيجة` : `${filtered.length} Results`)
                : (isAr ? "لا توجد نتائج" : "No Results")}
            </h2>
            {filtered.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="c-muted text-lg">
                  {isAr ? "جرّب كلمات أخرى" : "Try different keywords"}
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Image Tools */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span className="c-primary"><Icon name="image" size={24} /></span>
                <h2 className="text-2xl font-bold">{isAr ? "أدوات الصور" : "Image Tools"}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {IMAGE_TOOLS.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>

            {/* PDF Tools */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span className="c-error"><Icon name="pdf" size={24} /></span>
                <h2 className="text-2xl font-bold">{isAr ? "أدوات PDF" : "PDF Tools"}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {PDF_TOOLS.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>

            {/* Video Tools */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span className="c-error"><Icon name="download" size={24} /></span>
                <h2 className="text-2xl font-bold">{isAr ? "أدوات الفيديو" : "Video Tools"}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {VIDEO_TOOLS.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>

            {/* Developer Tools */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span style={{ color: "#10b981" }}><Icon name="code" size={24} /></span>
                <h2 className="text-2xl font-bold">{isAr ? "أدوات المطورين" : "Developer Tools"}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {DEVELOPER_TOOLS.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>

            {/* Text Tools */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span style={{ color: "#8b5cf6" }}><Icon name="type" size={24} /></span>
                <h2 className="text-2xl font-bold">{isAr ? "أدوات النصوص" : "Text Tools"}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {TEXT_TOOLS.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>

            {/* Converter Tools */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <span style={{ color: "#f59e0b" }}><Icon name="convert" size={24} /></span>
                <h2 className="text-2xl font-bold">{isAr ? "أدوات التحويل" : "Converter Tools"}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {CONVERTER_TOOLS.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </div>

            {/* AI Tools */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="c-primary"><Icon name="ai" size={24} /></span>
                <h2 className="text-2xl font-bold">{isAr ? "أدوات الذكاء الاصطناعي" : "AI Tools"}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {["image-translator"].map((slug) => {
                  const tool = getTool(slug);
                  return tool ? <ToolCard key={tool.slug} tool={tool} /> : null;
                })}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 border-t border-[var(--line)]">
        <h2 className="text-3xl font-bold text-center mb-12">
          {isAr ? "لماذا Kraftoox؟" : "Why Kraftoox?"}
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--surface2)] mb-4">
              <Icon name="shield" size={32} className="c-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{isAr ? "خصوصية كاملة" : "Complete Privacy"}</h3>
            <p className="c-muted">
              {isAr 
                ? "ملفاتك لا تغادر جهازك. كل المعالجة تتم محلياً في متصفحك."
                : "Your files never leave your device. All processing happens locally in your browser."}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--surface2)] mb-4">
              <Icon name="bolt" size={32} className="c-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{isAr ? "سريع وسهل" : "Fast & Simple"}</h3>
            <p className="c-muted">
              {isAr 
                ? "لا تسجيل، لا حدود، لا علامات مائية. فقط اختر الأداة وابدأ."
                : "No sign-up, no limits, no watermarks. Just pick a tool and start."}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--surface2)] mb-4">
              <Icon name="globe" size={32} className="c-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{isAr ? "مجاني بالكامل" : "Completely Free"}</h3>
            <p className="c-muted">
              {isAr 
                ? "جميع الأدوات مجانية 100%. لا اشتراكات، لا رسوم خفية."
                : "All tools are 100% free. No subscriptions, no hidden fees."}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center border-t border-[var(--line)]">
        <h2 className="text-3xl font-bold mb-4">
          {isAr ? "ابدأ الآن" : "Start Now"}
        </h2>
        <p className="c-muted text-lg mb-8 max-w-2xl mx-auto">
          {isAr 
            ? "اختر أي أداة وابدأ في معالجة ملفاتك فوراً. سريع، مجاني، وآمن."
            : "Pick any tool and start processing your files immediately. Fast, free, and secure."}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/tools" className="btn btn-primary">
            <Icon name="sparkle" size={18} />
            {isAr ? "كل الأدوات" : "All Tools"}
          </Link>
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText("https://kraftoox.app/");
              if (ok) showToast(isAr ? "تم نسخ الرابط" : "Link copied");
            }}
            className="btn btn-secondary"
          >
            <Icon name="link" size={18} />
            {isAr ? "شارك الموقع" : "Share Site"}
          </button>
        </div>
      </section>
    </main>
  );
}
