import { useMemo, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { BlobLink, InfoNote, IndeterminateBar } from "../components/bits";
import { getTool } from "../data/tools";
import { getPdfPageCount, mergePdfs } from "../lib/pdf";
import { bumpProcessedCount, bytesToBlob, downloadBlob, formatBytes, showToast, uid } from "../lib/utils";
import { ProcessBtn, ToolShell, FileRow } from "./shared";
import { Icon } from "../components/Icons";

interface Item {
  id: string;
  file: File;
  pages: number;
}

const TOOL = getTool("merge-pdf")!;

export default function MergePdf() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ bytes: Uint8Array; pages: number } | null>(null);

  const outBlob = useMemo(
    () => (result ? bytesToBlob(result.bytes, "application/pdf") : null),
    [result]
  );

  const addFiles = async (files: File[]) => {
    const list: Item[] = [];
    for (const file of files) {
      list.push({ id: uid(), file, pages: await getPdfPageCount(file) });
    }
    setItems((prev) => [...prev, ...list]);
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
    if (items.length < 2) return;
    setBusy(true);
    try {
      const res = await mergePdfs(items.map((i) => i.file));
      setResult(res);
      bumpProcessedCount(items.length);
      showToast(`تم دمج ${items.length} ملفات في ${res.pages} صفحة`);
    } catch {
      showToast("تعذّر دمج الملفات — تأكد أن جميعها ملفات PDF سليمة", "err");
    } finally {
      setBusy(false);
    }
  };

  const totalPages = items.reduce((s, i) => s + i.pages, 0);

  return (
    <ToolShell tool={TOOL}>
      <Dropzone
        accept={TOOL.accept}
        multiple
        onFiles={addFiles}
        color={TOOL.color}
        title="اسحب ملفات PDF هنا"
        subtitle="أضف ملفين أو أكثر ثم رتّبها بالأسهم قبل الدمج"
      />

      {items.length > 0 && (
        <div className="anim-pop mt-6">
          <div className="card mb-5 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold">
                ترتيب الدمج <span className="c-muted font-normal">({items.length} ملفات · {totalPages} صفحة)</span>
              </h3>
              {items.length > 0 && (
                <button type="button" onClick={() => { setItems([]); setResult(null); }} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                  <Icon name="trash" size={14} />
                  مسح الكل
                </button>
              )}
            </div>

            <ul className="space-y-2.5">
              {items.map((it, idx) => (
                <FileRow
                  key={it.id}
                  name={it.file.name}
                  color={TOOL.color}
                  status="idle"
                  meta={
                    <span dir="ltr" className="font-mono">
                      {it.pages} صفحات · {formatBytes(it.file.size)}
                    </span>
                  }
                  actions={
                    <>
                      <span className="font-display c-amber w-6 text-center text-sm font-bold">{idx + 1}</span>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => move(idx, -1)}
                          disabled={idx === 0}
                          className="c-muted rounded-md p-0.5 transition-colors hover:text-[var(--teal)] disabled:opacity-30"
                          aria-label="تقديم الملف"
                        >
                          <Icon name="up" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(idx, 1)}
                          disabled={idx === items.length - 1}
                          className="c-muted rounded-md p-0.5 transition-colors hover:text-[var(--teal)] disabled:opacity-30"
                          aria-label="تأخير الملف"
                        >
                          <Icon name="down" size={15} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        className="c-muted rounded-lg p-1.5 transition-colors hover:text-[var(--red)]"
                        aria-label={`حذف ${it.file.name}`}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </>
                  }
                />
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProcessBtn
                label={`ادمج ${items.length} ملفات`}
                onClick={run}
                busy={busy}
                disabled={items.length < 2}
                color={TOOL.color}
                icon="merge"
              />
              {result && (
                <BlobLink
                  blob={outBlob}
                  className="btn-teal"
                  label="تحميل الملف المدموج"
                  filename="kraftoox-merged.pdf"
                />
              )}
            </div>

            {items.length < 2 && (
              <p className="c-muted mt-3 text-xs">أضف ملفاً ثانياً على الأقل لتفعيل الدمج.</p>
            )}

            {busy && (
              <div className="mt-4">
                <IndeterminateBar color={TOOL.color} />
              </div>
            )}

            {result && (
              <p className="anim-pop mt-4 flex items-center gap-2 rounded-xl bg-[var(--teal-soft)] px-4 py-2.5 text-sm font-semibold c-teal">
                <Icon name="check" size={16} />
                تم الدمج: {result.pages} صفحة · <span dir="ltr" className="font-mono">{formatBytes(result.bytes.length)}</span>
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          تُنسخ الصفحات بالترتيب الذي تراه في القائمة — استخدم الأسهم لإعادة الترتيب. الدمج يتم
          محلياً عبر <span className="font-mono" dir="ltr">pdf-lib</span> دون إعادة ترميز المحتوى،
          لذلك لا تفقد أي صفحة جودتها.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
