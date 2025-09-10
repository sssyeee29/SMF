// src/components/WarehousePage.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ArrowLeft, Search, Plus, X, Package } from 'lucide-react';
import './WarehousePage.css';

// ⬇️ 서버 연동 서비스
import {
  fetchInventory,
  createItem,
  deliverItem,
  updateLimit, // ✅ 추가: 한도 변경 API
} from '../services/warehouseService';

// ⬇️ 3D 미니맵
import Warehouse3D from './Warehouse3D';

// 서버와 연동할지 여부 (true면 로컬 더미데이터 사용)
const USE_LOCAL_DATA = false;

// 🔁 UI ↔ 서버 파라미터 매핑
const statusMap = { '전체': '', '납품준비': 'READY', '납품완료': 'DONE' };
const productTypeMap = { '전체': '', '기본': 'BASIC', '세트': 'SET' };
const categoryMap = { '전체': '', '바나나맛': 'BANANA', '딸기맛': 'STRAWBERRY', '멜론맛': 'MELON' };
const regDaysMap = { '전체': null, '오늘': 0, '3일': 3, '7일': 7, '1개월': 30 };

// (로컬 모드 전용) 목데이터
const LOCAL_DATA = [
  { id: 1, name: '바나나맛 우유', code: 'BAN001', quantity: 70, limit: 100, location: 'A-01-01', inDate: '2025-01-15', outDate: '-', note: '신선도 우수', category: '바나나맛', productType: '기본', status: 'READY' },
  { id: 2, name: '딸기맛 우유', code: 'STR002', quantity: 100, limit: 100, location: 'A-02-03', inDate: '2025-01-20', outDate: '-', note: '인기 상품', category: '딸기맛', productType: '기본', status: 'READY' },
  { id: 3, name: '멜론맛 우유', code: 'MLK003', quantity: 80, limit: 100, location: 'B-01-05', inDate: '2025-01-18', outDate: '-', note: '냉장보관', category: '멜론맛', productType: '세트', status: 'READY' },
];

