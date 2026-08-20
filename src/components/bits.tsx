import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx, copyText } from "../lib/utils";
import { Icon, type IconName } from "./Icons";

/* ===== Spinner ===== */
export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cx("anim-spin", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ===== زر نسخ مع حالة نجاح ===== */
export function CopyBtn({
  text,
  label = "نسخ",
  className,
  small,
}: {
  text: string;
  label?: string;
  className?: string;
  small?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }
      }}
      className={cx(
        "btn",
        small ? "!px-2.5 !py-1.5 !text-xs !rounded-lg" : "",
        copied ? "btn-teal" : className?.includes("btn-") ? "" : "btn-ghost",
        className
      )}
    >
      <Icon name={copied ? "check" : "copy"} size={small ? 14 : 16} />
      {copied ? "تم النسخ" : label}
    </button>
  );
}

/* ===== شريط تقدم ===== */
export function ProgressBar({ value, color = "var(--teal)" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2 border bd-line">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

/* ===== شريط تقدم "نملة" أثناء المعالجة غير محددة المدة ===== */
export function IndeterminateBar({ color = "var(--teal)" }: { color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2 border bd-line">
      <div
        className="h-full rounded-full"
        style={{ background: color, animation: "ft-bar 1.4s ease-in-out infinite alternate" }}
      />
    </div>
  );
}

/* ===== التوست ===== */
interface ToastMsg {
  id: string;
  message: string;
  kind: "ok" | "err" | "info";
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastMsg;
      setToasts((t) => [...t.slice(-2), detail]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== detail.id));
      }, 3400);
    };
    window.addEventListener("ft:toast", onToast);
    return () => window.removeEventListener("ft:toast", onToast);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "anim-toast pointer-events-auto flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg bg-surface bd-line"
          )}
          role="status"
        >
          <span
            className={cx(
              "grid h-6 w-6 shrink-0 place-items-center rounded-full",
              t.kind === "ok" && "c-teal bg-[var(--teal-soft)]",
              t.kind === "err" && "c-red bg-[var(--red-soft)]",
              t.kind === "info" && "c-amber bg-[var(--amber-soft)]"
            )}
          >
            <Icon name={t.kind === "ok" ? "check" : t.kind === "err" ? "alert" : "info"} size={14} />
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ===== ترويسة قسم ===== */
export function SectionHead({
  kicker,
  title,
  desc,
  icon,
  color,
}: {
  kicker: string;
  title: string;
  desc?: string;
  icon?: IconName;
  color?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-xl">
        <p
          className="font-display mb-1 flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: color ?? "var(--teal)" }}
        >
          {icon && <Icon name={icon} size={16} />}
          {kicker}
        </p>
        <h2 className="font-display text-2xl font-bold leading-snug sm:text-3xl">{title}</h2>
        {desc && <p className="c-muted mt-2 text-sm leading-relaxed sm:text-base">{desc}</p>}
      </div>
    </div>
  );
}

/* ===== منزلق مقارنة قبل/بعد ===== */
export function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(97, Math.max(3, p)));
  };

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-2xl cursor-ew-resize select-none overflow-hidden rounded-xl border bd-line bg-surface2"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
      role="slider"
      aria-label="مقارنة قبل وبعد"
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPos((p) => Math.max(3, p - 4));
        if (e.key === "ArrowRight") setPos((p) => Math.min(97, p + 4));
      }}
    >
      <img src={after} alt="بعد المعالجة" className="block w-full" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="قبل المعالجة" className="block h-full w-full object-cover" draggable={false} />
      </div>
      {/* المقبض */}
      <div className="absolute inset-y-0" style={{ insetInlineStart: `${pos}%` }}>
        <div className="absolute inset-y-0 -ms-px w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.5)]" />
        <div className="absolute top-1/2 grid h-9 w-9 -translate-y-1/2 -ms-[18px] place-items-center rounded-full border-2 border-white bg-[var(--teal)] text-white shadow-lg">
          <Icon name="flipH" size={16} />
        </div>
      </div>
      <span className="absolute top-2 start-2 rounded-md bg-[color-mix(in_srgb,var(--ink)_75%,transparent)] px-2 py-0.5 text-[10px] font-bold text-white">قبل</span>
      <span className="absolute top-2 end-2 rounded-md bg-[var(--teal)] px-2 py-0.5 text-[10px] font-bold text-white">بعد</span>
    </div>
  );
}

/* ===== بطاقة معلومة صغيرة ===== */
export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border bd-line bg-surface2 px-4 py-3 text-sm leading-relaxed">
      <span className="c-amber mt-0.5 shrink-0">
        <Icon name="info" size={17} />
      </span>
      <div>{children}</div>
    </div>
  );
}
