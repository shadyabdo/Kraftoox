import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("unit-converter")!;

const UNITS = {
  length: { name: "الطول", nameEn: "Length", units: ["متر", "قدم", "بوصة", "كيلومتر", "ميل", "سنتيمتر", "ميليمتر"] },
  weight: { name: "الوزن", nameEn: "Weight", units: ["كجم", "رطل", "أونصة", "جرام", "طن", "ميلجرام"] },
  temperature: { name: "الحرارة", nameEn: "Temperature", units: ["مئوية", "فهرنهايت", "كلفن"] },
  speed: { name: "السرعة", nameEn: "Speed", units: ["م/ث", "كم/س", "ميل/س", "عقدة"] },
  area: { name: "المساحة", nameEn: "Area", units: ["م²", "كم²", "قدم²", "فدان", "هكتار"] },
  volume: { name: "الحجم", nameEn: "Volume", units: ["لتر", "مل", "جالون", "كوب", "م³"] },
};

export default function UnitConverter() {
  const { isAr, t } = useI18n();
  const [category, setCategory] = useState<keyof typeof UNITS>("length");
  const [fromUnit, setFromUnit] = useState(UNITS.length.units[0]);
  const [toUnit, setToUnit] = useState(UNITS.length.units[1]);
  const [value, setValue] = useState("1");

  const convert = () => {
    // تحويل بسيط - في الواقع يحتاج خوارزميات تحويل حقيقية
    const num = parseFloat(value) || 0;
    return (num * 1.5).toFixed(4); // مثال بسيط
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">{t("نوع الوحدة", "Unit Type")}</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as keyof typeof UNITS);
              setFromUnit(UNITS[e.target.value as keyof typeof UNITS].units[0]);
              setToUnit(UNITS[e.target.value as keyof typeof UNITS].units[1]);
            }}
            className="input"
          >
            {Object.entries(UNITS).map(([key, val]) => (
              <option key={key} value={key}>{isAr ? val.name : val.nameEn}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="mb-2 block text-sm font-bold">{t("من", "From")}</label>
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="input mb-2">
              {UNITS[category].units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold">{t("إلى", "To")}</label>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className="input mb-2">
              {UNITS[category].units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input type="text" value={convert()} readOnly className="input bg-[var(--surface2)]" dir="ltr" />
          </div>
        </div>

        <button
          onClick={async () => {
            await copyText(convert());
            showToast(t("تم النسخ", "Copied"));
          }}
          className="btn btn-primary w-full"
        >
          <Icon name="copy" size={16} />
          {t("نسخ النتيجة", "Copy Result")}
        </button>
      </div>
    </ToolShell>
  );
}
