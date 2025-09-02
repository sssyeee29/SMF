// src/components/WarehousePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, Plus, X, Trash2 } from 'lucide-react';
import './WarehousePage.css';

// ⬇️ 서비스 임포트 (경로는 프로젝트 구조에 맞게 조정)
import { fetchInventory, deleteItem as apiDeleteItem } from '../services/warehouseService';

const WarehousePage = ({ setCurrentPage, username, handleLogout }) => {
  // 🔎 UI 입력 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [productType, setProductType] = useState('전체');
  const [subCategory, setSubCategory] = useState('전체');
  const [registrationDate, setRegistrationDate] = useState('전체');
  const [deliveryStatus, setDeliveryStatus] = useState('전체');

  // 📷 카메라 모달
  const [showCamera, setShowCamera] = useState(null);

  // 📄 서버 데이터 + 페이징
  const [inventoryData, setInventoryData] = useState([]);
  const [page, setPage] = useState(1);       // 프론트 1-base
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🔁 '검색' 버튼으로 확정된 필터 (타이핑 중엔 서버 호출 안 함)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    productType: '',
    category: '',
    status: '',
    regDays: null,
  });

  // 📊 좌측 차트(예시 데이터 유지. DB 데이터로 바꾸려면 여기서 가공)
  const chartData = [
    { name: '바나나맛 우유', quantity: 212 },
    { name: '딸기맛 우유', quantity: 301 },
    { name: '멜론맛 우유', quantity: 123 },
  ];

  // 🧱 창고 구역(예시)
  const warehouseLayout = [
    { section: 'A구역', items: 8, color: 'wh-section-blue', camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { section: 'B구역', items: 5, color: 'wh-section-green', camera: 'https://www.w3schools.com/html/movie.mp4' },
    { section: 'C구역', items: 3, color: 'wh-section-yellow', camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { section: '냉장구역', items: 12, color: 'wh-section-purple', camera: 'https://www.w3schools.com/html/movie.mp4' },
  ];

  // 🗓️ UI의 등록일 값을 regDays 숫자로 매핑
  const regDaysMap = {
    '전체': null,
    '오늘': 0,
    '3일': 3,
    '7일': 7,
    '1개월': 30,
  };

  // 📦 총 재고 (표 상단 요약용)
  const totalQuantity = useMemo(
    () => inventoryData.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
    [inventoryData]
  );

  // 🔍 검색 버튼 클릭 → 필터 확정 & 1페이지로 이동
  const applySearch = () => {
    setPage(1);
    setAppliedFilters({
      search: searchTerm.trim(),
      productType: productType === '전체' ? '' : productType,
      category: subCategory === '전체' ? '' : subCategory,
      status: deliveryStatus === '전체' ? '' : deliveryStatus, // ⚠ DB 실제 값(READY/DONE 등) 쓰면 여기서 매핑
      regDays: regDaysMap[registrationDate] ?? null,
    });
  };

  // 📥 서버에서 목록 불러오기
  const loadList = async () => {
    setLoading(true);
    try {
      const { items, total: t, page: p } = await fetchInventory({
        page,
        size,
        ...appliedFilters,
      });
      setInventoryData(items);
      setTotal(t);
      setPage(p); // 서버에서 되돌려주는 1-base 값으로 동기화
    } catch (e) {
      console.error('목록 조회 실패:', e);
      alert('재고 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ▶️ 페이지/사이즈/적용된 필터 변경 시 목록 재조회
  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, appliedFilters]);

  // 🗑️ 삭제
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await apiDeleteItem(itemId);
      // 현재 페이지에서 마지막 1개를 지웠고, 삭제 후 비게 되면 페이지 하나 당겨주기
      const willBeTotal = total - 1;
      const lastPage = Math.max(1, Math.ceil(willBeTotal / size));
      if (page > lastPage) {
        setPage(lastPage);
      } else {
        // 같은 페이지 재조회
        loadList();
      }
    } catch (e) {
      console.error('삭제 실패:', e);
      alert('삭제에 실패했습니다.');
    }
  };

  // ⏭️ 페이지네이션
  const totalPages = Math.max(1, Math.ceil(total / size));
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="wh-container">
      {/* 헤더 */}
      <div className="wh-header">
        <div className="wh-header-left">
          <button onClick={() => setCurrentPage('home')} className="wh-back-btn">
            <ArrowLeft className="wh-icon" />
          </button>
          <h1 className="wh-title">창고 페이지</h1>
        </div>
        <div className="wh-header-right">
          {username && <span className="wh-username">{username} 님</span>}
          <button onClick={handleLogout} className="wh-logout-btn">로그아웃</button>
        </div>
      </div>

      {/* 헤더 아래 콘텐츠 영역 */}
      <div className="wh-content">
        {/* 왼쪽 사이드바 */}
        <div className="wh-sidebar">
          {/* 재고 현황 통계 */}
          <div className="wh-statistics">
            <h3 className="wh-section-title">재고 현황 통계</h3>
            <div className="wh-chart-container">
              {chartData.map((item, index) => (
                <div key={index} className="wh-chart-item">
                  <div className="wh-chart-info">
                    <span className="wh-chart-name">{item.name}</span>
                    <span className="wh-chart-quantity">{item.quantity}개</span>
                  </div>
                  <div className="wh-progress-bar">
                    <div
                      className="wh-progress-fill"
                      style={{ width: `${(item.quantity / Math.max(...chartData.map(d => d.quantity))) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 창고 구역 */}
          <div className="wh-warehouse-section">
            <h3 className="wh-section-title">창고 구역</h3>
            <div className="wh-section-grid">
              {warehouseLayout.map((sec) => (
                <button
                  key={sec.section}
                  onClick={() => setShowCamera(sec)}
                  className={`wh-section-btn ${sec.color}`}
                >
                  <div className="wh-section-name">{sec.section}</div>
                  <div className="wh-section-count">상품 {sec.items}개</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽 메인 영역 */}
        <div className="wh-main">
          {/* 검색 및 필터 영역 */}
          <div className="wh-filter-container">
            <div className="wh-filter-row">
              {/* 검색 */}
              <div className="wh-filter-group">
                <span className="wh-filter-label">검색분류</span>
                <div className="wh-search-wrapper">
                  <Search className="wh-search-icon" />
                  <input
                    type="text"
                    placeholder="상품명, 코드"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="wh-search-input"
                  />
                </div>
              </div>

              {/* 필터 */}
              <div className="wh-filter-group">
                <span className="wh-filter-label">상품구분</span>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="wh-filter-select wh-select-small"
                >
                  <option>전체</option>
                  <option>기본</option>
                  <option>세트</option>
                </select>
              </div>

              <div className="wh-filter-group">
                <span className="wh-filter-label">분류</span>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="wh-filter-select wh-select-medium"
                >
                  <option>전체</option>
                  <option>바나나맛</option>
                  <option>딸기맛</option>
                  <option>멜론맛</option>
                </select>
              </div>

              {/* 등록일 */}
              <div className="wh-filter-group">
                <span className="wh-filter-label">등록일</span>
                <select
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                  className="wh-filter-select wh-select-medium"
                >
                  <option>전체</option>
                  <option>오늘</option>
                  <option>3일</option>
                  <option>7일</option>
                  <option>1개월</option>
                  <option>년월일 지정</option>
                </select>
              </div>

              {/* 납품상태 */}
              <div className="wh-filter-group">
                <span className="wh-filter-label">납품상태</span>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value)}
                  className="wh-filter-select wh-select-small"
                >
                  <option>전체</option>
                  <option>납품준비</option>
                  <option>납품완료</option>
                </select>
              </div>

              {/* 버튼 */}
              <button className="wh-btn wh-btn-primary">
                <Plus className="wh-btn-icon" />
                상품추가
              </button>
              <button className="wh-btn wh-btn-secondary" onClick={applySearch}>
                검색
              </button>
            </div>

            {/* 년월일 지정 영역 (직접 기간 지정이 필요하면 별도 파라미터 설계 필요) */}
            {registrationDate === '년월일 지정' && (
              <div className="wh-date-range">
                <div className="wh-date-group">
                  <span className="wh-filter-label">기간 설정</span>
                  <div className="wh-date-inputs">
                    <input type="date" className="wh-date-input" />
                    <span className="wh-date-separator">~</span>
                    <input type="date" className="wh-date-input" />
                    <button className="wh-btn wh-btn-apply">적용</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 상단 요약 통계 */}
          <div className="wh-summary-stats">
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-blue">{totalQuantity}</div>
              <div className="wh-stat-label">총 재고</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-green">{total}</div>
              <div className="wh-stat-label">제품 종류</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-orange">
                {inventoryData.filter((item) => (item.quantity ?? 0) > 0).length}
              </div>
              <div className="wh-stat-label">재고 제품</div>
            </div>
          </div>

          {/* 메인 테이블 영역 */}
          <div className="wh-table-container">
            <div className="wh-table-header">
              <h2 className="wh-table-title">재고 목록</h2>
              <div className="wh-table-count">총 {total}개 상품</div>
            </div>

            <div className="wh-table-wrapper">
              {loading ? (
                <div className="wh-loading">불러오는 중...</div>
              ) : (
                <table className="wh-table">
                  <thead className="wh-table-head">
                    <tr>
                      <th className="wh-th">
                        <input type="checkbox" className="wh-checkbox" />
                      </th>
                      <th className="wh-th">제품명/코드</th>
                      <th className="wh-th">수량</th>
                      <th className="wh-th">위치</th>
                      <th className="wh-th">입고일</th>
                      <th className="wh-th">출고일</th>
                      <th className="wh-th">비고</th>
                      <th className="wh-th">작업</th>
                    </tr>
                  </thead>

                  <tbody className="wh-table-body">
                    {inventoryData.map((item) => (
                      <tr key={item.id} className="wh-table-row">
                        <td className="wh-td">
                          <input type="checkbox" className="wh-checkbox" />
                        </td>
                        <td className="wh-td">
                          <div>
                            <div className="wh-product-name">{item.name}</div>
                            <div className="wh-product-code">{item.code}</div>
                          </div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-quantity">{item.quantity}개</div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-location">{item.location}</div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-date">{item.inDate ?? '-'}</div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-date">{item.outDate ?? '-'}</div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-note">{item.note ?? '-'}</div>
                        </td>
                        <td className="wh-td">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="wh-delete-btn"
                            title="삭제"
                          >
                            <Trash2 className="wh-delete-icon" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {inventoryData.length === 0 && !loading && (
                      <tr>
                        <td className="wh-td" colSpan={8} style={{ textAlign: 'center' }}>
                          데이터가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="wh-pagination">
              <div className="wh-pagination-left">
                <select
                  className="wh-page-size"
                  value={size}
                  onChange={(e) => {
                    setPage(1);
                    setSize(Number(e.target.value));
                  }}
                >
                  <option value={10}>10개</option>
                  <option value={20}>20개</option>
                  <option value={50}>50개</option>
                </select>
              </div>
              <div className="wh-pagination-buttons">
                <button className="wh-page-btn" disabled={page <= 1} onClick={goPrev}>
                  이전
                </button>
                <span className="wh-page-indicator">
                  {page} / {totalPages}
                </span>
                <button className="wh-page-btn" disabled={page >= totalPages} onClick={goNext}>
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카메라 모달 */}
      {showCamera && (
        <div className="wh-modal-overlay">
          <div className="wh-modal">
            <div className="wh-modal-header">
              <h3 className="wh-modal-title">{showCamera.section} 카메라</h3>
              <button onClick={() => setShowCamera(null)} className="wh-modal-close">
                <X className="wh-close-icon" />
              </button>
            </div>
            <div className="wh-modal-content">
              <video src={showCamera.camera} controls autoPlay loop className="wh-video" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehousePage;
