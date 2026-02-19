import { useState, useEffect } from 'react';
import { posService } from '../services/api';
import { X, Receipt, User, Clock, CreditCard, Box } from 'lucide-react';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await posService.getOrders({ limit: 50 });
            setOrders(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN');

    const OrderDetailModal = ({ order, onClose }) => {
        if (!order) return null;

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
                    {/* Header */}
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Receipt className="text-primary" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chi tiết hóa đơn</h2>
                                <p className="text-xs text-slate-500 font-bold">{order.code}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <Clock size={12} /> Thời gian
                                </div>
                                <div className="text-sm font-bold text-slate-700">{formatDate(order.createdAt)}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <CreditCard size={12} /> Thanh toán
                                </div>
                                <div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${order.paymentMethod === 'DEBT' ? 'bg-orange-100 text-orange-700' :
                                        order.paymentMethod === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {order.paymentMethod === 'DEBT' ? 'Ghi nợ' :
                                            order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1 bg-slate-50 p-4 rounded-2xl border border-dashed">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <User size={12} /> Khách hàng
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-800">{order.customer?.name || 'Khách lẻ'}</span>
                                    <span className="text-xs text-slate-500">{order.customer?.phone || ''}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest px-1">
                                <Box size={12} /> Danh sách sản phẩm
                            </div>
                            <div className="border rounded-2xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Sản phẩm</th>
                                            <th className="px-4 py-3 text-center">SL</th>
                                            <th className="px-4 py-3 text-right">Đơn giá</th>
                                            <th className="px-4 py-3 text-right">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.items?.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-slate-800">{item.product?.name || 'Sản phẩm đã xóa'}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium">{item.product?.barcode}</div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-slate-600">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(item.price)}</td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Total */}
                    <div className="p-6 bg-slate-900 text-white">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Tổng cộng thanh toán</span>
                            <span className="text-2xl font-black text-white">{formatCurrency(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border">
                        <Receipt className="text-primary" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Lịch sử đơn hàng</h1>
                        <p className="text-slate-500 text-xs font-bold">Quản lý và xem lại lỗi các hóa đơn đã xuất.</p>
                    </div>
                </div>
                <button
                    onClick={fetchOrders}
                    className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
                >
                    <Clock className="text-slate-400" size={20} />
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 text-slate-400 uppercase font-black text-[10px] tracking-widest">
                            <tr>
                                <th className="px-6 py-5">Mã đơn</th>
                                <th className="px-6 py-5">Khách hàng</th>
                                <th className="px-6 py-5">Thời gian</th>
                                <th className="px-6 py-5 text-center">PTTT</th>
                                <th className="px-6 py-5 text-right">Tổng tiền</th>
                                <th className="px-6 py-5 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        <span className="text-slate-400 font-bold text-xs">Đang tải dữ liệu...</span>
                                    </div>
                                </td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="6" className="p-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-slate-300">
                                        <Receipt size={48} strokeWidth={1} />
                                        <span className="font-bold">Chưa có đơn hàng nào được ghi nhận</span>
                                    </div>
                                </td></tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-black text-slate-900">
                                            <div className="bg-slate-100 px-2 py-1 rounded-lg inline-block group-hover:bg-white transition-colors">
                                                {order.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white transition-colors">
                                                    <User size={14} />
                                                </div>
                                                <span className="font-bold text-slate-700">{order.customer?.name || 'Khách lẻ'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${order.paymentMethod === 'DEBT' ? 'bg-orange-100 text-orange-700' :
                                                order.paymentMethod === 'BANK_TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {order.paymentMethod === 'DEBT' ? 'Ghi nợ' :
                                                    order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 border-r-4 border-transparent group-hover:border-primary transition-all">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="bg-white border border-slate-200 px-4 py-1.5 rounded-xl text-primary font-black text-[10px] uppercase shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                                            >
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </div>
    );
}
