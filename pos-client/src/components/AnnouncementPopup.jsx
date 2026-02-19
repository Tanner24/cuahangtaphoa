import { useState, useEffect } from 'react';
import { posService } from '../services/api';

const AnnouncementPopup = () => {
    const [announcement, setAnnouncement] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetchAnnouncement();
    }, []);

    const fetchAnnouncement = async () => {
        try {
            const data = await posService.getLatestAnnouncement();
            if (data && data.isActive) {
                // Check if user has dismissed this specific announcement
                const dismissedId = localStorage.getItem('dimissed_announcement_id');
                if (dismissedId !== data.id.toString()) {
                    setAnnouncement(data);
                    setIsVisible(true);
                }
            }
        } catch (err) {
            console.error('Lỗi lấy thông báo:', err);
        }
    };

    const handleDismiss = () => {
        if (announcement) {
            localStorage.setItem('dimissed_announcement_id', announcement.id.toString());
        }
        setIsVisible(false);
    };

    if (!isVisible || !announcement) return null;

    const colors = {
        info: { bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', accent: '#60a5fa', icon: 'campaign' },
        warning: { bg: 'linear-gradient(135deg, #92400e, #f59e0b)', accent: '#fbbf24', icon: 'warning' },
        danger: { bg: 'linear-gradient(135deg, #991b1b, #ef4444)', accent: '#f87171', icon: 'error' }
    };

    const style = colors[announcement.type] || colors.info;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: style.bg,
                width: '100%',
                maxWidth: '500px',
                borderRadius: '24px',
                padding: '32px',
                color: 'white',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: `1px solid ${style.accent}44`,
                animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <button
                    onClick={() => setIsVisible(false)}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <span className="material-icons" style={{ fontSize: '18px' }}>close</span>
                </button>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: `0 0 20px ${style.accent}66`
                    }}>
                        <span className="material-icons" style={{ fontSize: '32px' }}>{style.icon}</span>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>
                        {announcement.title}
                    </h2>
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.1)',
                    padding: '20px',
                    borderRadius: '16px',
                    marginBottom: '32px',
                    lineHeight: '1.6',
                    fontSize: '1rem',
                    textAlign: 'center'
                }}>
                    {announcement.content}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{
                            background: 'white',
                            color: style.bg.includes('#1e3a8a') ? '#1e3a8a' : style.bg.includes('#92400e') ? '#92400e' : '#991b1b',
                            border: 'none',
                            padding: '14px',
                            borderRadius: '14px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'transform 0.2s'
                        }}
                    >
                        Đã hiểu
                    </button>
                    <button
                        onClick={handleDismiss}
                        style={{
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.8)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '12px',
                            borderRadius: '14px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                    >
                        Đẫ hiểu và không hiển thị lại
                    </button>
                </div>
            </div>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleIn {
                        from { transform: scale(0.9); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

export default AnnouncementPopup;
