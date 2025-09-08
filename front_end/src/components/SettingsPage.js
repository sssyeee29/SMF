import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Cog, Save, Bell, Image, CheckSquare } from 'lucide-react';
import './SettingsPage.css';

const SettingsPage = ({ setCurrentPage, username, handleLogout }) => {
  const [settings, setSettings] = useState({
    // 이미지/촬영 설정
    imageDisplaySize: 100,
    imageZoomRatio: 150,
    captureResolution: 'high',
    imageQuality: 80,
    
    // AI 검사 설정
    autoDefectDetection: true,
    detectionSensitivity: 75,
    confidenceThreshold: 85,
    allowableTolerance: 10,
    
    // 알림/결과 표시
    defectAlertMethod: 'highlight',
    soundAlert: true,
    showLabels: true,
    highlightColor: '#FF0000',
    
    // 기록/저장
    autoSaveResults: true,
    saveImages: true,
    saveDefectData: true,
    logStoragePath: '/logs',
    retentionPeriod: 30,
    
    // 기존 설정들
    language: 'korean',
    theme: 'light',
    systemNotifications: true,
    emailNotifications: false
  });


  // 다크모드
  const [theme, setTheme] = useState('light');

    useEffect(() => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [theme]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };


const handleSave = async () => {
  try {
    const response = await fetch('/api/pi/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        confidence: settings.confidenceThreshold / 100,
        sensitivity: settings.detectionSensitivity / 100,
        tolerance: settings.allowableTolerance / 100
      })
    });

    const data = await response.json();
    if (data.ok) {
      alert('설정이 저장되었습니다.');
    } else {
      alert('저장 실패: ' + data.msg);
    }
  } catch (err) {
    console.error(err);
    alert('서버 오류');
  }
};

  return (
    <div className="set-container ">
      {/* 상단 헤더 */}
      <div className="set-header">
        <div className="set-header-content">
          <div className="set-header-left">
            <button 
              onClick={() => setCurrentPage('home')}
              className="set-back-button"
            >
              <ArrowLeft className="set-back-icon" />
            </button>
            <h1 className="set-title">환경 설정</h1>
          </div>

          <div className="set-header-right">
            {username && <span className="set-username">{username} 님</span>}
            <button onClick={handleLogout} className="set-logout-button">
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="set-content">
        <div className="set-content-wrapper">
          {/* 설정 메뉴 */}
          <div className="set-grid">
            
            {/* 1️⃣ AI 검사 설정 */}
            <div className="set-card">
              <h3 className="set-card-title">
                <CheckSquare className="set-card-icon" />
                AI 검사 설정
              </h3>
              <div className="set-card-content">
                <div className="set-setting-row">
                  <span className="set-setting-label">자동 불량 감지</span>
                  <input 
                    type="checkbox" 
                    checked={settings.autoDefectDetection}
                    onChange={(e) => handleSettingChange('autoDefectDetection', e.target.checked)}
                    className="set-checkbox" 
                  />
                </div>

                <div className="set-setting-group">
                  <label className="set-range-label">검출 민감도</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={settings.detectionSensitivity}
                    onChange={(e) => handleSettingChange('detectionSensitivity', e.target.value)}
                    className="set-range-input"
                    disabled={!settings.autoDefectDetection}
                  />
                  <div className="set-range-value">현재: {settings.detectionSensitivity}%</div>
                </div>

                <div className="set-setting-group">
                  <label className="set-range-label">신뢰도 임계값</label>
                  <input 
                    type="range" 
                    min="50" 
                    max="99" 
                    value={settings.confidenceThreshold}
                    onChange={(e) => handleSettingChange('confidenceThreshold', e.target.value)}
                    className="set-range-input"
                    disabled={!settings.autoDefectDetection}
                  />
                  <div className="set-range-value">현재: {settings.confidenceThreshold}%</div>
                </div>

                <div className="set-setting-group">
                  <label className="set-range-label">허용 오차 (결함 판정 기준)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={settings.allowableTolerance}
                    onChange={(e) => handleSettingChange('allowableTolerance', e.target.value)}
                    className="set-range-input"
                    disabled={!settings.autoDefectDetection}
                  />
                  <div className="set-range-value">현재: ±{settings.allowableTolerance}%</div>
                </div>
              </div>
            </div>

            {/* 2️⃣ 기록/저장 설정 */}
            <div className="set-card">
              <h3 className="set-card-title">
                <Save className="set-card-icon" />
                기록/저장 설정
              </h3>
              <div className="set-card-content">
                <div className="set-setting-row">
                  <span className="set-setting-label">검사 결과 자동 저장</span>
                  <input 
                    type="checkbox" 
                    checked={settings.autoSaveResults}
                    onChange={(e) => handleSettingChange('autoSaveResults', e.target.checked)}
                    className="set-checkbox" 
                  />
                </div>

                <div className="set-setting-row">
                  <span className="set-setting-label">이미지 저장</span>
                  <input 
                    type="checkbox" 
                    checked={settings.saveImages}
                    onChange={(e) => handleSettingChange('saveImages', e.target.checked)}
                    className="set-checkbox"
                    disabled={!settings.autoSaveResults}
                  />
                </div>

                <div className="set-setting-row">
                  <span className="set-setting-label">불량 데이터 저장</span>
                  <input 
                    type="checkbox" 
                    checked={settings.saveDefectData}
                    onChange={(e) => handleSettingChange('saveDefectData', e.target.checked)}
                    className="set-checkbox"
                    disabled={!settings.autoSaveResults}
                  />
                </div>

                <div className="set-setting-group">
                  <label className="set-input-label">로그 저장 위치</label>
                  <input 
                    type="text" 
                    value={settings.logStoragePath}
                    onChange={(e) => handleSettingChange('logStoragePath', e.target.value)}
                    className="set-text-input"
                    disabled={!settings.autoSaveResults}
                  />
                </div>

                <div className="set-setting-group">
                  <label className="set-input-label">데이터 보관 기간 (일)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="365" 
                    value={settings.retentionPeriod}
                    onChange={(e) => handleSettingChange('retentionPeriod', e.target.value)}
                    className="set-text-input"
                    disabled={!settings.autoSaveResults}
                  />
                  <div className="set-input-hint">오래된 데이터 자동 삭제</div>
                </div>
              </div>
            </div>

            {/* 3️⃣ 알람 설정 */}
            <div className="set-card">
              <h3 className="set-card-title">
                <Bell className="set-card-icon" />
                알람 설정
              </h3>
              <div className="set-card-content">
                <div className="set-setting-group">
                  <label className="set-select-label">불량 시 알림 방식</label>
                  <select 
                    value={settings.defectAlertMethod}
                    onChange={(e) => handleSettingChange('defectAlertMethod', e.target.value)}
                    className="set-select-input"
                  >
                    <option value="highlight">하이라이트 표시</option>
                    <option value="popup">팝업 알림</option>
                    <option value="both">하이라이트 + 팝업</option>
                    <option value="none">알림 없음</option>
                  </select>
                </div>

                <div className="set-setting-row">
                  <span className="set-setting-label">소리 알림</span>
                  <input 
                    type="checkbox" 
                    checked={settings.soundAlert}
                    onChange={(e) => handleSettingChange('soundAlert', e.target.checked)}
                    className="set-checkbox" 
                  />
                </div>

                <div className="set-setting-row">
                  <span className="set-setting-label">불량 부위 레이블 표시</span>
                  <input 
                    type="checkbox" 
                    checked={settings.showLabels}
                    onChange={(e) => handleSettingChange('showLabels', e.target.checked)}
                    className="set-checkbox" 
                  />
                </div>

                <div className="set-setting-group">
                  <label className="set-color-label">하이라이트 색상</label>
                  <div className="set-color-picker">
                    <input 
                      type="color" 
                      value={settings.highlightColor}
                      onChange={(e) => handleSettingChange('highlightColor', e.target.value)}
                      className="set-color-input"
                    />
                    <span className="set-color-value">{settings.highlightColor}</span>
                  </div>
                </div>

                <div className="set-setting-row">
                  <span className="set-setting-label">시스템 상태 알림</span>
                  <input 
                    type="checkbox" 
                    checked={settings.systemNotifications}
                    onChange={(e) => handleSettingChange('systemNotifications', e.target.checked)}
                    className="set-checkbox" 
                  />
                </div>

                <div className="set-setting-row">
                  <span className="set-setting-label">이메일 알림</span>
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="set-checkbox" 
                  />
                </div>
              </div>
            </div>
            
            {/* 4️⃣ 이미지/촬영 설정 */}
            <div className="set-card">
              <h3 className="set-card-title">
                <Image className="set-card-icon" />
                이미지/촬영 설정
              </h3>
              <div className="set-card-content">
                <div className="set-setting-group">
                  <label className="set-select-label">촬영 해상도</label>
                  <select 
                    value={settings.captureResolution}
                    onChange={(e) => handleSettingChange('captureResolution', e.target.value)}
                    className="set-select-input"
                  >
                    <option value="low">저화질 (640x480)</option>
                    <option value="medium">중화질 (1280x720)</option>
                    <option value="high">고화질 (1920x1080)</option>
                    <option value="ultra">초고화질 (2560x1440)</option>
                  </select>
                </div>

                <div className="set-setting-group">
                  <label className="set-range-label">이미지 품질</label>
                  <input 
                    type="range" 
                    min="30" 
                    max="100" 
                    value={settings.imageQuality}
                    onChange={(e) => handleSettingChange('imageQuality', e.target.value)}
                    className="set-range-input"
                  />
                  <div className="set-range-value">현재: {settings.imageQuality}% (용량 최적화)</div>
                </div>
              </div>
            </div>

            {/* 5️⃣ 일반 설정 */}
            <div className="set-card">
              <h3 className="set-card-title">
                <Cog className="set-card-icon" />
                일반 설정
              </h3>
              <div className="set-card-content">
                <div className="set-setting-group">
                  <label className="set-select-label">언어 설정</label>
                  <select 
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="set-select-input"
                  >
                    <option value="korean">한국어</option>
                    <option value="english">English</option>
                  </select>
                </div>
                <div className="set-setting-group">
                  <label className="set-select-label">테마</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => {
                      handleSettingChange('theme', e.target.value); // settings.theme 변경
                      setTheme(e.target.value);                     // theme 상태도 변경
                    }}
                    className="set-select-input"
                  >
                    <option value="light">라이트 모드</option>
                    <option value="dark">다크 모드</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 6️⃣ 시스템 정보 */}
            <div className="set-system-info">
              <h3 className="set-system-title">시스템 정보</h3>
              <div className="set-system-content">
                <div className="set-system-row">
                  <span className="set-system-label">시스템 버전:</span>
                  <span className="set-system-value">v2.1.3</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">AI 모델 버전:</span>
                  <span className="set-system-value">v1.5.2</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">마지막 업데이트:</span>
                  <span className="set-system-value">2025-08-20</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">라이선스:</span>
                  <span className="set-system-value">Professional</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">저장 용량:</span>
                  <span className="set-system-value">245GB / 500GB</span>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="set-button-group">
                <button 
                  onClick={() => setCurrentPage('home')}
                  className="set-cancel-button"
                >
                  취소
                </button>
                <button 
                  onClick={handleSave}
                  className="set-save-button"
                >
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;