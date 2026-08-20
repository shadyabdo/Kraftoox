import { useEffect, useMemo, useRef, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, ProgressBar } from "../components/bits";
import { getTool } from "../data/tools";
import { uploadToTmpfiles } from "../lib/host";
import {
  FILTERS,
  clipLength,
  probeVideoDuration,
  renderTimeline,
  timelineLength,
  type EditorClip,
} from "../lib/editor";
import {
  buildShotstackEdit,
  getStoredKey,
  pollRender,
  storeKey,
  submitRender,
  type ShotstackResolution,
} from "../lib/shotstack";
import { bumpProcessedCount, downloadBlob, formatSeconds, formatBytes, showToast, uid } from "../lib/utils";
import { ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";
import { cx } from "../lib/utils";

const TOOL = getTool("video-editor")!;

const RESOLUTIONS = [
  { id: "1280x720", label: "HD يوتيوب (1280×720)", w: 1280, h: 720 },
  { id: "1920x1080", label: "FHD يوتيوب (1920×1080)", w: 1920, h: 1080 },
  { id: "1080x1920", label: "شورتز (1080×1920)", w: 1080, h: 1920 },
  { id: "1080x1080", label: "مربع (1080×1080)", w: 1080, h: 1080 },
];

const SPEEDS = [0.5, 0.75, 1, 1.5, 2];

export default function VideoEditor() {
  const [clips, setClips] = useState<EditorClip[]>([]);
  const [selId, setSelId] = useState<string | null>(null);
  const [resId, setResId] = useState("1280x720");
  const [tab, setTab] = useState<"local" | "cloud">("local");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [apiKey, setApiKey] = useState(getStoredKey());
  const [cloudState, setCloudState] = useState<{
    phase: "idle" | "uploading" | "submitted" | "queued" | "rendering" | "done" | "error";
    url?: string;
    msg?: string;
    progress?: number;
  }>({ phase: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const sel = clips.find((c) => c.id === selId) ?? null;
  const total = useMemo(() => timelineLength(clips), [clips]);

  const addFiles = async (files: File[]) => {
    const added: EditorClip[] = [];
    for (const file of files) {
      const isImage = file.type.startsWith("image");
      const dur = isImage ? 4 : await probeVideoDuration(file);
      added.push({
        id: uid(),
        kind: isImage ? "image" : "video",
        src: URL.createObjectURL(file),
        file,
        name: file.name,
        nativeDur: dur,
        trimStart: 0,
        trimEnd: dur,
        speed: 1,
        filter: "",
        text: "",
        textPos: "bottom",
        transition: "fade",
      });
    }
    setClips((prev) => [...prev, ...added]);
    if (added.length) {
      setSelId(added[0].id);
      showToast(`أُضيف ${added.length === 1 ? "مقطع واحد" : `${added.length} مقاطع`} إلى الخط الزمني`);
    }
  };

  const patch = (id: string, p: Partial<EditorClip>) =>
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const remove = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (selId === id) setSelId(null);
  };

  const move = (id: string, dir: -1 | 1) => {
    setClips((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const renderLocal = async () => {
    const res = RESOLUTIONS.find((r) => r.id === resId)!;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setProgress(0);
    setResult(null);
    try {
      const out = await renderTimeline(clips, {
        width: res.w,
        height: res.h,
        onProgress: setProgress,
        signal: ctrl.signal,
      });
      const url = URL.createObjectURL(out.blob);
      setResult({ url, size: out.blob.size });
      bumpProcessedCount(clips.length);
      showToast("اكتمل التصدير المحلي — الفيديو جاهز");
    } catch {
      showToast("تعذّر التصدير — جرّب دقة أقل أو مقاطع أقصر", "err");
    } finally {
      setBusy(false);
    }
  };

  const renderCloud = async () => {
    if (!apiKey.trim()) {
      showToast("أدخل مفتاح Shotstack المجاني أولاً", "info");
      return;
    }
    storeKey(apiKey.trim());
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setCloudState({ phase: "uploading" });
    try {
      /* المقاطع المحلية تحتاج رابطاً عاماً مؤقتاً لتصل إليه خدمة الرندر */
      const resolved: EditorClip[] = [];
      for (const c of clips) {
        let src = c.src;
        if (c.src.startsWith("blob:") && c.file) {
          src = await uploadToTmpfiles(c.file);
        }
        resolved.push({ ...c, src });
      }
      setCloudState({ phase: "submitted" });
      const edit = buildShotstackEdit(resolved, resId.includes("1080x10") ? "full-hd" : "hd");
      const id = await submitRender(edit, apiKey.trim());
      const url = await pollRender(
        id,
        apiKey.trim(),
        (status, p) => {
          if (status === "queued" || status === "rendering") setCloudState({ phase: status, progress: p });
        },
        ctrl.signal
      );
      setCloudState({ phase: "done", url });
      bumpProcessedCount(clips.length);
      showToast("اكتمل الرندر السحابي — رابط MP4 جاهز");
    } catch (err) {
      const msg = (err as Error).message;
      if (msg !== "aborted") setCloudState({ phase: "error", msg });
    }
  };

  const filterLabel = (css: string) => FILTERS.find((f) => f.css === css)?.label ?? "بدون";

  return (
    <ToolShell tool={TOOL}>
      {clips.length === 0 ? (
        <Dropzone
          accept={TOOL.accept}
          multiple
          onFiles={addFiles}
          color={TOOL.color}
          title="اسحب مقاطع الفيديو والصور لبناء مشروعك"
          subtitle="MP4 · WebM · MOV · JPG · PNG · WebP — رتّبها على الخط الزمني ثم صدّر"
        />
      ) : (
        <div className="anim-pop space-y-5">
          {/* الخط الزمني */}
          <div className="card p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display flex items-center gap-2 text-sm font-bold">
                <span style={{ color: TOOL.color }}><Icon name="timeline" size={17} /></span>
                الخط الزمني
                <span className="c-muted font-normal">
                  · {clips.length} مقاطع · <span dir="ltr" className="font-mono">{formatSeconds(total)}</span>
                </span>
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                  <Icon name="plus" size={14} />
                  إضافة مقاطع
                </button>
                <button type="button" onClick={() => { setClips([]); setSelId(null); setResult(null); }} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                  <Icon name="trash" size={14} />
                  تفريغ
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-2" dir="ltr">
              {clips.map((c, i) => {
                const len = clipLength(c);
                const w = Math.max(64, Math.round(len * 26));
                return (
                  <div key={c.id} className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => setSelId(c.id)}
                      className={cx(
                        "relative flex h-16 flex-col justify-between overflow-hidden rounded-lg border-2 p-1.5 text-start transition-all duration-200",
                        selId === c.id ? "shadow-lg" : "opacity-80 hover:opacity-100"
                      )}
                      style={{
                        width: w,
                        borderColor: selId === c.id ? TOOL.color : "var(--line)",
                        background: `color-mix(in srgb, ${c.kind === "video" ? TOOL.color : "var(--amber)"} ${selId === c.id ? 22 : 12}%, var(--surface))`,
                      }}
                      aria-label={`المقطع ${i + 1}: ${c.name}`}
                    >
                      <span className="flex w-full items-center gap-1 text-[9px] font-bold">
                        <Icon name={c.kind === "video" ? "video" : "image"} size={11} />
                        <span className="truncate" dir="rtl">{c.name}</span>
                      </span>
                      <span className="font-mono text-[9px] opacity-70">{len.toFixed(1)}s{c.speed !== 1 ? ` ·×${c.speed}` : ""}</span>
                      {c.text && (
                        <span className="absolute top-1 end-1 text-[8px] font-bold c-amber"><Icon name="type" size={9} /></span>
                      )}
                    </button>
                    {i < clips.length - 1 && c.transition === "fade" && (
                      <span className="c-muted px-0.5 text-[9px] font-bold" title="انتقال تلاشي">⟋</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* أدوات المقطع المحدد */}
            {sel && (
              <div className="anim-pop mt-3 rounded-xl border bd-line bg-surface2 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-xs font-semibold">
                    <Icon name="scissors" size={14} className="c-amber" />
                    تعديل: <bdi className="max-w-44 truncate">{sel.name}</bdi>
                  </p>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => move(sel.id, -1)} className="c-muted rounded-md p-1 hover:text-[var(--teal)]" aria-label="تقديم في الترتيب">
                      <Icon name="arrow" size={14} className="rotate-180" />
                    </button>
                    <button type="button" onClick={() => move(sel.id, 1)} className="c-muted rounded-md p-1 hover:text-[var(--teal)]" aria-label="تأخير في الترتيب">
                      <Icon name="arrow" size={14} />
                    </button>
                    <button type="button" onClick={() => remove(sel.id)} className="c-muted rounded-md p-1 hover:text-[var(--red)]" aria-label="حذف المقطع">
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {sel.kind === "video" ? (
                    <div>
                      <FieldLabel>
                        القصّ: من <b dir="ltr" className="font-mono">{sel.trimStart.toFixed(1)}s</b> إلى{" "}
                        <b dir="ltr" className="font-mono">{sel.trimEnd.toFixed(1)}s</b> من أصل{" "}
                        <b dir="ltr" className="font-mono">{sel.nativeDur.toFixed(1)}s</b>
                      </FieldLabel>
                      <div className="space-y-2">
                        <input type="range" min={0} max={sel.nativeDur} step={0.1} value={sel.trimStart}
                          onChange={(e) => {
                            const v = Math.min(Number(e.target.value), sel.trimEnd - 0.5);
                            patch(sel.id, { trimStart: Math.max(0, v) });
                          }} className="w-full" aria-label="بداية القص" />
                        <input type="range" min={0} max={sel.nativeDur} step={0.1} value={sel.trimEnd}
                          onChange={(e) => {
                            const v = Math.max(Number(e.target.value), sel.trimStart + 0.5);
                            patch(sel.id, { trimEnd: Math.min(sel.nativeDur, v) });
                          }} className="w-full" aria-label="نهاية القص" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <FieldLabel>مدة عرض الصورة: <b dir="ltr" className="font-mono">{sel.trimEnd.toFixed(1)}s</b></FieldLabel>
                      <input type="range" min={1} max={15} step={0.5} value={sel.trimEnd}
                        onChange={(e) => patch(sel.id, { trimEnd: Number(e.target.value) })}
                        className="w-full" aria-label="مدة الصورة" />
                    </div>
                  )}

                  <div>
                    <FieldLabel>السرعة</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {SPEEDS.map((s) => (
                        <button key={s} type="button" onClick={() => patch(sel.id, { speed: s })}
                          className={cx("chip !px-3 !py-1.5 font-mono !text-xs", sel.speed === s && "!border-[var(--blue)] !text-[var(--blue)]")}>
                          ×{s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>الفلتر: {filterLabel(sel.filter)}</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {FILTERS.map((f) => (
                        <button key={f.id} type="button" onClick={() => patch(sel.id, { filter: f.css })}
                          className={cx("chip !px-3 !py-1.5 !text-xs", sel.filter === f.css && "!border-[var(--blue)] !text-[var(--blue)]")}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>نص عربي على المقطع</FieldLabel>
                    <div className="flex gap-2">
                      <input className="input !py-2 !text-sm" value={sel.text} placeholder="اكتب تعليقاً يظهر على الفيديو…"
                        onChange={(e) => patch(sel.id, { text: e.target.value })} />
                      <select className="input !w-28 !py-2 !text-sm" value={sel.textPos}
                        onChange={(e) => patch(sel.id, { textPos: e.target.value as EditorClip["textPos"] })} aria-label="موضع النص">
                        <option value="top">أعلى</option>
                        <option value="center">وسط</option>
                        <option value="bottom">أسفل</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>الانتقال</FieldLabel>
                    <div className="flex gap-1.5">
                      {(["fade", "none"] as const).map((t) => (
                        <button key={t} type="button" onClick={() => patch(sel.id, { transition: t })}
                          className={cx("chip !px-4 !py-1.5 !text-xs", sel.transition === t && "!border-[var(--blue)] !text-[var(--blue)]")}>
                          {t === "fade" ? "تلاشي" : "بدون"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* معاينة المقطع المحدد */}
                <div className="mt-4 grid place-items-center overflow-hidden rounded-lg border bd-line bg-black/80">
                  {sel.kind === "video" ? (
                    <video src={sel.src} controls className="max-h-64 w-auto" style={{ maxWidth: "100%" }} />
                  ) : (
                    <img src={sel.src} alt={sel.name} className="max-h-64 w-auto object-contain" style={{ maxWidth: "100%" }} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* التصدير */}
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-xl border bd-line p-1">
                <button type="button" onClick={() => setTab("local")}
                  className={cx("font-display flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors", tab === "local" ? "bg-surface2" : "c-muted")}>
                  <Icon name="bolt" size={14} />
                  تصدير محلي (مجاني)
                </button>
                <button type="button" onClick={() => setTab("cloud")}
                  className={cx("font-display flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors", tab === "cloud" ? "bg-surface2" : "c-muted")}>
                  <Icon name="cloud" size={14} />
                  تصدير سحابي MP4
                </button>
              </div>
              <select className="input !w-auto !py-2 !text-xs" value={resId} onChange={(e) => setResId(e.target.value)} aria-label="دقة التصدير">
                {RESOLUTIONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {tab === "local" ? (
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <ProcessBtn label="صدّر الفيديو الآن" onClick={renderLocal} busy={busy} color={TOOL.color} icon="film" />
                  {busy && (
                    <button type="button" onClick={() => abortRef.current?.abort()} className="btn btn-ghost !px-3 !py-2 !text-xs">
                      <Icon name="close" size={14} />
                      إلغاء
                    </button>
                  )}
                </div>
                {busy && (
                  <div className="mt-4">
                    <ProgressBar value={progress * 100} color={TOOL.color} />
                    <p className="c-muted mt-2 text-xs">يُرسَم الفيديو إطاراً بإطار في زمن حقيقي ({Math.round(progress * 100)}%)…</p>
                  </div>
                )}
                {result && (
                  <div className="anim-pop mt-4 rounded-xl border bd-line bg-surface2 p-4">
                    <video src={result.url} controls className="mx-auto max-h-72 rounded-lg" style={{ maxWidth: "100%" }} />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs c-muted" dir="ltr">WebM · {formatBytes(result.size)} · {formatSeconds(total)}</span>
                      <a href={result.url} download="kraftoox-edit.webm" className="btn btn-teal !py-2 !text-sm">
                        <Icon name="download" size={15} />
                        تنزيل الفيديو
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <div>
                    <FieldLabel>مفتاح Shotstack API (مجاني — 20 دقيقة رندر شهرياً)</FieldLabel>
                    <div className="flex gap-2">
                      <input
                        className="input font-mono !text-xs"
                        dir="ltr"
                        type="password"
                        placeholder="sandbox_xxxxxxxxxxxxxxxx"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <a href="https://dashboard.shotstack.io/register" target="_blank" rel="noopener noreferrer" className="btn btn-ghost shrink-0 !px-3 !py-2 !text-xs">
                        <Icon name="globe" size={14} />
                        احصل على مفتاح مجاني
                      </a>
                    </div>
                    <p className="c-muted mt-1.5 text-[11px]">
                      سجّل مجاناً في Shotstack وانسخ مفتاح الـSandbox — يُحفظ في متصفحك فقط. الرندر السحابي يصدر
                      <b className="font-mono" dir="ltr"> MP4 </b>جاهزاً بأي منصة.
                    </p>
                  </div>
                  <div className="flex items-end">
                    <ProcessBtn label="ارفع للرندر السحابي" onClick={renderCloud} color={TOOL.color} icon="cloud"
                      busy={["uploading", "submitted", "queued", "rendering"].includes(cloudState.phase)} />
                  </div>
                </div>

                {cloudState.phase !== "idle" && (
                  <div className="anim-pop mt-4 rounded-xl border bd-line bg-surface2 p-4">
                    {cloudState.phase === "done" && cloudState.url ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="flex items-center gap-2 text-sm font-bold c-teal">
                          <Icon name="check" size={18} />
                          فيديو MP4 جاهز من سحابة Shotstack!
                        </p>
                        <div className="flex gap-2">
                          <a href={cloudState.url} target="_blank" rel="noopener noreferrer" className="btn btn-teal !py-2 !text-sm">
                            <Icon name="download" size={15} />
                            فتح / تنزيل MP4
                          </a>
                          <button type="button" onClick={() => setCloudState({ phase: "idle" })} className="btn btn-ghost !py-2 !text-sm">
                            إغلاق
                          </button>
                        </div>
                      </div>
                    ) : cloudState.phase === "error" ? (
                      <p className="flex items-start gap-2 text-sm c-red">
                        <Icon name="alert" size={17} className="mt-0.5 shrink-0" />
                        {cloudState.msg}
                      </p>
                    ) : (
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-2">
                            <span className="anim-spin inline-flex" style={{ color: TOOL.color }}><Icon name="cloud" size={16} /></span>
                            {cloudState.phase === "uploading" && "رفع المقاطع لاستضافة مؤقتة…"}
                            {cloudState.phase === "submitted" && "إرسال المخطط إلى Shotstack…"}
                            {cloudState.phase === "queued" && "في طابور الرندر السحابي…"}
                            {cloudState.phase === "rendering" && "جارٍ الرندر في السحابة…"}
                          </span>
                          {typeof cloudState.progress === "number" && (
                            <span dir="ltr" className="font-mono">{Math.round(cloudState.progress * 100)}%</span>
                          )}
                        </div>
                        <ProgressBar
                          value={cloudState.phase === "uploading" ? 15 : cloudState.phase === "submitted" ? 30 : (cloudState.progress ?? 0.35) * 100}
                          color={TOOL.color}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept={TOOL.accept} multiple className="hidden"
        onChange={(e) => { if (e.target.files?.length) addFiles(Array.from(e.target.files)); e.target.value = ""; }} />

      <div className="mt-8">
        <InfoNote>
          التصدير المحلي مجاني تماماً ويُرمّز داخل متصفحك بصيغة WebM عالية الجودة مع الصوت.
          للتصدير السحابي بصيغة <b className="font-mono" dir="ltr">MP4</b> نستخدم خدمة
          <b className="font-mono" dir="ltr"> Shotstack Edit API </b> — خدمة تحرير فيديو سحابية جاهزة
          بمفتاح مجاني (20 دقيقة شهرياً)؛ المقاطع تُرفع مؤقتاً للوصول العام ثم تُحذف.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
