import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/* نظام ثنائي اللغة (عربي / إنجليزي) مع قلب اتجاه الصفحة */

export type Lang = "ar" | "en";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /* يختار النص حسب اللغة الحالية */
  L: (ar: string, en: string) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: "ar",
  setLang: () => undefined,
  L: (ar) => ar,
});

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem("kraftoox-lang");
    if (saved === "en" || saved === "ar") return saved;
  } catch {
    /* ignore */
  }
  return "ar";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("kraftoox-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const L = (ar: string, en: string) => (lang === "ar" ? ar : en);

  return <Ctx.Provider value={{ lang, setLang, L }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  return useContext(Ctx);
}

export function useL(): (ar: string, en: string) => string {
  return useContext(Ctx).L;
}

export function useLang(): Lang {
  return useContext(Ctx).lang;
}

/* لالتقاط القيم من البيانات المخزنة [عربي, إنجليزي] */
export function bi(lang: Lang, pair: readonly [string, string]): string {
  return lang === "ar" ? pair[0] : pair[1];
}
