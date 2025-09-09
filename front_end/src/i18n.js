import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationKo from './locales/ko/translation.json';
import translationEn from './locales/en/translation.json';
import translationJa from './locales/ja/translation.json'

const resources = {
    ko: { translation: translationKo },
    en: { translation: translationEn },
    ja: { translation: translationJa }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'ko',
        debug: true, // 개발 중일 때만 true
        interpolation: {
            escapeValue: false,
        },
        detection: {
            // 언어 자동 감지 순서 설정
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        initImmediate: false, // 💥 changeLanguage 오류 방지
    });

export default i18n;
