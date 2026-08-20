import { useState } from "react";
import imageCompression from "browser-image-compression";
import JSZip from "jszip";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, ProgressBar } from "../components/bits";
import { getTool } from "../data/tools";
import { bumpProcessedCount, downloadBlob, formatBytes, percentSavings, showToast, uid } from "../lib/utils";
import { FileRow, OptionsPanel, ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

interface Item {
  id: string;
  file: File;
  status: "idle" | "working" | "done" | "error";
  out?: Blob;
  error?: string;
}

const TOOL = getTool("compress-image")!;

export default function CompressImage() {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<"target" | "quality">("target");
  const [targetMB, setTargetMB] = useState(0.3);
  const [quality, setQuality] = useState(0.7);
  const [toWebp, setToWebp] = useState(false);
  const [busy, setBusy] = useState(false);

  const addFiles = (files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({ id: uid(), file, status: "idle" as const })),
    ]);
  };

  const patch = (id: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const run = async () => {
    setBusy(true);
    let ok = 0;
    for (const it of items.filter((i) => i.status !== "done")) {
      patch(it.id, { status: "working" });
      try {
        const opts: Parameters<typeof imageCompression>[1] = {
          useWebWorker: true,
          initialQuality: mode === "quality" ? quality : Math.min(quality, 0.9),
        };
        if (mode === "target") opts.maxSizeMB = targetMB;
        if (toWebp) opts.fileType = "image/webp";
        const out = await imageCompression(it.file, opts);
        patch(it.id, { status: "done", out });
        ok++;
      } catch {
        patch(it.id, { status: "error", error: "تعذّر ضغط هذه الصورة" });
      }
    }
    setBusy(false);
    if (ok) {
      bumpProcessedCount(ok);
      showToast(`تم ضغط ${ok === 1 ? "صورة واحدة" : `${ok} صور`} بنجاح`);
    }
  };

  const doneItems = items.filter((i) => i.status === "done" && i.out);
  const total = items.length;
  const finished = items.filter((i) => i.status === "done" || i.status === "error").length;

  const downloadAll = async () => {
    const zip = new JSZip();
    doneItems.forEach((it, i) => {
      const ext = toWebp ? "webp" : it.file.type.includes("png") ? "png" : "jpg";
      zip.file(`${it.file.name.replace(/\.[^.]+$/, "")}-compressed-${i + 1}.${ext}`, it.out!);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "kraftoox-compressed-images.zip");
  };

  return (
    <ToolShell tool={TOOL}>
      <Dropzone
        accept={TOOL.accept}
        multiple
        onFiles={addFiles}
        color={TOOL.color}
        title="اسحب صورك هنا لبدء الضغط"
        subtitle="JPG · PNG · WebP — معالجة جماعية، وكل شيء يبقى في جهازك"
      />

      {items.length > 0 && (
        <div className="anim-pop mt-6">
          <OptionsPanel>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel>طريقة الضغط</FieldLabel>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("target")}
                    className={`chip !px-4 !py-2 ${mode === "target" ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}
                  >
                    حجم مستهدف
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("quality")}
                    className={`chip !px-4 !py-2 ${mode === "quality" ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}
                  >
                    جودة يدوية
                  </button>
                </div>
              </div>

              {mode === "target" ? (
                <div>
                  <FieldLabel>
                    الحجم المستهدف: <b className="font-mono" dir="ltr">{targetMB} MB</b>
                  </FieldLabel>
                  <input
                    type="range"
                    min={0.05}
                    max={2}
                    step={0.05}
                    value={targetMB}
                    onChange={(e) => setTargetMB(Number(e.target.value))}
                    className="w-full"
                    aria-label="الحجم المستهدف بالميغابايت"
                  />
                </div>
              ) : (
                <div>
                  <FieldLabel>
                    الجودة: <b className="font-mono">{Math.round(quality * 100)}%</b>
                  </FieldLabel>
                  <input
                    type="range"
                    min={0.3}
                    max={0.95}
                    step={0.05}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full"
                    aria-label="جودة الضغط"
                  />
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={toWebp}
                  onChange={(e) => setToWebp(e.target.checked)}
                  className="h-4 w-4 accent-[var(--teal)]"
                />
                تحويل الناتج إلى <span className="font-mono" dir="ltr">WebP</span> (حجم أصغر للويب)
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProcessBtn label="اضغط الصور الآن" onClick={run} busy={busy} color={TOOL.color} />
              {doneItems.length > 1 && (
                <button type="button" onClick={downloadAll} className="btn btn-ghost">
                  <Icon name="zip" size={17} />
                  تحميل الكل ZIP
                </button>
              )}
              <button
                type="button"
                onClick={() => setItems([])}
                className="btn btn-ghost !px-3"
                aria-label="مسح القائمة"
              >
                <Icon name="refresh" size={16} />
                البدء من جديد
              </button>
            </div>

            {busy && total > 0 && (
              <div className="mt-4">
                <ProgressBar value={(finished / total) * 100} />
              </div>
            )}
          </OptionsPanel>

          <ul className="space-y-2.5">
            {items.map((it) => (
              <FileRow
                key={it.id}
                name={it.file.name}
                color={TOOL.color}
                status={it.status}
                thumb={URL.createObjectURL(it.file)}
                meta={
                  it.status === "done" && it.out ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span dir="ltr" className="font-mono">{formatBytes(it.file.size)}</span>
                      <Icon name="arrow" size={12} className="opacity-60" />
                      <b dir="ltr" className="font-mono c-teal">{formatBytes(it.out.size)}</b>
                      <b className="c-teal">({percentSavings(it.file.size, it.out.size)})</b>
                    </span>
                  ) : it.status === "error" ? (
                    <span className="c-red">{it.error}</span>
                  ) : (
                    <span dir="ltr" className="font-mono">{formatBytes(it.file.size)}</span>
                  )
                }
                actions={
                  it.status === "done" && it.out ? (
                    <button
                      type="button"
                      className="btn btn-teal !px-3 !py-2 !text-xs"
                      onClick={() =>
                        downloadBlob(
                          it.out!,
                          `${it.file.name.replace(/\.[^.]+$/, "")}-compressed.${toWebp ? "webp" : it.file.type.includes("png") ? "png" : "jpg"}`
                        )
                      }
                    >
                      <Icon name="download" size={14} />
                      تحميل
                    </button>
                  ) : undefined
                }
              />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          الصور تُعالج بالكامل داخل متصفحك باستخدام <b>Web Workers</b> — لا تُرفع إلى أي خادم.
          وضع «الحجم المستهدف» يبحث تلقائياً عن أفضل جودة تحقق الوزن المطلوب.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
