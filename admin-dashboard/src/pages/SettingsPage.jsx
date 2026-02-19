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

    useEffect(() => {
        localStorage.setItem('admin_settings', JSON.stringify(settings));
        if (settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [settings]);

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

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label" style={{ color: 'var(--color-text-secondary)' }}>Tên đăng nhập</label>
                            <div style={{
                                padding: '10px 12px',
                                background: 'var(--color-bg-subtle)',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '1.2em' }}>🔒</span>
                                {user?.username || 'N/A'}
                            </div>
                        </div>
                    </div>
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
                <p>POS SaaS Dashboard v1.2.0</p>
                <p>&copy; 2024 POS System. All rights reserved.</p>
            </div>
        </div>
    );
}

export default SettingsPage;
