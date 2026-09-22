import type { CSSProperties } from "react";
import type { ToolDef } from "../data/tools";
import { Link } from "../lib/router";
import { useI18n } from "../i18n";
import { Icon } from "./Icons";

export function ToolCard({ tool }: { tool: ToolDef }) {
  const { isAr } = useI18n();
  
  return (
    <Link
      to={`/tool/${tool.slug}`}
      className="tool-card card group flex flex-col p-6"
      style={{ "--tc": tool.color } as CSSProperties}
    >
      {/* Icon */}
      <div
        className="tool-icon grid h-14 w-14 place-items-center rounded-xl mb-4 transition-transform duration-200"
        style={{
          background: `color-mix(in srgb, ${tool.color} 15%, var(--surface2))`,
          color: tool.color,
        }}
      >
        <Icon name={tool.icon} size={28} />
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-bold mb-2 group-hover:text-[var(--primary)] transition-colors">
        {isAr ? tool.name : tool.nameEn}
      </h3>

      {/* Description */}
      <p className="c-muted text-sm leading-relaxed flex-1">
        {isAr ? tool.short : tool.shortEn}
      </p>

      {/* Badge */}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-xs c-muted" dir="ltr">
          {isAr ? tool.badge : tool.badgeEn}
        </span>
        {tool.isNew && (
          <span className="text-xs font-bold text-[var(--error)] bg-[var(--red-soft)] px-2 py-1 rounded">
            {isAr ? "جديد" : "NEW"}
          </span>
        )}
      </div>
    </Link>
  );
}
