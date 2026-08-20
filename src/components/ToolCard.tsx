import type { CSSProperties } from "react";
import type { ToolDef } from "../data/tools";
import { Link } from "../lib/router";
import { Icon } from "./Icons";
import { Reveal } from "./Reveal";

export function ToolCard({ tool, delay = 0 }: { tool: ToolDef; delay?: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        to={`/tool/${tool.slug}`}
        className="tool-card card group flex h-full flex-col gap-3 p-5"
        style={{ "--tc": tool.color } as CSSProperties}
      >
        <div className="flex items-start justify-between">
          <span
            className="tool-icon grid h-12 w-12 place-items-center rounded-xl transition-colors duration-300"
            style={{
              background: `color-mix(in srgb, ${tool.color} 12%, var(--surface))`,
              color: tool.color,
            }}
          >
            <Icon name={tool.icon} size={24} />
          </span>
          <span className="flex items-center gap-1.5">
            {tool.isNew && (
              <span className="font-display anim-pulse-soft rounded-md bg-[var(--red)] px-2 py-1 text-[10px] font-bold text-white">
                جديد
              </span>
            )}
            <span
              className="font-display rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide"
              style={{
                color: tool.color,
                background: `color-mix(in srgb, ${tool.color} 9%, transparent)`,
              }}
            >
              {tool.category === "image" ? "صور" : tool.category === "pdf" ? "PDF" : tool.category === "video" ? "فيديو" : "AI"}
            </span>
          </span>
        </div>

        <div className="flex-1">
          <h3 className="font-display text-lg font-bold leading-tight">{tool.name}</h3>
          <p className="c-muted mt-1.5 text-[13px] leading-relaxed">{tool.short}</p>
        </div>

        <div className="flex items-center justify-between border-t bd-line pt-3">
          <span className="font-mono text-[10px] tracking-wider c-muted" dir="ltr">
            {tool.badge}
          </span>
          <span
            className="flex items-center gap-1 text-xs font-semibold transition-transform duration-300 group-hover:-translate-x-1"
            style={{ color: tool.color }}
          >
            فتح الأداة
            <Icon name="arrow" size={15} />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
