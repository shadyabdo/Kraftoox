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

  const handleCopyUrl = async () => {
    if (!url.trim()) return;
    const success = await copyText(url);
    if (success) {
      showToast(t("تم نسخ الرابط", "URL copied"));
    }
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

        {/* أداة التنزيل المدمجة */}
        <div className="rounded-xl border border-[var(--line)] overflow-hidden bg-[var(--surface2)]">
          <div className="bg-[var(--surface)] px-4 py-2 border-b border-[var(--line)] flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              {isAr ? "أداة التنزيل" : "Download Tool"}
            </span>
            <a
              href={`https://10downloader.com/download?v=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs c-primary hover:underline flex items-center gap-1"
            >
              {isAr ? "فتح في نافذة جديدة" : "Open in new window"}
              <Icon name="globe" size={12} />
            </a>
          </div>
          <iframe
            src={"https://10downloader.com/download?v=" + encodeURIComponent(url)}
            className="w-full border-0"
            style={{ height: "550px" }}
            title="YouTube Downloader"
            allow="clipboard-write"
          />
        </div>

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
                <li>الصق الرابط في أداة التنزيل المدمجة</li>
                <li>اختر الجودة المطلوبة (فيديو أو صوت)</li>
                <li>اضغط تنزيل واحفظ الملف</li>
              </>
            ) : (
              <>
                <li>Paste the YouTube video URL in the field above</li>
                <li>Click the copy button to copy the URL</li>
                <li>Paste the URL in the embedded download tool</li>
                <li>Choose your preferred quality (video or audio)</li>
                <li>Click download and save the file</li>
              </>
            )}
          </ol>
        </div>
      </div>

      <div className="mt-6">
        <InfoNote>
          {isAr
            ? "نستخدم خدمة 10downloader لتنزيل الفيديوهات. الخدمة مجانية وتدعم جميع صيغ الفيديو والصوت. تأكد من احترام حقوق الملكية الفكرية."
            : "We use 10downloader service to download videos. The service is free and supports all video and audio formats. Please respect copyright laws."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}
