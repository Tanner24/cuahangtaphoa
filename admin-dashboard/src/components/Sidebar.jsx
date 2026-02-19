import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/stores', label: 'Cửa hàng', icon: '🏪' },
    { path: '/plans', label: 'Gói dịch vụ', icon: '💎' },
    { path: '/payments', label: 'Thanh toán', icon: '💳' },
    { path: '/logs', label: 'Nhật ký', icon: '📋' },
];

const systems = [
    { id: 'admin', name: 'POS Admin', subtitle: 'SaaS Center', icon: 'P', color: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-light))', url: '/' },
    { id: 'epos', name: 'Epos Pro', subtitle: 'Enterprise', icon: 'E', color: 'linear-gradient(135deg, #00d2a0, #55efc4)', url: '/epos-pro' },
    { id: 'jp', name: 'Nippon POS', subtitle: 'Japan Edition', icon: '日', color: 'linear-gradient(135deg, #ff6b81, #fab1a0)', url: '/jp' },
];

function Sidebar({ user, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [currentSystem, setCurrentSystem] = useState(systems[0]);

    const handleLogout = () => {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            onLogout();
            navigate('/login');
        }
    };

    const handleSystemChange = (system) => {
        setCurrentSystem(system);
        setIsSwitcherOpen(false);
        // In a real app, this might redirect to a different URL
        // navigate(system.url);
    };

    return (
        <aside className="sidebar">
            {/* Header / System Switcher */}
            <div className="sidebar-header">
                <div className="system-switcher">
                    <div
                        className={`switcher-trigger ${isSwitcherOpen ? 'open' : ''}`}
                        onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    >
                        <div className="sidebar-logo" style={{ background: currentSystem.color }}>
                            {currentSystem.icon}
                        </div>
                        <div className="sidebar-title">
                            <h2>{currentSystem.name}</h2>
                            <span>{currentSystem.subtitle}</span>
                        </div>
                        <div className="switcher-chevron">▾</div>
                    </div>

                    <div className={`switcher-dropdown ${isSwitcherOpen ? 'open' : ''}`}>
                        {systems.map((sys) => (
                            <div
                                key={sys.id}
                                className={`switcher-item ${currentSystem.id === sys.id ? 'active' : ''}`}
                                onClick={() => handleSystemChange(sys)}
                            >
                                <div className="switcher-mini-logo" style={{ background: sys.color }}>
                                    {sys.icon}
                                </div>
                                <div className="switcher-info">
                                    <strong>{sys.name}</strong>
                                    <span>{sys.subtitle}</span>
                                </div>
                                {currentSystem.id === sys.id && (
                                    <div className="switcher-active-indicator" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <span className="nav-section-title">Quản lý</span>
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-item-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}

                <span className="nav-section-title">Ứng dụng</span>
                <button
                    className={`nav-item ${location.pathname === '/products' ? 'active' : ''}`}
                    onClick={() => navigate('/products')}
                >
                    <span className="nav-item-icon">📦</span>
                    <span>Sản phẩm</span>
                </button>
                <button
                    className={`nav-item ${location.pathname === '/utilities' ? 'active' : ''}`}
                    onClick={() => navigate('/utilities')}
                >
                    <span className="nav-item-icon">🛠️</span>
                    <span>Tiện ích</span>
                </button>
                <button
                    className={`nav-item ${location.pathname === '/support' ? 'active' : ''}`}
                    onClick={() => navigate('/support')}
                >
                    <span className="nav-item-icon">🎧</span>
                    <span>Hỗ trợ</span>
                </button>

                <span className="nav-section-title" style={{ marginTop: 'auto' }}>Hệ thống</span>
                <button
                    className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}
                    onClick={() => navigate('/settings')}
                >
                    <span className="nav-item-icon">⚙️</span>
                    <span>Cài đặt</span>
                </button>
            </nav>

            {/* Footer / User Info */}
            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-avatar">
                        {(user?.fullName || user?.username || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                        <strong>{user?.fullName || user?.username}</strong>
                        <span>{user?.role?.replace('_', ' ')}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
