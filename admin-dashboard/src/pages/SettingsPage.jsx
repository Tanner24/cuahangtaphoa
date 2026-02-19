import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsPage({ user, onLogout }) {
    const navigate = useNavigate();
    const isSuperAdmin = user?.role === 'super_admin';

    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('admin_settings');
            return saved ? JSON.parse(saved) : {
                theme: 'dark',
                maintenance: false,
                registrations: true,
                emailAlerts: true
            };
        } catch (e) {
            return { theme: 'dark', maintenance: false, registrations: true, emailAlerts: true };
        }
    });

    const [adminPermissions, setAdminPermissions] = useState(() => {
        try {
            const saved = localStorage.getItem('admin_permissions');
            return saved ? JSON.parse(saved) : {
                support_admin: ['customer_support', 'manage_stores'],
                billing_admin: ['view_payments', 'manage_plans']
            };
        } catch (e) {
            return {
                support_admin: ['customer_support', 'manage_stores'],
                billing_admin: ['view_payments', 'manage_plans']
            };
        }
    });

    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const toggleAdminPermission = (role, permissionId) => {
        setAdminPermissions(prev => {
            const current = prev[role] || [];
            const updated = current.includes(permissionId)
                ? current.filter(id => id !== permissionId)
                : [...current, permissionId];
            return { ...prev, [role]: updated };
        });
    };

    useEffect(() => {
        localStorage.setItem('admin_settings', JSON.stringify(settings));
        if (settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [settings]);

    useEffect(() => {
        localStorage.setItem('admin_permissions', JSON.stringify(adminPermissions));
    }, [adminPermissions]);

    const handleLogout = () => {
        if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
            onLogout();
            navigate('/login');
        }
    };

    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleTheme = () => {
        setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
    };

    return (
        <div>
            <div className="page-header">
                <h1>Cài đặt hệ thống</h1>
                <p>Quản lý cấu hình và tài khoản của bạn</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                {/* Profile Card */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="card-title">👤 Thông tin tài khoản</h3>
                        <span className="badge success">Đang hoạt động</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px', marginBottom: '30px' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}>
                            {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', fontWeight: 700 }}>{user?.fullName || user?.username}</h2>
                            <span className="badge info" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {user?.role?.replace(/_/g, ' ') || 'ADMIN'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[
                            { label: 'Họ và tên', value: user?.fullName || 'Super Administrator', icon: 'person' },
                            { label: 'Tên đăng nhập', value: user?.username || 'admin', icon: 'badge' },
                            { label: 'Mã nhân viên', value: `NV-${String(user?.id || 1).padStart(3, '0')}`, icon: 'fingerprint' },
                            { label: 'Email', value: user?.email || 'admin@pos.vn', icon: 'email' },
                            { label: 'Số điện thoại', value: user?.phone || '09xx-xxx-xxx', icon: 'call' },
                            { label: 'Vai trò', value: user?.role?.toUpperCase() || 'SUPER ADMIN', icon: 'shield', isBadge: true }
                        ].map((item, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: idx === 5 ? 'none' : '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
                                    <span className="material-icons" style={{ fontSize: '18px' }}>{item.icon}</span>
                                    <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
                                </div>
                                {item.isBadge ? (
                                    <span className="badge info" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{item.value}</span>
                                ) : (
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Admin Team Card */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="card-title">👥 Đội ngũ quản trị</h3>
                        <button className="btn btn-primary btn-sm">+ Thêm Admin</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { id: 'me', name: user?.fullName || user?.username, role: 'super_admin', roleLabel: 'Super Admin', status: 'Trực tuyến', isMe: true },
                            { id: 'support', name: 'Support Team', role: 'support_admin', roleLabel: 'Support Admin', status: 'Ngoại tuyến', isMe: false },
                            { id: 'billing', name: 'Billing Dept', role: 'billing_admin', roleLabel: 'Billing Admin', status: 'Trực tuyến', isMe: false }
                        ].map((member, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedAdmin(member)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    background: selectedAdmin?.id === member.id ? 'var(--color-bg-body)' : 'var(--color-bg-subtle)',
                                    borderRadius: '12px',
                                    border: selectedAdmin?.id === member.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: member.isMe ? 'var(--color-primary)' : 'var(--color-bg-card)',
                                    color: member.isMe ? 'white' : 'var(--color-text-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }}>
                                    {member.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.name} {member.isMe && <small>(Bạn)</small>}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{member.roleLabel}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: member.status === 'Trực tuyến' ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 700 }}>
                                        {member.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedAdmin ? (
                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '1px', fontWeight: 800, margin: 0 }}>
                                    Chi tiết Quản trị viên
                                </h4>
                                <button className="btn btn-sm" onClick={() => setSelectedAdmin(null)} style={{ padding: '4px 8px' }}>Đóng</button>
                            </div>

                            {/* Staff Info Section */}
                            <div style={{
                                background: 'var(--color-bg-body)',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                marginBottom: '24px'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Họ tên</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedAdmin.name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Vai trò</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedAdmin.roleLabel}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Email</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{selectedAdmin.id}@admin.pos.vn</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Số điện thoại</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>09xx-xxx-xxx</div>
                                    </div>
                                </div>
                            </div>

                            {selectedAdmin.role === 'super_admin' ? (
                                <div style={{ padding: '24px', background: 'var(--color-bg-body)', borderRadius: '16px', border: '1px solid var(--color-success)', textAlign: 'center' }}>
                                    <span className="material-icons" style={{ fontSize: '32px', color: 'var(--color-success)', marginBottom: '8px' }}>verified_user</span>
                                    <h5 style={{ margin: '0 0 4px' }}>Toàn quyền hệ thống</h5>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                        Tài khoản Super Admin có toàn quyền truy cập mọi tính năng.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '12px' }}>
                                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '0.5px', fontWeight: 700, margin: 0 }}>
                                            Phân quyền Dashboard
                                        </h4>
                                    </div>
                                    <div style={{ background: 'var(--color-bg-subtle)', borderRadius: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                                                    <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-secondary)' }}>Tính năng Dashboard</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', width: '80px' }}>Cho phép</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { id: 'manage_stores', label: 'Quản lý Cửa hàng (Stores)', icon: 'store' },
                                                    { id: 'manage_plans', label: 'Quản lý Gói dịch vụ (Plans)', icon: 'sell' },
                                                    { id: 'view_payments', label: 'Xem Thanh toán (Payments)', icon: 'payments' },
                                                    { id: 'system_logs', label: 'Xem Nhật ký hệ thống (Logs)', icon: 'history' },
                                                    { id: 'customer_support', label: 'Quản lý Hỗ trợ (Tickets)', icon: 'support_agent' },
                                                    { id: 'system_settings', label: 'Cấu hình SaaS Settings', icon: 'settings' }
                                                ].map((p, i) => (
                                                    <tr key={p.id} style={{ borderBottom: i < 5 ? '1px solid var(--color-border)' : 'none' }}>
                                                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span className="material-icons" style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>{p.icon}</span>
                                                                {p.label}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={adminPermissions[selectedAdmin.role]?.includes(p.id)}
                                                                onChange={() => toggleAdminPermission(selectedAdmin.role, p.id)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={{ marginTop: '32px', padding: '24px', textAlign: 'center', background: 'var(--color-bg-subtle)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Chọn một thành viên để xem và thiết lập quyền hạn
                            </p>
                        </div>
                    )}
                </div>

                {/* Settings Card */}
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '20px' }}>⚙️ Tùy chỉnh hệ thống</h3>

                    {/* Interface Settings */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px', letterSpacing: '1px' }}>Giao diện</h4>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>Chế độ Tối / Sáng</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Thay đổi giao diện dashboard</div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`btn btn-sm ${settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ width: '100px' }}
                            >
                                {settings.theme === 'dark' ? '🌑 Tối' : '☀️ Sáng'}
                            </button>
                        </div>
                    </div>

                    {/* System settings (Super Admin only) */}
                    {isSuperAdmin && (
                        <div>
                            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px', letterSpacing: '1px' }}>Hệ thống SaaS</h4>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Cho phép đăng ký mới</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Người dùng có thể tự tạo cửa hàng</div>
                                </div>
                                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                                    <input type="checkbox" checked={settings.registrations} onChange={() => toggleSetting('registrations')} style={{ opacity: 0, width: 0, height: 0 }} />
                                    <span style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: settings.registrations ? 'var(--color-success)' : '#ccc',
                                        transition: '.4s', borderRadius: '34px'
                                    }}></span>
                                    <span style={{
                                        position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px',
                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                        transform: settings.registrations ? 'translateX(16px)' : 'translateX(0)'
                                    }}></span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Bảo trì hệ thống</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Chỉ Admin mới có thể đăng nhập</div>
                                </div>
                                <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                                    <input type="checkbox" checked={settings.maintenance} onChange={() => toggleSetting('maintenance')} style={{ opacity: 0, width: 0, height: 0 }} />
                                    <span style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: settings.maintenance ? 'var(--color-accent)' : '#ccc',
                                        transition: '.4s', borderRadius: '34px'
                                    }}></span>
                                    <span style={{
                                        position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px',
                                        backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                                        transform: settings.maintenance ? 'translateX(16px)' : 'translateX(0)'
                                    }}></span>
                                </label>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            <div className="card" style={{ marginTop: '24px', borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ color: 'var(--color-danger)', marginBottom: '4px' }}>Khu vực nguy hiểm</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                            Đăng xuất khỏi phiên làm việc hiện tại.
                        </p>
                    </div>
                    <button className="btn btn-danger" onClick={handleLogout}>
                        🚪 Đăng xuất ngay
                    </button>
                </div>
            </div>

            {/* Application Info */}
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <p>EPOS SaaS Dashboard v1.2.0</p>
                <p>&copy; 2024 EPOS System. All rights reserved.</p>
            </div>
        </div>
    );
}

export default SettingsPage;
