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
        // Check if token exists on load
        const token = localStorage.getItem('pos_token');
        if (token) {
            // Decode user info (naive approach for MVP)
            const cachedUser = JSON.parse(localStorage.getItem('pos_user') || 'null');
            if (cachedUser) {
                setUser(cachedUser);
            }
        }
        setLoading(false);
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
