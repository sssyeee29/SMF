import React from 'react';
import './HomePage.css';
import smfLogo from '../logo/smf.svg';
import { useTranslation } from 'react-i18next';

const HomePage = ({ setCurrentPage, handleLogout, username }) => {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      {/* 상단 헤더 */}
      <div className="home-header">
        <div className="home-header-container">
          <div className="p-4">
            <img src={smfLogo} alt="SMF Logo" className="h-16" />
          </div>
          <h1 className="home-title">{t("home.title")}</h1>
          <div className="home-header-right">
            {/* ✅ 로그인한 사용자 이름 */}
            {username && (
              <span className="home-username">
                {t("home.username", { name: username })}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="home-logout-button"
            >
              {t("home.logout")}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="home-main-content">
        <div className="menu-container">
          <button
            onClick={() => setCurrentPage('camera')}
            className="menu-button"
          >
            {t("home.camera")}
          </button>

          <button
            onClick={() => setCurrentPage('log')}
            className="menu-button"
          >
            {t("home.log")}
          </button>

          <button
            onClick={() => setCurrentPage('warehouse')}
            className="menu-button"
          >
            {t("home.warehouse")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
