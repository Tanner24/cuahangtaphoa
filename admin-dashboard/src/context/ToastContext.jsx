import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', title = '') => {
        const id = Date.now();
        const titles = {
            success: 'Thành công',
            error: 'Lỗi',
            warning: 'Cảnh báo',
            info: 'Thông báo'
        };

        setToasts(prev => [...prev, { id, message, type, title: title || titles[type] }]);

        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ success: (m, t) => addToast(m, 'success', t), error: (m, t) => addToast(m, 'error', t), info: (m, t) => addToast(m, 'info', t), warning: (m, t) => addToast(m, 'warning', t) }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast ${toast.type}`}>
                        <div className="toast-icon">
                            <span className="material-icons">
                                {toast.type === 'success' && 'check_circle'}
                                {toast.type === 'error' && 'error'}
                                {toast.type === 'info' && 'info'}
                                {toast.type === 'warning' && 'warning'}
                            </span>
                        </div>
                        <div className="toast-content">
                            <div className="toast-title">{toast.title}</div>
                            <div className="toast-message">{toast.message}</div>
                        </div>
                        <div className="toast-close" onClick={() => removeToast(toast.id)}>
                            <span className="material-icons" style={{ fontSize: 18 }}>close</span>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
