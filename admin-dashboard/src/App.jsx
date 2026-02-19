import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StoresPage from './pages/StoresPage';
import PlansPage from './pages/PlansPage';
import PaymentsPage from './pages/PaymentsPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import UtilitiesPage from './pages/UtilitiesPage';
import SupportPage from './pages/SupportPage';
import ProductsPage from './pages/ProductsPage';
import { ToastProvider } from './context/ToastContext';

function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('admin_user');
        return saved ? JSON.parse(saved) : null;
    });

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setUser(null);
    };

    if (!user) {
        return (
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        );
    }

    return (
        <ToastProvider>
            <BrowserRouter>
                <div className="app-layout">
                    <Sidebar user={user} onLogout={handleLogout} />
                    <main className="main-content">
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/stores" element={<StoresPage />} />
                            <Route path="/plans" element={<PlansPage />} />
                            <Route path="/payments" element={<PaymentsPage />} />
                            <Route path="/logs" element={<LogsPage />} />
                            <Route path="/utilities" element={<UtilitiesPage />} />
                            <Route path="/support" element={<SupportPage />} />
                            <Route path="/products" element={<ProductsPage />} />
                            <Route path="/settings" element={<SettingsPage user={user} onLogout={handleLogout} />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;
