import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { copyText, showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("password-generator")!;

export default function PasswordGenerator() {
  const { t, isAr } = useI18n();
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  const generatePassword = () => {
    const chars = {
      uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lowercase: "abcdefghijklmnopqrstuvwxyz",
      numbers: "0123456789",
      symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    };

    let availableChars = "";
    if (options.uppercase) availableChars += chars.uppercase;
    if (options.lowercase) availableChars += chars.lowercase;
    if (options.numbers) availableChars += chars.numbers;
    if (options.symbols) availableChars += chars.symbols;

    if (!availableChars) {
      showToast(t("اختر نوع واحد على الأقل", "Select at least one type"), "err");
      return;
    }

    let result = "";
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += availableChars[array[i] % availableChars.length];
    }

    setPassword(result);
    showToast(t("تم التوليد", "Generated"));
  };

  const handleCopy = async () => {
    if (!password) return;
    const success = await copyText(password);
    if (success) {
      showToast(t("تم النسخ", "Copied"));
    }
  };

  const getStrength = () => {
    if (!password) return { level: 0, text: "", color: "" };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, text: isAr ? "ضعيفة" : "Weak", color: "var(--error)" };
    if (score <= 4) return { level: 2, text: isAr ? "متوسطة" : "Medium", color: "var(--warning)" };
    if (score <= 6) return { level: 3, text: isAr ? "قوية" : "Strong", color: "var(--success)" };
    return { level: 4, text: isAr ? "قوية جداً" : "Very Strong", color: "var(--success)" };
  };

  const strength = getStrength();

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4">
          <label className="mb-2 block text-sm font-bold">
            {t("الطول", "Length")}: {length}
          </label>
          <input
            type="range"
            min="8"
            max="128"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">{t("أحرف كبيرة (A-Z)", "Uppercase (A-Z)")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={(e) => setOptions({ ...options, lowercase: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">{t("أحرف صغيرة (a-z)", "Lowercase (a-z)")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">{t("أرقام (0-9)", "Numbers (0-9)")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">{t("رموز (!@#$)", "Symbols (!@#$)")}</span>
          </label>
        </div>

        <button
          type="button"
          onClick={generatePassword}
          className="btn btn-primary w-full mb-4"
        >
          <Icon name="wand" size={16} />
          {t("ولّد كلمة مرور", "Generate Password")}
        </button>

        {password && (
          <>
            <div className="mb-4 rounded-lg bg-[var(--surface2)] p-4">
              <div className="flex items-center justify-between mb-2">
                <code className="text-lg font-mono break-all" dir="ltr">
                  {password}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-ghost !py-1 !px-2"
                >
                  <Icon name="copy" size={16} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(strength.level / 4) * 100}%`,
                      backgroundColor: strength.color,
                    }}
                  />
                </div>
                <span className="text-sm font-bold" style={{ color: strength.color }}>
                  {strength.text}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}
