import React from 'react';
import './HomePage.css';
import smfLogo from '../logo/smf.svg';


const HomePage = ({ setCurrentPage, handleLogout, username }) => {
  return (
    <div className="home-page">
      {/* 상단 헤더 */}
      <div className="home-header">
        <div className="home-header-container">
          <div className="p-4">
            <img src={smfLogo} alt="SMF Logo" className="h-16" />
          </div>
          <h1 className="home-title">불량품 검출 프로그램</h1>
          <div className="home-header-right">
            {/* ✅ 로그인한 사용자 이름 */}
            {username && <span className="home-username">{username} 님</span>}
            <button
              onClick={handleLogout}
              className="home-logout-button"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="home-main-content">
        {/* 메뉴 버튼 */}
        <div className="menu-container">
          <button
            onClick={() => setCurrentPage('camera')}
            className="menu-button"
          >
            실시간 카메라
          </button>

          <button
            onClick={() => setCurrentPage('log')}
            className="menu-button"
          >
            로그 게시판
          </button>

          <button
            onClick={() => setCurrentPage('warehouse')}
            className="menu-button"
          >
            창고 관리
          </button>
        </div>

      </div>
    </div>
  );
};

export default HomePage;