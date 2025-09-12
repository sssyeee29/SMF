import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Line,
    ComposedChart,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

import './DashboardPage.css';

// ISO 주차, 월별, 년별을 한국어 형식으로 변환하는 통합 함수
const formatPeriodToKorean = (periodString) => {
    if (!periodString) {
        return '';
    }
    // 주별 (예: 2025-W36)
    if (periodString.includes('-W')) {
        const [year, weekStr] = periodString.split('-W');
        const week = parseInt(weekStr, 10);
        const yearInt = parseInt(year, 10);

        const date = new Date(yearInt, 0, 1 + (week - 1) * 7);
        const day = date.getDay();
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - day + (day === 0 ? -6 : 1));

        const month = weekStart.getMonth() + 1;
        let weekOfMonth = 0;
        let tempDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
        while (tempDate <= weekStart) {
            weekOfMonth++;
            tempDate.setDate(tempDate.getDate() + 7);
        }

        const weekName = ['', '첫째', '둘째', '셋째', '넷째', '다섯째'][weekOfMonth] || '';
        return `${yearInt}년 ${month}월 ${weekName} 주`;
    }
    // 월별 (예: 2025-09)
    else if (periodString.includes('-')) {
        const [year, month] = periodString.split('-');
        return `${year}년 ${parseInt(month, 10)}월`;
    }
    // 년별 (예: 2025)
    else if (!isNaN(parseInt(periodString, 10))) {
        return `${periodString}년`;
    }
    return periodString;
};

// 백엔드 period는 week/month/year 이므로, UI 값(daily/monthly/yearly)을 매핑
const mapPeriod = (uiPeriod) => {
    if (uiPeriod === 'daily') return 'week';
    if (uiPeriod === 'monthly') return 'month';
    if (uiPeriod === 'yearly') return 'year';
    return 'month';
};

// 백엔드 DTO → 프론트 차트키로 변환
const mapQuality = (rows = []) =>
    rows.map(r => ({
        date: r.period,
        normal: r.normal,
        defective: r.defect,
    }));

const mapDelivery = (rows = []) =>
    rows.map(r => ({
        date: r.period,
        deliveryCount: r.deliveredCount,
        deliveryQuantity: r.deliveredQty,
    }));

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

// 월별 목록
const getMonths = () => {
    const months = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.push({ value: `${year}-${month}`, label: `${year}년 ${parseInt(month, 10)}월` });
    }
    return months.reverse();
};

// 년도 목록
const getYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
        const year = currentYear - i;
        years.push({ value: `${year}`, label: `${year}년` });
    }
    return years.reverse();
};

