import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("calculator")!;

export default function Calculator() {
  const { isAr, t } = useI18n();
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetDisplay, setResetDisplay] = useState(false);

  const handleNumber = (num: string) => {
    if (resetDisplay) {
      setDisplay(num);
      setResetDisplay(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    if (prevValue !== null && operation) {
      const result = calculate(prevValue, current, operation);
      setDisplay(String(result));
      setPrevValue(result);
    } else {
      setPrevValue(current);
    }
    setOperation(op);
    setResetDisplay(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return a / b;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prevValue === null || !operation) return;
    const current = parseFloat(display);
    const result = calculate(prevValue, current, operation);
    setDisplay(String(result));
    setPrevValue(null);
    setOperation(null);
    setResetDisplay(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperation(null);
    setResetDisplay(false);
  };

  const handleDecimal = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const buttons = [
    ["7", "8", "9", "/"],
    ["4", "5", "6", "*"],
    ["1", "2", "3", "-"],
    ["0", ".", "=", "+"],
  ];

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6 max-w-md mx-auto">
        <div className="bg-[var(--surface2)] rounded-lg p-4 mb-4">
          <div className="text-right text-3xl font-mono font-bold min-h-[50px] flex items-center justify-end">
            {display}
          </div>
        </div>

        <button onClick={handleClear} className="btn btn-secondary w-full mb-4">
          {t("مسح", "Clear")}
        </button>

        <div className="grid grid-cols-4 gap-2">
          {buttons.map((row, rowIdx) =>
            row.map((btn) => (
              <button
                key={`${rowIdx}-${btn}`}
                onClick={() => {
                  if (btn === "=") handleEquals();
                  else if (btn === ".") handleDecimal();
                  else if (["+", "-", "*", "/"].includes(btn)) handleOperation(btn);
                  else handleNumber(btn);
                }}
                className={`btn ${
                  ["+", "-", "*", "/", "="].includes(btn)
                    ? "btn-primary"
                    : "btn-secondary"
                } !py-4 !text-lg`}
              >
                {btn}
              </button>
            ))
          )}
        </div>
      </div>
    </ToolShell>
  );
}
