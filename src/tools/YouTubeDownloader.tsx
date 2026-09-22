import { useState } from "react";
import { InfoNote } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("youtube-downloader")!;

export default function YouTubeDownloader() {
  const { t, isAr } = useI18n();
  const [url, setUrl] = useState("");

  const handleOpenCobalt = () => {
    if (!url.trim()) return;
    
    // فتح cobalt.tools في نافذة جديدة مع الرابط
    const cobaltUrl = `https://cobalt.tools/#${encodeURIComponent(url)}`;
    window.open(cobaltUrl, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleOpenCobalt();
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-6">
          <label className="mb-2 block text-sm font-bold">
            {t("رابط فيديو يوتيوب", "YouTube Video URL")}
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.youtube.com/watch?v=..."
              className="input flex-1"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleOpenCobalt}
              disabled={!url.trim()}
              className="btn btn-primary !px-6"
            >
              <Icon name="download" size={18} />
              {t("تنزيل", "Download")}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-6 text-center">
          <div className="mb-4">
            <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--teal-soft)] c-primary">
              <Icon name="video" size={32} />
            </span>
          </div>
          <h3 className="text-lg font-bold mb-2">
            {isAr ? "تنزيل سريع وآمن" : "Fast & Secure Download"}
          </h3>
          <p className="c-muted text-sm mb-4">
            {isAr
              ? "الصق رابط الفيديو أعلاه واضغط تنزيل - سيفتح موقع Cobalt في نافذة جديدة لتنزيل الفيديو مباشرة."
              : "Paste the video URL above and click Download - Cobalt will open in a new window to download the video directly."}
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="chip">✓ {isAr ? "مجاني" : "Free"}</span>
            <span className="chip">✓ {isAr ? "بدون علامة مائية" : "No Watermark"}</span>
            <span className="chip">✓ {isAr ? "جودات متعددة" : "Multiple Qualities"}</span>
            <span className="chip">✓ {isAr ? "آمن" : "Secure"}</span>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-bold mb-3">
            {isAr ? "كيف يعمل؟" : "How it works?"}
          </h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--teal-soft)] c-primary flex items-center justify-center font-bold text-sm">
                1
              </span>
              <div>
                <p className="font-semibold text-sm">
                  {isAr ? "الصق رابط الفيديو" : "Paste video URL"}
                </p>
                <p className="c-muted text-xs">
                  {isAr 
                    ? "انسخ رابط فيديو يوتيوب والصقه في الحقل أعلاه"
                    : "Copy the YouTube video URL and paste it in the field above"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--teal-soft)] c-primary flex items-center justify-center font-bold text-sm">
                2
              </span>
              <div>
                <p className="font-semibold text-sm">
                  {isAr ? "اضغط تنزيل" : "Click Download"}
                </p>
                <p className="c-muted text-xs">
                  {isAr 
                    ? "سيفتح موقع Cobalt في نافذة جديدة مع الرابط جاهزاً"
                    : "Cobalt will open in a new window with the URL ready"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--teal-soft)] c-primary flex items-center justify-center font-bold text-sm">
                3
              </span>
              <div>
                <p className="font-semibold text-sm">
                  {isAr ? "اختر الجودة ونزّل" : "Choose quality & download"}
                </p>
                <p className="c-muted text-xs">
                  {isAr 
                    ? "اختر الجودة المطلوبة (فيديو أو صوت) واضغط تنزيل"
                    : "Select your preferred quality (video or audio) and click download"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <InfoNote>
          {isAr
            ? "نستخدم خدمة Cobalt (مفتوحة المصدر) لتنزيل الفيديوهات. تأكد من احترام حقوق الملكية الفكرية وعدم تنزيل محتوى محمي بدون إذن."
            : "We use Cobalt service (open source) to download videos. Please respect copyright laws and do not download protected content without permission."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}