const DashboardPage = ({ setCurrentPage, handleLogout, username }) => {
    const [quality, setQuality] = useState([]);
    const [delivery, setDelivery] = useState([]);
    const [defectCause, setDefectCause] = useState([]);
    const [productDelivery, setProductDelivery] = useState([]);

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const currentYear = `${new Date().getFullYear()}`;

    const [filters, setFilters] = useState({
        chart1: { period: 'daily', startDate, endDate: today },
        chart2: { period: 'daily', startDate, endDate: today },
        chart3: { period: 'daily', startDate, endDate: today, comparison: 'none' },
        chart4: { period: 'daily', startDate, endDate: today }
    });

    const [loading, setLoading] = useState(false);

    const updateFilter = (chartId, filterType, value) => {
        setFilters(prev => {
            const newFilters = { ...prev };
            newFilters[chartId] = { ...newFilters[chartId], [filterType]: value };

            if (filterType === 'period') {
                if (value === 'daily') {
                    newFilters[chartId].startDate = startDate;
                    newFilters[chartId].endDate = today;
                } else if (value === 'monthly') {
                    newFilters[chartId].startDate = currentYearMonth;
                    newFilters[chartId].endDate = currentYearMonth;
                } else if (value === 'yearly') {
                    newFilters[chartId].startDate = currentYear;
                    newFilters[chartId].endDate = currentYear;
                }
            }
            return newFilters;
        });
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const getParams = (chartId) => {
                const period = mapPeriod(filters[chartId].period);
                let startDate = filters[chartId].startDate;
                let endDate = filters[chartId].endDate;

                if (filters[chartId].period === 'yearly') {
                    return { period: 'year', startDate, endDate };
                }
                if (filters[chartId].period === 'monthly') {
                    return { period: 'month', startDate, endDate };
                }
                return { period, startDate, endDate };
            };

            const [r1, r2, r3, r4] = await Promise.all([
                axios.get('/api/dashboard/quality', { params: getParams('chart1') }),
                axios.get('/api/dashboard/delivery', { params: getParams('chart2') }),
                axios.get('/api/dashboard/defect-cause', { params: getParams('chart3') }),
                axios.get('/api/dashboard/product-delivery', { params: getParams('chart4') })
            ]);

            setQuality(mapQuality(r1.data));
            setDelivery(mapDelivery(r2.data));
            setDefectCause(mapDefectCause(r3.data));
            setProductDelivery(mapProductDelivery(r4.data));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // 페이지가 처음 렌더링되거나 filters 상태가 변경될 때마다 실행 
    useEffect(() => { loadAll(); }, [loadAll]);

    const prepareAreaData = (data) => {
        if (data.length === 1) {
            const item = data[0];
            return [{ ...item, date: item.date }, { ...item, date: item.date }];
        }
        return data;
    };

    const filterData = useCallback((chartId) => {
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

        const totalSum = totals.banana + totals.strawberry + totals.melon;
        if (totalSum === 0) return [];

        return [
            { name: '바나나맛', value: totals.banana, color: '#FFD700' },
            { name: '딸기맛', value: totals.strawberry, color: '#FF6B6B' },
            { name: '메로나맛', value: totals.melon, color: '#4ECDC4' }
        ];
    }, [filterData]);

    // 필터 UI
    const FilterComponent = ({ chartId, showComparison = false }) => {
        const period = filters[chartId].period;

        const renderPeriodInput = () => {
            if (period === 'daily') {
                return (
                    <>
                        <input
                            type="date"
                            value={filters[chartId].startDate}
                            onChange={(e) => updateFilter(chartId, 'startDate', e.target.value)}
                            className="chart-filter-date"
                            max={today}
                        />
                        <input
                            type="date"
                            value={filters[chartId].endDate}
                            onChange={(e) => updateFilter(chartId, 'endDate', e.target.value)}
                            className="chart-filter-date"
                            disabled={!filters[chartId].startDate}
                            min={filters[chartId].startDate}
                            max={today}
                        />
                    </>
                );
            } else if (period === 'monthly') {
                return (
                    <select
                        value={filters[chartId].startDate}
                        onChange={(e) => updateFilter(chartId, 'startDate', e.target.value)}
                        className="chart-filter-select"
                    >
                        {getMonths().map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                );
            } else if (period === 'yearly') {
                return (
                    <select
                        value={filters[chartId].startDate}
                        onChange={(e) => updateFilter(chartId, 'startDate', e.target.value)}
                        className="chart-filter-select"
                    >
                        {getYears().map(y => (
                            <option key={y.value} value={y.value}>{y.label}</option>
                        ))}
                    </select>
                );
            }
            return null;
        };

        return (
            <div className="chart-filter-container">
                <div className="chart-filter-row">
                    <select
                        value={period}
                        onChange={(e) => updateFilter(chartId, 'period', e.target.value)}
                        className="chart-filter-select"
                    >
                        <option value="daily">주별</option>
                        <option value="monthly">월별</option>
                        <option value="yearly">년별</option>
                    </select>
                    {renderPeriodInput()}
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
    };

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

            <div className="dashboard-main-content">
                <div className="charts-grid">
                    {/* 1번 그래프 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">정상/불량 건수</h3>
                            <FilterComponent chartId="chart1" />
                        </div>
                        <div className="chart-card-content">
                            {filterData('chart1').length > 0 ? (
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={filterData('chart1')}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={formatPeriodToKorean} />
                                        <YAxis />
                                        <Tooltip labelFormatter={formatPeriodToKorean} />
                                        <Legend />
                                        <Bar dataKey="normal" fill="#4CAF50" name="정상" />
                                        <Bar dataKey="defective" fill="#FF5722" name="불량" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="no-data-message"><p>조회 데이터가 없습니다.</p></div>
                            )}
                        </div>
                    </div>

                    {/* 2번 그래프: 납품 현황 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">납품 현황</h3>
                            <FilterComponent chartId="chart2" />
                        </div>
                        <div className="chart-card-content">
                            {filterData('chart2').length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <ComposedChart data={filterData('chart2')}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={formatPeriodToKorean} />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip labelFormatter={formatPeriodToKorean} />
                                        <Bar yAxisId="left" dataKey="deliveryQuantity" fill="#2196F3" name="납품 수량" />
                                        <Line yAxisId="right" type="monotone" dataKey="deliveryCount" stroke="#FF9800" strokeWidth={3} name="납품 건수" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="no-data-message"><p>조회 데이터가 없습니다.</p></div>
                            )}
                        </div>
                    </div>

                    {/* 3번 그래프: 불량 원인 분석 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">불량 원인 분석</h3>
                            <FilterComponent chartId="chart3" showComparison={true} />
                        </div>
                        <div className="chart-card-content">
                            {filterData('chart3').length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={prepareAreaData(filterData('chart3'))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tickFormatter={formatPeriodToKorean} />
                                        <YAxis />
                                        <Tooltip labelFormatter={formatPeriodToKorean} />
                                        <Area type="monotone" dataKey="lidDefect" stroke="#E91E63" fill="#E91E63" fillOpacity={0.2} name="뚜껑 불량" />
                                        <Area type="monotone" dataKey="bodyDefect" stroke="#9C27B0" fill="#9C27B0" fillOpacity={0.2} name="데이지 불량" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="no-data-message"><p>조회 데이터가 없습니다.</p></div>
                            )}
                        </div>
                    </div>

                    {/* 4번 그래프 */}
                    <div className="chart-card">
                        <div className="chart-card-header">
                            <h3 className="chart-card-title">제품별 납품 현황</h3>
                            <FilterComponent chartId="chart4" />
                        </div>
                        <div className="chart-card-content">
                            {chart4Data.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={chart4Data} cx="50%" cy="50%" innerRadius={60} outerRadius={130} paddingAngle={0} dataKey="value">
                                            {chart4Data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend wrapperStyle={{ transform: "translateY(20px)" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="no-data-message"><p>조회 데이터가 없습니다.</p></div>
                            )}
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
