import { useState } from "react";
import QRCode from "qrcode";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("qr-code-generator")!;

export default function QRCodeGenerator() {
  const { isAr, t } = useI18n();
  const [text, setText] = useState("https://kraftoox.app");
  const [qrUrl, setQrUrl] = useState("");
  const [size, setSize] = useState(300);
  const [color, setColor] = useState("#000000");

  const generate = async () => {
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: { dark: color, light: "#ffffff" },
      });
      setQrUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  const download = () => {
    if (!qrUrl) return;
    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = qrUrl;
    link.click();
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">{t("النص أو الرابط", "Text or URL")}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input min-h-[100px]"
            placeholder={isAr ? "أدخل النص أو الرابط..." : "Enter text or URL..."}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="mb-2 block text-sm font-bold">{t("الحجم", "Size")}</label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="input"
              min={100}
              max={1000}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold">{t("اللون", "Color")}</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="input h-[42px]"
            />
          </div>
        </div>

        <button onClick={generate} className="btn btn-primary w-full mb-4">
          <Icon name="wand" size={16} />
          {t("إنشاء QR Code", "Generate QR Code")}
        </button>

        {qrUrl && (
          <div className="flex flex-col items-center gap-4">
            <img src={qrUrl} alt="QR Code" className="border border-[var(--line)] rounded-lg" />
            <button onClick={download} className="btn btn-secondary">
              <Icon name="download" size={16} />
              {t("تحميل PNG", "Download PNG")}
            </button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
