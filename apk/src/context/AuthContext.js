import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, registerLogoutCallback } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkToken = async () => {
        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const data = await AsyncStorage.getItem('userData');
            if (token) {
                setUserToken(token);
                setUserData(data ? JSON.parse(data) : null);
            }
        } catch (e) {
            console.error('Failed to load token', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkToken();
        registerLogoutCallback(() => {
            setUserToken(null);
            setUserData(null);
        });
    }, []);

    const login = async (username, password) => {
        setIsLoading(true);
        try {
            const response = await authService.login(username, password);
            if (response.accessToken) {
                setUserToken(response.accessToken);
                setUserData(response.user);
            }
        } catch (e) {
            console.error('Login error:', e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await authService.logout();
            setUserToken(null);
            setUserData(null);
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            setIsLoading(false);
        }
    };
    const register = async ({ storeName, phone, fullName, password }) => {
        setIsLoading(true);
        try {
            const response = await authService.register({ storeName, phone, fullName, password });
            if (response.accessToken) {
                setUserToken(response.accessToken);
                setUserData(response.user);
            }
        } catch (e) {
            console.error('Register error:', e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ userToken, userData, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
