import { useState, useEffect } from 'react';
import { posService } from '../services/api';

export default function SupportModal({ isOpen, onClose }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('list'); // list, create, chat
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [form, setForm] = useState({ subject: '', content: '', priority: 'medium' });
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTickets();
        }
    }, [isOpen]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const data = await posService.getMyTickets();
            setTickets(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadTicketDetail = async (id) => {
        try {
            const data = await posService.getTicketDetail(id);
            setSelectedTicket(data);
            setView('chat');
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await posService.createTicket(form);
            setForm({ subject: '', content: '', priority: 'medium' });
            setView('list');
            loadTickets();
        } catch (e) {
            alert('Lỗi: ' + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendMsg = async (e) => {
        e.preventDefault();
        if (!message.trim() || !selectedTicket) return;
        try {
            await posService.addTicketMessage(selectedTicket.id, message);
            setMessage('');
            loadTicketDetail(selectedTicket.id);
        } catch (e) {
            console.error(e);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {view !== 'list' && (
                            <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <span className="material-icons" style={{ color: '#64748b' }}>arrow_back</span>
                            </button>
                        )}
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                            {view === 'list' ? 'Hỗ Trợ Kỹ Thuật' : view === 'create' ? 'Gửi Yêu Cầu Mới' : selectedTicket?.subject}
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span className="material-icons" style={{ color: '#64748b' }}>close</span>
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {view === 'list' ? (
                        <>
                            <button onClick={() => setView('create')} style={{ width: '100%', padding: '16px', background: '#0f172a', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span className="material-icons">add_circle</span>
                                Tạo yêu cầu mới
                            </button>

                            {loading ? (
                                <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Đang tải...</div>
                            ) : tickets.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Bạn chưa có yêu cầu nào</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {tickets.map(t => (
                                        <div key={t.id} onClick={() => loadTicketDetail(t.id)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: t.status === 'open' ? '#3b82f6' : t.status === 'pending' ? '#f59e0b' : '#10b981' }}>
                                                    {t.status === 'open' ? '● Mới' : t.status === 'pending' ? '● Đang chờ' : '● Đã xử lý'}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.subject}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : view === 'create' ? (
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Tiêu đề</label>
                                <input required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                    value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                                    placeholder="Ví dụ: Lỗi in hóa đơn, Cần thêm tính năng..."
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Mức độ ưu tiên</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none' }}
                                    value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                    <option value="low">Thấp</option>
                                    <option value="medium">Bình thường</option>
                                    <option value="high">Cao / Gấp</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>Nội dung chi tiết</label>
                                <textarea required rows="5" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }}
                                    value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                                />
                            </div>
                            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '16px', background: '#3b82f6', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 700, marginTop: '12px' }}>
                                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedTicket?.messages?.map(m => (
                                    <div key={m.id} style={{
                                        maxWidth: '85%',
                                        alignSelf: m.senderRole === 'admin' ? 'flex-start' : 'flex-end',
                                        background: m.senderRole === 'admin' ? '#f1f5f9' : '#3b82f6',
                                        color: m.senderRole === 'admin' ? '#0f172a' : 'white',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        fontSize: '0.9rem'
                                    }}>
                                        <div style={{ fontSize: '0.65rem', opacity: 0.7, marginBottom: '4px', fontWeight: 700 }}>{m.senderName}</div>
                                        {m.content}
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSendMsg} style={{ display: 'flex', gap: '8px', marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '16px' }}>
                                <input style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', padding: '4px' }}
                                    placeholder="Nhập tin nhắn..." value={message} onChange={e => setMessage(e.target.value)}
                                />
                                <button type="submit" disabled={!message.trim()} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', padding: '8px 12px' }}>
                                    <span className="material-icons" style={{ fontSize: '18px' }}>send</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
