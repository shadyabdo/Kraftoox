import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";

const TOOL = getTool("word-counter")!;

export default function WordCounter() {
  const { t, isAr } = useI18n();
  const [text, setText] = useState("");

  const stats = {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    sentences: text.trim() ? text.split(/[.!?؟]+/).filter(s => s.trim()).length : 0,
    paragraphs: text.trim() ? text.split(/\n\n+/).filter(p => p.trim()).length : 0,
    readingTime: Math.ceil((text.trim() ? text.trim().split(/\s+/).length : 0) / 200),
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {t("أدخل النص", "Enter text")}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("اكتب أو الصق النص هنا...", "Type or paste text here...")}
            className="input min-h-[200px]"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-lg bg-[var(--surface2)] p-4 text-center">
            <div className="text-3xl font-bold c-primary">{stats.words}</div>
            <div className="text-sm c-muted">{t("كلمات", "Words")}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface2)] p-4 text-center">
            <div className="text-3xl font-bold c-primary">{stats.characters}</div>
            <div className="text-sm c-muted">{t("أحرف", "Characters")}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface2)] p-4 text-center">
            <div className="text-3xl font-bold c-primary">{stats.charactersNoSpaces}</div>
            <div className="text-sm c-muted">{t("بدون مسافات", "No Spaces")}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface2)] p-4 text-center">
            <div className="text-3xl font-bold c-primary">{stats.sentences}</div>
            <div className="text-sm c-muted">{t("جمل", "Sentences")}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface2)] p-4 text-center">
            <div className="text-3xl font-bold c-primary">{stats.paragraphs}</div>
            <div className="text-sm c-muted">{t("فقرات", "Paragraphs")}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface2)] p-4 text-center">
            <div className="text-3xl font-bold c-primary">{stats.readingTime}</div>
            <div className="text-sm c-muted">{t("دقائق قراءة", "Min Read")}</div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
