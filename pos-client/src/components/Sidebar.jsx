import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { useQuota } from '../hooks/useQuota';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    ClipboardList,
    RotateCcw, // For Refunds
    BarChart3,
    Settings,
    LogOut,
    Tags, // For Categories
    User,
    ShieldAlert,
    ShieldCheck,
    Crown,
    Lock
} from 'lucide-react';

const MENU_GROUPS = [
    {
        title: 'Tổng quan',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
        ]
    },
    {
        title: 'Giao dịch',
        items: [
            { path: '/pos', label: 'Bán hàng (POS)', icon: ShoppingCart },
            { path: '/orders', label: 'Lịch sử đơn hàng', icon: ClipboardList },
            { path: '/refunds', label: 'Trả hàng & Hoàn tiền', icon: RotateCcw, feature: 'refunds' },
        ]
    },
    {
        title: 'Hàng hóa',
        items: [
            { path: '/inventory', label: 'Sản phẩm', icon: Package },
            { path: '/categories', label: 'Danh mục & Brand', icon: Tags, feature: 'inventory_advanced' },
        ]
    },
    {
        title: 'Báo cáo',
        items: [
            { path: '/revenue-report', label: 'Báo cáo doanh thu', icon: BarChart3, feature: 'revenue_report' },
            { path: '/tax-report', label: 'Báo cáo thuế & Sổ sách', icon: ShieldCheck, feature: 'tax_report' }
        ]
    },
    {
        title: 'Hệ thống',
        items: [
            { path: '/logs', label: 'Nhật ký hệ thống', icon: ShieldAlert, feature: 'logs' },
            { path: '/settings', label: 'Cài đặt', icon: Settings }
        ]
    }
];

export default function Sidebar() {
    const location = useLocation();
    const { logout, user } = useAuth();
    const { shopName, logoUrl, address } = useShop();
    const { isPro, hasFeature, tier } = useQuota();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="hidden md:flex flex-col w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white shadow-xl z-50">
            {/* Logo Area */}
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-10 h-10 rounded-md object-contain bg-white"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                ) : null}
                <div className={`w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50 ${logoUrl ? 'hidden' : 'flex'}`}>
                    <ShoppingCart size={24} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="font-bold text-xl tracking-wide truncate" title={shopName || 'EPOS Pro'}>
                        {shopName || 'EPOS Pro'}
                    </h1>
                    <p className="text-xs text-slate-400 font-medium truncate" title={address || 'Store Manager'}>
                        {address || 'Store Manager'}
                    </p>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
                {MENU_GROUPS.map((group, idx) => (
                    <div key={idx}>
                        <h3 className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                const locked = item.feature && !hasFeature(item.feature);

                                return (
                                    <Link
                                        key={item.path}
                                        to={locked ? '#' : item.path}
                                        onClick={(e) => locked && e.preventDefault()}
                                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${locked ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={20} className={isActive ? 'animate-pulse' : ''} />
                                            <span>{item.label}</span>
                                        </div>
                                        {locked && (
                                            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded text-[10px] font-black uppercase">
                                                <Lock size={10} /> PRO
                                            </div>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                        <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-white">{user?.fullName || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.role || 'Store Owner'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 bg-slate-800 hover:bg-red-600/90 text-slate-300 hover:text-white py-2.5 rounded-lg transition-all duration-300 text-sm font-medium group"
                >
                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}
