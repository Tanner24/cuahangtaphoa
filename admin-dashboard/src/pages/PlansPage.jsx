import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

function PlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editPlan, setEditPlan] = useState(null);
    const [form, setForm] = useState({
        name: '', maxProducts: 50, maxUsers: 1, price: 0, durationDays: 30, features: [],
        technicalFeatures: { reports: false, inventory_advanced: false, refunds: false, logs: false }
    });
    const toast = useToast();

    const TECHNICAL_FEATURES = [
        { id: 'revenue_report', label: 'Báo cáo doanh thu chuyên sâu', icon: 'bar_chart' },
        { id: 'tax_report', label: 'Báo cáo thuế & Sổ sách (TT88)', icon: 'account_balance' },
        { id: 'staff_permissions', label: 'Phân quyền nhân viên chuyên sâu', icon: 'security' },
        { id: 'inventory_advanced', label: 'Quản lý kho & Danh mục nâng cao', icon: 'inventory_2' },
        { id: 'refunds', label: 'Xử lý Trả hàng & Hoàn tiền', icon: 'keyboard_return' },
        { id: 'logs', label: 'Nhật ký hệ thống (Audit Logs)', icon: 'history_edu' },
    ];

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const result = await api.getPlans();
            // Ensure features is distinct array if comes as string
            const data = (result.data || []).map(p => ({
                ...p,
                features: typeof p.features === 'string' ? JSON.parse(p.features) : (p.features || [])
            }));
            setPlans(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Combine technical features with custom display features
            const techFeats = Object.keys(form.technicalFeatures)
                .filter(k => form.technicalFeatures[k])
                .map(k => TECHNICAL_FEATURES.find(tf => tf.id === k).label);

            const allFeatures = [...new Set([...techFeats, ...(form.features || [])])].filter(f => f.trim() !== '');

            const cleanForm = {
                ...form,
                features: allFeatures
            };

            if (editPlan) {
                await api.updatePlan(editPlan.id, cleanForm);
            } else {
                await api.createPlan(cleanForm);
            }
            setShowForm(false);
            setEditPlan(null);
            resetForm();
            loadPlans();
            toast.success(editPlan ? 'Đã cập nhật gói dịch vụ' : 'Đã tạo gói dịch vụ mới');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (plan) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa gói "${plan.name}"?`)) return;
        try {
            await api.deletePlan(plan.id);
            toast.success('Xóa gói dịch vụ thành công');
            loadPlans();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const resetForm = () => {
        setForm({
            name: '', maxProducts: 50, maxUsers: 1, price: 0, durationDays: 30, features: [],
            technicalFeatures: { reports: false, inventory_advanced: false, refunds: false, logs: false }
        });
    };

    const openEdit = (plan) => {
        setEditPlan(plan);
        const planFeats = Array.isArray(plan.features) ? plan.features : [];

        // Infer technical features from string matches
        const techFeats = {};
        TECHNICAL_FEATURES.forEach(tf => {
            techFeats[tf.id] = planFeats.some(f => f.toLowerCase().includes(tf.label.toLowerCase()) || f.toLowerCase().includes(tf.id.toLowerCase()));
        });

        setForm({
            name: plan.name,
            maxProducts: plan.maxProducts,
            maxUsers: plan.maxUsers,
            price: Number(plan.price),
            durationDays: plan.durationDays,
            features: planFeats.filter(f => !TECHNICAL_FEATURES.some(tf => f.toLowerCase().includes(tf.label.toLowerCase()))),
            technicalFeatures: techFeats
        });
        setShowForm(true);
    };

    const addFeature = () => {
        setForm(prev => ({ ...prev, features: [...(prev.features || []), ''] }));
    };

    const removeFeature = (index) => {
        const newFeatures = [...(form.features || [])];
        newFeatures.splice(index, 1);
        setForm({ ...form, features: newFeatures });
    };

    const updateFeature = (index, value) => {
        const newFeatures = [...(form.features || [])];
        newFeatures[index] = value;
        setForm({ ...form, features: newFeatures });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            <div className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Hệ thống gói dịch vụ</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Thiết kế và cấu hình các gói đăng ký cho cửa hàng</p>
                </div>
                <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -5px var(--color-primary-alpha)' }} onClick={() => { setEditPlan(null); resetForm(); setShowForm(true); }}>
                    <span className="material-icons" style={{ fontSize: '20px' }}>add</span> Thêm gói mới
                </button>
            </div>

            {/* Plan Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '24px',
                marginTop: '1rem'
            }}>
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="card skeleton-card" style={{ height: '500px', borderRadius: '24px' }} />
                    ))
                ) : (
                    plans.map((plan) => {
                        const isEnterprise = plan.price > 400000;
                        const isBasic = plan.price > 0 && plan.price <= 400000;
                        const isFree = plan.price === 0;

                        return (
                            <div key={plan.id} className="plan-card" style={{
                                background: isEnterprise ? 'linear-gradient(145deg, #1e1e3f, #111126)' : 'var(--color-bg-card)',
                                borderRadius: '24px',
                                border: '1px solid var(--color-border)',
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderTop: isEnterprise ? '6px solid #f1c40f' : isBasic ? '6px solid var(--color-accent)' : '1px solid var(--color-border)',
                                overflow: 'hidden'
                            }}>
                                {/* Background Ornament */}
                                <div style={{
                                    position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px',
                                    background: isEnterprise ? 'rgba(241, 196, 15, 0.05)' : isBasic ? 'rgba(var(--color-accent-rgb), 0.05)' : 'transparent',
                                    borderRadius: '50%', filter: 'blur(40px)', zIndex: 0
                                }} />

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: isEnterprise ? '#f1c40f' : isBasic ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                marginBottom: '8px'
                                            }}>
                                                <span className="material-icons" style={{ fontSize: '16px' }}>
                                                    {isEnterprise ? 'workspace_premium' : isBasic ? 'star' : 'auto_awesome'}
                                                </span>
                                                {isEnterprise ? 'Premium' : isBasic ? 'Popular' : 'Standard'}
                                            </div>
                                            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '12px' }}>{plan.name}</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => openEdit(plan)}
                                                className="btn-action"
                                                style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', transition: 'all 0.2s', background: 'transparent', cursor: 'pointer' }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '18px' }}>edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(plan)}
                                                className="btn-action"
                                                style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', transition: 'all 0.2s', background: 'transparent', cursor: 'pointer' }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '18px' }}>delete_outline</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '32px' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em' }}>
                                                {isFree ? '0' : formatCurrency(plan.price).replace(' ₫', '')}
                                            </span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, opacity: 0.6 }}>₫</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '4px' }}>
                                            Sử dụng trong {plan.durationDays} ngày
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '4px' }}>Hàng hóa</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{plan.maxProducts.toLocaleString()}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.5, marginBottom: '4px' }}>Nhân viên</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{plan.maxUsers}</div>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.4, letterSpacing: '0.1em', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>Đặc quyền gói</p>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(Array.isArray(plan.features) ? plan.features : []).slice(0, 5).map((feat, idx) => (
                                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: isEnterprise ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)' }}>
                                                    <span className="material-icons" style={{ fontSize: '18px', color: isEnterprise ? '#f1c40f' : '#10b981' }}>check_circle</span>
                                                    {feat}
                                                </li>
                                            ))}
                                            {Array.isArray(plan.features) && plan.features.length > 5 && (
                                                <li style={{ fontSize: '0.8rem', opacity: 0.5, paddingLeft: '28px' }}>+ {plan.features.length - 5} tính năng cao cấp khác...</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                                    <div style={{
                                        padding: '12px 20px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.8rem'
                                    }}>
                                        <span style={{ opacity: 0.6, fontWeight: 600 }}>Cửa hàng đang dùng</span>
                                        <span style={{ fontWeight: 800, color: isEnterprise ? '#f1c40f' : 'var(--color-primary)' }}>{plan._count?.stores || 0}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Form Dialog */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setShowForm(false)}>
                    <div style={{ background: 'white', borderRadius: '32px', width: '100%', maxWidth: '640px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '95vh', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '8px',
                            background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))'
                        }} />

                        <div style={{ padding: '32px 40px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}>
                                    {editPlan ? '✏️ Cập nhật gói dịch vụ' : '➕ Khởi tạo gói mới'}
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>Thiết lập quyền quản trị và giá thành dịch vụ</p>
                            </div>
                            <button style={{ padding: '8px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowForm(false)}>
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} id="planForm" style={{ flex: 1, overflowY: 'auto', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {!editPlan && (
                                <div style={{ background: 'rgba(var(--color-primary-rgb), 0.1)', padding: '24px', borderRadius: '20px' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', display: 'block', marginBottom: '16px' }}>Chọn nhanh gói mẫu</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {[
                                            {
                                                name: 'Miễn phí', price: 0, durationDays: 365, maxProducts: 50, maxUsers: 1,
                                                features: ['Hỗ trợ cộng đồng', 'Bán hàng cơ bản'],
                                                technicalFeatures: { reports: false, inventory_advanced: false, refunds: false, logs: false }
                                            },
                                            {
                                                name: 'Cơ bản', price: 199000, durationDays: 30, maxProducts: 500, maxUsers: 5,
                                                features: ['Báo cáo cơ bản', 'Quản trị nhân sự', 'In hóa đơn nhiệt'],
                                                technicalFeatures: { reports: true, inventory_advanced: true, refunds: false, logs: false }
                                            },
                                            {
                                                name: 'Premium', price: 499000, durationDays: 30, maxProducts: 999999, maxUsers: 20,
                                                features: ['Full tính năng', 'Ưu tiên hỗ trợ 24/7', 'Tùy biến nhãn hiệu'],
                                                technicalFeatures: { reports: true, inventory_advanced: true, refunds: true, logs: true }
                                            },
                                        ].map((tpl, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                className="btn-template"
                                                onClick={() => setForm({ ...tpl })}
                                                style={{
                                                    padding: '8px 16px', background: 'white', borderRadius: '12px',
                                                    fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                ✨ {tpl.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Tên hiển thị gói dịch vụ *</label>
                                    <input style={{ width: '100%', padding: '16px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '1.125rem', fontWeight: 700, outline: 'none' }} required value={form.name}
                                        placeholder="Ví dụ: Enterprise Edition..."
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Giá thành (₫)</label>
                                        <input style={{ width: '100%', padding: '16px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }} type="number" min="0" value={form.price}
                                            onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Thời hạn (ngày)</label>
                                        <input style={{ width: '100%', padding: '16px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }} type="number" min="1" value={form.durationDays}
                                            onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) })} />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Giới hạn hàng hóa</label>
                                        <div style={{ position: 'relative' }}>
                                            <input style={{ width: '100%', padding: '16px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }} type="number" min="1" value={form.maxProducts}
                                                onChange={(e) => setForm({ ...form, maxProducts: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Giới hạn nhân viên</label>
                                        <div style={{ position: 'relative' }}>
                                            <input style={{ width: '100%', padding: '16px 24px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '1.25rem', fontWeight: 900, outline: 'none' }} type="number" min="1" value={form.maxUsers}
                                                onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', display: 'block' }}>Phân quyền hệ thống</label>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        background: '#f8fafc',
                                        padding: '24px',
                                        borderRadius: '24px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {TECHNICAL_FEATURES.map(feat => (
                                            <label key={feat.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                cursor: 'pointer',
                                                padding: '12px',
                                                background: 'white',
                                                borderRadius: '16px',
                                                border: form.technicalFeatures[feat.id] ? '2px solid var(--color-primary)' : '2px solid transparent',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                transition: 'all 0.2s'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }}
                                                    checked={form.technicalFeatures[feat.id]}
                                                    onChange={e => setForm({
                                                        ...form,
                                                        technicalFeatures: { ...form.technicalFeatures, [feat.id]: e.target.checked }
                                                    })}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{feat.label}</span>
                                                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: {feat.id}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', display: 'block' }}>Thông tin giới thiệu (Marketing)</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(form.features || []).map((feat, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <div style={{ flex: 1, position: 'relative' }}>
                                                        <span className="material-icons" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#10b981' }}>check_circle</span>
                                                        <input
                                                            style={{ width: '100%', padding: '16px 16px 16px 48px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, outline: 'none' }}
                                                            value={feat}
                                                            placeholder="Mô tả ưu điểm..."
                                                            onChange={(e) => updateFeature(index, e.target.value)}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        style={{ padding: '12px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                                                        onClick={() => removeFeature(index)}
                                                    >
                                                        <span className="material-icons">delete_outline</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            style={{ width: '100%', padding: '16px', background: 'transparent', border: '2px dashed #e2e8f0', borderRadius: '12px', color: '#94a3b8', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                            onClick={addFeature}
                                        >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>add_circle_outline</span>
                                            Thêm đặc điểm nổi bật
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div style={{ padding: '32px 40px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'end', gap: '16px' }}>
                            <button type="button" style={{ padding: '16px 32px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', color: '#64748b', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }} onClick={() => setShowForm(false)}>Đóng</button>
                            <button type="submit" form="planForm" style={{ padding: '16px 40px', background: '#0f172a', border: 'none', borderRadius: '16px', color: 'white', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                                Lưu cấu hình hệ thống
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .plan-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 30px 60px -15px rgba(0,0,0,0.3);
                    border-color: rgba(255,255,255,0.1);
                }
                .btn-template:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
                    border-color: var(--color-primary);
                }
                .skeleton-card {
                    background: var(--color-bg-card);
                    position: relative;
                    overflow: hidden;
                }
                .skeleton-card::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    transform: translateX(-100%);
                    background-image: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0,
                        rgba(255, 255, 255, 0.05) 20%,
                        rgba(255, 255, 255, 0.1) 60%,
                        rgba(255, 255, 255, 0)
                    );
                    animation: shimmer 2s infinite;
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
}

export default PlansPage;
