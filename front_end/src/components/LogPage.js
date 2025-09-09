import React, { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './LogPage.css';
import { logs } from '../services/logs';

const LogPageUtils = {
  calculateStats: (detectionHistory) => ({
    total: detectionHistory.length,
    good: detectionHistory.filter(item => item.result === '양품').length,
    defective: detectionHistory.filter(item => item.result === '불량품').length,
    pending: detectionHistory.filter(item => item.result === '보류').length
  }),


  getPaginatedData: (data, currentPage, itemsPerPage) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return {
      currentItems: data.slice(indexOfFirstItem, indexOfLastItem),
      indexOfFirstItem,
      indexOfLastItem,
      totalPages: Math.ceil(data.length / itemsPerPage)
    };
  },


  exportToCSV: (detectionHistory, username) => {
    const csvContent = [
      ['순서', '촬영 시간', '제품 코드', '검출 결과', '불량 유형', '검출 확률'],
      ...detectionHistory.map((log, index) => {
        const formattedTimestamp = log.timestamp.replace('T', ' ').replace(/-/g, '/');
        return [
          detectionHistory.length - index,
          formattedTimestamp,
          log.productCode,
          log.result,
          log.type,
          log.confidence
        ];
      })
    ].map(row => row.join(',')).join('\n');


    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `검사로그_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  },


  getStatusClass: (result) => {
    if (result === '불량품') return 'log-status-defective';
    if (result === '보류') return 'log-status-pending';
    return 'log-status-good';
  },


  calculatePercentage: (value, total) => {
    return total > 0 ? (value / total) * 100 : 0;
  },


  formatTimestamp: (timestamp) => {
    return timestamp.replace('T', ' ');
  }
};

const ImageLightbox = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="log-lightbox-overlay" onClick={onClose}>
      <div className="log-lightbox-content">
        <img src={imageUrl} alt="확대 이미지" className="log-lightbox-image" />
      </div>
    </div>
  );
};

const StatItem = ({ type, value, label, total }) => {
  const percentage = LogPageUtils.calculatePercentage(value, total);
  return (
    <div className="log-stat-item">
      <div className={`log-stat-number log-${type}`}>{value}</div>
      <div className="log-stat-label">{label}</div>
      <div className="log-progress-bar">
        <div className={`log-progress-fill log-${type}`} style={{ width: type === 'total' ? '100%' : `${percentage}%` }} />
      </div>
    </div>
  );
};

const StatusBadge = ({ result }) => {
  const { t } = useTranslation();
  const statusClass = LogPageUtils.getStatusClass(result);

  const displayText = {
    '양품': t('log.status_good'),
    '불량품': t('log.status_defective'),
    '보류': t('log.status_pending')
  }[result] || result;

  return <span className={`log-status-badge ${statusClass}`}>{displayText}</span>;
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();
  const handlePrevious = () => onPageChange(currentPage - 1);
  const handleNext = () => onPageChange(currentPage + 1);

  const pageNumbers = [];
  const maxPageButtons = 5;
  const currentGroup = Math.ceil(currentPage / maxPageButtons);
  let startPage = (currentGroup - 1) * maxPageButtons + 1;
  let endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="log-pagination">
      <button onClick={handlePrevious} disabled={currentPage === 1} className="log-page-button">
        {t('log.prev')}
      </button>
      {pageNumbers.map((number) => (
        <button key={number} onClick={() => onPageChange(number)} className={`log-page-button ${currentPage === number ? 'log-active' : ''}`}>
          {number}
        </button>
      ))}
      <button onClick={handleNext} disabled={currentPage === totalPages} className="log-page-button">
        {t('log.next')}
      </button>
    </div>
  );
};

const DetailModal = ({ selectedDetail, onClose, setLightboxImage }) => {
  const { t } = useTranslation();
  if (!selectedDetail) return null;

  return (
    <div className="log-modal" onClick={onClose}>
      <div className="log-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal-header">
          <h3 className="log-modal-title">{t('log.detailTitle')}</h3>
          <button onClick={onClose} className="log-close-button">
            <X className="log-close-icon" style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        <div className="log-modal-body">
          <div className="log-modal-grid">
            <div className="log-image-section">
              <h4 className="log-section-title">{t('log.imageSection')}</h4>
              <div className="log-image-container">
                {selectedDetail.image ? (
                  <img
                    src={`${selectedDetail.image}?t=${new Date().getTime()}`}
                    alt="제품 썸네일"
                    className="log-product-image"
                    onClick={() => setLightboxImage(`${selectedDetail.image}?t=${new Date().getTime()}`)}
                  />
                ) : (
                  <div className="log-image-placeholder">
                    <span>{t('log.noImage')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="log-detail-section">
              <h4 className="log-section-title">{t('log.detailSection')}</h4>
              <div className="log-detail-info">
                <div className="log-info-row">
                  <span className="log-info-label">{t('log.index')}:</span>
                  <span className="log-info-value">{selectedDetail.순서}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">{t('log.time')}:</span>
                  <span className="log-info-value">{LogPageUtils.formatTimestamp(selectedDetail.timestamp)}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">{t('log.product')}:</span>
                  <span className="log-info-value">{selectedDetail.제품코드}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">{t('log.result')}:</span>
                  <StatusBadge result={selectedDetail.result} />
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">{t('log.type')}:</span>
                  <span className="log-info-value">{selectedDetail.type || '-'}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">{t('log.confidence')}:</span>
                  <span className="log-info-value">{selectedDetail.confidence}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="log-modal-footer">
          <button onClick={onClose} className="log-close-modal-button">
            {t('log.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const LogPage = ({ setCurrentPage, detectionHistory, username, handleLogout, setDetectionHistory }) => {
  const { t } = useTranslation();
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentLogPage, setCurrentLogPage] = useState(1);
  const logsPerPage = 25;
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    logs().then(logs => setDetectionHistory(logs));
  }, []);

  const stats = LogPageUtils.calculateStats(detectionHistory);
  const {
    currentItems: currentLogs,
    indexOfFirstItem: indexOfFirstLog,
    totalPages
  } = LogPageUtils.getPaginatedData(detectionHistory, currentLogPage, logsPerPage);

  const handleExportList = () => {
    LogPageUtils.exportToCSV(detectionHistory, username);
  };

  const openDetailModal = (log, index) => {
    setSelectedDetail({
      ...log,
      순서: detectionHistory.length - (indexOfFirstLog + index),
      제품코드: log.productCode || 'PROD-001',
      썸네일: log.image || '/placeholder-image.jpg'
    });
  };

  const closeDetailModal = () => {
    setSelectedDetail(null);
  };

  return (
    <div className="log-main-container">
      <div className="log-header">
        <div className="log-header-content">
          <div className="log-header-left">
            <button onClick={() => setCurrentPage('home')} className="log-back-button">
              <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <h1 className="log-title">{t('log.title')}</h1>
          </div>

          <div className="log-header-right">
            {username && <span className="log-username">{t('user_greeting', { name: username })}</span>}
            <button onClick={handleLogout} className="log-logout-button">
              {t('log.logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="log-main-content">
        <div className="log-content-wrapper">
          <div className="log-stats-card">
            <div className="log-stats-header">
              <h2 className="log-stats-title">{t('log.summary')}</h2>
            </div>
            <div className="log-stats-content">
              <div className="log-stats-grid">
                <StatItem type="total" value={stats.total} label={t('log.total')} total={stats.total} />
                <StatItem type="good" value={stats.good} label={t('log.good')} total={stats.total} />
                <StatItem type="defective" value={stats.defective} label={t('log.defective')} total={stats.total} />
                <StatItem type="pending" value={stats.pending} label={t('log.pending')} total={stats.total} />
              </div>
            </div>
          </div>

          <div className="log-table-card">
            <div className="log-table-header">
              <h2 className="log-table-title">{t('log.logList')}</h2>
              <button onClick={handleExportList} className="log-export-button">
                {t('log.export')}
              </button>
            </div>

            <div className="log-table-wrapper">
              <table className="log-table">
                <thead className="log-table-head">
                  <tr>
                    <th className="log-table-header-cell">{t('log.index')}</th>
                    <th className="log-table-header-cell">{t('log.time')}</th>
                    <th className="log-table-header-cell">{t('log.product')}</th>
                    <th className="log-table-header-cell">{t('log.result')}</th>
                    <th className="log-table-header-cell">{t('log.type')}</th>
                    <th className="log-table-header-cell">{t('log.confidence')}</th>
                    <th className="log-table-header-cell">{t('log.detail')}</th>
                  </tr>
                </thead>
                <tbody className="log-table-body">
                  {currentLogs.map((log, index) => (
                    <tr key={log.id || `log-item-${index}`} className="log-table-row">
                      <td className="log-table-cell">{detectionHistory.length - (indexOfFirstLog + index)}</td>
                      <td className="log-table-cell">{LogPageUtils.formatTimestamp(log.timestamp)}</td>
                      <td className="log-table-cell">{log.productCode || 'PROD-001'}</td>
                      <td className="log-table-cell"><StatusBadge result={log.result} /></td>
                      <td className="log-table-cell">{log.result === '불량품' ? (log.type || '뚜껑 손상') : '-'}</td>
                      <td className="log-table-cell">{log.confidence}%</td>
                      <td className="log-table-cell">
                        <button onClick={() => openDetailModal(log, index)} className="log-detail-button">
                          {t('log.detail')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination currentPage={currentLogPage} totalPages={totalPages} onPageChange={setCurrentLogPage} />
          </div>
        </div>
      </div>

      <DetailModal selectedDetail={selectedDetail} onClose={closeDetailModal} setLightboxImage={setLightboxImage} />
      <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

export default LogPage;