// ✅ 납품 준비 여부: DONE은 제외
const isDeliveryReady = (item) =>
  item?.status !== 'DONE' && (Number(item?.quantity) || 0) >= (Number(item?.limit) || 100);

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

  // ✅ 화면에서 사용할 "활성 상자"(DONE 제외)
  const activeItems = useMemo(
    () => inventoryData.filter(it => (it.status ?? 'READY') !== 'DONE'),
    [inventoryData]
  );

  // 좌측 통계 차트(✅ DONE 제외)
  const chartData = useMemo(
    () => activeItems.map(item => ({ name: item.name, quantity: Number(item.quantity) || 0, limit: Number(item.limit) || 100 })),
    [activeItems]
  );

  // ========== [추가] 섹션별 개수 집계 (DONE 제외, DB 연동 데이터 기준) ==========
  const getSectionKey = (loc) => {
    if (!loc) return 'A';
    let s = String(loc).trim();
    if (/^불량/.test(s)) return 'D'; // '불량...' → D
    const m = s.match(/^([A-Za-z])\s*-\s*\d+\s*-\s*\d+/);
    return (m ? m[1] : 'A').toUpperCase();
  };

  const sectionCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    activeItems.forEach((it) => {
      const key = getSectionKey(it.location);
      if (counts[key] != null) counts[key] += 1;
    });
    return counts;
  }, [activeItems]);

  // 창고 구역(섹션별 실시간 개수 반영)
  const warehouseLayout = [
    { key: 'A', section: 'A구역', items: sectionCounts.A, color: 'wh-section-blue', camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { key: 'B', section: 'B구역', items: sectionCounts.B, color: 'wh-section-green', camera: 'https://www.w3schools.com/html/movie.mp4' },
    { key: 'C', section: 'C구역', items: sectionCounts.C, color: 'wh-section-yellow', camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { key: 'D', section: '불량구역', items: sectionCounts.D, color: 'wh-section-purple', camera: 'https://www.w3schools.com/html/movie.mp4' },
  ];

  // ========== 서버 목록 로딩 ==========
  const abortRef = useRef(null);

  const buildFiltersForServer = () => {
    const isCustom = registrationDate === '년월일 지정';
    return {
      page: 1,
      size: 9999,
      search: searchTerm.trim(),
      productType: productTypeMap[productType] ?? '',
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
      // limit/status 기본값 보정
      setInventoryData(
        items.map(it => ({
          ...it,
          limit: it.limit ?? 100,
          status: it.status ?? 'READY',
        }))
      );
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
      const keyword = searchTerm.toLowerCase();
      const filtered = LOCAL_DATA.filter(i => {
        const matchKeyword =
          !keyword || i.name.toLowerCase().includes(keyword) || i.code.toLowerCase().includes(keyword);
        const matchType = (productType === '전체' || i.productType === productType);
        const matchCat = (subCategory === '전체' || i.category === subCategory);
        const matchStatus =
          deliveryStatus === '전체' ||
          (deliveryStatus === '납품준비' && (i.status ?? 'READY') !== 'DONE') ||
          (deliveryStatus === '납품완료' && (i.status ?? 'READY') === 'DONE');
        return matchKeyword && matchType && matchCat && matchStatus;
      });
      setInventoryData(filtered.map(it => ({ ...it, status: it.status ?? 'READY', limit: it.limit ?? 100 })));
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
      // ✅ 수량 유지 + 상태만 DONE + outDate 기록
      setInventoryData(list =>
        list.map(it => it.id === itemId ? { ...it, status: 'DONE', outDate: today } : it)
      );
      return;
    }

    try {
      setLoading(true);
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
        status: 'READY',
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
    // ✅ DONE 제외
    inventoryData
      .filter(it => (it.status ?? 'READY') !== 'DONE')
      .forEach(item => { limits[item.id] = item.limit ?? 100; });
    setEditingLimits(limits);
    setShowLimitModal(true);
  };

  // ✅ 서버에 한도 저장 → 재조회
  const saveLimits = async () => {
    if (USE_LOCAL_DATA) {
      setInventoryData(prev =>
        prev.map(item => ({ ...item, limit: editingLimits[item.id] || 100 }))
      );
      setShowLimitModal(false);
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        Object.entries(editingLimits).map(([id, limit]) =>
          updateLimit(Number(id), Number(limit))
        )
      );
      await loadFromServer();
    } catch (e) {
      console.error('한도 업데이트 실패', e);
      alert('한도 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
      setShowLimitModal(false);
    }
  };

  // ✅ 상단 요약(모두 DONE 제외 기준)
  const totalQty = useMemo(
    () => activeItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [activeItems]
  );
  // ✅ 상자 갯수: READY 상태(납품 대기/진행 중)만 카운트
  const boxCount = useMemo(
    () => inventoryData.filter(item => (item.status ?? 'READY') === 'READY').length,
    [inventoryData]
  );
  // 납품완료 갯수: status === 'DONE'
  const doneCount = useMemo(
    () => inventoryData.filter(item => (item.status ?? 'READY') === 'DONE').length,
    [inventoryData]
  );
  const readyForDeliveryCount = useMemo(
    () => activeItems.filter(item => isDeliveryReady(item)).length,
    [activeItems]
  );

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
          {/* 재고 현황 통계 (✅ DONE 제외 데이터 사용) */}
          <div className="wh-statistics">
            <h3 className="wh-section-title">재고 현황 통계</h3>
            <div className="wh-chart-container">
              {chartData.map((item, index) => {
                const limit = chartData[index]?.limit ?? 100;
                const ratio = Math.min((item.quantity / limit) * 100, 100);
                return (
                  <div key={index} className="wh-chart-item">
                    <div className="wh-chart-info">
                      <span className="wh-chart-name">{item.name}</span>
                      <span className={`wh-chart-quantity ${item.quantity >= limit ? 'wh-quantity-full' : ''}`}>
                        {item.quantity}개 / {limit}개
                      </span>
                    </div>
                    <div className="wh-progress-bar">
                      <div
                        className={`wh-progress-fill ${item.quantity >= limit ? 'wh-quantity-full' : ''}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {chartData.length === 0 && (
                <div className="wh-empty-hint">표시할 활성 재고가 없습니다. (납품완료 제외)</div>
              )}
            </div>
          </div>

          {/* 창고 구역 (섹션별 실시간 개수) */}
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
                    <input type="date" className="wh-date-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    <span className="wh-date-separator">~</span>
                    <input type="date" className="wh-date-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    <button className="wh-btn wh-btn-apply" onClick={handleSearch}>적용</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 상단 요약 통계 (✅ DONE 제외 기준) */}
          <div className="wh-summary-stats">
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-blue">{totalQty}</div>
              <div className="wh-stat-label">총 재고</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-green">{boxCount}</div>
              <div className="wh-stat-label">상자 갯수</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-orange">{doneCount}</div>
              <div className="wh-stat-label">납품 완료</div>
            </div>

            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-red">{readyForDeliveryCount}</div>
              <div className="wh-stat-label">납품 가능</div>
            </div>
          </div>

          {/* 3D 창고 미니맵 (✅ DONE 제외 데이터만 전달) */}
          <div style={{ margin: '12px 0' }}>
            <Warehouse3D
              data={activeItems}
              getThreshold={(item) => Number(item.limit) || 100}
              onSelect={(item) => {
                console.log('picked:', item);
              }}
              style={{ height: 360 }}
            />
          </div>

          {/* 메인 테이블 영역 (📌 테이블은 전체 보여줌: DONE 포함) */}
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
                            <div
                              className={`wh-quantity ${item.status === 'DONE'
                                ? 'wh-quantity-done'
                                : isDeliveryReady(item)
                                  ? 'wh-quantity-full'
                                  : item.quantity === 0
                                    ? 'wh-quantity-empty'
                                    : ''
                                }`}
                            >
                              {item.quantity}개 / {item.limit ?? 100}개
                              {item.status === 'DONE' && (
                                <span className="wh-status-done">납품완료</span>
                              )}
                              {item.status !== 'DONE' && isDeliveryReady(item) && (
                                <span className="wh-delivery-badge">납품가능</span>
                              )}
                            </div>
                            <div className="wh-quantity-bar">
                              <div
                                className={`wh-quantity-fill ${item.status === 'DONE'
                                  ? 'wh-fill-done'
                                  : isDeliveryReady(item)
                                    ? 'wh-fill-full'
                                    : item.quantity === 0
                                      ? 'wh-fill-empty'
                                      : ''
                                  }`}
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
                            disabled={item.status === 'DONE' || !isDeliveryReady(item)}
                            className={`wh-delivery-btn ${item.status === 'DONE'
                              ? 'wh-delivery-done'
                              : isDeliveryReady(item)
                                ? 'wh-delivery-ready'
                                : 'wh-delivery-disabled'
                              }`}
                            title={
                              item.status === 'DONE'
                                ? '이미 납품완료된 상자입니다'
                                : isDeliveryReady(item)
                                  ? '납품하기'
                                  : `수량이 ${item.limit ?? 100}개 이상 되어야 납품 가능합니다`
                            }
                          >
                            <Package className="wh-delivery-icon" />
                            {item.status === 'DONE' ? '완료됨' : '납품하기'}
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
                      onChange={e => setNewItem(s => ({ ...s, name: e.target.value }))}
                      placeholder="제품명을 입력하세요"
                    />
                  </div>
                  <div className="wh-form-row">
                    <label>코드</label>
                    <input
                      value={newItem.code}
                      onChange={e => setNewItem(s => ({ ...s, code: e.target.value }))}
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
                      onChange={e => setNewItem(s => ({ ...s, quantity: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="wh-form-row">
                    <label>위치</label>
                    <input
                      value={newItem.location}
                      onChange={e => setNewItem(s => ({ ...s, location: e.target.value }))}
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
                      onChange={e => setNewItem(s => ({ ...s, inDate: e.target.value }))}
                    />
                  </div>
                  <div className="wh-form-row">
                    <label>분류</label>
                    <select
                      value={newItem.category}
                      onChange={e => setNewItem(s => ({ ...s, category: e.target.value }))}
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
                      onChange={e => setNewItem(s => ({ ...s, productType: e.target.value }))}
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
                    onChange={e => setNewItem(s => ({ ...s, note: e.target.value }))}
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
              {/* ✅ DONE 제외한 목록 사용 */}
              {inventoryData
                .filter(it => (it.status ?? 'READY') !== 'DONE')
                .map(item => (
                  <div key={item.id} className="wh-form-row">
                    <label>
                      {item.name} ({item.code})
                      {item.location ? <> &nbsp;[ {item.location} ]</> : null}
                    </label>
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

              {/* ✅ 전부 DONE이면 안내 */}
              {inventoryData.every(it => (it.status ?? 'READY') === 'DONE') && (
                <div style={{ color: '#888', padding: '8px 0' }}>
                  표시할 활성 재고가 없습니다. (납품완료 제외)
                </div>
              )}

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
