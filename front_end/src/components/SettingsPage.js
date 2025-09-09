import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Cog, Save, Bell, Image, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './SettingsPage.css';
import { useTheme } from '../contexts/ThemeContexts';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsPage = ({ setCurrentPage, username, handleLogout }) => {
  const { t } = useTranslation();

    // ✅ 전역 테마 사용 (ThemeContext)
  const { theme, setTheme } = useTheme();

  const { language, setLanguage } = useLanguage();

  const [settings, setSettings] = useState({
    imageDisplaySize: 100,
    imageZoomRatio: 150,
    captureResolution: 'high',
    imageQuality: 80,
    autoDefectDetection: true,
    detectionSensitivity: 75,
    confidenceThreshold: 85,
    allowableTolerance: 10,
    defectAlertMethod: 'highlight',
    soundAlert: true,
    showLabels: true,
    highlightColor: '#FF0000',
    autoSaveResults: true,
    saveImages: true,
    saveDefectData: true,
    logStoragePath: '/logs',
    retentionPeriod: 30,
    language: 'korean',
    theme: 'light',
    systemNotifications: true,
    emailNotifications: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/pi/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence: settings.confidenceThreshold / 100,
          sensitivity: settings.detectionSensitivity / 100,
          tolerance: settings.allowableTolerance / 100
        })
      });

      const data = await response.json();
      alert(data.ok ? t('save_success') : t('save_fail') + data.msg);
    } catch (err) {
      console.error(err);
      alert(t('server_error'));
    }
  };

  return (
    <div className="set-container">
      <div className="set-header">
        <div className="set-header-content">
          <div className="set-header-left">
            <button onClick={() => setCurrentPage('home')} className="set-back-button">
              <ArrowLeft className="set-back-icon" />
            </button>
            <h1 className="set-title">{t('settings')}</h1>
          </div>
          <div className="set-header-right">
            {username && <span className="set-username">{t('user_greeting', { name: username })}</span>}
            <button onClick={handleLogout} className="set-logout-button">
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="set-content">
        <div className="set-content-wrapper">
          <div className="set-grid">
            <div className="set-card">
              <h3 className="set-card-title">
                <CheckSquare className="set-card-icon" />
                {t('ai_settings')}
              </h3>
              <div className="set-card-content">
                <div className="set-setting-row">
                  <span className="set-setting-label">{t('auto_defect_detection')}</span>
                  <input
                    type="checkbox"
                    checked={settings.autoDefectDetection}
                    onChange={(e) => handleSettingChange('autoDefectDetection', e.target.checked)}
                    className="set-checkbox"
                  />
                </div>
                <div className="set-setting-group">
                  <label className="set-range-label">{t('detection_sensitivity')}</label>
                  <input
                    type="range" min="1" max="100"
                    value={settings.detectionSensitivity}
                    onChange={(e) => handleSettingChange('detectionSensitivity', e.target.value)}
                    className="set-range-input"
                    disabled={!settings.autoDefectDetection}
                  />
                  <div className="set-range-value">{t('current', { value: settings.detectionSensitivity + '%' })}</div>
                </div>
                <div className="set-setting-group">
                  <label className="set-range-label">{t('confidence_threshold')}</label>
                  <input
                    type="range" min="50" max="99"
                    value={settings.confidenceThreshold}
                    onChange={(e) => handleSettingChange('confidenceThreshold', e.target.value)}
                    className="set-range-input"
                    disabled={!settings.autoDefectDetection}
                  />
                  <div className="set-range-value">{t('current', { value: settings.confidenceThreshold + '%' })}</div>
                </div>
                <div className="set-setting-group">
                  <label className="set-range-label">{t('tolerance')}</label>
                  <input
                    type="range" min="0" max="50"
                    value={settings.allowableTolerance}
                    onChange={(e) => handleSettingChange('allowableTolerance', e.target.value)}
                    className="set-range-input"
                    disabled={!settings.autoDefectDetection}
                  />
                  <div className="set-range-value">{t('current', { value: '±' + settings.allowableTolerance + '%' })}</div>
                </div>
              </div>
            </div>

            <div className="set-card">
              <h3 className="set-card-title">
                <Save className="set-card-icon" />
                {t('record_storage_settings')}
              </h3>
              <div className="set-card-content">
                <div className="set-setting-row">
                  <span className="set-setting-label">{t('auto_save_results')}</span>
                  <input
                    type="checkbox"
                    checked={settings.autoSaveResults}
                    onChange={(e) => handleSettingChange('autoSaveResults', e.target.checked)}
                    className="set-checkbox"
                  />
                </div>
                <div className="set-setting-row">
                  <span className="set-setting-label">{t('save_images')}</span>
                  <input
                    type="checkbox"
                    checked={settings.saveImages}
                    onChange={(e) => handleSettingChange('saveImages', e.target.checked)}
                    className="set-checkbox"
                    disabled={!settings.autoSaveResults}
                  />
                </div>
                <div className="set-setting-row">
                  <span className="set-setting-label">{t('save_defect_data')}</span>
                  <input
                    type="checkbox"
                    checked={settings.saveDefectData}
                    onChange={(e) => handleSettingChange('saveDefectData', e.target.checked)}
                    className="set-checkbox"
                    disabled={!settings.autoSaveResults}
                  />
                </div>
                <div className="set-setting-group">
                  <label className="set-input-label">{t('log_path')}</label>
                  <input
                    type="text"
                    value={settings.logStoragePath}
                    onChange={(e) => handleSettingChange('logStoragePath', e.target.value)}
                    className="set-text-input"
                    disabled={!settings.autoSaveResults}
                  />
                </div>
                <div className="set-setting-group">
                  <label className="set-input-label">{t('retention_days')}</label>
                  <input
                    type="number" min="1" max="365"
                    value={settings.retentionPeriod}
                    onChange={(e) => handleSettingChange('retentionPeriod', e.target.value)}
                    className="set-text-input"
                    disabled={!settings.autoSaveResults}
                  />
                  <div className="set-input-hint">{t('auto_delete_old')}</div>
                </div>
              </div>
            </div>

            <div className="set-card">
              <h3 className="set-card-title">
                <Bell className="set-card-icon" />
                {t('alert_settings')}
              </h3>
              <div className="set-card-content">
                <div className="set-setting-group">
                  <label className="set-select-label">{t('alert_method')}</label>
                  <select
                    value={settings.defectAlertMethod}
                    onChange={(e) => handleSettingChange('defectAlertMethod', e.target.value)}
                    className="set-select-input"
                  >
                    <option value="highlight">{t('highlight_display')}</option>
                    <option value="popup">{t('popup_alert')}</option>
                    <option value="both">{t('highlight_and_popup')}</option>
                    <option value="none">{t('no_alert')}</option>
                  </select>
                </div>
                <div className="set-setting-row">
                  <span className="set-setting-label">{t('sound_alert')}</span>
                  <input
                    type="checkbox"
                    checked={settings.soundAlert}
                    onChange={(e) => handleSettingChange('soundAlert', e.target.checked)}
                    className="set-checkbox"
                  />
                </div>
                <div className="set-setting-row">
                  <span className="set-setting-label">{t('show_overlay')}</span>
                  <input
                    type="checkbox"
                    checked={settings.showLabels}
                    onChange={(e) => handleSettingChange('showLabels', e.target.checked)}
                    className="set-checkbox"
                  />
                </div>
                <div className="set-setting-group">
                  <label className="set-color-label">{t('highlight_color')}</label>
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
                  <span className="set-setting-label">{t('system_status_alert')}</span>
                  <input
                    type="checkbox"
                    checked={settings.systemNotifications}
                    onChange={(e) => handleSettingChange('systemNotifications', e.target.checked)}
                    className="set-checkbox"
                  />
                </div>
                <div className="set-setting-row">
                  <span className="set-setting-label">{t('email_alert')}</span>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="set-checkbox"
                  />
                </div>
              </div>
            </div>

            <div className="set-card">
              <h3 className="set-card-title">
                <Image className="set-card-icon" />
                {t('image_capture_settings')}
              </h3>
              <div className="set-card-content">
                <div className="set-setting-group">
                  <label className="set-select-label">{t('resolution')}</label>
                  <select
                    value={settings.captureResolution}
                    onChange={(e) => handleSettingChange('captureResolution', e.target.value)}
                    className="set-select-input"
                  >
                    <option value="low">{t('resolution_low')}</option>
                    <option value="medium">{t('resolution_medium')}</option>
                    <option value="high">{t('resolution_high')}</option>
                    <option value="ultra">{t('resolution_ultra')}</option>
                  </select>
                </div>
                <div className="set-setting-group">
                  <label className="set-range-label">{t('quality')}</label>
                  <input
                    type="range" min="30" max="100"
                    value={settings.imageQuality}
                    onChange={(e) => handleSettingChange('imageQuality', e.target.value)}
                    className="set-range-input"
                  />
                  <div className="set-range-value">
                    {t('current', { value: `${settings.imageQuality}% (${t('quality_optimized')})` })}
                  </div>
                </div>
              </div>
            </div>

            <div className="set-card">
              <h3 className="set-card-title">
                <Cog className="set-card-icon" />
                {t('general_settings')}
              </h3>
              <div className="set-card-content">
                {/* ✅ 언어 셀렉트: settings.language만 변경 */}
                <div className="set-setting-group">
                  <label className="set-select-label">{t('language')}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="set-select-input"
                  >
                    <option value="ko">{t('korean')}</option>
                    <option value="en">{t('english')}</option>
                    <option value="ja">{t('japanese')}</option>
                  </select>
                </div>

                {/* ✅ 테마 셀렉트: 전역 theme + 저장 */}
                <div className="set-setting-group">
                  <label className="set-select-label">{t('theme')}</label>
                  <select
                    value={theme}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTheme(val);                     // 전역 테마 즉시 적용
                      handleSettingChange('theme', val); // 설정에도 저장(옵션)
                    }}
                    className="set-select-input"
                  >
                    <option value="light">{t('light_mode')}</option>
                    <option value="dark">{t('dark_mode')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="set-system-info">
              <h3 className="set-system-title">{t('system_info')}</h3>
              <div className="set-system-content">
                <div className="set-system-row">
                  <span className="set-system-label">{t('system_version')}:</span>
                  <span className="set-system-value">v2.1.3</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">{t('ai_model_version')}:</span>
                  <span className="set-system-value">v1.5.2</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">{t('last_update')}:</span>
                  <span className="set-system-value">2025-08-20</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">{t('license')}:</span>
                  <span className="set-system-value">Professional</span>
                </div>
                <div className="set-system-row">
                  <span className="set-system-label">{t('storage_usage')}:</span>
                  <span className="set-system-value">245GB / 500GB</span>
                </div>
              </div>
              <div className="set-button-group">
                <button onClick={() => setCurrentPage('home')} className="set-cancel-button">
                  {t('cancel')}
                </button>
                <button onClick={handleSave} className="set-save-button">
                  {t('save')}
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
