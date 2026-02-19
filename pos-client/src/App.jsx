import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ShopProvider } from './context/ShopContext';
import Login from './pages/Login';
import Pos from './pages/Pos';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Debt from './pages/Debt';
import Report from './pages/Report';
import Settings from './pages/Settings';
import Categories from './pages/Categories'; // New page
import Refunds from './pages/Refunds'; // New page
import Sidebar from './components/Sidebar';
import Logs from './pages/Logs'; // New page
import AnnouncementPopup from './components/AnnouncementPopup';

// App Layout with Sidebar (Protected)
function AppLayout() {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <Sidebar />
            <div className="flex-1 md:ml-64 min-w-0 transition-all duration-300">
                <AnnouncementPopup />
                <Outlet />
            </div>
        </div>
    );
}

// Protected Route Wrapper
const PrivateRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center">Đang tải...</div>;
    return user ? <AppLayout /> : <Navigate to="/login" replace />;
};

function AppContent() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
                <Route path="/" element={<Navigate to="/pos" replace />} />

                {/* POS with Cart Context */}
                <Route path="/pos" element={<CartProvider><Pos /></CartProvider>} />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/categories" element={<Categories />} /> {/* New Route */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/refunds" element={<Refunds />} /> {/* New Route */}
                <Route path="/debts" element={<Debt />} />
                <Route path="/report" element={<Report />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

// App entry point
export default function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <AuthProvider>
                <ShopProvider>
                    <AppContent />
                </ShopProvider>
            </AuthProvider>
        </Router>
    );
}
