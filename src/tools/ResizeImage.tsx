import { useState } from "react";
import JSZip from "jszip";
import { Dropzone } from "../components/Dropzone";
import { InfoNote, ProgressBar } from "../components/bits";
import { getTool } from "../data/tools";
import { resizeImage, loadImageEl } from "../lib/img";
import { bumpProcessedCount, downloadBlob, formatBytes, showToast, uid } from "../lib/utils";
import { FileRow, OptionsPanel, ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

interface Item {
  id: string;
  file: File;
  w: number;
  h: number;
  status: "idle" | "working" | "done" | "error";
  out?: Blob;
  outW?: number;
  outH?: number;
  error?: string;
}

const TOOL = getTool("resize-image")!;

export default function ResizeImage() {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<"percent" | "exact">("percent");
  const [percent, setPercent] = useState(50);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [lock, setLock] = useState(true);
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: File[]) => {
    const newItems: Item[] = [];
    for (const file of files) {
      try {
        const img = await loadImageEl(file);
        newItems.push({ id: uid(), file, w: img.naturalWidth, h: img.naturalHeight, status: "idle" });
      } catch {
        showToast(`تعذّر قراءة ${file.name}`, "err");
      }
    }
    if (newItems.length) setItems((prev) => [...prev, ...newItems]);
  };

  const patch = (id: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const onWidth = (v: number) => {
    setWidth(v);
    if (lock && items.length && v > 0) {
      const r = items[0].h / items[0].w;
      setHeight(Math.max(1, Math.round(v * r)));
    }
  };

  const onHeight = (v: number) => {
    setHeight(v);
    if (lock && items.length && v > 0) {
      const r = items[0].w / items[0].h;
      setWidth(Math.max(1, Math.round(v * r)));
    }
  };

  const run = async () => {
    setBusy(true);
    let ok = 0;
    for (const it of items.filter((i) => i.status !== "done")) {
      patch(it.id, { status: "working" });
      try {
        const out = await resizeImage(
          it.file,
          mode === "percent" ? { percent } : { width, height }
        );
        const ratio = mode === "percent" ? percent / 100 : null;
        patch(it.id, {
          status: "done",
          out,
          outW: ratio ? Math.round(it.w * ratio) : width,
          outH: ratio ? Math.round(it.h * ratio) : height,
        });
        ok++;
      } catch {
        patch(it.id, { status: "error", error: "فشل تغيير الحجم" });
      }
    }
    setBusy(false);
    if (ok) {
      bumpProcessedCount(ok);
      showToast(`تم تغيير حجم ${ok === 1 ? "صورة واحدة" : `${ok} صور`}`);
    }
  };

  const doneItems = items.filter((i) => i.status === "done" && i.out);
  const finished = items.filter((i) => i.status === "done" || i.status === "error").length;

  const downloadAll = async () => {
    const zip = new JSZip();
    doneItems.forEach((it, i) => {
      zip.file(`${it.file.name.replace(/\.[^.]+$/, "")}-resized-${i + 1}.${it.file.name.split(".").pop()}`, it.out!);
    });
    downloadBlob(await zip.generateAsync({ type: "blob" }), "filetools-resized-images.zip");
  };

  return (
    <ToolShell tool={TOOL}>
      <Dropzone
        accept={TOOL.accept}
        multiple
        onFiles={addFiles}
        color={TOOL.color}
        title="اسحب الصور لتغيير أبعادها"
        subtitle="تُقرأ أبعاد كل صورة تلقائياً عند الإضافة"
      />

      {items.length > 0 && (
        <div className="anim-pop mt-6">
          <OptionsPanel>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel>طريقة تغيير الحجم</FieldLabel>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("percent")}
                    className={`chip !px-4 !py-2 ${mode === "percent" ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}
                  >
                    نسبة مئوية
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("exact")}
                    className={`chip !px-4 !py-2 ${mode === "exact" ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}
                  >
                    أبعاد دقيقة
                  </button>
                </div>
              </div>

              {mode === "percent" ? (
                <div>
                  <FieldLabel>النسبة: <b className="font-mono">{percent}%</b></FieldLabel>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="w-full"
                    aria-label="نسبة تغيير الحجم"
                  />
                </div>
              ) : (
                <div>
                  <FieldLabel>الأبعاد بالبكسل</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="input !py-2 text-center font-mono"
                      dir="ltr"
                      value={width}
                      min={1}
                      max={8000}
                      onChange={(e) => onWidth(Number(e.target.value))}
                      aria-label="العرض"
                    />
                    <button
                      type="button"
                      onClick={() => setLock((l) => !l)}
                      className={`chip !px-2.5 !py-2 ${lock ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}
                      title={lock ? "نسبة الأبعاد مقفلة" : "نسبة الأبعاد حرة"}
                      aria-pressed={lock}
                    >
                      <Icon name={lock ? "link" : "close"} size={14} />
                    </button>
                    <input
                      type="number"
                      className="input !py-2 text-center font-mono"
                      dir="ltr"
                      value={height}
                      min={1}
                      max={8000}
                      onChange={(e) => onHeight(Number(e.target.value))}
                      aria-label="الارتفاع"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProcessBtn label="غيّر الحجم الآن" onClick={run} busy={busy} color={TOOL.color} icon="resize" />
              {doneItems.length > 1 && (
                <button type="button" onClick={downloadAll} className="btn btn-ghost">
                  <Icon name="zip" size={17} />
                  تحميل الكل ZIP
                </button>
              )}
              <button type="button" onClick={() => setItems([])} className="btn btn-ghost !px-3">
                <Icon name="refresh" size={16} />
                البدء من جديد
              </button>
            </div>

            {busy && items.length > 0 && (
              <div className="mt-4">
                <ProgressBar value={(finished / items.length) * 100} />
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
                  it.status === "done" ? (
                    <span dir="ltr" className="font-mono">
                      {it.w}×{it.h} → <b className="c-teal">{it.outW}×{it.outH}</b> · {it.out && formatBytes(it.out.size)}
                    </span>
                  ) : it.status === "error" ? (
                    <span className="c-red">{it.error}</span>
                  ) : (
                    <span dir="ltr" className="font-mono">
                      {it.w}×{it.h} · {formatBytes(it.file.size)}
                    </span>
                  )
                }
                actions={
                  it.status === "done" && it.out ? (
                    <button
                      type="button"
                      className="btn btn-teal !px-3 !py-2 !text-xs"
                      onClick={() =>
                        downloadBlob(it.out!, `${it.file.name.replace(/\.[^.]+$/, "")}-resized.${it.file.name.split(".").pop()}`)
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
          عند تفعيل قفل نسبة الأبعاد، يُحسب البعد الثاني تلقائياً بناءً على أول صورة في القائمة.
          التصغير الكبير يحافظ على الحواف عبر إعادة عينات متعددة المراحل.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
