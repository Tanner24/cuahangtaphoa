import { useState, useEffect } from 'react';
import api from '../services/api';

function LogsPage() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');

    useEffect(() => {
        loadLogs();
    }, [page, actionFilter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 50 };
            if (actionFilter) params.action = actionFilter;
            const result = await api.getSystemLogs(params);
            setLogs(result.data || []);
            setMeta(result.meta || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('vi-VN');
    };

    const getActionColor = (action) => {
        if (action?.includes('SUSPEND') || action?.includes('DELETE')) return 'var(--color-danger)';
        if (action?.includes('CREATE') || action?.includes('ACTIVATE')) return 'var(--color-success)';
        if (action?.includes('UPDATE') || action?.includes('EXTEND')) return 'var(--color-warning)';
        if (action?.includes('LOGIN') || action?.includes('LOGOUT')) return 'var(--color-info)';
        return 'var(--color-text-secondary)';
    };

    const actionTypes = [
        'LOGIN', 'LOGOUT', 'CREATE_STORE', 'UPDATE_STORE', 'SUSPEND_STORE',
        'ACTIVATE_STORE', 'SUBSCRIBE_STORE', 'EXTEND_STORE', 'CREATE_PLAN',
        'UPDATE_PLAN', 'AUTO_EXPIRE_STORE',
    ];

    return (
        <div>
            <div className="page-header">
                <h1>Nhật ký hệ thống</h1>
                <p>Audit trail — Theo dõi mọi thao tác quản trị</p>
            </div>

            {/* Filters */}
            <div className="toolbar">
                <select
                    className="form-input"
                    style={{ width: 220 }}
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                >
                    <option value="">Tất cả hành động</option>
                    {actionTypes.map(action => (
                        <option key={action} value={action}>{action}</option>
                    ))}
                </select>

                <button className="btn btn-secondary" onClick={() => { setActionFilter(''); setPage(1); }}>
                    🔄 Xóa bộ lọc
                </button>
            </div>

            {/* Logs Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Hành động</th>
                                <th>Người thực hiện</th>
                                <th>Cửa hàng</th>
                                <th>Chi tiết</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        Chưa có nhật ký nào
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td>
                                            <span style={{
                                                color: getActionColor(log.action),
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                fontFamily: 'monospace',
                                            }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td>{log.user?.fullName || log.user?.username || 'System'}</td>
                                        <td>{log.store?.name || '—'}</td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {log.entityType ? `${log.entityType}: ${log.entityId?.substring(0, 8)}...` : '—'}
                                        </td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            {log.ipAddress || '—'}
                                        </td>
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
                            Trang {page} / {meta.totalPages} ({meta.total} log)
                        </span>
                        <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LogsPage;
