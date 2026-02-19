import { useState, useEffect } from 'react';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const savedUsername = localStorage.getItem('admin_remembered_username');
        const savedPassword = localStorage.getItem('admin_remembered_password');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
        if (savedPassword) {
            setPassword(savedPassword);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (rememberMe) {
                localStorage.setItem('admin_remembered_username', username);
                localStorage.setItem('admin_remembered_password', password);
            } else {
                localStorage.removeItem('admin_remembered_username');
                localStorage.removeItem('admin_remembered_password');
            }

            const data = await api.login(username, password);
            onLogin(data.user);
        } catch (err) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div className="sidebar-logo" style={{ margin: '0 auto 1rem', width: 56, height: 56, fontSize: '1.5rem' }}>
                        P
                    </div>
                </div>
                <h1>Admin Center</h1>
                <p>Đăng nhập vào hệ thống quản trị POS SaaS</p>

                {error && <div className="login-error">{error}</div>}

                <div className="form-group">
                    <label className="form-label" htmlFor="username">Tên đăng nhập</label>
                    <input
                        id="username"
                        className="form-input"
                        type="text"
                        placeholder="admin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">Mật khẩu</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                        <input
                            id="password"
                            className="form-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                        />
                        <span>Tự động đăng nhập</span>
                    </label>
                </div>

                <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={loading}
                    style={{ marginTop: '0.5rem' }}
                >
                    {loading ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập'}
                </button>

                <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    POS SaaS Admin Center v1.0 — Chỉ dành cho quản trị viên
                </p>
            </form>
        </div>
    );
}

export default LoginPage;
