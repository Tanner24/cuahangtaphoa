import { useState, useEffect } from 'react';
import api, { posService } from '../services/api';
import {
    RotateCcw,
    Search,
    FileText,
    CheckCircle,
    RefreshCcw,
    Package,
    User,
    Calendar,
    ArrowRight,
    SearchX,
    CreditCard
} from 'lucide-react';

export default function Refunds() {
    const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'

    return (
        <div className="h-full bg-[#f8fafc] flex flex-col p-6 lg:p-8 overflow-hidden gap-8 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trả Hàng & Hoàn Tiền</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Quản lý trả hàng linh hoạt và khấu trừ công nợ tự động</p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-slate-200/50 p-1 rounded-2xl flex shadow-inner">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'create'
                            ? 'bg-white text-blue-600 shadow-xl shadow-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <RefreshCcw size={14} /> Tạo phiếu mới
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === 'history'
                            ? 'bg-white text-blue-600 shadow-xl shadow-slate-200'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <RotateCcw size={14} /> Lịch sử trả
                        </div>
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200/60 flex flex-col overflow-hidden">
                {activeTab === 'create' ? <CreateRefund /> : <RefundHistory />}
            </div>
        </div>
    );
}

// ================= Create Refund Component =================
function CreateRefund() {
    const [searchCode, setSearchCode] = useState('');
    const [invoice, setInvoice] = useState(null);
    const [returnItems, setReturnItems] = useState({}); // { productId: quantity }
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [refundMethod, setRefundMethod] = useState('CASH'); // CASH, DEBT_DEDUCT

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchCode) return;
        setLoading(true);
        try {
            const res = await posService.getOrders({ search: searchCode, limit: 1 });
            if (res && res.data && res.data.length > 0) {
                setInvoice(res.data[0]);
                setReturnItems({});
            } else {
                alert('Không tìm thấy đơn hàng');
                setInvoice(null);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi tìm kiếm đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (productId, maxQty, newQty) => {
        const qty = parseInt(newQty) || 0;
        if (qty < 0) return;
        if (qty > maxQty) return;
        setReturnItems(prev => ({ ...prev, [productId]: qty }));
    };

    const calculateTotalRefund = () => {
        if (!invoice) return 0;
        return invoice.items.reduce((total, item) => {
            const returnQty = returnItems[item.productId] || 0;
            return total + (Number(item.price) * returnQty);
        }, 0);
    };

    const handleSubmit = async () => {
        const itemsToReturn = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([pid, qty]) => ({ productId: parseInt(pid), quantity: qty }));

        if (itemsToReturn.length === 0) return;

        if (!window.confirm('Xác nhận hoàn tất thủ tục trả hàng?')) return;

        setLoading(true);
        try {
            await api.post('/pos/refunds', {
                invoiceId: invoice.id,
                items: itemsToReturn,
                reason,
                refundMethod
            });
            alert('Đã tạo phiếu trả hàng thành công!');
            setInvoice(null);
            setSearchCode('');
            setReturnItems({});
            setReason('');
        } catch (error) {
            alert('Lỗi: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col lg:flex-row">
            {/* Left: Input & Details */}
            <div className="flex-1 flex flex-col border-r border-slate-100 min-w-0">
                {/* Search Area */}
                <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                value={searchCode} onChange={e => setSearchCode(e.target.value)}
                                placeholder="Nhập mã hóa đơn gốc (VD: INV-123456)"
                                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold transition-all shadow-sm"
                            />
                        </div>
                        <button type="submit" disabled={loading} className="bg-slate-900 text-white px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50">
                            {loading ? 'Đang quét...' : 'Tìm đơn'}
                        </button>
                    </form>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                    {invoice ? (
                        <div className="space-y-10">
                            {/* Summary Box */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <DetailBox icon={<FileText size={18} />} label="Mã đơn hàng" value={invoice.code} color="blue" />
                                <DetailBox icon={<User size={18} />} label="Khách hàng" value={invoice.customer?.name || 'Khách lẻ'} color="purple" />
                                <DetailBox icon={<Calendar size={18} />} label="Thời điểm bán" value={new Date(invoice.createdAt).toLocaleString('vi-VN')} color="slate" />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Danh sách mặt hàng hỗ trợ trả
                                </h3>
                                <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                            <tr>
                                                <th className="p-5 text-left">Sản phẩm</th>
                                                <th className="p-5 text-right">Đơn giá</th>
                                                <th className="p-5 text-center">Đã mua</th>
                                                <th className="p-5 text-center w-32">Số lượng trả</th>
                                                <th className="p-5 text-right">Hoàn lại</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {invoice.items.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-5">
                                                        <div className="font-bold text-slate-900">{item.productName || item.product?.name || 'Sản phẩm ' + item.productId}</div>
                                                        <div className="text-[10px] text-slate-400 uppercase font-bold mt-1 tracking-wider">{item.product?.barcode || 'No-Barcode'}</div>
                                                    </td>
                                                    <td className="p-5 text-right font-medium text-slate-500">{Number(item.price).toLocaleString()}</td>
                                                    <td className="p-5 text-center font-bold text-slate-400">{item.quantity}</td>
                                                    <td className="p-5">
                                                        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.productId, item.quantity, (returnItems[item.productId] || 0) - 1)}
                                                                className="px-3 py-2 hover:bg-slate-50 text-slate-400 font-black">-</button>
                                                            <input
                                                                type="number" min="0" max={item.quantity}
                                                                value={returnItems[item.productId] || 0}
                                                                onChange={e => handleQuantityChange(item.productId, item.quantity, e.target.value)}
                                                                className="w-full text-center outline-none font-black text-blue-600 py-2 border-x border-slate-100"
                                                            />
                                                            <button
                                                                onClick={() => handleQuantityChange(item.productId, item.quantity, (returnItems[item.productId] || 0) + 1)}
                                                                className="px-3 py-2 hover:bg-slate-50 text-slate-400 font-black">+</button>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right font-black text-rose-600 text-base">
                                                        {((returnItems[item.productId] || 0) * Number(item.price)).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                            <div className="bg-slate-100 p-12 rounded-[3.5rem] mb-8">
                                <SearchX size={64} className="text-slate-300" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sẵn sàng tra cứu</h3>
                            <p className="text-slate-500 font-medium text-sm mt-4 max-w-xs">Nhập mã hóa đơn từ khách hàng cung cấp để bắt đầu thực hiện thủ tục hoàn trả hàng hóa.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Summary Sidebar */}
            <div className="w-full lg:w-[400px] bg-slate-50/50 p-8 lg:p-12 flex flex-col justify-between gap-10">
                <div className="space-y-10">
                    <header>
                        <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Thông tin hoàn trả</h3>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2 px-3 py-1 bg-blue-50 rounded-lg inline-block">Khởi tạo phiếu RT-{Date.now().toString().slice(-4)}</p>
                    </header>

                    <div className="space-y-8">
                        <section className="bg-white p-8 rounded-[2rem] border-2 border-blue-100 shadow-xl shadow-blue-100/30">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Tổng tiền hoàn trả</label>
                            <div className="flex items-end gap-2 text-blue-600">
                                <span className="text-5xl font-black tabular-nums leading-none">{calculateTotalRefund().toLocaleString()}</span>
                                <span className="text-xl font-bold mb-1 opacity-50 underline decoration-2 underline-offset-4">đ</span>
                            </div>
                        </section>

                        <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest px-2">Phương thức xử lý</label>
                            <div className="grid grid-cols-1 gap-2">
                                <MethodButton
                                    active={refundMethod === 'CASH'}
                                    onClick={() => setRefundMethod('CASH')}
                                    icon={<CreditCard size={18} />}
                                    title="Tiền mặt"
                                    desc="Hoàn trả trực tiếp"
                                />
                                <MethodButton
                                    active={refundMethod === 'DEBT_DEDUCT'}
                                    onClick={() => setRefundMethod('DEBT_DEDUCT')}
                                    disabled={!invoice?.customerId}
                                    icon={<RotateCcw size={18} />}
                                    title="Trừ công nợ"
                                    desc="Giảm nợ cho khách"
                                />
                            </div>
                            {!invoice?.customerId && (
                                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest px-4 italic">* Chỉ áp dụng cho khách thành viên</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-800 uppercase tracking-widest px-2">Lý do trả hàng</label>
                            <textarea
                                value={reason} onChange={e => setReason(e.target.value)}
                                className="w-full p-6 bg-white border border-slate-200 rounded-[2rem] h-32 resize-none outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 font-medium text-sm transition-all"
                                placeholder="Ghi chú nguyên nhân trả hàng..."
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!invoice || calculateTotalRefund() === 0 || loading}
                    className="w-full bg-blue-600 text-white font-black py-6 rounded-[2rem] uppercase tracking-[0.3em] text-xs shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
                >
                    {loading ? 'Đang xác nhận...' : 'Xác Nhận Thủ Tục'}
                </button>
            </div>
        </div>
    );
}

// ================= History Component =================
function RefundHistory() {
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRefunds = async () => {
            try {
                const res = await api.get('/pos/refunds');
                setRefunds(res || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchRefunds();
    }, []);

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Đang tải lịch sử trả hàng...</p>
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            {refunds.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <Package size={80} />
                    <p className="mt-6 font-black uppercase tracking-[0.3em] text-xs text-slate-900">Chưa có bản ghi trả hàng nào</p>
                </div>
            ) : (
                <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-100">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] text-center">
                            <tr>
                                <th className="p-6 border-r border-slate-800">Mã Phiếu</th>
                                <th className="p-6 border-r border-slate-800">Đơn Gốc</th>
                                <th className="p-6 text-left">Khách Hàng & Lý Do</th>
                                <th className="p-6">Sản phẩm</th>
                                <th className="p-6 text-right">Tổng Hoàn</th>
                                <th className="p-6 text-right">Ngày Tạo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {refunds.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-6 text-center">
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-sm">{r.returnCode}</span>
                                    </td>
                                    <td className="p-6 text-center font-bold text-slate-400 group-hover:text-slate-900 transition-colors">{r.invoice?.code}</td>
                                    <td className="p-6">
                                        <div className="font-extrabold text-slate-800">{r.invoice?.customer?.name || 'Khách lẻ'}</div>
                                        <div className="text-[11px] text-slate-400 mt-1 max-w-xs italic leading-relaxed">{r.reason || 'Không có ghi chú lý do'}</div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl font-black text-[10px] uppercase text-slate-500">
                                            <Package size={12} /> {r.items?.length || 0} SP
                                        </div>
                                    </td>
                                    <td className="p-6 text-right font-black text-rose-600 text-lg tabular-nums">{Number(r.totalAmount).toLocaleString()}</td>
                                    <td className="p-6 text-right font-bold text-slate-400 text-xs uppercase tracking-tighter">
                                        <div className="flex flex-col items-end">
                                            <span>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                                            <span className="text-[10px] opacity-40">{new Date(r.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// --- Internal UI Components ---

const DetailBox = ({ icon, label, value, color }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50/50 border-blue-100',
        purple: 'text-purple-600 bg-purple-50/50 border-purple-100',
        slate: 'text-slate-600 bg-slate-50/50 border-slate-100'
    };
    return (
        <div className={`p-6 rounded-3xl border flex flex-col gap-3 group transition-all hover:scale-[1.05] shadow-sm hover:shadow-xl ${colors[color]}`}>
            <div className="flex justify-between items-center text-slate-400 group-hover:text-current transition-colors">
                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                {icon}
            </div>
            <div className="font-black text-slate-900 truncate">{value}</div>
        </div>
    );
};

const MethodButton = ({ active, onClick, disabled, icon, title, desc }) => (
    <button
        disabled={disabled}
        onClick={onClick}
        className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 text-left transition-all ${active ? 'border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-100' : 'border-white bg-white hover:border-slate-100'
            } ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div className={`p-4 rounded-2xl ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
            {icon}
        </div>
        <div>
            <div className={`font-black uppercase text-[10px] tracking-widest ${active ? 'text-blue-600' : 'text-slate-900'}`}>{title}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{desc}</div>
        </div>
    </button>
);
