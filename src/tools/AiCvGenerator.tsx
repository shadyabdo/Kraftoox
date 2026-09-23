import { useState, useRef } from "react";
import { InfoNote, Spinner } from "../components/bits";
import { getTool } from "../data/tools";
import { useI18n } from "../i18n";
import { showToast } from "../lib/utils";
import { ToolShell } from "./shared";
import { Icon } from "../components/Icons";

const TOOL = getTool("ai-cv-generator")!;
const KEY_STORAGE = "kx-gemini-cv-key";
const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

interface CVData {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
}

export default function AiCvGenerator() {
  const { t, isAr } = useI18n();
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem(KEY_STORAGE) ?? "";
    } catch {
      return "";
    }
  });
  const [showKey, setShowKey] = useState(false);
  const [cvData, setCvData] = useState<CVData>({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    experience: "",
    education: "",
    skills: "",
    languages: "",
  });
  const [generatedCV, setGeneratedCV] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cvRef = useRef<HTMLDivElement>(null);

  const saveKey = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem(KEY_STORAGE, key);
    } catch {
      /* ignore */
    }
  };

  const handleChange = (field: keyof CVData, value: string) => {
    setCvData((prev) => ({ ...prev, [field]: value }));
  };

  const generateCV = async () => {
    if (!apiKey.trim()) {
      setError(t("أدخل مفتاح Gemini API أولاً", "Enter Gemini API key first"));
      return;
    }

    if (!cvData.fullName.trim() || !cvData.jobTitle.trim()) {
      setError(t("أدخل الاسم والمسمى الوظيفي على الأقل", "Enter at least name and job title"));
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedCV("");

    const prompt = `Create a professional ATS-compatible CV/Resume in ${isAr ? "Arabic" : "English"} based on this information:

Name: ${cvData.fullName}
Job Title: ${cvData.jobTitle}
Email: ${cvData.email}
Phone: ${cvData.phone}
Location: ${cvData.location}
Professional Summary: ${cvData.summary}
Work Experience: ${cvData.experience}
Education: ${cvData.education}
Skills: ${cvData.skills}
Languages: ${cvData.languages}

Requirements:
1. Use a clean, simple text format (no tables, no graphics, no columns)
2. Include relevant keywords for the job title
3. Use standard section headers: Professional Summary, Work Experience, Education, Skills
4. Use bullet points for achievements and responsibilities
5. Keep it concise and professional
6. Optimize for ATS (Applicant Tracking System) parsing
7. ${isAr ? "اكتب بالعربية" : "Write in English"}

Generate the complete CV now:`;

    try {
      const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "API error");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No content generated");
      }

      setGeneratedCV(text);
      showToast(t("تم إنشاء السيرة الذاتية بنجاح", "CV generated successfully"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("فشل إنشاء CV", "Failed to generate CV"));
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!generatedCV) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
<!DOCTYPE html>
<html dir="${isAr ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8">
  <title>${cvData.fullName} - CV</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Almarai', Arial, sans-serif;
      padding: 40px;
      line-height: 1.6;
      color: #333;
      font-size: 14px;
    }
    h1 { font-size: 28px; margin-bottom: 5px; color: #212121; }
    h2 { font-size: 18px; margin: 20px 0 10px 0; color: #c8a460; border-bottom: 2px solid #c8a460; padding-bottom: 5px; }
    h3 { font-size: 16px; margin: 15px 0 5px 0; color: #212121; }
    p { margin: 5px 0; }
    ul { margin: 5px 0 10px 20px; }
    li { margin: 3px 0; }
    .contact { color: #666; font-size: 13px; margin-bottom: 20px; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <h1>${cvData.fullName}</h1>
  <p class="contact">${cvData.jobTitle}${cvData.email ? ` | ${cvData.email}` : ""}${cvData.phone ? ` | ${cvData.phone}` : ""}${cvData.location ? ` | ${cvData.location}` : ""}</p>
  <div style="white-space: pre-wrap;">${generatedCV}</div>
  <script>
    window.onload = () => {
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const copyCV = async () => {
    if (!generatedCV) return;
    try {
      await navigator.clipboard.writeText(generatedCV);
      showToast(t("تم نسخ CV", "CV copied"));
    } catch {
      showToast(t("فشل النسخ", "Copy failed"), "err");
    }
  };

  return (
    <ToolShell tool={TOOL}>
      <div className="grid gap-5 lg:grid-cols-[350px_1fr]">
        {/* لوحة الإدخال */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-extrabold">
              <span className="c-primary"><Icon name="shield" size={17} /></span>
              {t("مفتاح Gemini API", "Gemini API Key")}
            </h3>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                className="input !pe-11 font-mono !text-xs"
                dir="ltr"
                style={{ textAlign: "left" }}
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => saveKey(e.target.value)}
                aria-label="Gemini API key"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="c-muted absolute inset-y-0 end-3 grid place-items-center transition-colors hover:text-[var(--teal)]"
              >
                <Icon name={showKey ? "close" : "eye"} size={17} />
              </button>
            </div>
            <p className="c-muted mt-2 text-[11px] leading-relaxed">
              {t(
                "مجاني من Google AI Studio، يُحفظ في متصفحك فقط.",
                "Free from Google AI Studio, stored in your browser only."
              )}{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="linkish"
                dir="ltr"
              >
                aistudio.google.com/apikey
              </a>
            </p>
          </div>

          <div className="card p-5">
            <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-extrabold">
              <span className="c-primary"><Icon name="file" size={17} /></span>
              {t("المعلومات الأساسية", "Basic Information")}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold">{t("الاسم الكامل *", "Full Name *")}</label>
                <input
                  type="text"
                  className="input"
                  value={cvData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder={isAr ? "محمد أحمد" : "John Smith"}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">{t("المسمى الوظيفي *", "Job Title *")}</label>
                <input
                  type="text"
                  className="input"
                  value={cvData.jobTitle}
                  onChange={(e) => handleChange("jobTitle", e.target.value)}
                  placeholder={isAr ? "مطور ويب" : "Web Developer"}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-bold">{t("البريد", "Email")}</label>
                  <input
                    type="email"
                    className="input"
                    dir="ltr"
                    style={{ textAlign: "left" }}
                    value={cvData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">{t("الهاتف", "Phone")}</label>
                  <input
                    type="tel"
                    className="input"
                    dir="ltr"
                    style={{ textAlign: "left" }}
                    value={cvData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">{t("الموقع", "Location")}</label>
                <input
                  type="text"
                  className="input"
                  value={cvData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder={isAr ? "القاهرة، مصر" : "Cairo, Egypt"}
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display mb-3 flex items-center gap-2 text-sm font-extrabold">
              <span className="c-primary"><Icon name="file" size={17} /></span>
              {t("التفاصيل المهنية", "Professional Details")}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold">{t("الملخص المهني", "Professional Summary")}</label>
                <textarea
                  className="input min-h-[80px]"
                  value={cvData.summary}
                  onChange={(e) => handleChange("summary", e.target.value)}
                  placeholder={isAr ? "مطور ويب بخبرة 5 سنوات..." : "Web developer with 5 years of experience..."}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">{t("الخبرات العملية", "Work Experience")}</label>
                <textarea
                  className="input min-h-[100px]"
                  value={cvData.experience}
                  onChange={(e) => handleChange("experience", e.target.value)}
                  placeholder={isAr ? "شركة XYZ - مطور أول (2020-الحالي)..." : "XYZ Company - Senior Developer (2020-Present)..."}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">{t("التعليم", "Education")}</label>
                <textarea
                  className="input min-h-[60px]"
                  value={cvData.education}
                  onChange={(e) => handleChange("education", e.target.value)}
                  placeholder={isAr ? "بكالوريوس حاسبات - جامعة القاهرة 2019" : "BSc Computer Science - Cairo University 2019"}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">{t("المهارات", "Skills")}</label>
                <textarea
                  className="input min-h-[60px]"
                  value={cvData.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                  placeholder={isAr ? "JavaScript, React, Node.js..." : "JavaScript, React, Node.js..."}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">{t("اللغات", "Languages")}</label>
                <input
                  type="text"
                  className="input"
                  value={cvData.languages}
                  onChange={(e) => handleChange("languages", e.target.value)}
                  placeholder={isAr ? "العربية، الإنجليزية" : "Arabic, English"}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={generateCV}
            disabled={loading}
            className="btn btn-primary w-full !py-3"
          >
            {loading ? <Spinner size={18} /> : <Icon name="wand" size={18} />}
            {loading ? t("جارٍ الإنشاء...", "Generating...") : t("أنشئ CV بالذكاء الاصطناعي", "Generate CV with AI")}
          </button>

          {error && (
            <div className="rounded-lg bg-[var(--red-soft)] p-3 text-sm c-error">
              <Icon name="alert" size={16} className="inline-block ms-1" />
              {error}
            </div>
          )}
        </div>

        {/* نتيجة CV */}
        <div className="space-y-4">
          {!generatedCV ? (
            <div className="card grid min-h-[400px] place-items-center p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--teal-soft)] c-primary">
                  <Icon name="file" size={32} />
                </span>
                <p className="font-display text-lg font-bold">
                  {t("CV الخاص بك سيظهر هنا", "Your CV will appear here")}
                </p>
                <p className="c-muted max-w-sm text-sm leading-relaxed">
                  {t(
                    "أدخل معلوماتك واضغط 'أنشئ CV' - سيولّد الذكاء الاصطناعي سيرة ذاتية احترافية متوافقة مع ATS.",
                    "Enter your info and click 'Generate CV' - AI will create a professional ATS-compatible CV."
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
                  <span className="flex items-center gap-1.5 text-sm font-bold c-primary">
                    <Icon name="check" size={18} />
                    {t("تم إنشاء CV بنجاح", "CV Generated Successfully")}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyCV}
                      className="btn btn-secondary !py-2 !px-3 !text-xs"
                    >
                      <Icon name="copy" size={14} />
                      {t("نسخ", "Copy")}
                    </button>
                    <button
                      type="button"
                      onClick={exportPDF}
                      className="btn btn-primary !py-2 !px-3 !text-xs"
                    >
                      <Icon name="download" size={14} />
                      {t("تصدير PDF", "Export PDF")}
                    </button>
                  </div>
                </div>
                <div
                  ref={cvRef}
                  className="p-6 font-display text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ maxHeight: "600px", overflowY: "auto" }}
                >
                  {generatedCV}
                </div>
              </div>

              <div className="rounded-lg bg-[var(--teal-soft)] border border-[var(--primary)] p-4">
                <p className="text-sm font-bold mb-2">
                  {isAr ? "💡 نصائح ATS:" : "💡 ATS Tips:"}
                </p>
                <ul className="text-xs space-y-1 c-muted list-disc list-inside">
                  {isAr ? (
                    <>
                      <li>استخدم كلمات مفتاحية من وصف الوظيفة</li>
                      <li>تجنب الجداول والرسومات والأعمدة</li>
                      <li>استخدم تنسيقات ملفات Word أو PDF بسيطة</li>
                      <li>تحقق من الأخطاء الإملائية</li>
                    </>
                  ) : (
                    <>
                      <li>Use keywords from the job description</li>
                      <li>Avoid tables, graphics, and columns</li>
                      <li>Use simple Word or PDF file formats</li>
                      <li>Check for spelling errors</li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6">
        <InfoNote>
          {isAr
            ? "يولّد Gemini AI سيرة ذاتية احترافية متوافقة مع أنظمة تتبع المتقدمين (ATS). التصميم بسيط ونصي لضمان قراءة سهلة من قبل الأنظمة الآلية. مفتاحك يُحفظ محلياً ولا يُرسل لأي خادم تابع لنا."
            : "Gemini AI generates a professional ATS-compatible CV. The design is simple and text-based to ensure easy reading by automated systems. Your key is stored locally and never sent to our servers."}
        </InfoNote>
      </div>
    </ToolShell>
  );
}
