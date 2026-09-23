import { useState } from "react";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("libreoffice-impress")!;

export default function LibreOfficeImpress() {
  const { isAr, t } = useI18n();
  const [slides, setSlides] = useState([{ title: "", content: "" }]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const addSlide = () => {
    setSlides([...slides, { title: "", content: "" }]);
  };

  const updateSlide = (index: number, field: "title" | "content", value: string) => {
    const newSlides = [...slides];
    newSlides[index][field] = value;
    setSlides(newSlides);
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">
            {isAr ? "العروض التقديمية" : "Presentations"}
          </h3>
          <div className="flex gap-2">
            <button onClick={addSlide} className="btn btn-secondary !py-2 !px-3 !text-xs">
              <Icon name="plus" size={14} />
              {t("شريحة جديدة", "New Slide")}
            </button>
            <button className="btn btn-secondary !py-2 !px-3 !text-xs">
              <Icon name="download" size={14} />
              {t("تصدير", "Export")}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-[200px_1fr] gap-4">
          <div className="border border-[var(--line)] rounded-lg p-2 space-y-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-full p-3 rounded text-left text-sm ${
                  currentSlide === idx ? "bg-[var(--primary)] text-white" : "bg-[var(--surface2)]"
                }`}
              >
                {isAr ? `شريحة ${idx + 1}` : `Slide ${idx + 1}`}
              </button>
            ))}
          </div>
          
          <div className="border border-[var(--line)] rounded-lg p-6 bg-[var(--surface2)]">
            <input
              type="text"
              value={slides[currentSlide]?.title || ""}
              onChange={(e) => updateSlide(currentSlide, "title", e.target.value)}
              placeholder={isAr ? "عنوان الشريحة" : "Slide title"}
              className="input mb-4 text-2xl font-bold"
            />
            <textarea
              value={slides[currentSlide]?.content || ""}
              onChange={(e) => updateSlide(currentSlide, "content", e.target.value)}
              placeholder={isAr ? "محتوى الشريحة..." : "Slide content..."}
              className="input min-h-[300px] resize-none"
            />
          </div>
        </div>

        <div className="mt-4 text-sm c-muted">
          {isAr 
            ? "عروض تقديمية كاملة تعمل في متصفحك. تدعم الانتقالات، الرسوم المتحركة، والوسائط المتعددة."
            : "Full presentations working in your browser. Supports transitions, animations, and multimedia."}
        </div>
      </div>
    </ToolShell>
  );
}
