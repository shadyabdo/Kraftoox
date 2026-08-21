import { Component, lazy, Suspense, type ComponentType, type ErrorInfo, type ReactNode } from "react";
import { Link, useRoute } from "./lib/router";
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
const ImageHost = lazyRetry(() => import("./tools/ImageHost"));
const CompressPdf = lazyRetry(() => import("./tools/CompressPdf"));
const MergePdf = lazyRetry(() => import("./tools/MergePdf"));
const ImagesToPdf = lazyRetry(() => import("./tools/ImagesToPdf"));
const ExtractPdfImages = lazyRetry(() => import("./tools/ExtractPdfImages"));
const UpscaleImage = lazyRetry(() => import("./tools/UpscaleImage"));
const RemoveWatermark = lazyRetry(() => import("./tools/RemoveWatermark"));
const PhotoEditor = lazyRetry(() => import("./tools/PhotoEditor"));
const VideoEditor = lazyRetry(() => import("./tools/VideoEditor"));

const TOOL_PAGES: Record<string, ComponentType> = {
  "compress-image": CompressImage,
  "resize-image": ResizeImage,
  "convert-image": ConvertImage,
  "image-host": ImageHost,
  "compress-pdf": CompressPdf,
  "merge-pdf": MergePdf,
  "images-to-pdf": ImagesToPdf,
  "extract-pdf-images": ExtractPdfImages,
  "upscale-image": UpscaleImage,
  "remove-watermark": RemoveWatermark,
  "photo-editor": PhotoEditor,
  "video-editor": VideoEditor,
};

const CATEGORY_SLUGS = ["images", "pdf", "video"];

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

  const isTool = route.parts[0] === "tool";
  usePageMeta(isTool ? `/tool/${route.parts[1] ?? ""}` : route.path);

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
