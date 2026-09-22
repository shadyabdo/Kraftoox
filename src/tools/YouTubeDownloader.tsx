import { useState, useEffect } from "react";
import { InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("youtube-downloader")!;

// Piped API instances (مجانية، مفتوحة المصدر، تدعم CORS)
const Piped_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.projectsegfau.lt",
  "https://pipedapi.in.projectsegfau.lt",
];

interface VideoStream {
  url: string;
  format: string;
  quality: string;
  mimeType: string;
  bitrate: number;
  width?: number;
  height?: number;
  fps?: number;
  videoOnly?: boolean;
  codec?: string;
}

interface AudioStream {
  url: string;
  format: string;
  quality: string;
  mimeType: string;
  bitrate: number;
  audioQuality?: string;
  codec?: string;
}

interface VideoInfo {
  title: string;
  thumbnailUrl: string;
  uploaderName: string;
  duration: number;
  views: number;
  uploadDate: string;
  videoStreams: VideoStream[];
  audioStreams: AudioStream[];
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchFromPiped(videoId: string): Promise<VideoInfo> {
  let lastError: Error | null = null;
  
  for (const instance of Piped_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        signal: AbortSignal.timeout(10000),
      });
      
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      
      const data = await res.json();
      
      if (!data.title && !data.videoStreams) {
        lastError = new Error("Invalid response");
        continue;
      }
      
      return {
        title: data.title || "Untitled",
        thumbnailUrl: data.thumbnailUrl || "",
        uploaderName: data.uploader || "Unknown",
        duration: data.duration || 0,
        views: data.views || 0,
        uploadDate: data.uploadDate || "",
        videoStreams: (data.videoStreams || []).filter((s: VideoStream) => s.url),
        audioStreams: (data.audioStreams || []).filter((s: AudioStream) => s.url),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      continue;
    }
  }
  
  throw lastError || new Error("All instances failed");
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(views: number): string {
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
}

// تصنيف الجودات وإزالة المكررات
function getUniqueVideoQualities(streams: VideoStream[]) {
  const seen = new Map<string, VideoStream>();
  
  // ترتيب حسب الجودة (الأعلى أولاً)
  const sorted = [...streams].sort((a, b) => {
    const hA = a.height || 0;
    const hB = b.height || 0;
    if (hA !== hB) return hB - hA;
    return (b.bitrate || 0) - (a.bitrate || 0);
  });
  
  for (const stream of sorted) {
    // استخدام الارتفاع كمعرف للجودة
    const key = stream.height ? `${stream.height}p` : stream.quality;
    if (!seen.has(key)) {
      seen.set(key, stream);
    }
  }
  
  return Array.from(seen.entries()).map(([label, stream]) => ({
    label: stream.height ? `${stream.height}p${stream.fps && stream.fps > 30 ? ` ${stream.fps}fps` : ""}` : label,
    stream,
    height: stream.height || 0,
  }));
}

function getUniqueAudioQualities(streams: AudioStream[]) {
  const seen = new Map<string, AudioStream>();
  
  // ترتيب حسب bitrate (الأعلى أولاً)
  const sorted = [...streams].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  
  for (const stream of sorted) {
    // استخدام bitrate كمعرف للجودة
    const key = `${stream.bitrate || stream.quality}`;
    if (!seen.has(key)) {
      seen.set(key, stream);
    }
  }
  
  return Array.from(seen.entries()).map(([key, stream]) => ({
    label: `${Math.round((stream.bitrate || 0) / 1000)}kbps ${stream.mimeType?.includes("opus") ? "(Opus)" : stream.mimeType?.includes("mp4") ? "(M4A)" : "(MP3)"}`,
    stream,
    bitrate: stream.bitrate || 0,
  }));
}

