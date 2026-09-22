import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("lorem-ipsum")!;

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");

const Lorem = () => {
  const { t, isAr } = useI18n();
  const [count, setCount] = useState(3);
  const [type, setType] = useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const [output, setOutput] = useState("");

  const generate = () => {
    const randomWord = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
    const randomSentence = () => {
      const len = Math.floor(Math.random() * 10) + 5;
      const words = Array.from({ length: len }, randomWord);
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      return words.join(" ") + ".";
    };
    const randomParagraph = () => {
      const len = Math.floor(Math.random() * 4) + 3;
      return Array.from({ length: len }, randomSentence).join(" ");
    };

    let result = "";
    if (type === "paragraphs") {
      result = Array.from({ length: count }, randomParagraph).join("\n\n");
    } else if (type === "sentences") {
      result = Array.from({ length: count }, randomSentence).join(" ");
    } else {
      result = Array.from({ length: count }, randomWord).join(" ");
    }

    setOutput(result);
    showToast(t("تم التوليد", "Generated"));
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
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-sm font-bold">{t("النوع", "Type")}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="input"
            >
              <option value="paragraphs">{t("فقرات", "Paragraphs")}</option>
              <option value="sentences">{t("جمل", "Sentences")}</option>
              <option value="words">{t("كلمات", "Words")}</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold">{t("العدد", "Count")}</label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="input"
            />
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button type="button" onClick={generate} className="btn btn-primary">
            <Icon name="wand" size={16} />
            {t("ولّد", "Generate")}
          </button>
          {output && (
            <button type="button" onClick={handleCopy} className="btn btn-secondary">
              <Icon name="copy" size={16} />
              {t("نسخ", "Copy")}
            </button>
          )}
        </div>

        {output && (
          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <p className="whitespace-pre-wrap leading-relaxed">{output}</p>
          </div>
        )}
      </div>
    </ToolShell>
  );
};

export default Lorem;
