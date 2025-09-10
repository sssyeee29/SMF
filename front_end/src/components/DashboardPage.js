import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios'; // 서버 연동을 위함 
import { ArrowLeft } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, PieChart, Pie, Cell, Legend } from 'recharts';

import './DashboardPage.css';


// 🔹 [추가] 프록시(package.json "proxy": "http://localhost:8080")가 있으니 상대경로로 호출하면 됨.
// 백엔드 period는 week/month/year 이므로, UI 값(daily/monthly/yearly)을 매핑
const mapPeriod = (uiPeriod) => {
    if (uiPeriod === 'daily') return 'week';   // UI에서 '주별'을 daily로 쓰고 있어서 week로 보냄
    if (uiPeriod === 'monthly') return 'month';
    if (uiPeriod === 'yearly') return 'year';
    return 'month';
};

// 🔹 [추가] 백엔드 DTO → 프론트 차트키로 변환
// G1: QualityTrendRow { period, normal, defect, defectRatePct }
const mapQuality = (rows = []) =>
    rows.map(r => ({
        date: r.period,      // X축에 쓸 라벨
        normal: r.normal,    // 정상 건수
        defective: r.defect, // 불량 건수
    }));

// G2: DeliveryComboRow { period, deliveredCount, deliveredQty }
const mapDelivery = (rows = []) =>
    rows.map(r => ({
        date: r.period,
        deliveryCount: r.deliveredCount,
        deliveryQuantity: r.deliveredQty,
    }));

// G3: DefectCauseRow { period, causeCode, defectCount, sharePct }
// causeCode별(세로형) 데이터를 period 한 줄로 묶어서 {lidDefect, bodyDefect}로 변환
const mapDefectCause = (rows = []) => {
    const m = new Map();
    rows.forEach(r => {
        const date = r.period;
        const code = (r.causeCode || '').trim().toUpperCase();
        const obj = m.get(date) || { date, lidDefect: 0, bodyDefect: 0 };

        if (code === 'DAMAGE-H') {
            obj.lidDefect += r.defectCount;
        } else if (code === 'DAMAGE-B') {
            obj.bodyDefect += r.defectCount;
        }

        m.set(date, obj);
    });
    return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
};

// G4: ProductDeliveryRow { period, productName, productCode, deliveredCount, deliveredQty }
// 제품별 행을 period별로 모아 도넛차트용 {banana, strawberry, melon} 형태로 변환
const mapProductDelivery = (rows = []) => {
    const m = new Map();
    rows.forEach(r => {
        const date = r.period;
        const name = (r.productName || '').trim().toLowerCase();
        const qty = r.deliveredQty ?? 0;
        const obj = m.get(date) || { date, banana: 0, strawberry: 0, melon: 0 };

        if (name.includes('banana')) obj.banana += qty;
        else if (name.includes('strawberry')) obj.strawberry += qty;
        else if (name.includes('melon')) obj.melon += qty;

        m.set(date, obj);
    });
    return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const DashboardPage = ({ setCurrentPage, handleLogout, username }) => {

    // const [data] = useState(generateSampleData());

    // 서버 데이터 상태를 따로 관리
    const [quality, setQuality] = useState([]);
    const [delivery, setDelivery] = useState([]);
    const [defectCause, setDefectCause] = useState([]);
    const [productDelivery, setProductDelivery] = useState([]);

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        chart1: { period: 'monthly', startDate, endDate: today },
        chart2: { period: 'monthly', startDate, endDate: today },
        chart3: { period: 'monthly', startDate, endDate: today, comparison: 'none' },
        chart4: { period: 'monthly', startDate, endDate: today }
    });

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const updateFilter = (chartId, filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [chartId]: {
                ...prev[chartId],
                [filterType]: value
            }
        }));
    };

    // 🔹 서버 호출 (startDate, endDate 포함)
