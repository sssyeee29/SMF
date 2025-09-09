import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, PieChart, Pie, Cell, Legend } from 'recharts';

import './DashboardPage.css';

// 샘플 데이터 생성 함수 (최근 7일)
const generateSampleData = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    return dates.map(date => ({
        date,
        normal: Math.floor(Math.random() * 50) + 20,
        defective: Math.floor(Math.random() * 10) + 2,
        deliveryCount: Math.floor(Math.random() * 30) + 10,
        deliveryQuantity: Math.floor(Math.random() * 500) + 100,
        lidDefect: Math.floor(Math.random() * 5) + 1,
        daisyDefect: Math.floor(Math.random() * 5) + 1,
        banana: Math.floor(Math.random() * 100) + 50,
        strawberry: Math.floor(Math.random() * 80) + 40,
        melon: Math.floor(Math.random() * 60) + 30
    }));
};

const DashboardPage = ({ setCurrentPage, handleLogout, username }) => {

    const [data] = useState(generateSampleData());

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const [filters, setFilters] = useState({
        chart1: { period: 'daily', startDate, endDate: today },
        chart2: { period: 'daily', startDate, endDate: today },
        chart3: { period: 'daily', startDate, endDate: today, comparison: 'none' },
        chart4: { period: 'daily', startDate, endDate: today }
    });

    const updateFilter = (chartId, filterType, value) => {
        setFilters(prev => ({
        ...prev,
        [chartId]: {
            ...prev[chartId],
            [filterType]: value
        }
        }));
    };

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
        const filter = filters[chartId];
        let filteredData = [...data];

        if (filter.startDate && filter.endDate) {
        filteredData = filteredData.filter(item => 
            item.date >= filter.startDate && item.date <= filter.endDate
        );
        }

        if (filter.period === 'monthly') {
        const monthlyData = {};
        filteredData.forEach(item => {
            const month = item.date.substring(0, 7);
            if (!monthlyData[month]) {
            monthlyData[month] = { date: month, normal: 0, defective: 0, deliveryCount: 0, deliveryQuantity: 0, lidDefect: 0, daisyDefect: 0, banana: 0, strawberry: 0, melon: 0 };
            }
            Object.keys(item).forEach(key => {
            if (key !== 'date') monthlyData[month][key] += item[key];
            });
        });
        filteredData = Object.values(monthlyData);
        } else if (filter.period === 'yearly') {
        const yearlyData = {};
        filteredData.forEach(item => {
            const year = item.date.substring(0, 4);
            if (!yearlyData[year]) {
            yearlyData[year] = { date: year, normal: 0, defective: 0, deliveryCount: 0, deliveryQuantity: 0, lidDefect: 0, daisyDefect: 0, banana: 0, strawberry: 0, melon: 0 };
            }
            Object.keys(item).forEach(key => {
            if (key !== 'date') yearlyData[year][key] += item[key];
            });
        });
        filteredData = Object.values(yearlyData);
        }

        return filteredData;
    }, [data, filters]);

    const chart4Data = useMemo(() => {
        const filteredData = filterData('chart4');
        const totals = filteredData.reduce((acc, item) => {
        acc.banana += item.banana;
        acc.strawberry += item.strawberry;
        acc.melon += item.melon;
        return acc;
        }, { banana: 0, strawberry: 0, melon: 0 });

        return [
        { name: '바나나', value: totals.banana, color: '#FFD700' },
        { name: '딸기', value: totals.strawberry, color: '#FF6B6B' },
        { name: '멜론', value: totals.melon, color: '#4ECDC4' }
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
            />
            
            <input
            type="date"
            value={filters[chartId].endDate}
            onChange={(e) => updateFilter(chartId, 'endDate', e.target.value)}
            className="chart-filter-date"
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
                                        dataKey="daisyDefect"
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
                                        <div className="chart-legend-color" style={{backgroundColor: item.color}}></div>
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
