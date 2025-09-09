import { createContext, useContext, useState, useEffect } from "react";
import i18n from "i18next";

const LanguageContext = createContext();
export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem("app_lang") || "ko"  // 이제는 "ko", "en", "ja" 중 하나
  );

  useEffect(() => {
    i18n.changeLanguage(language);  // language 자체가 "ko", "en", "ja"
    localStorage.setItem("app_lang", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
