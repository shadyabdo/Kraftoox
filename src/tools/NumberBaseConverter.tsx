import { useState, useEffect } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("number-base-converter")!;

export default function NumberBaseConverter() {
  const { t, isAr } = useI18n();
  const [binary, setBinary] = useState("");
  const [decimal, setDecimal] = useState("");
  const [octal, setOctal] = useState("");
  const [hex, setHex] = useState("");
  const [error, setError] = useState("");

  const updateFromDecimal = (value: string, source: string) => {
    setError("");
    if (!value.trim()) {
      setBinary("");
      setDecimal("");
      setOctal("");
      setHex("");
      return;
    }

    try {
      let num: number;
      switch (source) {
        case "binary":
          if (!/^[01]+$/.test(value)) throw new Error("Invalid binary");
          num = parseInt(value, 2);
          break;
        case "decimal":
          num = parseInt(value, 10);
          if (isNaN(num)) throw new Error("Invalid decimal");
          break;
        case "octal":
          if (!/^[0-7]+$/.test(value)) throw new Error("Invalid octal");
          num = parseInt(value, 8);
          break;
        case "hex":
          if (!/^[0-9a-fA-F]+$/.test(value)) throw new Error("Invalid hex");
          num = parseInt(value, 16);
          break;
        default:
          return;
      }

      if (isNaN(num)) throw new Error("Invalid number");

      setBinary(num.toString(2));
      setDecimal(num.toString(10));
      setOctal(num.toString(8));
      setHex(num.toString(16).toUpperCase());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
    }
  };

  const handleCopy = async (text: string) => {
    const success = await copyText(text);
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-[var(--red-soft)] p-3 text-sm c-error">
            <Icon name="alert" size={16} className="inline-block ms-1" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{t("ثنائي (Binary)", "Binary")}</span>
              <button type="button" onClick={() => handleCopy(binary)} className="btn btn-ghost !py-1 !px-2 !text-xs">
                <Icon name="copy" size={14} />
              </button>
            </div>
            <input
              type="text"
              value={binary}
              onChange={(e) => updateFromDecimal(e.target.value, "binary")}
              placeholder="101010"
              className="input font-mono"
              dir="ltr"
            />
          </div>

          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{t("عشري (Decimal)", "Decimal")}</span>
              <button type="button" onClick={() => handleCopy(decimal)} className="btn btn-ghost !py-1 !px-2 !text-xs">
                <Icon name="copy" size={14} />
              </button>
            </div>
            <input
              type="text"
              value={decimal}
              onChange={(e) => updateFromDecimal(e.target.value, "decimal")}
              placeholder="42"
              className="input font-mono"
              dir="ltr"
            />
          </div>

          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{t("ثماني (Octal)", "Octal")}</span>
              <button type="button" onClick={() => handleCopy(octal)} className="btn btn-ghost !py-1 !px-2 !text-xs">
                <Icon name="copy" size={14} />
              </button>
            </div>
            <input
              type="text"
              value={octal}
              onChange={(e) => updateFromDecimal(e.target.value, "octal")}
              placeholder="52"
              className="input font-mono"
              dir="ltr"
            />
          </div>

          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{t("ست عشري (Hex)", "Hexadecimal")}</span>
              <button type="button" onClick={() => handleCopy(hex)} className="btn btn-ghost !py-1 !px-2 !text-xs">
                <Icon name="copy" size={14} />
              </button>
            </div>
            <input
              type="text"
              value={hex}
              onChange={(e) => updateFromDecimal(e.target.value, "hex")}
              placeholder="2A"
              className="input font-mono"
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
