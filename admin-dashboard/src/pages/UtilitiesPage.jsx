import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const UtilityCard = ({ title, icon, color, children }) => (
    <div className="card" style={{ height: '100%', borderTop: `4px solid ${color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span className="material-icons" style={{ color: color }}>{icon}</span>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{title}</h3>
        </div>
        {children}
    </div>
);

export default function UtilitiesPage() {
    const [msg, setMsg] = useState({ title: '', content: '', type: 'info' });
    const [broadcasts, setBroadcasts] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [settings, setSettings] = useState({
        vietqr_api: { enabled: true, gateway: 'https://api.vietqr.io/v2/business', apiKey: '' },
        support_info: { hotline: '0987.654.321', zalo: 'https://zalo.me', help_url: '#', email: 'support@example.com' }
    });
    const toast = useToast();

    useEffect(() => {
        loadBroadcasts();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.getSystemSettings();
            if (data && Object.keys(data).length > 0) {
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error('Load settings error:', err);
        }
    };

    const loadBroadcasts = async () => {
        try {
            const data = await api.getAnnouncements();
            setBroadcasts(data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBroadcast = async (e) => {
        e.preventDefault();
        if (!msg.title || !msg.content) return;

        try {
            await api.createAnnouncement(msg);
            setMsg({ title: '', content: '', type: 'info' });
            loadBroadcasts();
            toast.success('Đã phát thông báo thành công tới tất cả cửa hàng');
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleUpdateSettings = async (key, value) => {
        try {
            await api.updateSystemSetting({ key, value });
            setSettings(prev => ({ ...prev, [key]: value }));
            toast.success('Đã cập nhật cấu hình hệ thống');
        } catch (err) {
            toast.error('Lỗi cập nhật cấu hình: ' + err.message);
        }
    };

    return (
        <div className="utilities-container" style={{ padding: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1>Trung Tâm Tiện Ích</h1>
                <p>Công cụ quản trị và hỗ trợ vận hành hệ thống</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* 1. BROADCAST UTILITY */}
                {/* 1. BROADCAST UTILITY */}
                <UtilityCard title="Thông Báo Toàn Hệ Thống" icon="campaign" color="var(--color-primary)">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    Tiêu đề thông báo
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {[
                                            { t: 'Lễ/Tết', c: 'Thông báo lịch nghỉ Tết Nguyên Đán 2026', type: 'info' },
                                            { t: 'Bảo trì', c: 'Bảo trì hệ thống định kỳ', type: 'warning' },
                                            { t: 'Tính năng', c: 'Cập nhật tính năng mới: Quản lý công nợ', type: 'info' }
                                        ].map((p, i) => (
                                            <button key={i} type="button" className="btn btn-secondary btn-sm" style={{ fontSize: '0.65rem', padding: '2px 8px' }}
                                                onClick={() => setMsg({ ...msg, title: p.c, type: p.type })}>
                                                {p.t}
                                            </button>
                                        ))}
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ví dụ: Lịch nghỉ lễ, Bảo trì..."
                                    value={msg.title}
                                    style={{ border: msg.title ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }}
                                    onChange={e => setMsg({ ...msg, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Nội dung chi tiết</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    placeholder="Nhập nội dung hiển thị trên POS của khách hàng..."
                                    value={msg.content}
                                    onChange={e => setMsg({ ...msg, content: e.target.value })}
                                    required
                                    style={{ resize: 'none' }}
                                ></textarea>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                    <label className="form-label">Mức độ khẩn cấp</label>
                                    <select className="form-control" value={msg.type} onChange={e => setMsg({ ...msg, type: e.target.value })}>
                                        <option value="info">🔵 Thông tin (Bình thường)</option>
                                        <option value="warning">🟡 Cảnh báo (Quan trọng)</option>
                                        <option value="danger">🔴 Khẩn cấp (Nghiêm trọng)</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
                                    <span className="material-icons" style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '8px' }}>bolt</span>
                                    Phát Ngay
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPreview(true)} style={{ padding: '0.75rem' }}>
                                    <span className="material-icons">visibility</span>
                                </button>
                            </div>
                        </form>

                        <div style={{ marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Lịch sử phát sóng</h4>
                                <button className="btn btn-icon btn-sm" onClick={loadBroadcasts} title="Tải lại">
                                    <span className="material-icons" style={{ fontSize: '18px' }}>refresh</span>
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                {broadcasts.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', background: 'var(--color-bg-body)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                                        Chưa có thông báo nào được gửi
                                    </div>
                                ) : (
                                    broadcasts.map(b => (
                                        <div key={b.id} style={{
                                            background: 'var(--color-bg-body)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            border: '1px solid var(--color-border)',
                                            borderLeft: `4px solid ${b.type === 'danger' ? '#ef4444' : b.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {b.type === 'danger' && <span className="material-icons" style={{ fontSize: '14px', color: '#ef4444' }}>error</span>}
                                                    {b.title}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', display: 'flex', gap: '10px' }}>
                                                    <span>📅 {new Date(b.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    <span>⏰ {new Date(b.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background: b.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                                    color: b.isActive ? '#22c55e' : '#6b7280',
                                                    border: `1px solid ${b.isActive ? '#22c55e33' : '#6b728033'}`
                                                }}>
                                                    {b.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ TẮT'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </UtilityCard>

                {/* 2. SYSTEM HEALTH */}
                <UtilityCard title="Tình Trạng Hệ Thống" icon="analytics" color="var(--color-success)">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="stat-item" style={{ padding: '15px', background: 'var(--color-bg-body)', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Disk Usage</p>
                            <h4 style={{ margin: '5px 0' }}>45.2 GB <small>/ 100GB</small></h4>
                            <div style={{ height: '6px', background: '#eee', borderRadius: '3px', marginTop: '10px' }}>
                                <div style={{ width: '45%', height: '100%', background: 'var(--color-success)', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                        <div className="stat-item" style={{ padding: '15px', background: 'var(--color-bg-body)', borderRadius: 'var(--radius-md)' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Memory (RAM)</p>
                            <h4 style={{ margin: '5px 0' }}>1.2 GB <small>/ 4GB</small></h4>
                            <div style={{ height: '6px', background: '#eee', borderRadius: '3px', marginTop: '10px' }}>
                                <div style={{ width: '30%', height: '100%', background: 'var(--color-info)', borderRadius: '3px' }}></div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontSize: '0.9rem' }}>API Server Status</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.8rem' }}>● Hoạt động</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ fontSize: '0.9rem' }}>Database Sync</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.8rem' }}>● Ổn định</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                            <span style={{ fontSize: '0.9rem' }}>Backup tự động</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Cách đây 4 giờ</span>
                        </div>
                    </div>

                    <button className="btn btn-secondary" style={{ width: '100%', marginTop: '15px' }}>
                        Kiểm tra chi tiết
                    </button>
                </UtilityCard>

                {/* 3. QUICK ACTIONS */}
                <UtilityCard title="Thao Tác Nhanh" icon="bolt" color="var(--color-warning)">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', gap: '5px' }}>
                            <span className="material-icons">refresh</span>
                            <span style={{ fontSize: '0.75rem' }}>Refresh Cache</span>
                        </button>
                        <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', gap: '5px' }}>
                            <span className="material-icons">cloud_download</span>
                            <span style={{ fontSize: '0.75rem' }}>Backup DB</span>
                        </button>
                        <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', gap: '5px' }}>
                            <span className="material-icons">cleaning_services</span>
                            <span style={{ fontSize: '0.75rem' }}>Clean Logs</span>
                        </button>
                        <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', gap: '5px' }}>
                            <span className="material-icons">support_agent</span>
                            <span style={{ fontSize: '0.75rem' }}>Support Mode</span>
                        </button>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--color-bg-body)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                        <h5 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Ghi chú quản trị (Local)</h5>
                        <textarea
                            style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', fontSize: '0.85rem', marginTop: '5px', outline: 'none' }}
                            rows="4"
                            placeholder="Nhập ghi chú nhanh tại đây..."
                        ></textarea>
                    </div>
                </UtilityCard>

                {/* 4. EXTENSIONS */}
                <UtilityCard title="Tiện Ích Mở Rộng" icon="extension" color="#9333ea">
                    <div style={{ background: 'rgba(147, 51, 234, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(147, 51, 234, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
                            <div style={{ background: 'white', padding: '10px', borderRadius: '12px', shadow: '0 2px 5px rgba(0,0,0,0.1)', color: '#9333ea' }}>
                                <span className="material-icons">qr_code</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h5 style={{ margin: '0 0 5px', fontSize: '1rem', fontWeight: 700 }}>Tra cứu Mã số thuế tự động</h5>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                                    Tự động tìm và điền Tên công ty/Địa chỉ từ VietQR API khi nhập MST tại quầy.
                                </p>

                                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9333ea', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>API Gateway</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={settings.vietqr_api.gateway}
                                            readOnly
                                            style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.05)' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9333ea', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>API Key (Client ID)</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Để trống nếu dùng bản miễn phí"
                                            value={settings.vietqr_api.apiKey}
                                            onChange={e => setSettings({ ...settings, vietqr_api: { ...settings.vietqr_api, apiKey: e.target.value } })}
                                            onBlur={() => handleUpdateSettings('vietqr_api', settings.vietqr_api)}
                                            style={{ fontSize: '0.8rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div style={{ paddingTop: '5px' }}>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.vietqr_api.enabled}
                                        onChange={e => {
                                            const newVal = { ...settings.vietqr_api, enabled: e.target.checked };
                                            handleUpdateSettings('vietqr_api', newVal);
                                        }}
                                    />
                                    <span className="slider round" style={{ background: settings.vietqr_api.enabled ? '#9333ea' : '#ccc' }}></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--color-bg-body)', borderRadius: '12px', fontSize: '0.8rem' }}>
                        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons" style={{ fontSize: '16px', color: '#9333ea' }}>info</span>
                            Cấu hình này sẽ được áp dụng cho <b>toàn bộ hệ thống POS</b>.
                        </p>
                    </div>
                </UtilityCard>

                {/* 5. SUPPORT INFO */}
                <UtilityCard title="Hỗ Trợ Khách Hàng" icon="support_agent" color="#10b981">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Hotline hỗ trợ</label>
                            <div className="relative">
                                <span className="material-icons" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#10b981' }}>phone</span>
                                <input style={{ width: '100%', padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                                    value={settings.support_info.hotline}
                                    placeholder="Ví dụ: 0987.654.321"
                                    onChange={e => setSettings({ ...settings, support_info: { ...settings.support_info, hotline: e.target.value } })}
                                    onBlur={() => handleUpdateSettings('support_info', settings.support_info)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Link Zalo OA</label>
                            <div className="relative">
                                <span className="material-icons" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#3b82f6' }}>chat</span>
                                <input style={{ width: '100%', padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                                    value={settings.support_info.zalo}
                                    placeholder="https://zalo.me/..."
                                    onChange={e => setSettings({ ...settings, support_info: { ...settings.support_info, zalo: e.target.value } })}
                                    onBlur={() => handleUpdateSettings('support_info', settings.support_info)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Link Hướng dẫn</label>
                            <div className="relative">
                                <span className="material-icons" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#f59e0b' }}>help_outline</span>
                                <input style={{ width: '100%', padding: '12px 12px 12px 40px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, outline: 'none' }}
                                    value={settings.support_info.help_url}
                                    placeholder="https://docs.example.com"
                                    onChange={e => setSettings({ ...settings, support_info: { ...settings.support_info, help_url: e.target.value } })}
                                    onBlur={() => handleUpdateSettings('support_info', settings.support_info)}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '5px', padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-icons" style={{ fontSize: '16px' }}>info</span>
                                Thông tin này sẽ hiển thị tại <b>Dashboard của POS Client</b>.
                            </p>
                        </div>
                    </div>
                </UtilityCard>
            </div>

            {/* PREVIEW MODAL */}
            {showPreview && (
                <div className="modal-overlay" style={{ zIndex: 1000, background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowPreview(false)}>
                    <div className="modal" style={{ maxWidth: '500px', padding: 0, overflow: 'hidden', background: 'transparent', boxShadow: 'none' }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            background: msg.type === 'danger' ? 'linear-gradient(135deg, #991b1b, #ef4444)' : msg.type === 'warning' ? 'linear-gradient(135deg, #92400e, #f59e0b)' : 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                            padding: '32px',
                            borderRadius: '24px',
                            color: 'white',
                            textAlign: 'center'
                        }}>
                            <div style={{ background: 'rgba(255,255,255,0.2)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <span className="material-icons" style={{ fontSize: '32px' }}>{msg.type === 'info' ? 'campaign' : msg.type === 'warning' ? 'warning' : 'error'}</span>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 16px' }}>{msg.title || 'Tiêu đề thông báo'}</h2>
                            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '20px', borderRadius: '16px', marginBottom: '32px', fontSize: '1rem' }}>
                                {msg.content || 'Nội dung thông báo sẽ hiển thị tại đây...'}
                            </div>
                            <button className="btn" style={{ background: 'white', color: '#1e3a8a', width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 700 }}>Đã hiểu</button>
                            <p style={{ marginTop: '12px', opacity: 0.7, fontSize: '0.8rem' }}>Xem trước giao diện trên POS</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
