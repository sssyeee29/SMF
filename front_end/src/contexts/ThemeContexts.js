// src/contexts/ThemeContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(
        localStorage.getItem("app_theme") || "light"
    );

    // ✅ DB에서 테마 불러오기 (최초 1회 실행)
    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const res = await fetch("/api/pi/settings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.ok && data.data?.theme) {
                        setTheme(data.data.theme);
                        localStorage.setItem("app_theme", data.data.theme);
                    }
                }
            } catch (e) {
                console.error("[ERROR] 테마 불러오기 실패:", e);
            }
        };
        fetchTheme();
    }, []);

    // ✅ theme 상태 바뀔 때마다 DOM + localStorage 반영
    useEffect(() => {
        // 모든 테마 클래스 제거 후 현재 테마만 추가
        document.documentElement.classList.remove("light", "dark", "blue", "sepia");
        document.documentElement.classList.add(theme);

        localStorage.setItem("app_theme", theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
