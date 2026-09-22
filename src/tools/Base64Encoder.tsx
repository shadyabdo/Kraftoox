import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("base64-encoder")!;

export default function Base64Encoder() {
  const { t, isAr } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const handleConvert = () => {
    try {
      if (mode === "encode") {
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(input)));
        setOutput(decoded);
      }
      showToast(t("تم التحويل بنجاح", "Converted successfully"));
    } catch (e) {
      showToast(t("خطأ في التحويل", "Conversion error"), "err");
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

  const handleSwap = () => {
    setInput(output);
    setOutput("");
    setMode(mode === "encode" ? "decode" : "encode");
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("encode")}
            className={`btn ${mode === "encode" ? "btn-primary" : "btn-secondary"}`}
          >
            {t("ترميز", "Encode")}
          </button>
          <button
            type="button"
            onClick={() => setMode("decode")}
            className={`btn ${mode === "decode" ? "btn-primary" : "btn-secondary"}`}
          >
            {t("فك ترميز", "Decode")}
          </button>
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {mode === "encode" ? t("النص", "Text") : t("Base64", "Base64")}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? "Hello World" : "SGVsbG8gV29ybGQ="}
            className="input min-h-[150px] font-mono text-sm"
            dir="ltr"
          />
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={handleConvert}
            disabled={!input.trim()}
            className="btn btn-primary"
          >
            <Icon name="wand" size={16} />
            {mode === "encode" ? t("رمّز", "Encode") : t("فك الترميز", "Decode")}
          </button>
          <button
            type="button"
            onClick={handleSwap}
            disabled={!output}
            className="btn btn-secondary"
          >
            <Icon name="swap" size={16} />
            {t("تبديل", "Swap")}
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
        </div>

        {output && (
          <div>
            <label className="mb-2 block text-sm font-bold">
              {mode === "encode" ? t("Base64", "Base64") : t("النص", "Text")}
            </label>
            <textarea
              value={output}
              readOnly
              className="input min-h-[150px] font-mono text-sm bg-[var(--surface2)]"
              dir="ltr"
            />
          </div>
        )}
      </div>
    </ToolShell>
  );
}
