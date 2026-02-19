import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext({
    user: null,
    login: () => { },
    logout: () => { },
    loading: true,
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Check for token in URL (Auto-login from Admin)
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');

            if (tokenFromUrl) {
                localStorage.setItem('pos_token', tokenFromUrl);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            const token = localStorage.getItem('pos_token');
            if (token) {
                try {
                    // Verify token and get fresh user data
                    const user = await authService.getMe();
                    setUser(user);
                    localStorage.setItem('pos_user', JSON.stringify(user));
                } catch (error) {
                    console.error('Auth verification failed:', error);
                    // Fallback to cache if network error (not 401, which is handled by interceptor)
                    const cachedUser = JSON.parse(localStorage.getItem('pos_user') || 'null');
                    if (cachedUser) {
                        setUser(cachedUser);
                    }
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        try {
            const { user, accessToken } = await authService.login(username, password);
            setUser(user);
            // Token is already set in authService, but for safety in context update:
            if (accessToken) localStorage.setItem('pos_token', accessToken);
            localStorage.setItem('pos_user', JSON.stringify(user));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (data) => {
        setLoading(true);
        try {
            const result = await authService.register(data);
            setUser(result.user);
            if (result.accessToken) localStorage.setItem('pos_token', result.accessToken);
            localStorage.setItem('pos_user', JSON.stringify(result.user));
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
