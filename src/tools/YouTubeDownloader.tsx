import { useState, useEffect } from "react";
import { InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("youtube-downloader")!;

// Cobalt API - خدمة متخصصة لتنزيل الفيديوهات
const COBALT_API = "https://api.cobalt.tools/api/json";

// CORS Proxies - لحل مشكلة الحظر من المتصفح
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
];

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
}

interface QualityOption {
  label: string;
  value: string;
  type: "video" | "audio";
}

const VIDEO_QUALITIES: QualityOption[] = [
  { label: "4K (2160p)", value: "2160", type: "video" },
  { label: "1440p", value: "1440", type: "video" },
  { label: "1080p", value: "1080", type: "video" },
  { label: "720p", value: "720", type: "video" },
  { label: "480p", value: "480", type: "video" },
  { label: "360p", value: "360", type: "video" },
  { label: "240p", value: "240", type: "video" },
  { label: "144p", value: "144", type: "video" },
];

const AUDIO_QUALITIES: QualityOption[] = [
  { label: "MP3 320kbps", value: "320", type: "audio" },
  { label: "MP3 256kbps", value: "256", type: "audio" },
  { label: "MP3 192kbps", value: "192", type: "audio" },
  { label: "MP3 128kbps", value: "128", type: "audio" },
  { label: "MP3 96kbps", value: "96", type: "audio" },
  { label: "MP3 64kbps", value: "64", type: "audio" },
];

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
  const res = await fetch(noembedUrl);
  if (!res.ok) throw new Error("Failed to fetch video info");
  const data = await res.json();
  return {
    title: data.title || "Untitled",
    thumbnail: data.thumbnail_url || "",
    duration: "",
    author: data.author_name || "Unknown",
  };
}

async function downloadFromCobalt(url: string, quality: string, type: "video" | "audio"): Promise<string> {
  const payload = {
    url,
    vCodec: "h264",
    vQuality: quality,
    aFormat: "mp3",
    isAudioOnly: type === "audio",
    filenamePattern: "basic",
  };

  // محاولة الاتصال المباشر أولاً
  try {
    const res = await fetch(COBALT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "error") {
        throw new Error(data.text || "Download error");
      }
      if (data.status === "redirect" || data.status === "stream") {
        return data.url;
      }
    }
  } catch {
    // إذا فشل الاتصال المباشر، جرب CORS proxies
  }

  // محاولة استخدام CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(COBALT_API);
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "error") {
          throw new Error(data.text || "Download error");
        }
        if (data.status === "redirect" || data.status === "stream") {
          return data.url;
        }
      }
    } catch {
      continue;
    }
  }

  throw new Error("فشل الاتصال بخدمة التنزيل. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.");
}

export default function YouTubeDownloader() {
  const { t, isAr } = useI18n();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityOption>(VIDEO_QUALITIES[2]);
  const [error, setError] = useState("");
  const [currentType, setCurrentType] = useState<"video" | "audio">("video");

  const handleFetchInfo = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError(t("رابط غير صالح", "Invalid URL"));
      return;
    }

    setLoading(true);
    setError("");
    try {
      const info = await fetchVideoInfo(videoId);
      setVideoInfo(info);
    } catch {
      setError(t("تعذّر جلب معلومات الفيديو", "Failed to fetch video info"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;

    setDownloading(true);
    setError("");
    try {
      const downloadUrl = await downloadFromCobalt(url, selectedQuality.value, currentType);
      
      // Trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${videoInfo.title}.${currentType === "audio" ? "mp3" : "mp4"}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(t("بدأ التنزيل", "Download started"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("فشل التنزيل", "Download failed"));
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setVideoInfo(null);
    setError("");
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
              placeholder="https://www.youtube.com/watch?v=..."
              className="input flex-1"
              dir="ltr"
              disabled={loading || downloading}
              onKeyDown={(e) => e.key === "Enter" && handleFetchInfo()}
            />
            <button
              type="button"
              onClick={handleFetchInfo}
              disabled={loading || downloading || !url}
              className="btn btn-primary !px-6"
            >
              {loading ? <Spinner size={18} /> : <Icon name="search" size={18} />}
              {t("جلب المعلومات", "Fetch Info")}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--red-soft)] p-3 text-sm c-error">
            <Icon name="alert" size={16} className="inline-block ms-1" />
            {error}
          </div>
        )}

        {videoInfo && (
          <div className="anim-pop space-y-5">
            {/* معاينة الفيديو */}
            <div className="flex gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-4">
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="h-24 w-40 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-display text-base font-bold leading-snug">{videoInfo.title}</h3>
                <p className="mt-1 text-sm c-muted">{videoInfo.author}</p>
              </div>
            </div>

            {/* اختيار النوع */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                {t("النوع", "Type")}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentType("video");
                    setSelectedQuality(VIDEO_QUALITIES[2]);
                  }}
                  className={`chip flex-1 !justify-center !py-2.5 ${currentType === "video" ? "!border-[var(--primary)] !bg-[var(--teal-soft)] !text-[var(--primary)]" : ""}`}
                >
                  <Icon name="video" size={16} />
                  {t("فيديو", "Video")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentType("audio");
                    setSelectedQuality(AUDIO_QUALITIES[0]);
                  }}
                  className={`chip flex-1 !justify-center !py-2.5 ${currentType === "audio" ? "!border-[var(--primary)] !bg-[var(--teal-soft)] !text-[var(--primary)]" : ""}`}
                >
                  <Icon name="mic" size={16} />
                  {t("صوت فقط", "Audio Only")}
                </button>
              </div>
            </div>

            {/* اختيار الجودة */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                {t("الجودة", "Quality")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(currentType === "video" ? VIDEO_QUALITIES : AUDIO_QUALITIES).map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setSelectedQuality(q)}
                    className={`chip !justify-center !py-2.5 ${selectedQuality.value === q.value ? "!border-[var(--primary)] !bg-[var(--teal-soft)] !text-[var(--primary)]" : ""}`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* أزرار التنزيل */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn btn-primary flex-1 !py-3"
              >
                {downloading ? <Spinner size={18} /> : <Icon name="download" size={18} />}
                {t("تنزيل", "Download")}
              </button>
              <button type="button" onClick={handleReset} className="btn btn-secondary !px-6">
                <Icon name="refresh" size={18} />
                {t("جديد", "New")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <InfoNote>
          {isAr
            ? "هذه الأداة تستخدم خدمة Cobalt (مفتوحة المصدر) لاستخراج الفيديوهات. تأكد من احترام حقوق الملكية الفكرية وعدم تنزيل محتوى محمي بدون إذن."
            : "This tool uses Cobalt service (open source) to extract videos. Please respect copyright laws and do not download protected content without permission."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}