const loadAll = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
        const p1 = axios.get('/api/dashboard/quality', {
            params: {
                period: mapPeriod(filters.chart1.period),
                startDate: filters.chart1.startDate,
                endDate: filters.chart1.endDate,
            }
        });
        const p2 = axios.get('/api/dashboard/delivery', {
            params: {
                period: mapPeriod(filters.chart2.period),
                startDate: filters.chart2.startDate,
                endDate: filters.chart2.endDate,
            }
        });
        const p3 = axios.get('/api/dashboard/defect-cause', {
            params: {
                period: mapPeriod(filters.chart3.period),
                startDate: filters.chart3.startDate,
                endDate: filters.chart3.endDate,
            }
        });
        const p4 = axios.get('/api/dashboard/product-delivery', {
            params: {
                period: mapPeriod(filters.chart4.period),
                startDate: filters.chart4.startDate,
                endDate: filters.chart4.endDate,
            }
        });

        const [r1, r2, r3, r4] = await Promise.all([p1, p2, p3, p4]);

        setQuality(mapQuality(r1.data));
        setDelivery(mapDelivery(r2.data));
        setDefectCause(mapDefectCause(r3.data));
        setProductDelivery(mapProductDelivery(r4.data));
    } catch (e) {
        console.error(e);
        setErr('대시보드 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
        setLoading(false);
    }
}, [filters]); // 필터값이 변경될 때마다 데이터 재호출

    // 🔹 [추가] 최초 마운트/필터 변경 시 서버 호출
    useEffect(() => { loadAll(); }, [loadAll]);

    const prepareAreaData = (data) => {
        if (data.length === 1) {
            const item = data[0];
            // 같은 값을 가진 두 점을 만들어 수평선 효과
            return [
                { ...item, date: item.date + '_start' },
                { ...item, date: item.date + '_end' }
            ];
        }
        return data;
    };

    const filterData = useCallback((chartId) => {
        // 서버에서 period 기준으로 이미 집계되어 오므로 그대로 사용 
        if (chartId === 'chart1') return quality;
        if (chartId === 'chart2') return delivery;
        if (chartId === 'chart3') return defectCause;
        if (chartId === 'chart4') return productDelivery;
        return [];
    }, [quality, delivery, defectCause, productDelivery]);


    const chart4Data = useMemo(() => {

        const filteredData = filterData('chart4');

        const totals = filteredData.reduce((acc, item) => {
            acc.banana += (item.banana ?? 0);
            acc.strawberry += (item.strawberry ?? 0);
            acc.melon += (item.melon ?? 0);
            return acc;
        }, { banana: 0, strawberry: 0, melon: 0 });

        return [
            { name: '바나나맛', value: totals.banana, color: '#FFD700' },
            { name: '딸기맛', value: totals.strawberry, color: '#FF6B6B' },
            { name: '메로나맛', value: totals.melon, color: '#4ECDC4' }
        ];
    }, [filterData]);

    const FilterComponent = ({ chartId, showComparison = false }) => (
        <div className="chart-filter-container">
            <div className="chart-filter-row">
                <select
                    value={filters[chartId].period}
                    onChange={(e) => updateFilter(chartId, 'period', e.target.value)}
                    className="chart-filter-select"
                >
                    <option value="daily">주별</option>
                    <option value="monthly">월별</option>
                    <option value="yearly">년별</option>
                </select>

                <input
                    type="date"
                    value={filters[chartId].startDate}
                    onChange={(e) => updateFilter(chartId, 'startDate', e.target.value)}
                    className="chart-filter-date"
                    max={today} // 시작 날짜 오늘 이전으로 제한
                />

                <input
                    type="date"
                    value={filters[chartId].endDate}
                    onChange={(e) => updateFilter(chartId, 'endDate', e.target.value)}
                    className="chart-filter-date"
                    disabled={!filters[chartId].startDate} // 마감 날짜는 시작 날짜가 있어야 활성화
                    min={filters[chartId].startDate} // 마감 날짜는 시작 날짜 이후만 선택 가능 
                    max={today} // 마감 날짜를 오늘 날짜로 제한
                />

                {showComparison && (
                    <select
                        value={filters[chartId].comparison}
                        onChange={(e) => updateFilter(chartId, 'comparison', e.target.value)}
                        className="chart-filter-select"
                    >
                        <option value="none">비교없음</option>
                        <option value="monthly">월별비교</option>
                    </select>
                )}
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* 헤더 */}
            <div className="dashboard-header">
                <div className="dashboard-header-left">
                    <button onClick={() => setCurrentPage('home')} className="dashboard-back-btn">
                        <ArrowLeft className="dashboard-icon" />
                    </button>
                    <h1 className="dashboard-title">대시보드 페이지</h1>
                </div>
                <div className="dashboard-header-right">
                    {username && <span className="dashboard-username">{username} 님</span>}
                    <button onClick={handleLogout} className="dashboard-logout-btn">로그아웃</button>
                </div>
            </div>

            <div className='dashboard-main-content'>
                <div className="charts-grid">
                    {/* 1번 그래프 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">정상/불량 건수</h3>
                            <FilterComponent chartId="chart1" />
                        </div>
                        <div className="chart-card-content">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={filterData('chart1')}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />

                                    <Bar dataKey="normal" fill="#4CAF50" name="정상" />
                                    <Bar dataKey="defective" fill="#FF5722" name="불량" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2번 그래프: 납품 현황 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">납품 현황</h3>
                            <FilterComponent chartId="chart2" />
                        </div>
                        <div className="chart-card-content">
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={filterData('chart2')}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="deliveryQuantity"
                                        fill="#2196F3"
                                        name="납품 수량"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="deliveryCount"
                                        stroke="#FF9800"
                                        strokeWidth={3}
                                        name="납품 건수"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3번 그래프: 불량 원인 분석 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">불량 원인 분석</h3>
                            <FilterComponent chartId="chart3" showComparison={true} />
                        </div>
                        <div className="chart-card-content">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={prepareAreaData(filterData('chart3'))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="lidDefect"
                                        stroke="#E91E63"
                                        fill="#E91E63"
                                        fillOpacity={0.2}
                                        name="뚜껑 불량"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="bodyDefect"
                                        stroke="#9C27B0"
                                        fill="#9C27B0"
                                        fillOpacity={0.2}
                                        name="데이지 불량"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>

                        </div>
                    </div>

                    {/* 4번 그래프 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">제품별 납품 현황</h3>
                            <FilterComponent chartId="chart4" />
                        </div>
                        <div className="chart-card-content">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chart4Data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={130}
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        {chart4Data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{
                                        transform: "translateY(20px)", // 살짝 내렸습니다.
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="chart-donut-legend">
                                {chart4Data.map((item, index) => (
                                    <div key={index} className="chart-legend-item">
                                        <div className="chart-legend-color" style={{ backgroundColor: item.color }}></div>
                                        <span>{item.name}: {item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
