import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("text-case-converter")!;

export default function TextCaseConverter() {
  const { t, isAr } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const convert = (type: string) => {
    switch (type) {
      case "upper":
        setOutput(input.toUpperCase());
        break;
      case "lower":
        setOutput(input.toLowerCase());
        break;
      case "title":
        setOutput(input.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
        break;
      case "sentence":
        setOutput(input.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()));
        break;
      case "camel":
        setOutput(input.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()));
        break;
      case "snake":
        setOutput(input.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""));
        break;
      case "kebab":
        setOutput(input.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
        break;
    }
    showToast(t("تم التحويل", "Converted"));
  };

  const handleCopy = async () => {
    if (!output) return;
    const success = await copyText(output);
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {t("أدخل النص", "Enter text")}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("اكتب النص هنا...", "Type text here...")}
            className="input min-h-[150px]"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => convert("upper")} className="btn btn-secondary !py-2 !text-xs">UPPER CASE</button>
          <button type="button" onClick={() => convert("lower")} className="btn btn-secondary !py-2 !text-xs">lower case</button>
          <button type="button" onClick={() => convert("title")} className="btn btn-secondary !py-2 !text-xs">Title Case</button>
          <button type="button" onClick={() => convert("sentence")} className="btn btn-secondary !py-2 !text-xs">{t("Sentence case", "Sentence case")}</button>
          <button type="button" onClick={() => convert("camel")} className="btn btn-secondary !py-2 !text-xs">camelCase</button>
          <button type="button" onClick={() => convert("snake")} className="btn btn-secondary !py-2 !text-xs">snake_case</button>
          <button type="button" onClick={() => convert("kebab")} className="btn btn-secondary !py-2 !text-xs">kebab-case</button>
        </div>

        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold">{t("النتيجة", "Result")}</label>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-ghost !py-1 !px-2 !text-xs"
              >
                <Icon name="copy" size={14} />
                {t("نسخ", "Copy")}
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              className="input min-h-[150px] bg-[var(--surface2)]"
            />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
