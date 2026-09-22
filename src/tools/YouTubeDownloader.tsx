import { useState } from "react";
import { InfoNote } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("youtube-downloader")!;

export default function YouTubeDownloader() {
  const { t, isAr } = useI18n();
  const [url, setUrl] = useState("");
  const [showEmbed, setShowEmbed] = useState(false);

  const handleStart = () => {
    if (!url.trim()) return;
    setShowEmbed(true);
  };

  const handleCopyUrl = async () => {
    if (!url.trim()) return;
    const success = await copyText(url);
    if (success) {
      showToast(t("تم نسخ الرابط - الصقه في الأداة أدناه", "URL copied - paste it in the tool below"));
    }
  };

  const handleOpenInNewTab = () => {
    window.open("https://cobalt.tools", "_blank", "noopener,noreferrer");
  };

  const handleReset = () => {
    setUrl("");
    setShowEmbed(false);
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        {!showEmbed ? (
          <>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold">
                {t("رابط فيديو يوتيوب", "YouTube Video URL")}
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input flex-1"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!url.trim()}
                  className="btn btn-primary !px-6"
                >
                  <Icon name="download" size={18} />
                  {t("تنزيل", "Download")}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-6">
              <div className="text-center mb-4">
                <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--teal-soft)] c-primary">
                  <Icon name="video" size={32} />
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-center">
                {isAr ? "تنزيل سريع وآمن" : "Fast & Secure Download"}
              </h3>
              <p className="c-muted text-sm text-center mb-4">
                {isAr
                  ? "الصق رابط الفيديو واضغط تنزيل - ستفتح أداة التنزيل مباشرة"
                  : "Paste the video URL and click Download - the download tool will open directly"}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs">
                <span className="chip">✓ {isAr ? "مجاني" : "Free"}</span>
                <span className="chip">✓ {isAr ? "بدون علامة مائية" : "No Watermark"}</span>
                <span className="chip">✓ {isAr ? "جودات متعددة" : "Multiple Qualities"}</span>
                <span className="chip">✓ {isAr ? "آمن" : "Secure"}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" dir="ltr">
                  {url}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="btn btn-secondary !py-2 !px-3 !text-xs"
                  title={t("نسخ الرابط", "Copy URL")}
                >
                  <Icon name="copy" size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  className="btn btn-secondary !py-2 !px-3 !text-xs"
                  title={t("فتح في نافذة جديدة", "Open in new tab")}
                >
                  <Icon name="globe" size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary !py-2 !px-3 !text-xs"
                  title={t("رجوع", "Back")}
                >
                  <Icon name="refresh" size={16} />
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--line)] overflow-hidden bg-[var(--surface2)]">
              <div className="bg-[var(--surface)] px-4 py-2 border-b border-[var(--line)] flex items-center justify-between">
                <span className="text-sm font-bold">
                  {isAr ? "أداة التنزيل" : "Download Tool"}
                </span>
                <a
                  href="https://cobalt.tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs c-primary hover:underline"
                >
                  {isAr ? "فتح في نافذة جديدة" : "Open in new window"} ↗
                </a>
              </div>
              <iframe
                src="https://cobalt.tools"
                className="w-full border-0"
                style={{ height: "600px" }}
                title="Cobalt Video Downloader"
                allow="clipboard-write"
              />
            </div>

            <div className="mt-4 rounded-lg bg-[var(--teal-soft)] border border-[var(--primary)] p-4">
              <p className="text-sm font-bold mb-2">
                {isAr ? "📋 كيفية الاستخدام:" : "📋 How to use:"}
              </p>
              <ol className="text-xs space-y-1 c-muted list-decimal list-inside">
                {isAr ? (
                  <>
                    <li>انسخ الرابط من الزر أعلاه (تم نسخه تلقائياً إذا ضغطت عليه)</li>
                    <li>الصق الرابط في حقل الإدخال في أداة التنزيل أدناه</li>
                    <li>اختر الجودة المطلوبة (فيديو أو صوت)</li>
                    <li>اضغط تنزيل واحفظ الملف</li>
                  </>
                ) : (
                  <>
                    <li>Copy the URL from the button above (it's copied if you clicked it)</li>
                    <li>Paste the URL in the input field in the download tool below</li>
                    <li>Choose your preferred quality (video or audio)</li>
                    <li>Click download and save the file</li>
                  </>
                )}
              </ol>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="btn btn-primary flex-1"
              >
                <Icon name="copy" size={16} />
                {t("نسخ الرابط", "Copy URL")}
              </button>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="btn btn-secondary flex-1"
              >
                <Icon name="globe" size={16} />
                {t("فتح الموقع", "Open Website")}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6">
        <InfoNote>
          {isAr
            ? "نستخدم خدمة Cobalt (مفتوحة المصدر) لتنزيل الفيديوهات. الخدمة مجانية تماماً وتدعم جميع صيغ الفيديو والصوت. تأكد من احترام حقوق الملكية الفكرية."
            : "We use Cobalt service (open source) to download videos. The service is completely free and supports all video and audio formats. Please respect copyright laws."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}