export default function YouTubeDownloader() {
  const { t, isAr } = useI18n();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState("");
  const [currentType, setCurrentType] = useState<"video" | "audio">("video");
  const [selectedStream, setSelectedStream] = useState<VideoStream | AudioStream | null>(null);

  const videoQualities = videoInfo ? getUniqueVideoQualities(videoInfo.videoStreams) : [];
  const audioQualities = videoInfo ? getUniqueAudioQualities(videoInfo.audioStreams) : [];

  // اختيار أول جودة متاحة عند تحميل الفيديو
  useEffect(() => {
    if (videoInfo) {
      if (currentType === "video" && videoQualities.length > 0) {
        setSelectedStream(videoQualities[0].stream);
      } else if (currentType === "audio" && audioQualities.length > 0) {
        setSelectedStream(audioQualities[0].stream);
      }
    }
  }, [videoInfo, currentType]);

  const handleFetchInfo = async () => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError(t("رابط غير صالح", "Invalid URL"));
      return;
    }

    setLoading(true);
    setError("");
    setVideoInfo(null);
    
    try {
      const info = await fetchFromPiped(videoId);
      
      if (info.videoStreams.length === 0 && info.audioStreams.length === 0) {
        throw new Error(t("لا توجد جودات متاحة لهذا الفيديو", "No qualities available for this video"));
      }
      
      setVideoInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("تعذّر جلب معلومات الفيديو", "Failed to fetch video info"));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!selectedStream || !videoInfo) return;

    setDownloading(true);
    
    try {
      // فتح الرابط في نافذة جديدة للتنزيل
      const link = document.createElement("a");
      link.href = selectedStream.url;
      const ext = selectedStream.mimeType?.includes("audio") ? "m4a" : "mp4";
      link.download = `${videoInfo.title}.${ext}`;
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
    setSelectedStream(null);
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
              className="btn btn-teal !px-6"
            >
              {loading ? <Spinner size={18} /> : <Icon name="search" size={18} />}
              {t("جلب المعلومات", "Fetch Info")}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--red-soft)] p-3 text-sm c-red">
            <Icon name="alert" size={16} className="inline-block ms-1" />
            {error}
          </div>
        )}

        {videoInfo && (
          <div className="anim-pop space-y-5">
            {/* معاينة الفيديو */}
            <div className="flex gap-4 rounded-xl border bd-line bg-surface2 p-4">
              <img
                src={videoInfo.thumbnailUrl}
                alt={videoInfo.title}
                className="h-24 w-40 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-bold leading-snug line-clamp-2">
                  {videoInfo.title}
                </h3>
                <p className="mt-1 text-sm c-muted">{videoInfo.uploaderName}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs c-muted">
                  <span>{formatDuration(videoInfo.duration)}</span>
                  <span>{formatViews(videoInfo.views)} {t("مشاهدة", "views")}</span>
                </div>
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
                  onClick={() => setCurrentType("video")}
                  className={`chip flex-1 !justify-center !py-2.5 ${currentType === "video" ? "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]" : ""}`}
                  disabled={videoQualities.length === 0}
                >
                  <Icon name="video" size={16} />
                  {t("فيديو", "Video")}
                  {videoQualities.length > 0 && (
                    <span className="ms-1 text-xs opacity-70">({videoQualities.length})</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentType("audio")}
                  className={`chip flex-1 !justify-center !py-2.5 ${currentType === "audio" ? "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]" : ""}`}
                  disabled={audioQualities.length === 0}
                >
                  <Icon name="mic" size={16} />
                  {t("صوت فقط", "Audio Only")}
                  {audioQualities.length > 0 && (
                    <span className="ms-1 text-xs opacity-70">({audioQualities.length})</span>
                  )}
                </button>
              </div>
            </div>

            {/* اختيار الجودة - عرض الجودات الفعلية فقط */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                {t("الجودة", "Quality")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {currentType === "video"
                  ? videoQualities.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => setSelectedStream(q.stream)}
                        className={`chip !justify-center !py-2.5 ${selectedStream === q.stream ? "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]" : ""}`}
                      >
                        {q.label}
                      </button>
                    ))
                  : audioQualities.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => setSelectedStream(q.stream)}
                        className={`chip !justify-center !py-2.5 ${selectedStream === q.stream ? "!border-[var(--teal)] !bg-[var(--teal-soft)] !text-[var(--teal)]" : ""}`}
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
                disabled={downloading || !selectedStream}
                className="btn btn-teal flex-1 !py-3"
              >
                {downloading ? <Spinner size={18} /> : <Icon name="download" size={18} />}
                {t("تنزيل", "Download")}
              </button>
              <button type="button" onClick={handleReset} className="btn btn-ghost !px-6">
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
            ? "هذه الأداة تستخدم شبكة Piped (مفتوحة المصدر) لاستخراج الفيديوهات. الجودات المعروضة هي الجودات الفعلية المتاحة للفيديو فقط. تأكد من احترام حقوق الملكية الفكرية."
            : "This tool uses the Piped network (open source) to extract videos. Only actually available qualities are shown. Please respect copyright laws."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}
