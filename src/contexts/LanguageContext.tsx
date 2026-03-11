import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Language = "he" | "en";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "he",
  setLanguage: () => {},
  isRTL: true,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem("language") as Language) || "he"
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const isRTL = language === "he";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
