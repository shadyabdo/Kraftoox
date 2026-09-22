import { Component, lazy, Suspense, useEffect, useState, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { Link, navigate, useRoute } from "./lib/router";
import { usePageMeta } from "./lib/seo";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Spinner, Toaster } from "./components/bits";
import { Icon } from "./components/Icons";
import { LangProvider, useI18n } from "./i18n";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Category from "./pages/Category";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";

/* تحميل كسول مع إعادة محاولة تلقائية عند فشل جلب الحزمة */
function lazyRetry(factory: () => Promise<{ default: ComponentType }>, retries = 2) {
  return lazy(() => {
    const attempt = (left: number): Promise<{ default: ComponentType }> =>
      factory().catch((err) => {
        if (left <= 0) throw err;
        return new Promise((r) => setTimeout(r, 350)).then(() => attempt(left - 1));
      });
    return attempt(retries);
  });
}

const CompressImage = lazyRetry(() => import("./tools/CompressImage"));
const ResizeImage = lazyRetry(() => import("./tools/ResizeImage"));
const ConvertImage = lazyRetry(() => import("./tools/ConvertImage"));
const CompressPdf = lazyRetry(() => import("./tools/CompressPdf"));
const MergePdf = lazyRetry(() => import("./tools/MergePdf"));
const ImagesToPdf = lazyRetry(() => import("./tools/ImagesToPdf"));
const ExtractPdfImages = lazyRetry(() => import("./tools/ExtractPdfImages"));
const UpscaleImage = lazyRetry(() => import("./tools/UpscaleImage"));
const ImageTranslator = lazyRetry(() => import("./tools/ImageTranslator"));
const YouTubeDownloader = lazyRetry(() => import("./tools/YouTubeDownloader"));
const JsonFormatter = lazyRetry(() => import("./tools/JsonFormatter"));
const Base64Encoder = lazyRetry(() => import("./tools/Base64Encoder"));
const HashGenerator = lazyRetry(() => import("./tools/HashGenerator"));
const PasswordGenerator = lazyRetry(() => import("./tools/PasswordGenerator"));
const UUIDGenerator = lazyRetry(() => import("./tools/UUIDGenerator"));
const WordCounter = lazyRetry(() => import("./tools/WordCounter"));
const TextCaseConverter = lazyRetry(() => import("./tools/TextCaseConverter"));
const LoremIpsum = lazyRetry(() => import("./tools/LoremIpsum"));
const ColorConverter = lazyRetry(() => import("./tools/ColorConverter"));
const NumberBaseConverter = lazyRetry(() => import("./tools/NumberBaseConverter"));

const TOOL_PAGES: Record<string, ComponentType> = {
  "compress-image": CompressImage,
  "resize-image": ResizeImage,
  "convert-image": ConvertImage,
  "compress-pdf": CompressPdf,
  "merge-pdf": MergePdf,
  "images-to-pdf": ImagesToPdf,
  "extract-pdf-images": ExtractPdfImages,
  "upscale-image": UpscaleImage,
  "image-translator": ImageTranslator,
  "youtube-downloader": YouTubeDownloader,
  "json-formatter": JsonFormatter,
  "base64-encoder": Base64Encoder,
  "hash-generator": HashGenerator,
  "password-generator": PasswordGenerator,
  "uuid-generator": UUIDGenerator,
  "word-counter": WordCounter,
  "text-case-converter": TextCaseConverter,
  "lorem-ipsum": LoremIpsum,
  "color-converter": ColorConverter,
  "number-base-converter": NumberBaseConverter,
};

const CATEGORY_SLUGS = ["images", "pdf", "video", "developer", "text", "converter"];

