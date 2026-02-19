import { useState } from 'react';
import api from '../services/api';

function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
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
                    <input
                        id="password"
                        className="form-input"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
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
