import { useState } from "react";
import JSZip from "jszip";
import { Dropzone } from "../components/Dropzone";
import { BlobLink, InfoNote, ProgressBar } from "../components/bits";
import { getTool } from "../data/tools";
import { convertImage, extForFormat, baseName, type OutputFormat } from "../lib/img";
import { bumpProcessedCount, downloadBlob, formatBytes, showToast, uid } from "../lib/utils";
import { FileRow, OptionsPanel, ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

interface Item {
  id: string;
  file: File;
  status: "idle" | "working" | "done" | "error";
  out?: Blob;
  error?: string;
}

const TOOL = getTool("convert-image")!;

const FORMATS: Array<{ value: OutputFormat; label: string }> = [
  { value: "image/jpeg", label: "JPG — توافق واسع" },
  { value: "image/png", label: "PNG — جودة وشفافية" },
  { value: "image/webp", label: "WebP — أصغر حجم للويب" },
];

export default function ConvertImage() {
  const [items, setItems] = useState<Item[]>([]);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);

  const addFiles = (files: File[]) =>
    setItems((prev) => [...prev, ...files.map((file) => ({ id: uid(), file, status: "idle" as const }))]);

  const patch = (id: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const run = async () => {
    setBusy(true);
    let ok = 0;
    for (const it of items.filter((i) => i.status !== "done")) {
      patch(it.id, { status: "working" });
      try {
        const out = await convertImage(it.file, { format, quality });
        patch(it.id, { status: "done", out });
        ok++;
      } catch {
        patch(it.id, { status: "error", error: "تعذّر تحويل هذه الصورة" });
      }
    }
    setBusy(false);
    if (ok) {
      bumpProcessedCount(ok);
      showToast(`تم تحويل ${ok === 1 ? "صورة واحدة" : `${ok} صور`} إلى ${extForFormat(format).toUpperCase()}`);
    }
  };

  const doneItems = items.filter((i) => i.status === "done" && i.out);
  const finished = items.filter((i) => i.status === "done" || i.status === "error").length;
  const lossy = format !== "image/png";

  const downloadAll = async () => {
    const zip = new JSZip();
    doneItems.forEach((it, i) =>
      zip.file(`${baseName(it.file.name)}-${i + 1}.${extForFormat(format)}`, it.out!)
    );
    downloadBlob(await zip.generateAsync({ type: "blob" }), "kraftoox-converted-images.zip");
  };

  return (
    <ToolShell tool={TOOL}>
      <Dropzone
        accept={TOOL.accept}
        multiple
        onFiles={addFiles}
        color={TOOL.color}
        title="اسحب الصور لتحويل صيغتها"
        subtitle="JPG · PNG · WebP — تحويل جماعي فوري داخل المتصفح"
      />

      {items.length > 0 && (
        <div className="anim-pop mt-6">
          <OptionsPanel>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel>الصيغة الهدف</FieldLabel>
                <select
                  className="input"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  aria-label="الصيغة الهدف"
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              {lossy && (
                <div>
                  <FieldLabel>
                    الجودة: <b className="font-mono">{Math.round(quality * 100)}%</b>
                  </FieldLabel>
                  <input
                    type="range"
                    min={0.4}
                    max={1}
                    step={0.05}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="mt-3 w-full"
                    aria-label="جودة الصورة الناتجة"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProcessBtn
                label={`حوّل إلى ${extForFormat(format).toUpperCase()}`}
                onClick={run}
                busy={busy}
                color={TOOL.color}
                icon="convert"
              />
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
                  it.status === "done" && it.out ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] uppercase">{it.file.type.split("/")[1]}</span>
                      <Icon name="arrow" size={12} className="opacity-60" />
                      <b className="font-mono text-[11px] uppercase c-teal">{extForFormat(format)}</b>
                      <span dir="ltr" className="font-mono">· {formatBytes(it.out.size)}</span>
                    </span>
                  ) : it.status === "error" ? (
                    <span className="c-red">{it.error}</span>
                  ) : (
                    <span dir="ltr" className="font-mono">{formatBytes(it.file.size)}</span>
                  )
                }
                actions={
                  it.status === "done" && it.out ? (
                    <BlobLink
                      small
                      className="btn-teal"
                      blob={it.out}
                      label="تحميل"
                      filename={`${baseName(it.file.name)}.${extForFormat(format)}`}
                    />
                  ) : undefined
                }
              />
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          عند التحويل إلى JPG تُضاف خلفية بيضاء تلقائياً للصور الشفافة. صيغة WebP توفر عادةً
          <b> 25–35%</b> من الحجم مقارنة بـ JPG عند نفس الجودة المدركة.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
