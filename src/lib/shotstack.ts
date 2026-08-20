/* عميل Shotstack Edit API — خدمة سحابية جاهزة لتحرير الفيديو وتصديره MP4
   https://shotstack.io — مفتاح مجاني (Sandbox) يمنح 20 دقيقة رندر شهرياً */

import { FILTERS, clipLength, type EditorClip } from "./editor";

const API = "https://api.shotstack.io/edit/v1";
const KEY_STORAGE = "ft-shotstack-key";

export function getStoredKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function storeKey(key: string): void {
  try {
    localStorage.setItem(KEY_STORAGE, key);
  } catch {
    /* ignore */
  }
}

export type ShotstackResolution = "sd" | "hd" | "full-hd";

interface ShotstackAsset {
  type: "video" | "image" | "title";
  src?: string;
  text?: string;
  style?: string;
  background?: string;
  trim?: number;
  volume?: number;
}

interface ShotstackClip {
  asset: ShotstackAsset;
  start: number;
  length: number;
  speed?: number;
  effect?: string;
  transition?: { in?: string; out?: string };
  position?: string;
}

/* بناء مخطط التحرير بصيغة Shotstack من مقاطع المحرر */
export function buildShotstackEdit(
  clips: EditorClip[],
  resolution: ShotstackResolution
): Record<string, unknown> {
  const mainTrack: ShotstackClip[] = [];
  const textTrack: ShotstackClip[] = [];
  let cursor = 0;

  clips.forEach((c, i) => {
    const len = Math.round(clipLength(c) * 100) / 100;
    const filter = FILTERS.find((f) => f.css === c.filter);
    const effect = filter?.shotstack;

    const clip: ShotstackClip = {
      asset:
        c.kind === "video"
          ? { type: "video", src: c.src, trim: Math.round(c.trimStart * 100) / 100, volume: 1 }
          : { type: "image", src: c.src },
      start: cursor,
      length: len,
    };
    if (c.kind === "video" && c.speed !== 1) clip.speed = c.speed;
    if (effect) clip.effect = effect;
    if (c.transition === "fade") {
      clip.transition = {};
      if (i > 0) clip.transition.in = "fade";
      if (i < clips.length - 1) clip.transition.out = "fade";
      if (!clip.transition.in && !clip.transition.out) delete clip.transition;
    }
    mainTrack.push(clip);

    if (c.text.trim()) {
      textTrack.push({
        asset: {
          type: "title",
          text: c.text.trim(),
          style: "minimal",
          background: "transparent",
        },
        start: cursor,
        length: len,
        position: c.textPos,
      });
    }
    cursor += len;
  });

  return {
    timeline: {
      background: "#000000",
      tracks: [
        ...(textTrack.length ? [{ clips: textTrack }] : []),
        { clips: mainTrack },
      ],
    },
    output: {
      format: "mp4",
      resolution,
      fps: 30,
    },
  };
}

/* إرسال الرندر — يرجع معرّف المهمة */
export async function submitRender(
  edit: Record<string, unknown>,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${API}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(edit),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new Error("مفتاح API غير صالح — تأكد من نسخه من لوحة Shotstack");
    }
    throw new Error(`رفضت الخدمة الطلب (${res.status})${body ? `: ${body.slice(0, 140)}` : ""}`);
  }
  const json = await res.json();
  const id = json?.response?.id;
  if (!id) throw new Error("استجابة غير متوقعة من Shotstack");
  return id as string;
}

export type RenderStatus = "queued" | "rendering" | "done" | "failed";

/* متابعة حالة الرندر حتى الانتهاء — ترجع رابط MP4 الجاهز */
export async function pollRender(
  id: string,
  apiKey: string,
  onStatus: (status: RenderStatus, progress?: number) => void,
  signal?: AbortSignal
): Promise<string> {
  for (let i = 0; i < 150; i++) {
    if (signal?.aborted) throw new Error("aborted");
    await new Promise((r) => setTimeout(r, 3000));
    if (signal?.aborted) throw new Error("aborted");

    const res = await fetch(`${API}/render/${id}`, {
      headers: { "x-api-key": apiKey },
    });
    if (!res.ok) throw new Error(`تعذّر جلب حالة الرندر (${res.status})`);
    const json = await res.json();
    const status: RenderStatus = json?.response?.status ?? "queued";
    const progress: number | undefined = json?.response?.data?.progress;

    if (status === "done") {
      const url = json?.response?.url;
      if (!url) throw new Error("اكتمل الرندر بدون رابط — جرّب مجدداً");
      onStatus("done", 1);
      return url as string;
    }
    if (status === "failed") {
      throw new Error("فشل الرندر السحابي — راجع المقاطع أو جرّب التصدير المحلي المجاني");
    }
    onStatus(status, progress);
  }
  throw new Error("انتهت مهلة انتظار الرندر — جرّب مقطعاً أقصر");
}
