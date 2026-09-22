import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("json-formatter")!;

export default function JsonFormatter() {
  const { t, isAr } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutput(formatted);
      setError("");
      showToast(t("تم التنسيق بنجاح", "Formatted successfully"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setError("");
      showToast(t("تم التصغير بنجاح", "Minified successfully"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setOutput("");
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    const success = await copyText(output);
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {t("أدخل JSON", "Enter JSON")}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            className="input min-h-[200px] font-mono text-sm"
            dir="ltr"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[var(--red-soft)] p-3 text-sm c-error">
            <Icon name="alert" size={16} className="inline-block ms-1" />
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleFormat}
            disabled={!input.trim()}
            className="btn btn-primary"
          >
            <Icon name="wand" size={16} />
            {t("تنسيق", "Format")}
          </button>
          <button
            type="button"
            onClick={handleMinify}
            disabled={!input.trim()}
            className="btn btn-secondary"
          >
            <Icon name="compress" size={16} />
            {t("تصغير", "Minify")}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!output}
            className="btn btn-secondary"
          >
            <Icon name="copy" size={16} />
            {t("نسخ", "Copy")}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-ghost"
          >
            <Icon name="trash" size={16} />
            {t("مسح", "Clear")}
          </button>
          <div className="flex items-center gap-2 ms-auto">
            <label className="text-sm c-muted">{t("المسافة البادئة:", "Indent:")}</label>
            <select
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value))}
              className="input !w-20 !py-1"
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </div>
        </div>

        {output && (
          <div>
            <label className="mb-2 block text-sm font-bold">
              {t("النتيجة", "Result")}
            </label>
            <pre className="rounded-lg bg-[var(--surface2)] p-4 overflow-x-auto font-mono text-sm" dir="ltr">
              <code>{output}</code>
            </pre>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
