// src/components/WarehousePage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Search, Plus, X, Package } from 'lucide-react';
import './WarehousePage.css';

// ⬇️ 서버 연동 서비스 (미리 만들어둔 파일)
import {
  fetchInventory,
  createItem,
  deliverItem,
} from '../services/warehouseService';

// ⬇️ 3D 미니맵
import Warehouse3D from './Warehouse3D';

// 서버와 연동할지 여부 (true면 로컬 더미데이터 사용)
const USE_LOCAL_DATA = false;

// 🔁 UI ↔ 서버 파라미터 매핑 (서버가 영문 ENUM이면 사용, 한글이면 서버에서 그대로 처리됨)
const statusMap = { '전체': '', '납품준비': 'READY', '납품완료': 'DONE' };
const productTypeMap = { '전체': '', '기본': 'BASIC', '세트': 'SET' };
const categoryMap = { '전체': '', '바나나맛': 'BANANA', '딸기맛': 'STRAWBERRY', '멜론맛': 'MELON' };
const regDaysMap = { '전체': null, '오늘': 0, '3일': 3, '7일': 7, '1개월': 30 };

// (로컬 모드 전용) 목데이터
const LOCAL_DATA = [
  { id: 1, name: '바나나맛 우유', code: 'BAN001', quantity: 70, limit: 100, location: 'A-01-01', inDate: '2025-01-15', outDate: '-', note: '신선도 우수', category: '바나나맛', productType: '기본' },
  { id: 2, name: '딸기맛 우유',   code: 'STR002', quantity: 100, limit: 100, location: 'A-02-03', inDate: '2025-01-20', outDate: '-', note: '인기 상품',   category: '딸기맛',   productType: '기본' },
  { id: 3, name: '멜론맛 우유',   code: 'MLK003', quantity: 80, limit: 100, location: 'B-01-05', inDate: '2025-01-18', outDate: '-', note: '냉장보관',   category: '멜론맛',   productType: '세트' },
];

// 납품 준비 여부
const isDeliveryReady = (item) => (item.quantity >= (item.limit || 100));

