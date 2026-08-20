import { useMemo, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { BlobLink, InfoNote, IndeterminateBar } from "../components/bits";
import { getTool } from "../data/tools";
import { imagesToPdf } from "../lib/pdf";
import { bumpProcessedCount, bytesToBlob, downloadBlob, formatBytes, showToast, uid } from "../lib/utils";
import { OptionsPanel, ProcessBtn, ToolShell, FieldLabel } from "./shared";
import { Icon } from "../components/Icons";

interface Item {
  id: string;
  file: File;
  url: string;
}

const TOOL = getTool("images-to-pdf")!;

export default function ImagesToPdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "fit">("a4");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState(24);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ bytes: Uint8Array } | null>(null);

  const outBlob = useMemo(
    () => (result ? bytesToBlob(result.bytes, "application/pdf") : null),
    [result]
  );

  const addFiles = (files: File[]) => {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({ id: uid(), file, url: URL.createObjectURL(file) })),
    ]);
    setResult(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
    setResult(null);
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setResult(null);
  };

  const run = async () => {
    if (!items.length) return;
    setBusy(true);
    try {
      const bytes = await imagesToPdf(
        items.map((i) => i.file),
        { pageSize, orientation, margin: pageSize === "fit" ? 0 : margin }
      );
      setResult({ bytes });
      bumpProcessedCount(items.length);
      showToast(`تم إنشاء PDF من ${items.length} صورة`);
    } catch {
      showToast("تعذّر إنشاء الملف — تأكد أن الصور بصيغة مدعومة", "err");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <Dropzone
        accept={TOOL.accept}
        multiple
        onFiles={addFiles}
        color={TOOL.color}
        title="اسحب الصور لتحويلها إلى PDF"
        subtitle="كل صورة تصبح صفحة — رتّب الصور بالأسهم كما تريد ترتيب الصفحات"
      />

      {items.length > 0 && (
        <div className="anim-pop mt-6">
          <OptionsPanel title={`الصور المختارة (${items.length})`}>
            <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {items.map((it, idx) => (
                <li key={it.id} className="anim-pop group relative overflow-hidden rounded-xl border bd-line bg-surface2">
                  <img src={it.url} alt={it.file.name} className="h-24 w-full object-cover" />
                  <span className="font-display absolute top-1.5 start-1.5 grid h-6 w-6 place-items-center rounded-md bg-[var(--amber)] text-xs font-bold text-[#2b1c02]">
                    {idx + 1}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-[color-mix(in_srgb,var(--ink)_72%,transparent)] py-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="text-white/90 disabled:opacity-30" aria-label="تقديم">
                      <Icon name="up" size={15} />
                    </button>
                    <button type="button" onClick={() => remove(it.id)} className="text-white/90 hover:text-[var(--red)]" aria-label="حذف">
                      <Icon name="trash" size={15} />
                    </button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="text-white/90 disabled:opacity-30" aria-label="تأخير">
                      <Icon name="down" size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <FieldLabel>مقاس الصفحة</FieldLabel>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPageSize("a4")} className={`chip !px-4 !py-2 ${pageSize === "a4" ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}>
                    A4
                  </button>
                  <button type="button" onClick={() => setPageSize("fit")} className={`chip !px-4 !py-2 ${pageSize === "fit" ? "!border-[var(--teal)] !text-[var(--teal)]" : ""}`}>
                    حسب الصورة
                  </button>
                </div>
              </div>
              <div>
                <FieldLabel>الاتجاه</FieldLabel>
                <select
                  className="input"
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as typeof orientation)}
                  disabled={pageSize === "fit"}
                  aria-label="اتجاه الصفحة"
                >
                  <option value="auto">تلقائي حسب شكل الصورة</option>
                  <option value="portrait">طولي (عمودي)</option>
                  <option value="landscape">عرضي (أفقي)</option>
                </select>
              </div>
              <div>
                <FieldLabel>
                  الهامش: <b className="font-mono" dir="ltr">{margin} pt</b>
                </FieldLabel>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={4}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="mt-3 w-full"
                  disabled={pageSize === "fit"}
                  aria-label="هامش الصفحة"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProcessBtn
                label={`أنشئ PDF من ${items.length} ${items.length === 1 ? "صورة" : "صور"}`}
                onClick={run}
                busy={busy}
                color={TOOL.color}
                icon="img2pdf"
              />
              {result && (
                <BlobLink
                  blob={outBlob}
                  className="btn-teal"
                  label="تحميل الملف"
                  filename="kraftoox-images.pdf"
                />
              )}
              <button type="button" onClick={() => { setItems([]); setResult(null); }} className="btn btn-ghost !px-3">
                <Icon name="refresh" size={16} />
                البدء من جديد
              </button>
            </div>

            {busy && (
              <div className="mt-4">
                <IndeterminateBar color={TOOL.color} />
              </div>
            )}

            {result && (
              <p className="anim-pop mt-4 flex items-center gap-2 rounded-xl bg-[var(--teal-soft)] px-4 py-2.5 text-sm font-semibold c-teal">
                <Icon name="check" size={16} />
                جاهز: {items.length} صفحة · <span dir="ltr" className="font-mono">{formatBytes(result.bytes.length)}</span>
              </p>
            )}
          </OptionsPanel>
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          صور WebP تُحوّل تلقائياً إلى PNG قبل التضمين لضمان التوافق مع كل قارئات PDF.
          اختر «حسب الصورة» للحصول على ملف بأبعاد الصور الأصلية — مثالي للطباعة عالية الجودة.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
