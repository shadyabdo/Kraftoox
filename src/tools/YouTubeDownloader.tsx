import { useState } from "react";
import { InfoNote } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("youtube-downloader")!;

// قائمة خدمات بديلة تعمل فعلاً مع يوتيوب
const SERVICES = [
  { name: "Loader.to", url: "https://loader.to/en/", supportsIframe: true },
  { name: "Y2Mate", url: "https://www.y2mate.com/youtube", supportsIframe: false },
  { name: "SSYouTube", url: "https://ssyoutube.com", supportsIframe: false },
  { name: "9xBuddy", url: "https://9xbuddy.com", supportsIframe: false },
];

export default function YouTubeDownloader() {
  const { t, isAr } = useI18n();
  const [url, setUrl] = useState("");
  const [activeService, setActiveService] = useState(0);

  const handleCopyUrl = async () => {
    if (!url.trim()) return;
    const success = await copyText(url);
    if (success) {
      showToast(t("تم نسخ الرابط", "URL copied"));
    }
  };

  const handleOpenService = (serviceUrl: string) => {
    const finalUrl = url.trim() ? `${serviceUrl}${url.trim().includes("?v=") ? "" : "#"}${url.trim()}` : serviceUrl;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        {/* إدخال الرابط */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold">
            {t("رابط فيديو يوتيوب", "YouTube Video URL")}
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input flex-1"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              disabled={!url.trim()}
              className="btn btn-secondary !px-4"
              title={t("نسخ الرابط", "Copy URL")}
            >
              <Icon name="copy" size={18} />
            </button>
          </div>
        </div>

        {/* تبديل الخدمات */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {t("اختر خدمة التنزيل", "Choose download service")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((service, i) => (
              <button
                key={service.name}
                type="button"
                onClick={() => setActiveService(i)}
                className={`chip !py-2 ${activeService === i ? "!border-[var(--primary)] !text-[var(--primary)]" : ""}`}
              >
                {service.name}
                {service.supportsIframe && (
                  <span className="text-[10px] c-success">● {isAr ? "مدمج" : "embedded"}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* الخدمة المدمجة (Loader.to) */}
        {SERVICES[activeService].supportsIframe ? (
          <div className="rounded-xl border border-[var(--line)] overflow-hidden bg-[var(--surface2)]">
            <div className="bg-[var(--surface)] px-4 py-2 border-b border-[var(--line)] flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                {SERVICES[activeService].name}
              </span>
              <button
                type="button"
                onClick={() => handleOpenService(SERVICES[activeService].url)}
                className="text-xs c-primary hover:underline flex items-center gap-1"
              >
                {isAr ? "فتح في نافذة جديدة" : "Open in new window"}
                <Icon name="globe" size={12} />
              </button>
            </div>
            <iframe
              src={SERVICES[activeService].url}
              className="w-full border-0"
              style={{ height: "550px" }}
              title={SERVICES[activeService].name}
              allow="clipboard-write"
            />
          </div>
        ) : (
          /* الخدمات الأخرى - تفتح في نافذة جديدة */
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-8 text-center">
            <div className="mb-4">
              <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--teal-soft)] c-primary">
                <Icon name="globe" size={32} />
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2">
              {SERVICES[activeService].name}
            </h3>
            <p className="c-muted text-sm mb-6">
              {isAr
                ? "اضغط الزر أدناه لفتح خدمة التنزيل في نافذة جديدة، ثم الصق الرابط هناك."
                : "Click the button below to open the download service in a new window, then paste the URL there."}
            </p>
            <button
              type="button"
              onClick={() => handleOpenService(SERVICES[activeService].url)}
              className="btn btn-primary !px-8 !py-3"
            >
              <Icon name="globe" size={18} />
              {isAr ? `فتح ${SERVICES[activeService].name}` : `Open ${SERVICES[activeService].name}`}
            </button>
          </div>
        )}

        {/* تعليمات الاستخدام */}
        <div className="mt-4 rounded-lg bg-[var(--teal-soft)] border border-[var(--primary)] p-4">
          <p className="text-sm font-bold mb-2">
            {isAr ? "📋 كيفية الاستخدام:" : "📋 How to use:"}
          </p>
          <ol className="text-xs space-y-1 c-muted list-decimal list-inside">
            {isAr ? (
              <>
                <li>الصق رابط فيديو يوتيوب في الحقل أعلاه</li>
                <li>اضغط زر النسخ لنسخ الرابط</li>
                <li>اختر خدمة التنزيل (Loader.to مدمجة مباشرة)</li>
                <li>الصق الرابط في أداة التنزيل واختر الجودة</li>
                <li>اضغط تنزيل واحفظ الملف</li>
              </>
            ) : (
              <>
                <li>Paste the YouTube video URL in the field above</li>
                <li>Click the copy button to copy the URL</li>
                <li>Choose a download service (Loader.to is embedded directly)</li>
                <li>Paste the URL in the download tool and choose quality</li>
                <li>Click download and save the file</li>
              </>
            )}
          </ol>
        </div>
      </div>

      <div className="mt-6">
        <InfoNote>
          {isAr
            ? "نوفر عدة خدمات تنزيل بديلة. Loader.to مدمجة مباشرة في الصفحة. إذا لم تعمل خدمة، جرب الأخرى. تأكد من احترام حقوق الملكية الفكرية."
            : "We provide multiple alternative download services. Loader.to is embedded directly in the page. If one service doesn't work, try others. Please respect copyright laws."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}
