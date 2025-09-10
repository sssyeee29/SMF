// App.js - 메인 애플리케이션 컴포넌트
import React, { useEffect, useState } from 'react';
import { Home, LayoutDashboard, Camera, FileText, Package, Cog } from 'lucide-react';
import './App.css';

// 페이지 컴포넌트들 import
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import HomePage from './components/HomePage';
import CameraPage from './components/CameraPage';
import LogPage from './components/LogPage';
import WarehousePage from './components/WarehousePage';
import SettingsPage from './components/SettingsPage';
import DashboardPage from './components/DashboardPage';

// 백엔드 부분
import { loginUser, logoutUser, register } from './services/login';

// ✅ i18n
import { useTranslation } from 'react-i18next';

const App = () => {
  const { t } = useTranslation();

  useEffect(() => {
    handleLogout();
  }, []);

  // ✅ 로그인 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  // ✅ 현재 페이지 상태
  const [currentPage, setCurrentPage] = useState('login');
  const [authPage, setAuthPage] = useState('login'); // login 또는 signup

  // ✅ 사용자 데이터 (예시)
  const [users, setUsers] = useState([]);

  const validId = "";
  const validPw = "";

  const [detectionHistory, setDetectionHistory] = useState([]);
  const [inventory, setInventory] = useState([
    { id: 1, name: '제품 A', good: 145, defective: 12, total: 157 },
    { id: 2, name: '제품 B', good: 223, defective: 8, total: 231 },
    { id: 3, name: '제품 C', good: 89, defective: 15, total: 104 },
  ]);

  // 🔹 새로고침 시 로그인 상태 + 유저이름 복구
  useEffect(() => {
    const savedLogin = localStorage.getItem("isLoggedIn");
    const savedUser = localStorage.getItem("username");
    if (savedLogin === "true" && savedUser) {
      setIsLoggedIn(true);
      setUsername(savedUser);
      setCurrentPage("home");
    }
  }, []);

  // ✅ 로그인
  const handleLogin = (id, pw) => {
    loginUser(id, pw)
      .then(user => {
        setIsLoggedIn(true);
        setUsername(user.name);
        setCurrentPage("home");
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", user.name);
      })
      .catch(error => {
        alert(error.message);
      });
  };

  // ✅ 회원가입
  const handleSignup = (id, pw, name) => {
    register(id, pw, name)
      .then(user => {
        alert(user.message);
        setAuthPage('login');
      })
      .catch(error => {
        alert(error.message);
      });
    return true;
  };

  // ✅ 로그아웃
  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setUsername("");
    setCurrentPage("login");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
  };

  // ✅ 회원가입/로그인 페이지 전환
  const handleSignupClick = () => setAuthPage('signup');
  const handleBackToLogin = () => setAuthPage('login');

  const pageProps = {
    currentPage,
    setCurrentPage,
    detectionHistory,
    setDetectionHistory,
    inventory,
    setInventory,
    handleLogout,
    username,
  };

  // ✅ 비로그인 시
  if (!isLoggedIn) {
    if (authPage === 'signup') {
      return (
        <SignupPage
          onSignup={handleSignup}
          onBackToLogin={handleBackToLogin}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onSignupClick={handleSignupClick}
      />
    );
  }

  return (
    <div className="app-container">
      {/* 하단 네비게이션 바 */}
      <div className="app-bottom-nav">
        <div className="app-nav-buttons">
          <button
            onClick={() => setCurrentPage('home')}
            className={`app-nav-button ${currentPage === 'home' ? 'active' : ''}`}
            aria-label={t('nav.home')}
          >
            <Home className="app-nav-icon" />
            <span className="app-nav-text">{t('nav.home')}</span>
          </button>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className={`app-nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
            aria-label={t('nav.dashboard')}
          >
            <LayoutDashboard className="app-nav-icon" />
            <span className="app-nav-text">{t('nav.dashboard')}</span>
          </button>
          <button
            onClick={() => setCurrentPage('camera')}
            className={`app-nav-button ${currentPage === 'camera' ? 'active' : ''}`}
            aria-label={t('nav.camera')}
          >
            <Camera className="app-nav-icon" />
            <span className="app-nav-text">{t('nav.camera')}</span>
          </button>
          <button
            onClick={() => setCurrentPage('log')}
            className={`app-nav-button ${currentPage === 'log' ? 'active' : ''}`}
            aria-label={t('nav.log')}
          >
            <FileText className="app-nav-icon" />
            <span className="app-nav-text">{t('nav.log')}</span>
          </button>
          <button
            onClick={() => setCurrentPage('warehouse')}
            className={`app-nav-button ${currentPage === 'warehouse' ? 'active' : ''}`}
            aria-label={t('nav.warehouse')}
          >
            <Package className="app-nav-icon" />
            <span className="app-nav-text">{t('nav.warehouse')}</span>
          </button>
          <button
            onClick={() => setCurrentPage('settings')}
            className={`app-nav-button ${currentPage === 'settings' ? 'active' : ''}`}
            aria-label={t('nav.settings')}
          >
            <Cog className="app-nav-icon" />
            <span className="app-nav-text">{t('nav.settings')}</span>
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="app-main-content">
        {currentPage === 'home' && <HomePage {...pageProps} />}
        {currentPage === 'dashboard' && <DashboardPage {...pageProps} />}
        {currentPage === 'camera' && <CameraPage {...pageProps} />}
        {currentPage === 'log' && <LogPage {...pageProps} />}
        {currentPage === 'warehouse' && <WarehousePage {...pageProps} />}
        {currentPage === 'settings' && <SettingsPage {...pageProps} />}
      </div>
    </div>
  );
};

export default App;
