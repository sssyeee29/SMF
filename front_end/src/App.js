// App.js - 메인 애플리케이션 컴포넌트
import React, { useState, useEffect } from 'react';
import { Home, Camera, FileText, Package, Cog } from 'lucide-react';
import './App.css';

// 페이지 컴포넌트들 import
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import CameraPage from './components/CameraPage';
import LogPage from './components/LogPage';
import WarehousePage from './components/WarehousePage';
import SettingsPage from './components/SettingsPage';

// 백엔드 부분 
import {loginUser,logoutUser} from './services/login';


const App = () => {

    useEffect(() => {
        handleLogout();
    }, []);


  // ✅ 로그인 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(""); // 로그인한 사용자 이름 저장

  // ✅ 현재 페이지 상태
  const [currentPage, setCurrentPage] = useState('login'); 

  // ✅ 미리 지정한 아이디/비번
  const validId = "";
  const validPw = "";

  const [detectionHistory, setDetectionHistory] = useState([
    /*
    { id: 1, timestamp: '2025-08-25 14:30', result: '불량품', type: '뚜껑 손상', confidence: '87.3%' },
    { id: 2, timestamp: '2025-08-25 14:28', result: '보류', type: '-', confidence: '94.1%' },
    { id: 3, timestamp: '2025-08-25 14:25', result: '보류', type: '-', confidence: '91.7%' },
    { id: 4, timestamp: '2025-08-25 14:30', result: '불량품', type: '뚜껑 손상', confidence: '87.3%' },
    { id: 5, timestamp: '2025-08-26 13:28', result: '양품', type: '-', confidence: '98.1%' },
    { id: 6, timestamp: '2025-08-26 13:25', result: '양품', type: '-', confidence: '95.7%' },
    { id: 7, timestamp: '2025-08-26 15:30', result: '양품', type: '-', confidence: '97.3%' },
    { id: 8, timestamp: '2025-08-26 12:28', result: '양품', type: '-', confidence: '94.1%' },
    { id: 9, timestamp: '2025-08-24 17:25', result: '양품', type: '-', confidence: '99.7%' },
    { id: 10, timestamp: '2025-08-24 12:30', result: '양품', type: '-', confidence: '97.3%' },
    { id: 11, timestamp: '2025-08-23 12:28', result: '양품', type: '-', confidence: '98.1%' },
    { id: 12, timestamp: '2025-08-22 17:25', result: '불량품', type: '데미지', confidence: '91.7%' },
    { id: 13, timestamp: '2025-08-26 15:30', result: '양품', type: '-', confidence: '97.3%' },
    { id: 14, timestamp: '2025-08-26 12:28', result: '양품', type: '-', confidence: '94.1%' },
    { id: 15, timestamp: '2025-08-24 17:25', result: '양품', type: '-', confidence: '99.7%' },
    { id: 16, timestamp: '2025-08-24 12:30', result: '양품', type: '-', confidence: '97.3%' },
    { id: 17, timestamp: '2025-08-23 12:28', result: '양품', type: '-', confidence: '98.1%' },
    { id: 18, timestamp: '2025-08-22 17:25', result: '불량품', type: '용량 부족', confidence: '91.7%' },
    { id: 19, timestamp: '2025-08-22 17:25', result: '불량품', type: '데미지', confidence: '91.6%' },
    { id: 20, timestamp: '2025-08-26 15:30', result: '양품', type: '-', confidence: '97.3%' },
    { id: 21, timestamp: '2025-08-26 12:28', result: '양품', type: '-', confidence: '94.1%' },
    { id: 22, timestamp: '2025-08-24 17:25', result: '양품', type: '-', confidence: '99.7%' },
    { id: 23, timestamp: '2025-08-24 12:30', result: '양품', type: '-', confidence: '97.3%' },
    { id: 24, timestamp: '2025-08-23 12:28', result: '양품', type: '-', confidence: '98.1%' },
    { id: 25, timestamp: '2025-08-22 17:25', result: '불량품', type: '데미지', confidence: '91.7%' },
    { id: 26, timestamp: '2025-08-22 17:25', result: '불량품', type: '데미지', confidence: '91.7%' },
     */
  ]);

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

  // ✅ 로그인 함수
  const handleLogin = (id, pw) => {

    // 여기서 있는 아이디 확인 
    loginUser(id, pw)
    .then(user => {
      console.log("로그인 성공:", user);
      setIsLoggedIn(true);
      setUsername(user.name); // 백엔드에서 받은 이름 사용
      setCurrentPage("home");
      localStorage.setItem("isLoggedIn", "true"); 
      localStorage.setItem("username", user.name); // 유저이름도 저장
    })
    .catch(error => {
      console.error("로그인 실패:", error.message);
      alert(error.message);
    });
/*
    if (id === validId && pw === validPw) {
      setIsLoggedIn(true);
      setUsername(id); // 아이디 저장
      setCurrentPage("home");
      localStorage.setItem("isLoggedIn", "true"); 
      localStorage.setItem("username", id); // 유저이름도 저장
    } else {
      alert("아이디 또는 비밀번호가 틀렸습니다!");
    }
*/
  };

  // ✅ 로그아웃 함수
  const handleLogout = () => {
    logoutUser();
    setIsLoggedIn(false);
    setUsername(""); 
    setCurrentPage("login");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username"); 
  };

  // 전역 상태와 함수들을 props로 전달
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

  // ✅ 로그인 안됐을 때는 로그인 화면만 보임
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
        {/* 하단 네비게이션 바 */}
        <div className="app-bottom-nav">
          <div className="app-nav-buttons">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`app-nav-button ${currentPage === 'home' ? 'active' : ''}`}
            >
              <Home className="app-nav-icon" />
              <span className="app-nav-text">홈</span>
            </button>
            <button 
              onClick={() => setCurrentPage('camera')}
              className={`app-nav-button ${currentPage === 'camera' ? 'active' : ''}`}
            >
              <Camera className="app-nav-icon" />
              <span className="app-nav-text">카메라</span>
            </button>
            <button 
              onClick={() => setCurrentPage('log')}
              className={`app-nav-button ${currentPage === 'log' ? 'active' : ''}`}
            >
              <FileText className="app-nav-icon" />
              <span className="app-nav-text">로그</span>
            </button>
            <button 
              onClick={() => setCurrentPage('warehouse')}
              className={`app-nav-button ${currentPage === 'warehouse' ? 'active' : ''}`}
            >
              <Package className="app-nav-icon" />
              <span className="app-nav-text">창고</span>
            </button>
            <button 
              onClick={() => setCurrentPage('settings')}
              className={`app-nav-button ${currentPage === 'settings' ? 'active' : ''}`}
            >
              <Cog className="app-nav-icon" />
              <span className="app-nav-text">설정</span>
            </button>
          </div>
        </div>

      {/* 메인 컨텐츠 */}
      <div className="app-main-content">
        {currentPage === 'home' && <HomePage {...pageProps} />}
        {currentPage === 'camera' && <CameraPage {...pageProps} />}
        {currentPage === 'log' && <LogPage {...pageProps} />}
        {currentPage === 'warehouse' && <WarehousePage {...pageProps} />}
        {currentPage === 'settings' && <SettingsPage {...pageProps} />}
      </div>
    </div>
  );
};

export default App;