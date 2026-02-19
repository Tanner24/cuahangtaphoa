import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [reply, setReply] = useState('');
    const toast = useToast();

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const data = await api.getTickets();
            setTickets(data);
        } catch (err) {
            toast.error('Lỗi lấy danh sách ticket: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadTicketDetail = async (id) => {
        try {
            const data = await api.getTicketDetail(id);
            setSelectedTicket(data);
        } catch (err) {
            toast.error('Lỗi lấy chi tiết ticket: ' + err.message);
        }
    };

    const handleSendReply = async () => {
        if (!reply.trim() || !selectedTicket) return;
        try {
            await api.addTicketMessage(selectedTicket.id, reply);
            setReply('');
            loadTicketDetail(selectedTicket.id);
            loadTickets(); // Refresh list to update status/updatedAt
        } catch (err) {
            toast.error('Lỗi gửi phản hồi: ' + err.message);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.updateTicketStatus(id, status);
            toast.success('Đã cập nhật trạng thái');
            if (selectedTicket?.id === id) {
                loadTicketDetail(id);
            }
            loadTickets();
        } catch (err) {
            toast.error('Lỗi cập nhật trạng thái: ' + err.message);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            open: { bg: '#fee2e2', color: '#ef4444', label: 'Mở' },
            pending: { bg: '#fef3c7', color: '#d97706', label: 'Chờ' },
            resolved: { bg: '#dcfce7', color: '#16a34a', label: 'Đã xử lý' },
            closed: { bg: '#f3f4f6', color: '#6b7280', label: 'Đóng' }
        };
        const s = styles[status] || styles.open;
        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: s.bg,
                color: s.color
            }}>
                {s.label}
            </span>
        );
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải yêu cầu hỗ trợ...</div>;

    return (
        <div style={{ padding: '32px', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Yêu Cầu Hỗ Trợ</h1>
                <p style={{ color: '#64748b', marginTop: '4px' }}>Quản lý và giải đáp thắc mắc từ các chủ cửa hàng</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px', flex: 1, overflow: 'hidden' }}>
                {/* Tickets List */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Danh sách yêu cầu</h3>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                        {tickets.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Chưa có yêu cầu nào</div>
                        ) : (
                            tickets.map(t => (
                                <div key={t.id}
                                    onClick={() => loadTicketDetail(t.id)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '16px',
                                        marginBottom: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedTicket?.id === t.id ? '#f8fafc' : 'transparent',
                                        border: selectedTicket?.id === t.id ? '1px solid #3b82f6' : '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        {getStatusBadge(t.status)}
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</h4>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-icons" style={{ fontSize: '14px' }}>store</span>
                                        {t.store?.name}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ticket Conversation */}
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {selectedTicket ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{selectedTicket.subject}</h3>
                                        {getStatusBadge(selectedTicket.status)}
                                    </div>
                                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Bởi: <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedTicket.store?.name}</span> • ID: #{selectedTicket.id}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {selectedTicket.status !== 'resolved' && (
                                        <button onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')} className="btn btn-success btn-sm">Gửi xong</button>
                                    )}
                                    {selectedTicket.status !== 'closed' && (
                                        <button onClick={() => handleUpdateStatus(selectedTicket.id, 'closed')} className="btn btn-secondary btn-sm">Đóng ticket</button>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#fdfdfd' }}>
                                {selectedTicket.messages?.map(m => (
                                    <div key={m.id} style={{
                                        maxWidth: '80%',
                                        alignSelf: m.senderRole === 'admin' ? 'flex-end' : 'flex-start',
                                        backgroundColor: m.senderRole === 'admin' ? '#0f172a' : 'white',
                                        color: m.senderRole === 'admin' ? 'white' : '#0f172a',
                                        padding: '16px',
                                        borderRadius: '20px',
                                        border: m.senderRole === 'admin' ? 'none' : '1px solid #e2e8f0',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '4px', fontWeight: 700 }}>{m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{m.content}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            {selectedTicket.status !== 'closed' ? (
                                <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' }}>
                                    <textarea
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                        placeholder="Nhập nội dung phản hồi..."
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            resize: 'none',
                                            outline: 'none',
                                            fontSize: '0.95rem'
                                        }}
                                        rows="2"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        className="btn btn-primary"
                                        disabled={!reply.trim()}
                                        style={{ width: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-icons">send</span>
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '0.85rem' }}>
                                    Ticket này đã đóng. Không thể gửi thêm phản hồi.
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <span className="material-icons" style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.1 }}>forum</span>
                            <p>Chọn một yêu cầu bên trái để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
