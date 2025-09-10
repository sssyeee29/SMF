import { createContext, useContext, useState, useEffect } from "react";
import i18n from "i18next";

const LanguageContext = createContext();
export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem("app_lang") || "ko" // 기본값
  );

  // ✅ DB에서 언어 가져오기 (최초 1회 실행)
  useEffect(() => {
    const fetchLang = async () => {
      try {
        const res = await fetch("/api/pi/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data?.language) {
            setLanguage(data.data.language); // DB 값 우선 반영
            localStorage.setItem("app_lang", data.data.language);
          }
        }
      } catch (e) {
        console.error("[ERROR] 언어 불러오기 실패:", e);
      }
    };
    fetchLang();
  }, []);

  // ✅ i18n 적용 + localStorage 저장
  useEffect(() => {
    i18n.changeLanguage(language); // "ko" | "en" | "ja"
    localStorage.setItem("app_lang", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
