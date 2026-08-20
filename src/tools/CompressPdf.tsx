import { useMemo, useState } from "react";
import { Dropzone } from "../components/Dropzone";
import { BlobLink, InfoNote, IndeterminateBar } from "../components/bits";
import { getTool } from "../data/tools";
import { compressPdf } from "../lib/pdf";
import { bumpProcessedCount, bytesToBlob, downloadBlob, formatBytes, percentSavings, showToast } from "../lib/utils";
import { OptionsPanel, ProcessBtn, ToolShell, FileRow } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("compress-pdf")!;

const LEVELS = [
  { id: "light", label: "خفيف", desc: "أفضل جودة", q: 0.8 },
  { id: "balanced", label: "متوازن", desc: "موصى به", q: 0.6 },
  { id: "max", label: "أقصى", desc: "أصغر حجم", q: 0.4 },
] as const;

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("balanced");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ bytes: Uint8Array; replaced: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  const outBlob = useMemo(
    () => (result ? bytesToBlob(result.bytes, "application/pdf") : null),
    [result]
  );

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const q = LEVELS.find((l) => l.id === level)!.q;
      const res = await compressPdf(file, q);
      setResult({ bytes: res.bytes, replaced: res.replacedImages, skipped: res.skippedImages });
      bumpProcessedCount(1);
      showToast("تم ضغط الملف بنجاح");
    } catch {
      setError("تعذّرت معالجة هذا الملف — قد يكون محمياً أو تالفاً.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolShell tool={TOOL}>
      {!file ? (
        <Dropzone
          accept={TOOL.accept}
          multiple={false}
          onFiles={(f) => {
            setFile(f[0]);
            setResult(null);
            setError("");
          }}
          color={TOOL.color}
          title="اسحب ملف PDF لبدء الضغط"
          subtitle="يعيد المحرك ترميز الصور المضمنة ويحسّن بنية الملف الداخلية"
        />
      ) : (
        <div className="anim-pop">
          <OptionsPanel title="مستوى الضغط">
            <ul className="mb-5">
              <FileRow
                name={file.name}
                color={TOOL.color}
                status={busy ? "working" : result ? "done" : "idle"}
                meta={
                  <span dir="ltr" className="font-mono">
                    {formatBytes(file.size)}
                    {result && (
                      <>
                        {" → "}
                        <b className="c-teal">{formatBytes(result.bytes.length)}</b>
                        <b className="c-teal"> ({percentSavings(file.size, result.bytes.length)})</b>
                      </>
                    )}
                  </span>
                }
              />
            </ul>

            <div className="grid gap-2.5 sm:grid-cols-3">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevel(l.id)}
                  className={`card !rounded-xl p-3.5 text-start transition-all duration-200 ${
                    level === l.id
                      ? "!border-[var(--red)] shadow-[0_0_0_3px_var(--glow-red)]"
                      : "hover:-translate-y-0.5"
                  }`}
                  aria-pressed={level === l.id}
                >
                  <span className="font-display block text-sm font-bold">{l.label}</span>
                  <span className="c-muted text-xs">{l.desc}</span>
                  <span className="mt-1 block font-mono text-[10px] c-muted" dir="ltr">
                    quality: {l.q}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ProcessBtn label={result ? "أعد الضغط" : "اضغط الملف الآن"} onClick={run} busy={busy} color={TOOL.color} icon="pdf" />
              {result && (
                <BlobLink
                  blob={outBlob}
                  className="btn-teal"
                  label="تحميل الملف المضغوط"
                  filename={file.name.replace(/\.pdf$/i, "") + "-compressed.pdf"}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError("");
                }}
                className="btn btn-ghost !px-3"
              >
                <Icon name="refresh" size={16} />
                ملف آخر
              </button>
            </div>

            {busy && (
              <div className="mt-4">
                <IndeterminateBar color={TOOL.color} />
                <p className="c-muted mt-2 text-xs">
                  يفك المحرك الصور المضمنة ويعيد ترميزها… قد يستغرق ذلك ثوانٍ للملفات الكبيرة.
                </p>
              </div>
            )}
          </OptionsPanel>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border bd-line bg-[var(--red-soft)] px-4 py-3 text-sm">
              <span className="c-red mt-0.5"><Icon name="alert" size={17} /></span>
              {error}
            </div>
          )}

          {result && (
            <div className="anim-pop card mt-4 grid gap-4 p-5 sm:grid-cols-3">
              <div className="text-center">
                <p className="c-muted text-xs">الحجم الأصلي</p>
                <p className="font-display text-xl font-bold" dir="ltr">{formatBytes(file.size)}</p>
              </div>
              <div className="text-center">
                <p className="c-muted text-xs">الحجم بعد الضغط</p>
                <p className="font-display c-teal text-xl font-bold" dir="ltr">{formatBytes(result.bytes.length)}</p>
              </div>
              <div className="text-center">
                <p className="c-muted text-xs">صور أُعيد ترميزها</p>
                <p className="font-display text-xl font-bold" dir="ltr">
                  {result.replaced}
                  <span className="c-muted text-sm"> / {result.replaced + result.skipped}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <InfoNote>
          أفضل النتائج مع الملفات التي تحتوي صوراً ممسوحة أو لقطات شاشة. الملفات النصية البحتة
          يكون توفيرها أقل لأن النص مضغوط أصلاً — مع ذلك يُحسّن المحرك البنية ويزيل البيانات الزائدة.
        </InfoNote>
      </div>
    </ToolShell>
  );
}
