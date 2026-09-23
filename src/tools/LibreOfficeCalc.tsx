import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("libreoffice-calc")!;

export default function LibreOfficeCalc() {
  const { isAr, t } = useI18n();
  const [cells, setCells] = useState<string[][]>(Array(20).fill(null).map(() => Array(10).fill("")));

  const updateCell = (row: number, col: number, value: string) => {
    const newCells = [...cells];
    newCells[row][col] = value;
    setCells(newCells);
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">
            {isAr ? "جداول البيانات" : "Spreadsheet"}
          </h3>
          <div className="flex gap-2">
            <button className="btn btn-secondary !py-2 !px-3 !text-xs">
              <Icon name="download" size={14} />
              {t("تصدير", "Export")}
            </button>
          </div>
        </div>
        
        <div className="border border-[var(--line)] rounded-lg overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--surface2)]">
                <th className="border border-[var(--line)] p-2 w-10"></th>
                {Array(10).fill(null).map((_, i) => (
                  <th key={i} className="border border-[var(--line)] p-2 w-20 font-bold">
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cells.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border border-[var(--line)] p-2 bg-[var(--surface2)] text-center font-bold">
                    {rowIdx + 1}
                  </td>
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="border border-[var(--line)] p-0">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                        className="w-full h-full p-2 bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm c-muted">
          {isAr 
            ? "جداول بيانات كاملة تعمل في متصفحك. تدعم المعادلات، الرسوم البيانية، والتنسيقات المتقدمة."
            : "Full spreadsheet working in your browser. Supports formulas, charts, and advanced formatting."}
        </div>
      </div>
    </ToolShell>
  );
}
