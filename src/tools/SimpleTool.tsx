import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOLS_MAP = {
  "currency-converter": { name: "محول العملات", nameEn: "Currency Converter" },
  "markdown-editor": { name: "محرر Markdown", nameEn: "Markdown Editor" },
  "json-to-yaml": { name: "JSON إلى YAML", nameEn: "JSON to YAML" },
  "csv-to-json": { name: "CSV إلى JSON", nameEn: "CSV to JSON" },
  "text-diff": { name: "مقارنة النصوص", nameEn: "Text Diff" },
  "text-remover-duplicates": { name: "إزالة التكرار", nameEn: "Remove Duplicates" },
  "text-sorter": { name: "فرز النصوص", nameEn: "Text Sorter" },
  "random-number-generator": { name: "مولد أرقام عشوائية", nameEn: "Random Number Generator" },
  "barcode-generator": { name: "مولد الباركود", nameEn: "Barcode Generator" },
  "color-palette-generator": { name: "مولد لوحات الألوان", nameEn: "Color Palette Generator" },
  "image-to-base64": { name: "صورة إلى Base64", nameEn: "Image to Base64" },
  "image-resizer-online": { name: "تغيير حجم الصور", nameEn: "Image Resizer" },
  "image-cropper": { name: "قص الصور", nameEn: "Image Cropper" },
  "image-rotate-flip": { name: "تدوير وقلب الصور", nameEn: "Image Rotate & Flip" },
  "pdf-splitter": { name: "تقسيم PDF", nameEn: "PDF Splitter" },
  "pdf-protector": { name: "حماية PDF", nameEn: "PDF Protector" },
  "pdf-unlocker": { name: "إزالة حماية PDF", nameEn: "PDF Unlocker" },
  "pdf-page-numbers": { name: "ترقيم صفحات PDF", nameEn: "PDF Page Numbers" },
  "pdf-watermark": { name: "علامة مائية PDF", nameEn: "PDF Watermark" },
  "color-picker": { name: "منتقي الألوان", nameEn: "Color Picker" },
  "gradient-generator": { name: "مولد التدرجات", nameEn: "Gradient Generator" },
  "regex-tester": { name: "مختبر Regex", nameEn: "Regex Tester" },
  "sql-formatter": { name: "منسق SQL", nameEn: "SQL Formatter" },
};

export default function SimpleTool() {
  const slug = window.location.hash.split("/").pop() || "";
  const tool = getTool(slug)!;
  const { isAr, t } = useI18n();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const process = () => {
    // معالجة بسيطة حسب الأداة
    if (slug === "text-remover-duplicates") {
      const lines = input.split("\n");
      const unique = [...new Set(lines)];
      setOutput(unique.join("\n"));
    } else if (slug === "text-sorter") {
      const lines = input.split("\n");
      setOutput(lines.sort().join("\n"));
    } else if (slug === "random-number-generator") {
      const nums = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
      setOutput(nums.join(", "));
    } else if (slug === "markdown-editor") {
      setOutput(input); // محاكاة بسيطة
    } else {
      setOutput(input);
    }
  };

  return (
    <ToolShell tool={tool}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">{t("الإدخال", "Input")}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input min-h-[200px]"
            placeholder={isAr ? "أدخل النص هنا..." : "Enter text here..."}
          />
        </div>

        <button onClick={process} className="btn btn-primary w-full mb-4">
          <Icon name="wand" size={16} />
          {t("معالجة", "Process")}
        </button>

        {output && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold">{t("النتيجة", "Output")}</label>
            <textarea
              value={output}
              readOnly
              className="input min-h-[200px] bg-[var(--surface2)]"
            />
            <button
              onClick={async () => {
                await copyText(output);
                showToast(t("تم النسخ", "Copied"));
              }}
              className="btn btn-secondary mt-2 w-full"
            >
              <Icon name="copy" size={16} />
              {t("نسخ", "Copy")}
            </button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
