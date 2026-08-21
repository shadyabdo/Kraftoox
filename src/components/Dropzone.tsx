import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { cx, showToast } from "../lib/utils";
import { t as tr } from "../i18n";
import { takePendingFiles } from "../lib/pending";
import { Icon } from "./Icons";

interface DropzoneProps {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title?: string;
  subtitle?: string;
  color?: string;
  compact?: boolean;
}

/* منطقة إفلات الملفات — سحب/إفلات، نقر، ولصق من الحافظة */
export function Dropzone({
  accept,
  multiple = false,
  onFiles,
  title,
  subtitle,
  color = "var(--teal)",
  compact = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState(false);
  const acceptList = accept.split(",").map((s) => s.trim().toLowerCase());

  const dzTitle = title ?? tr("اسحب ملفاتك هنا", "Drop your files here");
  const dzSubtitle = subtitle ?? tr("أو انقر للاختيار من جهازك", "or click to browse your device");

  /* التقاط ملف مُمرَّر من صفحة الهبوط أو من قسم آخر */
  useEffect(() => {
    const files = takePendingFiles();
    if (!files?.length) return;
    const ok = validate(files);
    if (ok.length) onFiles(multiple ? ok : ok.slice(0, 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = (files: File[]): File[] => {
    /* بعض الأنظمة لا ترسل نوع MIME — نستنتجه من الامتداد كي لا يُرفض ملف سليم */
    const EXT_MIME: Record<string, string> = {
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml",
      ".bmp": "image/bmp", ".pdf": "application/pdf",
      ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
      ".mkv": "video/x-matroska", ".m4v": "video/mp4", ".avi": "video/x-msvideo",
    };
    const ok = files.filter((f) => {
      const ext = `.${(f.name.split(".").pop() ?? "").toLowerCase()}`;
      const type = f.type.toLowerCase() || EXT_MIME[ext] || "";
      if (!type) return true; /* ملف بلا نوع معروف — نمرّره ونترك الأداة تتعامل معه */
      return acceptList.some(
        (a) =>
          (a.startsWith(".") && a === ext) ||
          (a.endsWith("/*") && type.startsWith(a.slice(0, -1))) ||
          a === type
      );
    });
    if (ok.length !== files.length) {
      showToast("بعض الملفات بصيغة غير مدعومة في هذه الأداة وتم تجاهلها", "err");
    }
    return ok;
  };

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = validate(Array.from(list));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setLive(false);
    handle(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setLive(true);
      }}
      onDragLeave={() => setLive(false)}
      onDrop={onDrop}
      className={cx(
        "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl text-center outline-none transition-all duration-300",
        compact ? "gap-2.5 px-4 py-8" : "gap-3 px-6 py-12 sm:py-16",
        "bg-surface focus-visible:ring-2 focus-visible:ring-[var(--teal)]",
        live && "dropzone-live"
      )}
      style={
        {
          "--tc-active": color,
          border: "1px solid var(--line)",
          boxShadow: live
            ? `0 0 0 3px color-mix(in srgb, ${color} 30%, transparent), var(--card-shadow)`
            : "var(--card-shadow)",
        } as CSSProperties
      }
    >
      <span className="ants absolute inset-[7px] rounded-xl" aria-hidden="true" />

      <span
        className={cx(
          "grid place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
          compact ? "h-12 w-12" : "h-16 w-16"
        )}
        style={{ background: `color-mix(in srgb, ${color} 13%, transparent)`, color }}
      >
        <Icon name="upload" size={compact ? 22 : 30} />
      </span>

      <div>
        <p className={cx("font-display font-bold", compact ? "text-base" : "text-lg sm:text-xl")}>
          {dzTitle}
        </p>
        <p className="c-muted mt-1 text-xs sm:text-sm">{dzSubtitle}</p>
      </div>

      <span
        className="font-display mt-1 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 group-hover:-translate-y-0.5"
        style={{ background: color, color: color.includes("amber") ? "#2b1c02" : undefined }}
      >
        <Icon name="file" size={16} />
        {tr(multiple ? "اختر الملفات" : "اختر ملفاً", multiple ? "Choose files" : "Choose a file")}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
