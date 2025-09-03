// src/components/WarehousePage.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { ArrowLeft, Search, Plus, X, Trash2, Package } from 'lucide-react';
import './WarehousePage.css';
import {
  fetchInventory,
  deleteItem as apiDeleteItem,
  deliverItem,
  createItem,
} from '../services/warehouseService';

// ⬇️ 3D 창고 임포트
import Warehouse3D from './Warehouse3D';

// 서버 연동이면 false
const USE_LOCAL_DATA = false;

// UI ↔ 서버 값 매핑
const statusMap = { '전체': '', '납품준비': 'READY', '납품완료': 'DONE' };
const productTypeMap = { '전체': '', '기본': 'BASIC', '세트': 'SET' };
const categoryMap = { '전체': '', '바나나맛': 'BANANA', '딸기맛': 'STRAWBERRY', '멜론맛': 'MELON' };
const regDaysMap = { '전체': null, '오늘': 0, '3일': 3, '7일': 7, '1개월': 30 };

// (로컬 모드 전용) 목데이터
const LOCAL_DATA = [
  { id: 1, name: '바나나맛 우유', code: 'BAN001', quantity: 70,  location: 'A-01-01', inDate: '2025-01-15', outDate: '-', note: '신선도 우수', category: '바나나맛', productType: '기본', status: '납품준비' },
  { id: 2, name: '딸기맛 우유',   code: 'STR002', quantity: 100, location: 'A-02-03', inDate: '2025-01-20', outDate: '-', note: '인기 상품',   category: '딸기맛',   productType: '기본', status: '납품준비' },
  { id: 3, name: '멜론맛 우유',   code: 'MLK003', quantity: 80,  location: 'B-01-05', inDate: '2025-01-18', outDate: '-', note: '냉장보관',   category: '멜론맛',   productType: '세트', status: '납품준비' },
];

// 공통 상수/유틸
const DELIVER_THRESHOLD = 100;
const toNumber = (q) => (typeof q === 'number' ? q : parseInt(String(q).replace(/[^\d.-]/g, ''), 10) || 0);
const isDeliveryReady = (q) => toNumber(q) >= DELIVER_THRESHOLD;

// ▶ 섹션 → 카메라 스트림 매핑 (3D 상단 패널에서 사용)
const camMap = {
  A: 'https://www.w3schools.com/html/mov_bbb.mp4',
  B: 'https://www.w3schools.com/html/movie.mp4',
  C: 'https://www.w3schools.com/html/mov_bbb.mp4',
  D: 'https://www.w3schools.com/html/movie.mp4', // 불량구역
};

