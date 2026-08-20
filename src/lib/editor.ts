/* محرر الفيديو المحلي — خط زمني يُرسَم على Canvas ويُرمّز بـ MediaRecorder */

export interface EditorClip {
  id: string;
  kind: "video" | "image";
  src: string;
  file?: File;
  name: string;
  nativeDur: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  filter: string;
  text: string;
  textPos: "top" | "center" | "bottom";
  transition: "none" | "fade";
}

export interface FilterDef {
  id: string;
  label: string;
  css: string;
  shotstack?: string;
}

export const FILTERS: FilterDef[] = [
  { id: "none", label: "بدون", css: "" },
  { id: "bw", label: "أبيض وأسود", css: "grayscale(1)", shotstack: "greyscale" },
  { id: "sepia", label: "سيبيا", css: "sepia(0.85)", shotstack: "sepia" },
  { id: "invert", label: "معكوس", css: "invert(1)", shotstack: "invert" },
  { id: "warm", label: "دافئ", css: "saturate(1.5) sepia(0.22) contrast(1.05) brightness(1.04)", shotstack: "kodachrome" },
  { id: "cool", label: "بارد", css: "saturate(0.9) hue-rotate(10deg) brightness(1.02)", shotstack: "bleach" },
  { id: "vivid", label: "مشبع", css: "saturate(1.7) contrast(1.12)", shotstack: "technicolor" },
];

export function clipLength(c: EditorClip): number {
  return Math.max(0.4, (c.trimEnd - c.trimStart) / c.speed);
}

export function timelineLength(clips: EditorClip[]): number {
  return clips.reduce((s, c) => s + clipLength(c), 0);
}

export interface RenderOutput {
  blob: Blob;
  mime: string;
}

interface RenderOpts {
  width: number;
  height: number;
  onProgress: (p: number) => void;
  signal?: AbortSignal;
}

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return (
    ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    ) ?? null
  );
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = src;
    v.onloadeddata = () => resolve(v);
    v.onerror = () => reject(new Error("تعذّر قراءة المقطع"));
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("تعذّر قراءة الصورة"));
    img.src = src;
  });
}

function seekTo(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      v.removeEventListener("seeked", onSeeked);
      resolve();
    };
    v.addEventListener("seeked", onSeeked);
    v.currentTime = Math.min(Math.max(0, t), Math.max(0, (v.duration || t) - 0.05));
  });
}

export async function renderTimeline(clips: EditorClip[], opts: RenderOpts): Promise<RenderOutput> {
  const mime = pickMime();
  if (!mime) throw new Error("المتصفح لا يدعم تسجيل الفيديو");
  if (!clips.length) throw new Error("أضف مقاطع أولاً");

  const { width: w, height: h } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  const stream = canvas.captureStream(30);
  let audioCtx: AudioContext | null = null;
  let dest: MediaStreamAudioDestinationNode | null = null;
  try {
    audioCtx = new AudioContext();
    dest = audioCtx.createMediaStreamDestination();
    stream.addTrack(dest.stream.getAudioTracks()[0]);
  } catch {
    /* بدون صوت */
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: h >= 1080 ? 10_000_000 : 6_000_000,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

  const total = timelineLength(clips);
  let aborted = false;
  opts.signal?.addEventListener("abort", () => (aborted = true));

  const done = new Promise<RenderOutput>((resolve) => {
    recorder.onstop = () => {
      audioCtx?.close().catch(() => undefined);
      resolve({ blob: new Blob(chunks, { type: mime.split(";")[0] }), mime });
    };
  });

  const drawText = (clip: EditorClip) => {
    if (!clip.text.trim()) return;
    const fs = Math.round(h * 0.045);
    ctx.save();
    ctx.filter = "none";
    ctx.font = `700 ${fs}px "IBM Plex Sans Arabic", Tahoma, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const y = clip.textPos === "top" ? h * 0.12 : clip.textPos === "center" ? h * 0.5 : h * 0.88;
    ctx.lineWidth = fs * 0.18;
    ctx.strokeStyle = "rgba(0,0,0,0.75)";
    ctx.strokeText(clip.text, w / 2, y, w * 0.9);
    ctx.fillStyle = "#fff";
    ctx.fillText(clip.text, w / 2, y, w * 0.9);
    ctx.restore();
  };

  const drawCover = (src: CanvasImageSource, sw: number, sh: number, zoom = 1) => {
    const base = Math.max(w / sw, h / sh) * zoom;
    const dw = sw * base;
    const dh = sh * base;
    ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  };

  const fadeAlpha = (t: number, len: number, clip: EditorClip): number => {
    if (clip.transition === "none") return 0;
    const F = Math.min(0.4, len / 3);
    if (t < F) return 1 - t / F;
    if (t > len - F) return (t - (len - F)) / F;
    return 0;
  };

  const waitFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

  let elapsed = 0;
  recorder.start(400);

  for (const clip of clips) {
    if (aborted) break;
    const len = clipLength(clip);

    if (clip.kind === "image") {
      const img = await loadImage(clip.src);
      const startAt = performance.now();
      while (!aborted) {
        const t = (performance.now() - startAt) / 1000;
        if (t >= len) break;
        ctx.filter = clip.filter;
        drawCover(img, img.naturalWidth, img.naturalHeight, 1.02 + 0.08 * (t / len));
        ctx.filter = "none";
        drawText(clip);
        const fa = fadeAlpha(t, len, clip);
        if (fa > 0) {
          ctx.fillStyle = `rgba(0,0,0,${fa})`;
          ctx.fillRect(0, 0, w, h);
        }
        opts.onProgress(Math.min(1, (elapsed + t) / total));
        await waitFrame();
      }
      elapsed += len;
    } else {
      const video = await loadVideo(clip.src);
      await seekTo(video, clip.trimStart);
      video.playbackRate = Math.min(4, Math.max(0.25, clip.speed));

      let audioNode: MediaElementAudioSourceNode | null = null;
      if (audioCtx && dest) {
        try {
          audioNode = audioCtx.createMediaElementSource(video);
          audioNode.connect(dest);
        } catch {
          audioNode = null;
        }
      }

      await video.play().catch(() => undefined);
      while (!aborted) {
        const t = video.currentTime - clip.trimStart;
        const played = Math.max(0, t) / clip.speed;
        if (video.ended || video.currentTime >= clip.trimEnd - 0.03 || played >= len) break;
        ctx.filter = clip.filter;
        drawCover(video, video.videoWidth, video.videoHeight);
        ctx.filter = "none";
        drawText(clip);
        const fa = fadeAlpha(played, len, clip);
        if (fa > 0) {
          ctx.fillStyle = `rgba(0,0,0,${fa})`;
          ctx.fillRect(0, 0, w, h);
        }
        opts.onProgress(Math.min(1, (elapsed + played) / total));
        await waitFrame();
      }
      video.pause();
      audioNode?.disconnect();
      elapsed += len;
    }
  }

  await new Promise((r) => setTimeout(r, 150));
  if (recorder.state !== "inactive") recorder.stop();
  return done;
}

/* تحميل مدة مقطع فيديو من ملف */
export function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = URL.createObjectURL(file);
    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 10;
      resolve(d);
    };
    v.onerror = () => resolve(10);
  });
}
