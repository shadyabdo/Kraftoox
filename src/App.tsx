import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { Link, useRoute } from "./lib/router";
import { usePageMeta } from "./lib/seo";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Spinner, Toaster } from "./components/bits";
import { Icon } from "./components/Icons";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Category from "./pages/Category";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";

/* تحميل كسول لمكتبات المعالجة الثقيلة (pdf-lib, pako, jszip…) */
const CompressImage = lazy(() => import("./tools/CompressImage"));
const ResizeImage = lazy(() => import("./tools/ResizeImage"));
const ConvertImage = lazy(() => import("./tools/ConvertImage"));
const ImageHost = lazy(() => import("./tools/ImageHost"));
const CompressPdf = lazy(() => import("./tools/CompressPdf"));
const MergePdf = lazy(() => import("./tools/MergePdf"));
const ImagesToPdf = lazy(() => import("./tools/ImagesToPdf"));
const ExtractPdfImages = lazy(() => import("./tools/ExtractPdfImages"));
const UpscaleImage = lazy(() => import("./tools/UpscaleImage"));
const UpscaleVideo = lazy(() => import("./tools/UpscaleVideo"));
const RemoveWatermark = lazy(() => import("./tools/RemoveWatermark"));
const RemoveWatermarkVideo = lazy(() => import("./tools/RemoveWatermarkVideo"));
const PhotoEditor = lazy(() => import("./tools/PhotoEditor"));
const AiImage = lazy(() => import("./tools/AiImage"));
const AiVideo = lazy(() => import("./tools/AiVideo"));
const VideoEditor = lazy(() => import("./tools/VideoEditor"));
const ScreenRecorder = lazy(() => import("./tools/ScreenRecorder"));

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
  "upscale-video": UpscaleVideo,
  "remove-watermark": RemoveWatermark,
  "remove-watermark-video": RemoveWatermarkVideo,
  "photo-editor": PhotoEditor,
  "ai-image": AiImage,
  "ai-video": AiVideo,
  "video-editor": VideoEditor,
  "screen-recorder": ScreenRecorder,
};

const CATEGORY_SLUGS = ["images", "pdf", "video", "ai"];

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
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--amber-soft)] c-amber">
        <Icon name="file" size={30} />
      </span>
      <h1 className="font-display mt-5 text-3xl font-bold">الصفحة غير موجودة</h1>
      <p className="c-muted mt-2 text-sm leading-relaxed">
        يبدو أن الرابط الذي فتحته غير صحيح — لكن كل أدواتنا ما تزال في انتظارك.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn btn-teal">
          <Icon name="sparkle" size={17} />
          الصفحة الرئيسية
        </Link>
        <Link to="/tools" className="btn btn-ghost">
          كل الأدوات
        </Link>
      </div>
    </main>
  );
}

export default function App() {
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

  return (
    <div className="min-h-screen">
      {/* خلفية محيطية: تدرجات إشعاعية ناعمة + شبكة نقاط */}
      <div className="ambient" aria-hidden="true" />
      <div className="dotgrid" aria-hidden="true" />

      <Header route={route} />
      <Suspense fallback={<PageLoader />}>{page}</Suspense>
      <Footer />
      <Toaster />
    </div>
  );
}
