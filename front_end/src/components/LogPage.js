import React, { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import './LogPage.css'; // CSS 파일 임포트
// 백엔드 부분 
import {logs} from '../services/logs';

// 유틸리티 함수들을 별도 객체로 분리
const LogPageUtils = {
  // 통계 계산
  calculateStats: (detectionHistory) => ({
    total: detectionHistory.length,
    good: detectionHistory.filter(item => item.result === '양품').length,
    defective: detectionHistory.filter(item => item.result === '불량품').length,
    pending: detectionHistory.filter(item => item.result === '보류').length
  }),

  // 페이지네이션 계산
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

  // CSV 내보내기 함수
  exportToCSV: (detectionHistory, username) => {
    const csvContent = [
      ['순서', '촬영 시간', '제품 코드', '검출 결과', '불량 유형', '검출 확률', '작업자 ID'],
      ...detectionHistory.map((log, index) => {
        const formattedTimestamp = log.timestamp.replace('T', ' ').replace(/-/g, '/');
        return [
          detectionHistory.length - index,
          formattedTimestamp,
          log.productCode || 'PROD-001',
          log.result,
          log.type || (log.result === '불량품' ? '뚜껑 손상' : '-'),
          log.confidence,
          log.workerId || username
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

  // 상태별 스타일 클래스 반환
  getStatusClass: (result) => {
    if (result === '불량품') return 'log-status-defective';
    if (result === '보류') return 'log-status-pending';
    return 'log-status-good';
  },

  // 진행률 계산
  calculatePercentage: (value, total) => {
    return total > 0 ? (value / total) * 100 : 0;
  },

  // 타임스탬프 포맷팅
  formatTimestamp: (timestamp) => {
    return timestamp.replace('T', ' ');
  }
};

// --- 신규 추가: 이미지 라이트박스 컴포넌트 ---
const ImageLightbox = ({ imageUrl, onClose }) => {
    console.log(imageUrl)
    if (!imageUrl) return null;

    // 배경을 클릭하면 닫히도록 설정
    return (
        <div className="log-lightbox-overlay" onClick={onClose}>
            <div className="log-lightbox-content">
                <img src={imageUrl} alt="확대 이미지" className="log-lightbox-image" />
            </div>
        </div>
    );
};

// 통계 아이템 컴포넌트
const StatItem = ({ type, value, label, total }) => {
  const percentage = LogPageUtils.calculatePercentage(value, total);
  
  return (
    <div className="log-stat-item">
      <div className={`log-stat-number log-${type}`}>{value}</div>
      <div className="log-stat-label">{label}</div>
      <div className="log-progress-bar">
        <div 
          className={`log-progress-fill log-${type}`}
          style={{ width: type === 'total' ? '100%' : `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// 상태 뱃지 컴포넌트
const StatusBadge = ({ result }) => {
  const statusClass = LogPageUtils.getStatusClass(result);
  
  return (
    <span className={`log-status-badge ${statusClass}`}>
      {result}
    </span>
  );
};

// 페이지네이션 컴포넌트
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrevious = () => onPageChange(currentPage - 1);
  const handleNext = () => onPageChange(currentPage + 1);

 // 페이지 번호 그룹을 계산하는 로직
  const pageNumbers = [];
  const maxPageButtons = 5; // 한 번에 보여줄 최대 페이지 버튼 수
  const currentGroup = Math.ceil(currentPage / maxPageButtons);
  let startPage = (currentGroup - 1) * maxPageButtons + 1;
  let endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

  for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
  }

  return (
    <div className="log-pagination">
      <button 
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="log-page-button"
      >
        이전
      </button>

      {/* 계산된 페이지 번호들만 버튼으로 렌더링 */}
      {pageNumbers.map((number) => (
        <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`log-page-button ${currentPage === number ? 'log-active' : ''}`}
        >
            {number}
        </button>
      ))}

      <button 
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="log-page-button"
      >
        다음
      </button>
    </div>
  );
};

// 상세 모달 컴포넌트
const DetailModal = ({ selectedDetail, onClose ,setLightboxImage}) => {
  if (!selectedDetail) return null;

  return (
    <div className="log-modal" onClick={onClose}>
      <div className="log-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="log-modal-header">
          <h3 className="log-modal-title">검사 상세 정보</h3>
          <button onClick={onClose} className="log-close-button">
            <X className="log-close-icon" style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>
        
        <div className="log-modal-body">
          <div className="log-modal-grid">
            {/* 제품 이미지 섹션 */}
            <div className="log-image-section">
              <h4 className="log-section-title">제품 이미지</h4>
              <div className="log-image-container">
                {selectedDetail.image ? (
                  <img 
                    src={`/static/frames/${selectedDetail.image}?t=${new Date().getTime()}`}
                    alt="제품 썸네일" 
                    className="log-product-image"
                    onClick={() => setLightboxImage(`/static/frames/${selectedDetail.image}?t=${new Date().getTime()}`)}
                  />
                ) : (
                  <div className="log-image-placeholder">
                    <span>이미지 없음</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* 상세 정보 섹션 */}
            <div className="log-detail-section">
              <h4 className="log-section-title">검사 정보</h4>
              <div className="log-detail-info">
                <div className="log-info-row">
                  <span className="log-info-label">순서:</span>
                  <span className="log-info-value">{selectedDetail.순서}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">시간:</span>
                  <span className="log-info-value">
                    {LogPageUtils.formatTimestamp(selectedDetail.timestamp)}
                  </span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">제품:</span>
                  <span className="log-info-value">{selectedDetail.제품코드}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">결과:</span>
                  <StatusBadge result={selectedDetail.result} />
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">유형:</span>
                  <span className="log-info-value">{selectedDetail.type || '-'}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">확률:</span>
                  <span className="log-info-value">{selectedDetail.confidence}</span>
                </div>
                <div className="log-info-row">
                  <span className="log-info-label">작업자:</span>
                  <span className="log-info-value">{selectedDetail.작업자ID}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="log-modal-footer">
          <button onClick={onClose} className="log-close-modal-button">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// 메인 LogPage 컴포넌트
const LogPage = ({ setCurrentPage, detectionHistory, username, handleLogout ,setDetectionHistory}) => {
  
  useEffect(() => {
    const logsData = logs().then( logs => {
        setDetectionHistory(logs); }
    );
  }, []);  
  
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [currentLogPage, setCurrentLogPage] = useState(1);
  const logsPerPage = 25;
  const [lightboxImage, setLightboxImage] = useState(null);

  // 통계 및 페이지네이션 데이터 계산
  const stats = LogPageUtils.calculateStats(detectionHistory);
  const { 
    currentItems: currentLogs, 
    indexOfFirstItem: indexOfFirstLog, 
    totalPages 
  } = LogPageUtils.getPaginatedData(detectionHistory, currentLogPage, logsPerPage);

  // 이벤트 핸들러들
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentLogPage(pageNumber);
  };

  const handleExportList = () => {
    LogPageUtils.exportToCSV(detectionHistory, username);
  };

  const openDetailModal = (log, index) => {
    setSelectedDetail({
      ...log,
      순서: detectionHistory.length - (indexOfFirstLog + index),
      작업자ID: log.workerId || username,
      제품코드: log.productCode || 'PROD-001',
      썸네일: log.image || '/placeholder-image.jpg'
    });
  };

  const closeDetailModal = () => {
    setSelectedDetail(null);
  };

  return (
    <div className="log-main-container">
      {/* 상단 헤더 */}
      <div className="log-header">
        <div className="log-header-content">
          <div className="log-header-left">
            <button 
              onClick={() => setCurrentPage('home')}
              className="log-back-button"
            >
              <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <h1 className="log-title">로그 페이지</h1>
          </div>

          <div className="log-header-right">
            {username && (
              <span className="log-username">{username} 님</span>
            )}
            <button 
              onClick={handleLogout}
              className="log-logout-button"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="log-main-content">
        <div className="log-content-wrapper">
          {/* 통계 현황판 */}
          <div className="log-stats-card">
            <div className="log-stats-header">
              <h2 className="log-stats-title">검사 현황 요약</h2>
            </div>
            <div className="log-stats-content">
              <div className="log-stats-grid">
                <StatItem 
                  type="total" 
                  value={stats.total} 
                  label="전체" 
                  total={stats.total} 
                />
                <StatItem 
                  type="good" 
                  value={stats.good} 
                  label="정상" 
                  total={stats.total} 
                />
                <StatItem 
                  type="defective" 
                  value={stats.defective} 
                  label="불량" 
                  total={stats.total} 
                />
                <StatItem 
                  type="pending" 
                  value={stats.pending} 
                  label="보류" 
                  total={stats.total} 
                />
              </div>
            </div>
          </div>

          {/* 메인 테이블 */}
          <div className="log-table-card">
            <div className="log-table-header">
              <h2 className="log-table-title">검사 로그 내역</h2>
              <button 
                onClick={handleExportList}
                className="log-export-button"
              >
                리스트 내보내기
              </button>
            </div>
            
            <div className="log-table-wrapper">
              <table className="log-table">
                <thead className="log-table-head">
                  <tr>
                    <th className="log-table-header-cell">순서</th>
                    <th className="log-table-header-cell">촬영 시간</th>
                    <th className="log-table-header-cell">제품 코드</th>
                    <th className="log-table-header-cell">검출 결과</th>
                    <th className="log-table-header-cell">불량 유형</th>
                    <th className="log-table-header-cell">검출 확률</th>
                    <th className="log-table-header-cell">작업자 ID</th>
                    <th className="log-table-header-cell">비고</th>
                  </tr>
                </thead>
                <tbody className="log-table-body">
                  {currentLogs.map((log, index) => (
                    <tr key={log.id|| `log-item-${index}`} className="log-table-row">
                      <td className="log-table-cell">
                        {detectionHistory.length - (indexOfFirstLog + index)}
                      </td>
                      <td className="log-table-cell">
                        {LogPageUtils.formatTimestamp(log.timestamp)}
                      </td>
                      <td className="log-table-cell">
                        {log.productCode || 'PROD-001'}
                      </td>
                      <td className="log-table-cell">
                        <StatusBadge result={log.result} />
                      </td>
                      <td className="log-table-cell">
                        {log.result === '불량품' ? (log.type || '뚜껑 손상') : '-'}
                      </td>
                      <td className="log-table-cell">{log.confidence}%</td>
                      <td className="log-table-cell">{log.workerId || username}</td>
                      <td className="log-table-cell">
                        <button 
                          onClick={() => openDetailModal(log, index)}
                          className="log-detail-button"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <Pagination 
              currentPage={currentLogPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* 상세보기 모달 */}
      <DetailModal 
        selectedDetail={selectedDetail}
        onClose={closeDetailModal}
        setLightboxImage={setLightboxImage}
      />
      {/* --- 신규 추가: 라이트박스 렌더링 --- */}
      <ImageLightbox
           imageUrl={lightboxImage}
           onClose={() => setLightboxImage(null)}
      />
    </div>
  );
};

export default LogPage;