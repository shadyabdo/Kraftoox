import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("uuid-generator")!;

export default function UUIDGenerator() {
  const { t, isAr } = useI18n();
  const [count, setCount] = useState(10);
  const [uuids, setUuids] = useState<string[]>([]);

  const generateUUIDs = () => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(crypto.randomUUID());
    }
    setUuids(newUuids);
    showToast(t("تم التوليد", "Generated"));
  };

  const handleCopy = async () => {
    const success = await copyText(uuids.join("\n"));
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  const handleCopyOne = async (uuid: string) => {
    const success = await copyText(uuid);
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {t("العدد", "Count")}
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
            className="input"
          />
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={generateUUIDs}
            className="btn btn-primary"
          >
            <Icon name="wand" size={16} />
            {t("ولّد UUIDs", "Generate UUIDs")}
          </button>
          {uuids.length > 0 && (
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary"
            >
              <Icon name="copy" size={16} />
              {t("نسخ الكل", "Copy All")}
            </button>
          )}
        </div>

        {uuids.length > 0 && (
          <div className="rounded-lg bg-[var(--surface2)] p-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              {uuids.map((uuid, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded bg-[var(--surface)] p-2">
                  <code className="text-sm font-mono flex-1" dir="ltr">
                    {uuid}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyOne(uuid)}
                    className="btn btn-ghost !py-1 !px-2 !text-xs"
                  >
                    <Icon name="copy" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
