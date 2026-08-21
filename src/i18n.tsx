import { useCallback, useState, type ReactNode, createContext, useContext } from "react";

/* نظام اللغات — عربي (RTL) / إنجليزي (LTR) */

export type Lang = "ar" | "en";

const KEY = "kx-lang";

function readStored(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return v === "en" ? "en" : "ar";
  } catch {
    return "ar";
  }
}

let current: Lang = readStored();

export function applyLang(l: Lang): void {
  current = l;
  const root = document.documentElement;
  root.lang = l;
  root.dir = l === "ar" ? "rtl" : "ltr";
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
}

/* طبّق اللغة المحفوظة فور التحميل قبل أول رسم */
applyLang(current);

/* دالة الترجمة المباشرة — تقرأ اللغة الحالية من مستوى الوحدة */
export function t(ar: string, en: string): string {
  return current === "ar" ? ar : en;
}

export function getLang(): Lang {
  return current;
}

interface I18nCtx {
  lang: Lang;
  set: (l: Lang) => void;
  t: (ar: string, en: string) => string;
  isAr: boolean;
}

const Ctx = createContext<I18nCtx>({ lang: current, set: applyLang, t, isAr: current === "ar" });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(current);
  const set = useCallback((l: Lang) => {
    applyLang(l);
    setLang(l);
  }, []);
  return <Ctx.Provider value={{ lang, set, t, isAr: lang === "ar" }}>{children}</Ctx.Provider>;
}

/* الاشتراك في تغيير اللغة — يُستخدم في الهيدر ومكونات التحكم */
export function useI18n(): I18nCtx {
  return useContext(Ctx);
}