const WarehousePage = ({ setCurrentPage, username, handleLogout }) => {
  // 🔎 검색/필터
  const [searchTerm, setSearchTerm] = useState('');
  const [productType, setProductType] = useState('전체');
  const [subCategory, setSubCategory] = useState('전체');
  const [registrationDate, setRegistrationDate] = useState('전체');
  const [deliveryStatus, setDeliveryStatus] = useState('전체');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // 📷 카메라/추가/한도
  const [showCamera, setShowCamera] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editingLimits, setEditingLimits] = useState({});

  // 📄 데이터
  const [inventoryData, setInventoryData] = useState(USE_LOCAL_DATA ? LOCAL_DATA : []);
  const [loading, setLoading] = useState(false);

  // ➕ 새 아이템
  const [newItem, setNewItem] = useState({
    name: '',
    code: '',
    quantity: 0,
    location: '',
    inDate: '',
    note: '',
    category: '바나나맛',
    productType: '기본',
  });

  // 좌측 통계 차트용
  const chartData = inventoryData.map(item => ({ name: item.name, quantity: item.quantity }));

  // 창고 구역
  const warehouseLayout = [
    { section: 'A구역', items: 8, color: 'wh-section-blue',   camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { section: 'B구역', items: 5, color: 'wh-section-green',  camera: 'https://www.w3schools.com/html/movie.mp4' },
    { section: 'C구역', items: 3, color: 'wh-section-yellow', camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { section: '냉장구역', items: 12, color: 'wh-section-purple', camera: 'https://www.w3schools.com/html/movie.mp4' },
  ];

  // ========== 서버 목록 로딩 ==========
  const abortRef = useRef(null);

  const buildFiltersForServer = () => {
    const isCustom = registrationDate === '년월일 지정';
    return {
      page: 1,
      size: 9999, // 이 화면은 페이징 UI가 고정이라 일단 크게 받아옴(필요시 조절)
      search: searchTerm.trim(),
      productType: productTypeMap[productType] ?? '', // 서버가 한글이면 서비스/서버에서 한글로 자동 변환되도록 되어 있음
      category: categoryMap[subCategory] ?? '',
      status: statusMap[deliveryStatus] ?? '',
      regDays: isCustom ? null : (regDaysMap[registrationDate] ?? null),
      from: isCustom && fromDate ? fromDate : null,
      to: isCustom && toDate ? toDate : null,
    };
  };

  const loadFromServer = useCallback(async () => {
    if (USE_LOCAL_DATA) return;
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { items } = await fetchInventory(buildFiltersForServer(), { signal: controller.signal });
      // 서버 응답 필드 → 서비스에서 이미 UI형태로 매핑됨
      // limit 값이 서버에 없으면 기본 100으로 세팅
      setInventoryData(items.map(it => ({ ...it, limit: it.limit ?? 100 })));
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('재고 조회 실패', e);
        alert('재고 목록을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, productType, subCategory, deliveryStatus, registrationDate, fromDate, toDate]);

  useEffect(() => {
    if (!USE_LOCAL_DATA) loadFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 최초 1회

  // 🔎 검색 버튼: 서버 재조회
  const handleSearch = () => {
    if (USE_LOCAL_DATA) {
      // 간단 로컬 필터(등록일 지정은 생략)
      const keyword = searchTerm.toLowerCase();
      const filtered = LOCAL_DATA.filter(i =>
        (!keyword || i.name.toLowerCase().includes(keyword) || i.code.toLowerCase().includes(keyword)) &&
        (productType === '전체' || i.productType === productType) &&
        (subCategory === '전체' || i.category === subCategory) &&
        (deliveryStatus === '전체' ||
          (deliveryStatus === '납품준비' && i.quantity < (i.limit || 100)) ||
          (deliveryStatus === '납품완료' && i.quantity === 0))
      );
      setInventoryData(filtered);
    } else {
      loadFromServer();
    }
  };

  // 📨 납품 처리
  const handleDelivery = async (itemId) => {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item || !isDeliveryReady(item)) return;

    if (!window.confirm(`${item.name} (${item.code})을 납품하시겠습니까?`)) return;

    if (USE_LOCAL_DATA) {
      const today = new Date().toISOString().split('T')[0];
      setInventoryData(list =>
        list.map(it => it.id === itemId ? { ...it, quantity: 0, outDate: today } : it)
      );
      return;
    }

    try {
      setLoading(true);
      // 이 화면은 "전체 납품" 로직(=수량을 0으로) → 서버에 amount=현재수량 전달
      await deliverItem(itemId, item.quantity);
      await loadFromServer();
    } catch (e) {
      console.error('납품 처리 실패', e);
      alert('납품 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ➕ 상품 추가 저장
  const handleCreate = async () => {
    if (!newItem.name || !newItem.code) {
      alert('제품명과 코드는 필수입니다.');
      return;
    }

    if (USE_LOCAL_DATA) {
      const nextId = Math.max(0, ...inventoryData.map(i => i.id || 0)) + 1;
      const row = {
        id: nextId,
        name: newItem.name,
        code: newItem.code,
        quantity: Number(newItem.quantity) || 0,
        limit: 100,
        location: newItem.location || '-',
        inDate: newItem.inDate || new Date().toISOString().slice(0, 10),
        outDate: '-',
        note: newItem.note || '-',
        category: newItem.category,
        productType: newItem.productType,
      };
      setInventoryData(prev => [row, ...prev]);
    } else {
      try {
        setLoading(true);
        await createItem({
          name: newItem.name,
          code: newItem.code,
          quantity: Number(newItem.quantity) || 0,
          location: newItem.location || '-',
          inDate: newItem.inDate || new Date().toISOString().slice(0, 10),
          note: newItem.note || '-',
          // 서버가 영문 ENUM이면 아래 매핑, 한글 ENUM이면 서버에서 보정되도록 구현되어 있음
          category: categoryMap[newItem.category] || newItem.category,
          productType: productTypeMap[newItem.productType] || newItem.productType,
        });
        await loadFromServer();
      } catch (e) {
        console.error('상품 등록 실패', e);
        alert('상품 등록에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    setShowAdd(false);
    setNewItem({
      name: '',
      code: '',
      quantity: 0,
      location: '',
      inDate: '',
      note: '',
      category: '바나나맛',
      productType: '기본',
    });
  };

  // ✅ 납품 한도 모달
  const openLimitModal = () => {
    const limits = {};
    inventoryData.forEach(item => { limits[item.id] = item.limit || 100; });
    setEditingLimits(limits);
    setShowLimitModal(true);
  };

  const saveLimits = () => {
    // 현재는 프론트만 반영(로컬 상태 변경)
    // 서버에 저장하려면 PATCH /api/inventory/limits (itemId→limit 맵) 엔드포인트 추가 후 호출
    setInventoryData(prev =>
      prev.map(item => ({ ...item, limit: editingLimits[item.id] || 100 }))
    );
    setShowLimitModal(false);
  };

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
                    <span className={`wh-chart-quantity ${item.quantity >= (inventoryData[index]?.limit || 100) ? 'wh-quantity-full' : ''}`}>
                      {item.quantity}개 / {inventoryData[index]?.limit ?? 100}개
                    </span>
                  </div>
                  <div className="wh-progress-bar">
                    <div
                      className={`wh-progress-fill ${item.quantity >= (inventoryData[index]?.limit || 100) ? 'wh-progress-full' : ''}`}
                      style={{ width: `${Math.min((item.quantity / (inventoryData[index]?.limit || 100)) * 100, 100)}%` }}
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
                <button key={sec.section} onClick={() => setShowCamera(sec)} className={`wh-section-btn ${sec.color}`}>
                  <div className="wh-section-name">{sec.section}</div>
                  <div className="wh-section-count">상품 {sec.items}개</div>
                </button>
              ))}
            </div>
          </div>

          {/* 납품 제한 버튼 */}
          <div className="wh-quantity-control">
            <h3 className="wh-section-title">납품 한도 설정</h3>
            <button onClick={openLimitModal} className="wh-btn wh-btn-quantity-control">
              제한 설정하기
            </button>
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
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
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
              <button 
                onClick={() => setShowAdd(true)}
                className="wh-btn wh-btn-primary"
              >
                <Plus className="wh-btn-icon" />
                상품추가
              </button>
              <button className="wh-btn wh-btn-secondary" onClick={handleSearch}>
                검색
              </button>
            </div>

            {/* 년월일 지정 영역 */}
            {registrationDate === '년월일 지정' && (
              <div className="wh-date-range">
                <div className="wh-date-group">
                  <span className="wh-filter-label">기간 설정</span>
                  <div className="wh-date-inputs">
                    <input type="date" className="wh-date-input" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
                    <span className="wh-date-separator">~</span>
                    <input type="date" className="wh-date-input" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
                    <button className="wh-btn wh-btn-apply" onClick={handleSearch}>적용</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 상단 요약 통계 */}
          <div className="wh-summary-stats">
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-blue">
                {inventoryData.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)}
              </div>
              <div className="wh-stat-label">총 재고</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-green">
                {inventoryData.length}
              </div>
              <div className="wh-stat-label">제품 종류</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-orange">
                {inventoryData.filter(item => (Number(item.quantity)||0) > 0).length}
              </div>
              <div className="wh-stat-label">재고 제품</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-red">
                {inventoryData.filter(item => isDeliveryReady(item)).length}
              </div>
              <div className="wh-stat-label">납품 대기</div>
            </div>
          </div>

          {/* 3D 창고 미니맵 */}
          <div style={{ margin: '12px 0' }}>
            <Warehouse3D
              data={inventoryData}
              threshold={100} // (아이템별 limit을 쓰고 싶으면 개조 가능)
              onSelect={(item) => {
                // 아이템 클릭 시 원하는 동작
                console.log('picked:', item);
              }}
              style={{ height: 360 }}
            />
          </div>

          {/* 메인 테이블 영역 */}
          <div className="wh-table-container">
            <div className="wh-table-header">
              <h2 className="wh-table-title">재고 목록</h2>
              <div className="wh-table-count">
                총 {inventoryData.length}개 상품
              </div>
            </div>
            
            <div className="wh-table-wrapper">
              {loading ? (
                <div className="wh-loading" style={{ padding: 16 }}>불러오는 중...</div>
              ) : (
                <table className="wh-table">
                  <thead className="wh-table-head">
                    <tr>
                      <th className="wh-th">
                        <input type="checkbox" className="wh-checkbox" disabled />
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
                          <input type="checkbox" className="wh-checkbox" disabled />
                        </td>
                        <td className="wh-td">
                          <div>
                            <div className="wh-product-name">{item.name}</div>
                            <div className="wh-product-code">{item.code}</div>
                          </div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-quantity-container">
                            <div className={`wh-quantity ${isDeliveryReady(item) ? 'wh-quantity-full' : item.quantity === 0 ? 'wh-quantity-empty' : ''}`}>
                              {item.quantity}개 / {item.limit ?? 100}개
                              {isDeliveryReady(item) && (
                                <span className="wh-delivery-badge">납품가능</span>
                              )}
                            </div>
                            <div className="wh-quantity-bar">
                              <div 
                                className={`wh-quantity-fill ${isDeliveryReady(item) ? 'wh-fill-full' : item.quantity === 0 ? 'wh-fill-empty' : ''}`}
                                style={{ width: `${Math.min(((item.quantity || 0) / (item.limit || 100)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-location">{item.location}</div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-date">{item.inDate}</div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-date">{item.outDate ?? '-'}</div>
                        </td>
                        <td className="wh-td">
                          <div className="wh-note">{item.note}</div>
                        </td>
                        <td className="wh-td">
                          <button 
                            onClick={() => handleDelivery(item.id)}
                            disabled={!isDeliveryReady(item)}
                            className={`wh-delivery-btn ${isDeliveryReady(item) ? 'wh-delivery-ready' : 'wh-delivery-disabled'}`}
                            title={isDeliveryReady(item) ? "납품하기" : `수량이 ${item.limit ?? 100}개 이상 되어야 납품 가능합니다`}
                          >
                            <Package className="wh-delivery-icon" />
                            납품하기
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

            {/* 페이지네이션(디자인 유지용 더미) */}
            <div className="wh-pagination">
              <div className="wh-pagination-buttons">
                <button className="wh-page-btn" disabled>이전</button>
                <button className="wh-page-btn wh-page-btn-active">1</button>
                <button className="wh-page-btn" disabled>다음</button>
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

      {/* 상품 추가 모달 */}
      {showAdd && (
        <div className="wh-modal-overlay" role="dialog" aria-modal="true" aria-label="상품 추가">
          <div className="wh-modal">
            <div className="wh-modal-header">
              <h3 className="wh-modal-title">상품 추가</h3>
              <button onClick={() => setShowAdd(false)} className="wh-modal-close" aria-label="닫기">
                <X className="wh-close-icon" />
              </button>
            </div>

            <div className="wh-modal-content">
              <div className="wh-form">
                {/* 제품명, 코드 */}
                <div className="wh-form-row-group">
                  <div className="wh-form-row">
                    <label>제품명</label>
                    <input
                      value={newItem.name}
                      onChange={e => setNewItem(s => ({...s, name: e.target.value}))}
                      placeholder="제품명을 입력하세요"
                    />
                  </div>
                  <div className="wh-form-row">
                    <label>코드</label>
                    <input
                      value={newItem.code}
                      onChange={e => setNewItem(s => ({...s, code: e.target.value}))}
                      placeholder="상품 코드"
                    />
                  </div>
                </div>

                {/* 수량, 위치 */}
                <div className="wh-form-row-group">
                  <div className="wh-form-row">
                    <label>수량</label>
                    <input
                      type="number"
                      min="0"
                      value={newItem.quantity}
                      onChange={e => setNewItem(s => ({...s, quantity: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                  <div className="wh-form-row">
                    <label>위치</label>
                    <input
                      value={newItem.location}
                      onChange={e => setNewItem(s => ({...s, location: e.target.value}))}
                      placeholder="A-01-01"
                    />
                  </div>
                </div>

                {/* 입고일, 분류, 상품구분 */}
                <div className="wh-form-row-group">
                  <div className="wh-form-row">
                    <label>입고일</label>
                    <input
                      type="date"
                      value={newItem.inDate}
                      onChange={e => setNewItem(s => ({...s, inDate: e.target.value}))}
                    />
                  </div>
                  <div className="wh-form-row">
                    <label>분류</label>
                    <select
                      value={newItem.category}
                      onChange={e => setNewItem(s => ({...s, category: e.target.value}))}
                    >
                      <option>바나나맛</option>
                      <option>딸기맛</option>
                      <option>멜론맛</option>
                    </select>
                  </div>
                  <div className="wh-form-row">
                    <label>상품구분</label>
                    <select
                      value={newItem.productType}
                      onChange={e => setNewItem(s => ({...s, productType: e.target.value}))}
                    >
                      <option>기본</option>
                      <option>세트</option>
                    </select>
                  </div>
                </div>

                {/* 비고 */}
                <div className="wh-form-row">
                  <label>비고</label>
                  <input
                    value={newItem.note}
                    onChange={e => setNewItem(s => ({...s, note: e.target.value}))}
                    placeholder="추가 메모사항"
                  />
                </div>
                
                {/* 모달 버튼들 */}
                <div className="wh-form-buttons">
                  <button onClick={() => setShowAdd(false)} className="wh-btn wh-btn-cancel">
                    취소
                  </button>
                  <button onClick={handleCreate} className="wh-btn wh-btn-primary">
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ✅ 납품 한도 모달 */}
      {showLimitModal && (
        <div className="wh-modal-overlay">
          <div className="wh-modal">
            <div className="wh-modal-header">
              <h4 className="wh-modal-title">제품별 납품 한도 설정</h4>
              <button onClick={() => setShowLimitModal(false)} className="wh-modal-close"><X /></button>
            </div>
            <div className="wh-modal-content">
              {inventoryData.map(item => (
                <div key={item.id} className="wh-form-row">
                  <label>{item.name} ({item.code})</label>
                  <input
                    type="number"
                    min="1"
                    value={editingLimits[item.id] ?? (item.limit ?? 100)}
                    onChange={e =>
                      setEditingLimits(prev => ({
                        ...prev,
                        [item.id]: parseInt(e.target.value, 10) || 1
                      }))
                    }
                  />
                </div>
              ))}
              <div className="wh-form-buttons">
                <button onClick={() => setShowLimitModal(false)} className="wh-btn wh-btn-cancel">취소</button>
                <button onClick={saveLimits} className="wh-btn wh-btn-primary">저장</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 한도 설정 버튼은 사이드바에 있음 */}
    </div>
  );
};

export default WarehousePage;
