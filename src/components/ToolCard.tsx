import type { CSSProperties } from "react";
import type { ToolDef } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

export function ToolCard({ tool, delay = 0 }: { tool: ToolDef; delay?: number }) {
  const { isAr } = useI18n();
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        to={`/tool/${tool.slug}`}
        className="tool-card card group relative flex h-full flex-col overflow-hidden p-6"
        style={{ "--tc": tool.color } as CSSProperties}
      >
        {/* خلفية متدرجة عند التمرير */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-10"
          style={{ background: `radial-gradient(circle at 50% 0%, ${tool.color}, transparent 70%)` }}
        />

        {/* الرأس */}
        <div className="relative z-10 flex items-start justify-between mb-4">
          <span
            className="tool-icon grid h-14 w-14 place-items-center rounded-2xl transition-all duration-300"
            style={{
              background: `color-mix(in srgb, ${tool.color} 12%, var(--surface))`,
              color: tool.color,
            }}
          >
            <Icon name={tool.icon} size={28} />
          </span>
          <div className="flex items-center gap-1.5">
            {tool.isNew && (
              <span className="font-display anim-pulse-soft rounded-md bg-[var(--red)] px-2 py-1 text-[10px] font-bold text-white">
                {isAr ? "جديد" : "NEW"}
              </span>
            )}
            <span
              className="font-mono rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide"
              style={{
                color: tool.color,
                background: `color-mix(in srgb, ${tool.color} 9%, transparent)`,
              }}
            >
              {tool.category === "image"
                ? isAr ? "صور" : "IMG"
                : tool.category === "pdf"
                ? "PDF"
                : tool.category === "video"
                ? isAr ? "فيديو" : "VID"
                : "AI"}
            </span>
          </div>
        </div>

        {/* المحتوى */}
        <div className="relative z-10 flex-1">
          <h3 className="font-display text-lg font-extrabold leading-tight mb-2">
            {isAr ? tool.name : tool.nameEn}
          </h3>
          <p className="c-muted text-[13px] leading-relaxed line-clamp-2">
            {isAr ? tool.short : tool.shortEn}
          </p>
        </div>

        {/* التذييل */}
        <div className="relative z-10 flex items-center justify-between border-t bd-line pt-4 mt-4">
          <span className="font-mono text-[10px] tracking-wider c-muted" dir="ltr">
            {isAr ? tool.badge : tool.badgeEn}
          </span>
          <span
            className="flex items-center gap-1 text-xs font-bold transition-all duration-300 group-hover:-translate-x-1"
            style={{ color: tool.color }}
          >
            {isAr ? "فتح" : "Open"}
            <Icon name="arrow" size={15} />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
