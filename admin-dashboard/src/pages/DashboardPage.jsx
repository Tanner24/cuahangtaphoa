import { useState, useEffect } from 'react';
import api from '../services/api';

const StatCard = ({ title, value, colorType, icon, subtext }) => (
    <div className={`stat-card ${colorType}`}>
        <div className={`stat-icon ${colorType}`}>
            <span className="material-icons">{icon}</span>
        </div>
        <div className="stat-content">
            <p className="stat-label">{title}</p>
            <h3 className="stat-value">{value}</h3>
            {subtext && <p className="stat-change">{subtext}</p>}
        </div>
    </div>
);

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today');

    useEffect(() => {
        fetchDashboard();
    }, [period]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.getDashboard({ period });
            setData(res.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

    if (loading && !data) return <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Đang tải dữ liệu...</div>;
    if (!data) return <div className="p-8 text-center" style={{ color: 'var(--color-danger)' }}>Không có dữ liệu.</div>;

    const { overview, chart, lowStock, recentOrders } = data;

    return (
        <div className="dashboard-container">
            {/* Header & Filter */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Tổng Quan Kinh Doanh</h1>
                    <p>Dữ liệu: <span style={{ color: 'var(--color-accent-light)', fontWeight: 'bold', textTransform: 'capitalize' }}>{period.replace('_', ' ')}</span></p>
                </div>
                <div className="toolbar" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-card)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
                        {['today', 'yesterday', '7days', 'this_month'].map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ border: 'none' }}
                            >
                                {p === 'today' ? 'Hôm nay' : p === 'yesterday' ? 'Hôm qua' : p === '7days' ? '7 ngày' : 'Tháng này'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    title="Doanh Thu"
                    value={formatMoney(overview?.revenue)}
                    colorType="accent"
                    icon="payments"
                    subtext="Doanh thu thực tế"
                />
                <StatCard
                    title="Lợi Nhuận (Ước tính)"
                    value={formatMoney(overview?.profit)}
                    colorType="success"
                    icon="trending_up"
                    subtext="~30% doanh thu"
                />
                <StatCard
                    title="Số Đơn Hàng"
                    value={overview?.totalOrders || 0}
                    colorType="info"
                    icon="shopping_bag"
                    subtext={`${overview?.totalOrders > 0 ? formatMoney(overview.revenue / overview.totalOrders) : '0'}/đơn`}
                />
                <StatCard
                    title="Ghi Nợ Mới"
                    value={formatMoney(overview?.debtAdded)}
                    colorType="warning"
                    icon="book"
                    subtext="Phát sinh trong kỳ"
                />
            </div>

            {/* Charts & Tables */}
            <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                {/* Chart Section */}
                <div className="chart-card card">
                    <h3>Biểu đồ doanh thu</h3>
                    <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', padding: '0 10px' }}>
                        {chart?.map((item, idx) => {
                            const maxVal = Math.max(...chart.map(d => d.revenue)) || 1;
                            const heightPercent = (Number(item.revenue) / maxVal) * 100;
                            return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }} title={formatMoney(item.revenue)}>
                                    <div style={{
                                        width: '100%',
                                        maxWidth: '30px',
                                        background: 'var(--color-accent)',
                                        opacity: 0.8,
                                        borderRadius: '4px 4px 0 0',
                                        height: `${heightPercent}%`,
                                        transition: 'height 0.5s ease'
                                    }}></div>
                                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '8px' }}>{item.date}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Đơn hàng mới nhất</h3>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Tổng tiền</th>
                                    <th>TT</th>
                                    <th style={{ textAlign: 'right' }}>Thời gian</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders?.map(order => (
                                    <tr key={order.id}>
                                        <td><strong>{order.code}</strong></td>
                                        <td>{formatMoney(order.total)}</td>
                                        <td>
                                            <span className={`badge ${order.payment === 'DEBT' ? 'suspended' : 'active'}`}>
                                                {order.payment === 'DEBT' ? 'Nợ' : 'TM'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {order.time ? new Date(order.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </td>
                                    </tr>
                                ))}
                                {(!recentOrders || recentOrders.length === 0) && (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Trống</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div style={{ marginTop: '2rem' }}>
                <a href="http://localhost:5173/login" target="_blank" rel="noreferrer" className="btn btn-primary">
                    <span className="material-icons">point_of_sale</span>
                    Mở Trang Bán Hàng POS
                </a>
            </div>

            {/* Low Stock Alert */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <div className="card-header">
                    <h3 className="card-title" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons text-3xl">warning</span>
                        Sản phẩm sắp hết hàng ({lowStock?.count || 0})
                    </h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Đơn vị</th>
                                <th style={{ textAlign: 'right' }}>Tồn kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStock?.items?.map(item => (
                                <tr key={item.id || item.code}>
                                    <td><strong>{item.name}</strong></td>
                                    <td>{item.unit}</td>
                                    <td style={{ textAlign: 'right', color: 'var(--color-danger)', fontWeight: 'bold' }}>{item.currentStock}</td>
                                </tr>
                            ))}
                            {(!lowStock?.items || lowStock.items.length === 0) && (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-success)' }}>Kho hàng ổn định 🎉</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
