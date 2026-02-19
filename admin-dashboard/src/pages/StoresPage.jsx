import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

function StoresPage() {
    const [stores, setStores] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [showExtend, setShowExtend] = useState(null);
    const [showUpgrade, setShowUpgrade] = useState(null);
    const [extendDays, setExtendDays] = useState(30);
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const toast = useToast();
    const [form, setForm] = useState({ name: '', ownerName: '', phone: '', email: '' });

    useEffect(() => {
        loadStores();
        loadPlans();
    }, [page, statusFilter]);

    const loadPlans = async () => {
        try {
            const result = await api.getPlans();
            setPlans(result.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadStores = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const result = await api.getStores(params);
            setStores(result.data || []);
            setMeta(result.meta || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadStores();
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createStore(form);
            setShowCreate(false);
            setForm({ name: '', ownerName: '', phone: '', email: '' });
            loadStores();
            toast.success('Đã tạo cửa hàng mới thành công');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.updateStore(showEdit.id, form);
            setShowEdit(null);
            setForm({ name: '', ownerName: '', phone: '', email: '' });
            loadStores();
            toast.success('Cập nhật thông tin cửa hàng thành công');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleSuspend = async (store) => {
        if (!confirm(`Bạn có chắc muốn tạm ngưng "${store.name}"?`)) return;
        try {
            await api.suspendStore(store.id);
            loadStores();
            toast.warning(`Đã tạm ngưng cửa hàng ${store.name}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleActivate = async (store) => {
        try {
            await api.activateStore(store.id);
            loadStores();
            toast.success(`Đã kích hoạt cửa hàng ${store.name}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleExtend = async (e) => {
        e.preventDefault();
        try {
            await api.extendStore(showExtend.id, parseInt(extendDays));
            setShowExtend(null);
            setExtendDays(30);
            loadStores();
            toast.success('Gia hạn thành công');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleUpgrade = async (e) => {
        e.preventDefault();
        if (!selectedPlanId) return toast.warning('Vui lòng chọn gói dịch vụ');
        try {
            await api.subscribeStore(showUpgrade.id, parseInt(selectedPlanId), 'manual');
            setShowUpgrade(null);
            setSelectedPlanId('');
            loadStores();
            toast.success('Nâng cấp gói cước thành công');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const getStatusBadge = (status) => {
        return <span className={`badge ${status}`}><span className="badge-dot" />{status}</span>;
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('vi-VN');
    };

    // Role Check
    const user = api.getUser();
    const isSuperAdmin = user?.role === 'super_admin';
    const canSupport = ['super_admin', 'support_admin'].includes(user?.role);
    const canSales = ['super_admin', 'billing_admin'].includes(user?.role);

    return (
        <div>
            <div className="page-header">
                <h1>Quản lý Cửa hàng</h1>
                <p>Danh sách tất cả cửa hàng trên hệ thống POS SaaS</p>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-box">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <form onSubmit={handleSearch}>
                        <input
                            placeholder="Tìm theo tên, SĐT, chủ cửa hàng..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>

                <select
                    className="form-input"
                    style={{ width: 160 }}
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                    <option value="">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="expired">Hết hạn</option>
                    <option value="suspended">Tạm ngưng</option>
                </select>

                {canSales && (
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        ➕ Thêm cửa hàng
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Cửa hàng</th>
                                <th>Chủ sở hữu</th>
                                <th>SĐT</th>
                                <th>Gói</th>
                                <th>Hết hạn</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : stores.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                        Không có cửa hàng nào
                                    </td>
                                </tr>
                            ) : (
                                stores.map((store) => (
                                    <tr key={store.id}>
                                        <td>
                                            <strong>{store.name}</strong>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                                SP: {store._count?.products || 0} · HĐ: {store._count?.invoices || 0}
                                            </div>
                                        </td>
                                        <td>{store.ownerName || '—'}</td>
                                        <td>{store.phone}</td>
                                        <td>
                                            <span className="badge info">{store.subscriptionPlan?.name || 'N/A'}</span>
                                        </td>
                                        <td>{formatDate(store.subscriptionExpiredAt)}</td>
                                        <td>{getStatusBadge(store.status)}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {canSupport && (
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => window.open(`http://pos.local/sale.php?store_id=${store.id}`, '_blank')}
                                                        title="Truy cập POS"
                                                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                                    >
                                                        <span className="material-icons" style={{ fontSize: 16 }}>shopping_cart</span>
                                                        POS
                                                    </button>
                                                )}

                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => {
                                                        setShowEdit(store);
                                                        setForm({
                                                            name: store.name,
                                                            ownerName: store.ownerName || '',
                                                            phone: store.phone,
                                                            email: store.email || ''
                                                        });
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                                >
                                                    <span className="material-icons" style={{ fontSize: 16 }}>edit</span>
                                                    Chi tiết
                                                </button>
                                            </div>
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
                            Trang {page} / {meta.totalPages} ({meta.total} kết quả)
                        </span>
                        <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Sau →</button>
                    </div>
                )}
            </div>

            {/* Edit Store Modal */}
            {showEdit && (
                <div className="modal-overlay" onClick={() => setShowEdit(null)}>
                    <div className="modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚙️ Quản lý: {showEdit.name}</h2>
                            <button className="btn btn-icon" onClick={() => setShowEdit(null)}>✕</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', padding: '1rem' }}>
                            {/* Content Left: Profile */}
                            <form onSubmit={handleUpdate}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '1rem', textTransform: 'uppercase' }}>Thông tin cơ bản</h3>
                                <div className="form-group">
                                    <label className="form-label">Tên cửa hàng</label>
                                    <input className="form-input" required value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Chủ sở hữu</label>
                                    <input className="form-input" value={form.ownerName}
                                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
                                </div>
                                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Số điện thoại</label>
                                        <input className="form-input" required value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" type="email" value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
                                </div>
                            </form>

                            {/* Content Right: Actions */}
                            <div style={{ background: 'var(--color-bg-body)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: '0.9rem', color: 'var(--color-danger)', marginBottom: '1rem', textTransform: 'uppercase' }}>Quản lý Gói cước</h3>

                                <div className="info-item" style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Gói hiện tại</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-info)' }}>
                                        {showEdit.subscriptionPlan?.name || 'FREE PLAN'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                                        {showEdit.subscriptionExpiredAt ? `Hết hạn: ${formatDate(showEdit.subscriptionExpiredAt)}` : 'Vĩnh viễn'}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {canSales && (
                                        <>
                                            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
                                                setShowExtend(showEdit);
                                                setShowEdit(null);
                                            }}>
                                                <span className="material-icons" style={{ fontSize: 18, marginRight: 8 }}>history</span>
                                                Gia hạn thời gian
                                            </button>
                                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #a855f7, #9333ea)' }} onClick={() => {
                                                setShowUpgrade(showEdit);
                                                setSelectedPlanId(showEdit.subscriptionPlanId || '');
                                                setShowEdit(null);
                                            }}>
                                                <span className="material-icons" style={{ fontSize: 18, marginRight: 8 }}>upgrade</span>
                                                Nâng cấp gói cước
                                            </button>
                                        </>
                                    )}

                                    <hr style={{ margin: '10px 0', borderColor: 'var(--color-border)' }} />

                                    {isSuperAdmin && (
                                        showEdit.status === 'active' ? (
                                            <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleSuspend(showEdit)}>
                                                <span className="material-icons" style={{ fontSize: 18, marginRight: 8 }}>block</span>
                                                Tạm ngưng hoạt động
                                            </button>
                                        ) : (
                                            <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleActivate(showEdit)}>
                                                <span className="material-icons" style={{ fontSize: 18, marginRight: 8 }}>check_circle</span>
                                                Kích hoạt lại
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Extend Store Dialog */}
            {canSales && showExtend && (
                <div className="modal-overlay" onClick={() => setShowExtend(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⏳ Gia hạn: {showExtend.name}</h2>
                            <button className="btn btn-icon" onClick={() => setShowExtend(null)}>✕</button>
                        </div>
                        <form onSubmit={handleExtend}>
                            <div className="form-group">
                                <label className="form-label">Số ngày gia hạn</label>
                                <input className="form-input" type="number" min="1" value={extendDays}
                                    onChange={(e) => setExtendDays(e.target.value)} />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Hết hạn hiện tại: {formatDate(showExtend.subscriptionExpiredAt)}
                            </p>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowExtend(null)}>Hủy</button>
                                <button type="button" className="btn btn-secondary" style={{ marginRight: 'auto', border: '1px solid var(--color-info)', color: 'var(--color-info)' }} onClick={() => {
                                    const store = showExtend;
                                    setShowExtend(null);
                                    setShowUpgrade(store);
                                    setSelectedPlanId(store.subscriptionPlanId || '');
                                }}>🚀 Nâng cấp</button>
                                <button type="submit" className="btn btn-primary">Gia hạn</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upgrade Store Dialog */}
            {canSales && showUpgrade && (
                <div className="modal-overlay" onClick={() => setShowUpgrade(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🚀 Nâng cấp: {showUpgrade.name}</h2>
                            <button className="btn btn-icon" onClick={() => setShowUpgrade(null)}>✕</button>
                        </div>
                        <form onSubmit={handleUpgrade}>
                            <div className="form-group">
                                <label className="form-label">Chọn gói dịch vụ</label>
                                <select
                                    className="form-input"
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Chọn gói --</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name} - {new Intl.NumberFormat('vi-VN').format(plan.price)}đ / {plan.durationDays} ngày
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Gói hiện tại: {showUpgrade.subscriptionPlan?.name || 'Chưa có'}
                            </p>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowUpgrade(null)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Cập nhật gói</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StoresPage;
