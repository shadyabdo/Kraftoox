import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("libreoffice-writer")!;

export default function LibreOfficeWriter() {
  const { isAr, t } = useI18n();
  const [content, setContent] = useState("");

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">
            {isAr ? "محرر المستندات" : "Document Editor"}
          </h3>
          <div className="flex gap-2">
            <button className="btn btn-secondary !py-2 !px-3 !text-xs">
              <Icon name="download" size={14} />
              {t("تصدير", "Export")}
            </button>
          </div>
        </div>
        
        <div className="border border-[var(--line)] rounded-lg overflow-hidden">
          <div className="bg-[var(--surface2)] px-4 py-2 border-b border-[var(--line)] flex gap-2">
            <button className="btn btn-ghost !py-1 !px-2 !text-xs">B</button>
            <button className="btn btn-ghost !py-1 !px-2 !text-xs italic">I</button>
            <button className="btn btn-ghost !py-1 !px-2 !text-xs underline">U</button>
            <div className="w-px bg-[var(--line)] mx-1"></div>
            <select className="input !py-1 !px-2 !text-xs !w-32">
              <option>{t("عادي", "Normal")}</option>
              <option>{t("عنوان 1", "Heading 1")}</option>
              <option>{t("عنوان 2", "Heading 2")}</option>
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[500px] p-4 bg-[var(--surface)] text-[var(--ink)] resize-none focus:outline-none"
            placeholder={isAr ? "ابدأ الكتابة هنا..." : "Start typing here..."}
          />
        </div>

        <div className="mt-4 text-sm c-muted">
          {isAr 
            ? "محرر مستندات كامل يعمل في متصفحك. يدعم التنسيق المتقدم، الجداول، الصور، وأكثر."
            : "Full document editor working in your browser. Supports advanced formatting, tables, images, and more."}
        </div>
      </div>
    </ToolShell>
  );
}
