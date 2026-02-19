import { useLocation, useNavigate } from 'react-router-dom';

const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/stores', label: 'Cửa hàng', icon: '🏪' },
    { path: '/plans', label: 'Gói dịch vụ', icon: '💎' },
    { path: '/payments', label: 'Thanh toán', icon: '💳' },
    { path: '/logs', label: 'Nhật ký', icon: '📋' },
];

function Sidebar({ user, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            onLogout();
            navigate('/login');
        }
    };

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-logo">P</div>
                <div className="sidebar-title">
                    <h2>POS Admin</h2>
                    <span>SaaS Center</span>
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
