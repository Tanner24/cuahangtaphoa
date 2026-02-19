import { useState, useEffect } from 'react';
import api from '../services/api';

function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadPayments();
    }, [page, statusFilter]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            const result = await api.getPayments(params);
            setPayments(result.data || []);
            setMeta(result.meta || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('vi-VN');
    };

    return (
        <div>
            <div className="page-header">
                <h1>Thanh toán</h1>
                <p>Lịch sử thanh toán subscription của các cửa hàng</p>
            </div>

            {/* Filters */}
            <div className="toolbar">
                <select
                    className="form-input"
                    style={{ width: 160 }}
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="failed">Thất bại</option>
                </select>

                <input
                    className="form-input"
                    type="date"
                    style={{ width: 180 }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Từ ngày"
                />

                <input
                    className="form-input"
                    type="date"
                    style={{ width: 180 }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="Đến ngày"
                />

                <button className="btn btn-secondary" onClick={() => { setPage(1); loadPayments(); }}>
                    🔍 Lọc
                </button>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Cửa hàng</th>
                                <th>Số tiền</th>
                                <th>Phương thức</th>
                                <th>Trạng thái</th>
                                <th>Mã giao dịch</th>
                                <th>Ngày thanh toán</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        Chưa có giao dịch nào
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td>
                                            <strong>{payment.store?.name || '—'}</strong>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                {payment.store?.ownerName}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td>{payment.method || '—'}</td>
                                        <td>
                                            <span className={`badge ${payment.status}`}>
                                                <span className="badge-dot" />
                                                {payment.status === 'completed' ? 'Hoàn thành'
                                                    : payment.status === 'pending' ? 'Chờ xử lý'
                                                        : 'Thất bại'}
                                            </span>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                            {payment.transactionRef || '—'}
                                        </td>
                                        <td>{formatDate(payment.paidAt || payment.createdAt)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="pagination">
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Trước</button>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            Trang {page} / {meta.totalPages}
                        </span>
                        <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentsPage;