/* حاجز أخطاء: يعرض رسالة واضحة بدل الشاشة البيضاء عند أي عطل */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Kraftoox — خطأ في الصفحة:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--red-soft)] c-red">
            <Icon name="alert" size={30} />
          </span>
          <h1 className="font-display mt-5 text-3xl font-bold">حدث عطل مفاجئ في هذه الصفحة</h1>
          <p className="c-muted mt-2 text-sm leading-relaxed">
            لا تقلق — ملفاتك سليمة ولم يحدث أي فقدان. أعد تحميل الصفحة وسيعود كل شيء للعمل.
          </p>
          <p className="font-mono mt-3 max-w-full truncate rounded-lg bg-surface2 px-3 py-1.5 text-[10.5px] c-muted" dir="ltr">
            {String(this.state.error?.message ?? this.state.error).slice(0, 120)}
          </p>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-teal" onClick={() => window.location.reload()}>
              <Icon name="refresh" size={17} />
              إعادة التحميل
            </button>
            <Link to="/" className="btn btn-ghost">
              <Icon name="sparkle" size={17} />
              الرئيسية
            </Link>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <main className="grid min-h-[50vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="c-teal">
          <Spinner size={34} />
        </span>
        <p className="font-display text-sm font-semibold c-muted">جارٍ تجهيز الأداة…</p>
      </div>
    </main>
  );
}

function NotFound() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-mono text-6xl font-bold c-amber" dir="ltr">404</p>
      <h1 className="font-display mt-4 text-3xl font-bold">{t("الصفحة غير موجودة", "Page not found")}</h1>
      <p className="c-muted mt-2 text-sm leading-relaxed">
        {t(
          "الرابط الذي فتحته غير صحيح — لكن كل الأدوات ما تزال في انتظارك.",
          "The link you opened doesn't exist — but all the tools are still waiting for you."
        )}
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn btn-teal">
          <Icon name="sparkle" size={17} />
          {t("الصفحة الرئيسية", "Home")}
        </Link>
        <Link to="/tools" className="btn btn-ghost">
          {t("كل الأدوات", "All tools")}
        </Link>
      </div>
    </main>
  );
}

function AppInner() {
  const route = useRoute();
  const [showTop, setShowTop] = useState(false);

  const isTool = route.parts[0] === "tool";
  usePageMeta(isTool ? `/tool/${route.parts[1] ?? ""}` : route.path);

  /* اختصار "/" يفتح البحث الفوري عن الأدوات من أي صفحة */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable) return;
      e.preventDefault();
      navigate("/tools?focus=search");
    };
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  let page: ReactNode;
  if (route.path === "/") {
    page = <Landing />;
  } else if (route.path === "/tools") {
    page = (
      <Home
        query={route.query.get("q") ?? ""}
        focusSearch={route.query.get("focus") === "search"}
        scrollToTools
      />
    );
  } else if (route.parts.length === 1 && CATEGORY_SLUGS.includes(route.parts[0])) {
    page = <Category slug={route.parts[0]} />;
  } else if (isTool) {
    const slug = route.parts[1] ?? "";
    const ToolPage = TOOL_PAGES[slug];
    page = ToolPage ? <ToolPage /> : <NotFound />;
  } else if (route.path === "/about") {
    page = <About />;
  } else if (route.path === "/privacy") {
    page = <Privacy />;
  } else if (route.path === "/contact") {
    page = <Contact />;
  } else {
    page = <NotFound />;
  }

  /* الاشتراك في اللغة يعيد رسم الشجرة كاملة فتتحدث كل النصوص فور التبديل */
  const { lang } = useI18n();

  return (
    <div className="min-h-screen" data-lang={lang}>
      <div className="ambient" aria-hidden="true" />
      <div className="dotgrid" aria-hidden="true" />

      <Header route={route} />
      <ErrorBoundary key={route.path}>
        <Suspense fallback={<PageLoader />}>{page}</Suspense>
      </ErrorBoundary>
      <Footer />
      <Toaster />

      {/* زر العودة للأعلى — يظهر بعد التمرير */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="العودة للأعلى"
        className={
          "fixed bottom-5 end-5 z-[90] grid h-11 w-11 place-items-center rounded-xl border bd-line bg-surface shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[var(--teal)] hover:text-[var(--teal-ink)] c-muted " +
          (showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")
        }
      >
        <Icon name="up" size={19} />
      </button>
    </div>
  );
}

/* الجذر يلف التطبيق بمزوّد اللغة (عربي/إنجليزي) */
export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
