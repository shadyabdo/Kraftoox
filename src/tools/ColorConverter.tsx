import { useState, useEffect } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("color-converter")!;

export default function ColorConverter() {
  const { t, isAr } = useI18n();
  const [hex, setHex] = useState("#c8a460");
  const [rgb, setRgb] = useState({ r: 200, g: 164, b: 96 });
  const [hsl, setHsl] = useState({ h: 43, s: 50, l: 58 });

  useEffect(() => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setRgb({ r, g, b });

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;
    let h = 0, s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
      }
    }

    setHsl({ h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) });
  }, [hex]);

  const handleCopy = async (text: string) => {
    const success = await copyText(text);
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-6 flex gap-4 items-start">
          <div
            className="w-32 h-32 rounded-xl border border-[var(--line)]"
            style={{ backgroundColor: hex }}
          />
          <div className="flex-1">
            <label className="mb-2 block text-sm font-bold">{t("منتقي الألوان", "Color Picker")}</label>
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="w-full h-12 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">HEX</span>
              <button type="button" onClick={() => handleCopy(hex)} className="btn btn-ghost !py-1 !px-2 !text-xs">
                <Icon name="copy" size={14} />
              </button>
            </div>
            <input
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="input font-mono"
              dir="ltr"
            />
          </div>

          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">RGB</span>
              <button type="button" onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)} className="btn btn-ghost !py-1 !px-2 !text-xs">
                <Icon name="copy" size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input type="number" min="0" max="255" value={rgb.r} onChange={(e) => {
                const r = Number(e.target.value);
                setRgb({ ...rgb, r });
                setHex(`#${r.toString(16).padStart(2, "0")}${rgb.g.toString(16).padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`);
              }} className="input font-mono text-center" />
              <input type="number" min="0" max="255" value={rgb.g} onChange={(e) => {
                const g = Number(e.target.value);
                setRgb({ ...rgb, g });
                setHex(`#${rgb.r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${rgb.b.toString(16).padStart(2, "0")}`);
              }} className="input font-mono text-center" />
              <input type="number" min="0" max="255" value={rgb.b} onChange={(e) => {
                const b = Number(e.target.value);
                setRgb({ ...rgb, b });
                setHex(`#${rgb.r.toString(16).padStart(2, "0")}${rgb.g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`);
              }} className="input font-mono text-center" />
            </div>
          </div>

          <div className="rounded-lg bg-[var(--surface2)] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">HSL</span>
              <button type="button" onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)} className="btn btn-ghost !py-1 !px-2 !text-xs">
                <Icon name="copy" size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs c-muted">H</label>
                <input type="number" min="0" max="360" value={hsl.h} readOnly className="input font-mono text-center" />
              </div>
              <div>
                <label className="text-xs c-muted">S</label>
                <input type="number" min="0" max="100" value={hsl.s} readOnly className="input font-mono text-center" />
              </div>
              <div>
                <label className="text-xs c-muted">L</label>
                <input type="number" min="0" max="100" value={hsl.l} readOnly className="input font-mono text-center" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
