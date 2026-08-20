/* محرك معالجة الفيديو داخل المتصفح — Canvas captureStream + MediaRecorder */

export interface NormRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export function videoSupported(): boolean {
  return pickMime() !== null && !!HTMLCanvasElement.prototype.captureStream;
}

export interface ProcessVideoOptions {
  scale?: number;
  blurRect?: NormRect;
  onProgress: (p: number) => void;
  signal?: AbortSignal;
}

export interface ProcessVideoResult {
  blob: Blob;
  mime: string;
  width: number;
  height: number;
}

/* يعيد ترميز الفيديو إطاراً بإطار مع تكبير أو طمس منطقة محددة، مع الحفاظ على الصوت */
export function processVideo(file: File, opts: ProcessVideoOptions): Promise<ProcessVideoResult> {
  return new Promise((resolve, reject) => {
    const mime = pickMime();
    if (!mime) {
      reject(new Error("المتصفح لا يدعم تسجيل الفيديو (MediaRecorder)"));
      return;
    }

    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    let raf = 0;
    let recorder: MediaRecorder | null = null;
    let audioCtx: AudioContext | null = null;
    let settled = false;

    const cleanup = () => {
      cancelAnimationFrame(raf);
      video.pause();
      URL.revokeObjectURL(url);
      if (audioCtx) audioCtx.close().catch(() => undefined);
    };

    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    opts.signal?.addEventListener("abort", () => fail(new Error("aborted")));

    video.onerror = () => fail(new Error("تعذّر قراءة ملف الفيديو — الصيغة قد تكون غير مدعومة"));

    video.onloadedmetadata = async () => {
      try {
        const scale = opts.scale ?? 1;
        const outW = Math.min(3840, Math.round(video.videoWidth * scale));
        const outH = Math.min(3840, Math.round(video.videoHeight * scale));

        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const videoStream = canvas.captureStream(30);
        let combined: MediaStream = videoStream;

        /* محاولة الحفاظ على الصوت الأصلي */
        try {
          audioCtx = new AudioContext();
          const src = audioCtx.createMediaElementSource(video);
          const dest = audioCtx.createMediaStreamDestination();
          src.connect(dest);
          combined = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch {
          combined = videoStream;
        }

        recorder = new MediaRecorder(combined, {
          mimeType: mime,
          videoBitsPerSecond: Math.min(16_000_000, 6_000_000 * scale),
        });

        const chunks: BlobPart[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve({ blob: new Blob(chunks, { type: mime.split(";")[0] }), mime, width: outW, height: outH });
        };
        recorder.onerror = () => fail(new Error("فشل تسجيل الفيديو"));

        const draw = () => {
          ctx.drawImage(video, 0, 0, outW, outH);
          if (opts.blurRect) {
            const r = opts.blurRect;
            const rx = r.x * outW;
            const ry = r.y * outH;
            const rw = Math.max(2, r.w * outW);
            const rh = Math.max(2, r.h * outH);
            ctx.save();
            ctx.beginPath();
            ctx.rect(rx, ry, rw, rh);
            ctx.clip();
            /* رقعة مطموسة من نفس الإطار — تخفي العلامة المائية بمظهر طبيعي */
            const pad = 1.25;
            ctx.filter = "blur(18px) saturate(1.05)";
            ctx.drawImage(
              video,
              (rx / outW) * video.videoWidth * (1 - (pad - 1)),
              (ry / outH) * video.videoHeight * (1 - (pad - 1)),
              video.videoWidth * (rw / outW) * pad,
              video.videoHeight * (rh / outH) * pad,
              rx - (rw * (pad - 1)) / 2,
              ry - (rh * (pad - 1)) / 2,
              rw * pad,
              rh * pad
            );
            ctx.filter = "none";
            ctx.restore();
          }
          if (video.duration > 0) {
            opts.onProgress(Math.min(1, video.currentTime / video.duration));
          }
        };

        const loop = () => {
          if (video.ended || video.paused) return;
          draw();
          raf = requestAnimationFrame(loop);
        };

        video.onended = () => {
          draw();
          setTimeout(() => recorder?.state !== "inactive" && recorder?.stop(), 120);
        };

        recorder.start(300);
        await video.play();
        loop();
      } catch (err) {
        fail(err instanceof Error ? err : new Error("فشل بدء المعالجة"));
      }
    };
  });
}

/* تحميل عنصر فيديو للمعاينة */
export function loadVideoEl(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = () => reject(new Error("تعذّر قراءة ملف الفيديو"));
  });
}