const WarehousePage = ({ setCurrentPage, username, handleLogout }) => {
  // 🔎 검색/필터 입력 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [productType, setProductType] = useState('전체');
  const [subCategory, setSubCategory] = useState('전체');
  const [registrationDate, setRegistrationDate] = useState('전체');
  const [deliveryStatus, setDeliveryStatus] = useState('전체');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // 📷 카메라 모달
  const [showCamera, setShowCamera] = useState(null);

  // ➕ 상품 추가 모달/폼
  const [showAdd, setShowAdd] = useState(false);
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

  // 📄 데이터/페이징/로딩
  const [inventoryData, setInventoryData] = useState(USE_LOCAL_DATA ? LOCAL_DATA : []);
  const [page, setPage] = useState(1); // 1-base
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(USE_LOCAL_DATA ? LOCAL_DATA.length : 0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 선택/일괄삭제
  const [selectedIds, setSelectedIds] = useState([]);
  const allChecked = inventoryData.length > 0 && selectedIds.length === inventoryData.length;

  // 🔁 확정된 필터
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    productType: '',
    category: '',
    status: '',
    regDays: null,
    from: null,
    to: null,
  });

  // 좌측 차트: 현재 테이블 데이터 기반
  const chartData = inventoryData.map((item) => ({ name: item.name, quantity: toNumber(item.quantity) }));

  // 창고 구역(예시)
  const warehouseLayout = [
    { section: 'A구역', items: 8,  color: 'wh-section-blue',   camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { section: 'B구역', items: 5,  color: 'wh-section-green',  camera: 'https://www.w3schools.com/html/movie.mp4' },
    { section: 'C구역', items: 3,  color: 'wh-section-yellow', camera: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { section: '불량구역', items: 12, color: 'wh-section-purple', camera: 'https://www.w3schools.com/html/movie.mp4' },
  ];

  const totalQuantity = useMemo(() => inventoryData.reduce((s, i) => s + (toNumber(i.quantity) ?? 0), 0), [inventoryData]);

  // 🔍 검색 버튼 → 필터 확정 & 1페이지
  const applySearch = () => {
    setPage(1);
    setSelectedIds([]);
    const isCustom = registrationDate === '년월일 지정';
    setAppliedFilters({
      search: searchTerm.trim(),
      productType: productTypeMap[productType] ?? '',
      category: categoryMap[subCategory] ?? '',
      status: statusMap[deliveryStatus] ?? '',
      regDays: isCustom ? null : (regDaysMap[registrationDate] ?? null),
      from: isCustom && fromDate ? fromDate : null,
      to: isCustom && toDate ? toDate : null,
    });
  };

  // ========== 서버 모드: 요청 취소 지원 ==========
  const abortRef = useRef(null);
  const loadListFromServer = useCallback(async () => {
    if (USE_LOCAL_DATA) return;
    setLoading(true);
    setErrorMsg('');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { items, total: t, page: p } = await fetchInventory(
        { page, size, ...appliedFilters },
        { signal: controller.signal }
      );
      setInventoryData(items);
      setTotal(t);
      setPage(p);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('목록 조회 실패:', e);
        setErrorMsg('재고 목록을 불러오지 못했습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, size, appliedFilters]);

  // ========== 로컬 모드: 필터/페이징 ==========
  const filterLocal = useCallback(() => {
    let data = [...LOCAL_DATA].filter((i) => {
      const keyword = appliedFilters.search?.toLowerCase() ?? '';
      const textHit =
        !keyword ||
        i.name.toLowerCase().includes(keyword) ||
        i.code.toLowerCase().includes(keyword);
      const typeHit = !appliedFilters.productType || productTypeMap[i.productType] === appliedFilters.productType;
      const catHit  = !appliedFilters.category || categoryMap[i.category] === appliedFilters.category;
      const statHit = !appliedFilters.status || statusMap[i.status] === appliedFilters.status;
      return textHit && typeHit && catHit && statHit;
    });

    // 등록일(간단히 inDate 기준)
    const toNumDate = (d) => (d ? d.replaceAll('-', '') * 1 : 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (appliedFilters.regDays !== null && appliedFilters.regDays !== undefined) {
      const base = new Date();
      base.setDate(base.getDate() - appliedFilters.regDays);
      const from = base.toISOString().slice(0, 10);
      data = data.filter((i) => !i.inDate || (i.inDate >= from && i.inDate <= todayStr));
    }
    if (appliedFilters.from && appliedFilters.to) {
      data = data.filter(
        (i) => !i.inDate || (toNumDate(i.inDate) >= toNumDate(appliedFilters.from) && toNumDate(i.inDate) <= toNumDate(appliedFilters.to))
      );
    }

    // 페이징
    const t = data.length;
    const start = (page - 1) * size;
    const items = data.slice(start, start + size);

    setInventoryData(items);
    setTotal(t);
  }, [appliedFilters, page, size]);

  // 공통 로딩 훅
  useEffect(() => {
    if (USE_LOCAL_DATA) {
      filterLocal();
    } else {
      loadListFromServer();
      return () => abortRef.current?.abort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, appliedFilters]);

  // 📨 납품 처리 (수량에서 100 차감, 최소 0; 출고일 = 오늘)
  const handleDelivery = async (itemId) => {
    const today = new Date().toISOString().split('T')[0];
    const target = inventoryData.find((i) => String(i.id) === String(itemId));
    if (!target || !isDeliveryReady(target.quantity)) return;

    if (!window.confirm(`${target.name} (${target.code})을 납품하시겠습니까?`)) return;

    const curQ = toNumber(target.quantity);
    const newQ = Math.max(0, curQ - DELIVER_THRESHOLD);

    if (USE_LOCAL_DATA) {
      setInventoryData((list) =>
        list.map((i) =>
          String(i.id) === String(itemId)
            ? { ...i, quantity: newQ, outDate: today, status: newQ === 0 ? '납품완료' : (i.status || '납품준비') }
            : i
        )
      );
      const idx = LOCAL_DATA.findIndex((i) => String(i.id) === String(itemId));
      if (idx >= 0) {
        LOCAL_DATA[idx] = {
          ...LOCAL_DATA[idx],
          quantity: newQ,
          outDate: today,
          status: newQ === 0 ? '납품완료' : (LOCAL_DATA[idx].status || '납품준비'),
        };
      }
    } else {
      try {
        setLoading(true);
        await deliverItem(itemId, DELIVER_THRESHOLD);
        await loadListFromServer();
      } catch (e) {
        console.error('납품 처리 실패:', e);
        alert('납품 처리에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 🧹 선택/전체 선택/일괄 삭제
  const toggleRow = (id) =>
    setSelectedIds((sel) => (sel.includes(id) ? sel.filter((v) => v !== id) : [...sel, id]));
  const toggleAll = () =>
    setSelectedIds(allChecked ? [] : inventoryData.map((i) => i.id));

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return alert('선택된 항목이 없습니다.');
    if (!window.confirm(`${selectedIds.length}개 항목을 삭제하시겠습니까?`)) return;

    if (USE_LOCAL_DATA) {
      const idSet = new Set(selectedIds.map(String));
      setInventoryData((list) => list.filter((i) => !idSet.has(String(i.id))));
      for (const id of selectedIds) {
        const idx = LOCAL_DATA.findIndex((i) => String(i.id) === String(id));
        if (idx >= 0) LOCAL_DATA.splice(idx, 1);
      }
      setSelectedIds([]);
      const willBeTotal = Math.max(0, total - selectedIds.length);
      const lastPage = Math.max(1, Math.ceil(willBeTotal / size));
      if (page > lastPage) setPage(lastPage);
      else filterLocal();
    } else {
      try {
        setLoading(true);
        await Promise.all(selectedIds.map((id) => apiDeleteItem(id)));
        setSelectedIds([]);
        await loadListFromServer();
      } catch (e) {
        console.error('일괄 삭제 실패:', e);
        alert('일괄 삭제에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // ➕ 상품 추가 저장
  const handleCreate = async () => {
    if (!newItem.name || !newItem.code) {
      alert('제품명과 코드는 필수입니다.');
      return;
    }

    if (USE_LOCAL_DATA) {
      const nextId = Math.max(0, ...LOCAL_DATA.map(i => +i.id || 0)) + 1;
      const row = {
        id: nextId,
        name: newItem.name,
        code: newItem.code,
        quantity: Number(newItem.quantity) || 0,
        location: newItem.location || '-',
        inDate: newItem.inDate || new Date().toISOString().slice(0,10),
        outDate: '-',
        note: newItem.note || '-',
        category: newItem.category,
        productType: newItem.productType,
        status: '납품준비',
      };
      LOCAL_DATA.unshift(row);
      setInventoryData(prev => [row, ...prev]);
      setTotal(t => t + 1);
    } else {
      try {
        setLoading(true);
        await createItem({
          name: newItem.name,
          code: newItem.code,
          quantity: Number(newItem.quantity) || 0,
          location: newItem.location || '-',
          inDate: newItem.inDate || new Date().toISOString().slice(0,10),
          note: newItem.note || '-',
          // 서버가 영문 enum이라면 매핑 필요
          category: categoryMap[newItem.category] || '',
          productType: productTypeMap[newItem.productType] || '',
        });
        await loadListFromServer();
      } catch (e) {
        console.error(e);
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

  // ⏭️ 페이지네이션
  const totalPages = Math.max(1, Math.ceil(total / size));
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="wh-container">
      {/* 헤더 */}
      <div className="wh-header">
        <div className="wh-header-left">
          <button onClick={() => setCurrentPage('home')} className="wh-back-btn" aria-label="뒤로가기">
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
              {chartData.map((item, index) => {
                const pct = Math.min(100, Math.max(0, Math.round((toNumber(item.quantity) / DELIVER_THRESHOLD) * 100)));
                return (
                  <div key={index} className="wh-chart-item">
                    <div className="wh-chart-info">
                      <span className="wh-chart-name">{item.name}</span>
                      <span className={`wh-chart-quantity ${isDeliveryReady(item.quantity) ? 'wh-quantity-full' : ''}`}>
                        {toNumber(item.quantity)}개
                      </span>
                    </div>
                    <div className="wh-progress-bar" role="progressbar" aria-valuenow={pct}>
                      <div className={`wh-progress-fill ${pct === 100 ? 'wh-progress-full' : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
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
                  aria-label={`${sec.section} 카메라 열기`}
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
          {/* ⬇️ 3D 창고 미니맵 */}
          <div className="wh-3d-box">
            <Warehouse3D
              data={inventoryData}
              threshold={DELIVER_THRESHOLD}
              getCameraStream={(section) => camMap[section]}
              onSelect={(item) => console.log('picked:', item)}
              style={{ height: 560 }}
            />
          </div>

          {/* 검색 및 필터 */}
          <div className="wh-filter-container">
            <div className="wh-filter-row">
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
                    aria-label="상품명 또는 코드 검색"
                    onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                  />
                </div>
              </div>

              <div className="wh-filter-group">
                <span className="wh-filter-label">상품구분</span>
                <select value={productType} onChange={(e) => setProductType(e.target.value)} className="wh-filter-select wh-select-small">
                  <option>전체</option>
                  <option>기본</option>
                  <option>세트</option>
                </select>
              </div>

              <div className="wh-filter-group">
                <span className="wh-filter-label">분류</span>
                <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="wh-filter-select wh-select-medium">
                  <option>전체</option>
                  <option>바나나맛</option>
                  <option>딸기맛</option>
                  <option>멜론맛</option>
                </select>
              </div>

              <div className="wh-filter-group">
                <span className="wh-filter-label">등록일</span>
                <select value={registrationDate} onChange={(e) => setRegistrationDate(e.target.value)} className="wh-filter-select wh-select-medium">
                  <option>전체</option>
                  <option>오늘</option>
                  <option>3일</option>
                  <option>7일</option>
                  <option>1개월</option>
                  <option>년월일 지정</option>
                </select>
              </div>

              <div className="wh-filter-group">
                <span className="wh-filter-label">납품상태</span>
                <select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)} className="wh-filter-select wh-select-small">
                  <option>전체</option>
                  <option>납품준비</option>
                  <option>납품완료</option>
                </select>
              </div>

              {/* 버튼 */}
              <button
                className="wh-btn wh-btn-primary"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="wh-btn-icon" />
                상품추가
              </button>
              <button className="wh-btn wh-btn-secondary" onClick={applySearch}>
                검색
              </button>
            </div>

            {registrationDate === '년월일 지정' && (
              <div className="wh-date-range">
                <div className="wh-date-group">
                  <span className="wh-filter-label">기간 설정</span>
                  <div className="wh-date-inputs">
                    <input type="date" className="wh-date-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    <span className="wh-date-separator">~</span>
                    <input type="date" className="wh-date-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    <button className="wh-btn wh-btn-apply" onClick={applySearch}>적용</button>
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
              <div className="wh-stat-number wh-stat-orange">{inventoryData.filter((i) => toNumber(i.quantity) > 0).length}</div>
              <div className="wh-stat-label">재고 제품</div>
            </div>
            <div className="wh-stat-item">
              <div className="wh-stat-number wh-stat-red">{inventoryData.filter((i) => isDeliveryReady(i.quantity)).length}</div>
              <div className="wh-stat-label">납품 대기</div>
            </div>
          </div>

          {/* 메인 테이블 */}
          <div className="wh-table-container">
            <div className="wh-table-header">
              <h2 className="wh-table-title">재고 목록</h2>
              <div className="wh-table-actions">
                <button className="wh-btn wh-btn-danger" onClick={handleBulkDelete} disabled={selectedIds.length === 0}>
                  <Trash2 className="wh-btn-icon" />
                  선택삭제
                </button>
              </div>
              <div className="wh-table-count">총 {total}개 상품</div>
            </div>

            <div className="wh-table-wrapper">
              {loading ? (
                <div className="wh-loading">불러오는 중...</div>
              ) : errorMsg ? (
                <div className="wh-error">{errorMsg}</div>
              ) : (
                <table className="wh-table">
                  <thead className="wh-table-head">
                    <tr>
                      <th className="wh-th">
                        <input type="checkbox" className="wh-checkbox" checked={allChecked} onChange={toggleAll} aria-label="전체 선택" />
                      </th>
                      <th className="wh-th" scope="col">제품명/코드</th>
                      <th className="wh-th" scope="col">수량</th>
                      <th className="wh-th" scope="col">위치</th>
                      <th className="wh-th" scope="col">입고일</th>
                      <th className="wh-th" scope="col">출고일</th>
                      <th className="wh-th" scope="col">비고</th>
                      <th className="wh-th" scope="col">작업</th>
                    </tr>
                  </thead>

                  <tbody className="wh-table-body">
                    {inventoryData.map((item) => {
                      const q = toNumber(item.quantity);
                      const pct = Math.min(100, Math.max(0, Math.round((q / DELIVER_THRESHOLD) * 100)));
                      const ready = isDeliveryReady(q);
                      return (
                        <tr key={item.id} className="wh-table-row">
                          <td className="wh-td">
                            <input
                              type="checkbox"
                              className="wh-checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleRow(item.id)}
                              aria-label={`${item.name} 선택`}
                            />
                          </td>
                          <td className="wh-td">
                            <div>
                              <div className="wh-product-name">{item.name}</div>
                              <div className="wh-product-code">{item.code}</div>
                            </div>
                          </td>
                          <td className="wh-td">
                            <div className="wh-quantity-container">
                              <div className={`wh-quantity ${pct === 100 ? 'wh-quantity-full' : pct === 0 ? 'wh-quantity-empty' : ''}`}>
                                {q}개
                                {ready && <span className="wh-delivery-badge">납품가능</span>}
                              </div>
                              <div className="wh-quantity-bar">
                                <div className={`wh-quantity-fill ${pct === 100 ? 'wh-fill-full' : pct === 0 ? 'wh-fill-empty' : ''}`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="wh-td"><div className="wh-location">{item.location}</div></td>
                          <td className="wh-td"><div className="wh-date">{item.inDate ?? '-'}</div></td>
                          <td className="wh-td"><div className="wh-date">{item.outDate ?? '-'}</div></td>
                          <td className="wh-td"><div className="wh-note">{item.note ?? '-'}</div></td>
                          <td className="wh-td">
                            <button
                              onClick={() => handleDelivery(item.id)}
                              disabled={!ready}
                              className={`wh-delivery-btn ${ready ? 'wh-delivery-ready' : 'wh-delivery-disabled'}`}
                              title={ready ? '납품하기' : `수량이 ${DELIVER_THRESHOLD}개 이상이어야 납품 가능합니다`}
                              aria-label={ready ? `${item.name} 납품하기` : '납품 불가'}
                            >
                              <Package className="wh-delivery-icon" />
                              납품하기
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {inventoryData.length === 0 && !loading && !errorMsg && (
                      <tr>
                        <td className="wh-td" colSpan={8} style={{ textAlign: 'center' }}>데이터가 없습니다.</td>
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
                <button className="wh-page-btn" disabled={page <= 1} onClick={goPrev}>이전</button>
                <span className="wh-page-indicator">{page} / {totalPages}</span>
                <button className="wh-page-btn" disabled={page >= totalPages} onClick={goNext}>다음</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카메라 모달 */}
      {showCamera && (
        <div className="wh-modal-overlay" role="dialog" aria-modal="true" aria-label={`${showCamera.section} 카메라`}>
          <div className="wh-modal">
            <div className="wh-modal-header">
              <h3 className="wh-modal-title">{showCamera.section} 카메라</h3>
              <button onClick={() => setShowCamera(null)} className="wh-modal-close" aria-label="닫기">
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
                <div className="wh-form-row">
                  <label>제품명</label>
                  <input value={newItem.name} onChange={e=>setNewItem(s=>({...s,name:e.target.value}))} />
                </div>
                <div className="wh-form-row">
                  <label>코드</label>
                  <input value={newItem.code} onChange={e=>setNewItem(s=>({...s,code:e.target.value}))} />
                </div>
                <div className="wh-form-row">
                  <label>수량</label>
                  <input type="number" min="0" value={newItem.quantity} onChange={e=>setNewItem(s=>({...s,quantity:e.target.value}))} />
                </div>
                <div className="wh-form-row">
                  <label>위치</label>
                  <input value={newItem.location} onChange={e=>setNewItem(s=>({...s,location:e.target.value}))} />
                </div>
                <div className="wh-form-row">
                  <label>입고일</label>
                  <input type="date" value={newItem.inDate} onChange={e=>setNewItem(s=>({...s,inDate:e.target.value}))} />
                </div>
                <div className="wh-form-row">
                  <label>분류</label>
                  <select value={newItem.category} onChange={e=>setNewItem(s=>({...s,category:e.target.value}))}>
                    <option>바나나맛</option>
                    <option>딸기맛</option>
                    <option>멜론맛</option>
                  </select>
                </div>
                <div className="wh-form-row">
                  <label>상품구분</label>
                  <select value={newItem.productType} onChange={e=>setNewItem(s=>({...s,productType:e.target.value}))}>
                    <option>기본</option>
                    <option>세트</option>
                  </select>
                </div>
                <div className="wh-form-row">
                  <label>비고</label>
                  <input value={newItem.note} onChange={e=>setNewItem(s=>({...s,note:e.target.value}))} />
                </div>
              </div>
            </div>

            <div className="wh-modal-footer">
              <button className="wh-btn wh-btn-secondary" onClick={()=>setShowAdd(false)}>취소</button>
              <button className="wh-btn wh-btn-primary" onClick={handleCreate}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehousePage;
