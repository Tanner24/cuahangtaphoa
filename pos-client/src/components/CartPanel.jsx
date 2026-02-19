import { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { posService } from '../services/api';

export default function CartPanel({ isOpen, onClose, onCheckout }) {
    const { cart, removeFromCart, updateQuantity, clearCart, setCustomer, setDiscount, setTaxRate } = useCart();
    // Local state for customer search
    const [customerQuery, setCustomerQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const searchTimeout = useRef(null);

    // Add Customer Modal State
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [loadingTax, setLoadingTax] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        phone: '',
        name: '',
        taxCode: '',
        address: ''
    });
    const [systemSettings, setSystemSettings] = useState(null);

    // Format currency helper
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount).replace('₫', 'đ');

    useEffect(() => {
        fetchSystemSettings();
    }, []);

    const fetchSystemSettings = async () => {
        try {
            const data = await posService.getSystemSettings();
            setSystemSettings(data);
        } catch (err) {
            console.error("Failed to fetch system settings", err);
        }
    };

    // Customer search handler
    useEffect(() => {
        if (customerQuery.length > 1) {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const res = await posService.searchCustomers(customerQuery);
                    setCustomers(res.data || []);
                    setShowCustomerDropdown(true);
                } catch (err) {
                    console.error("Customer search errors", err);
                }
            }, 300);
        } else {
            setCustomers([]);
            setShowCustomerDropdown(false);
        }
    }, [customerQuery]);

    const handleSelectCustomer = (cust) => {
        setCustomer(cust);
        setCustomerQuery('');
        setShowCustomerDropdown(false);
    };

    const handleTaxLookup = async () => {
        if (!newCustomer.taxCode) return;

        const config = systemSettings?.vietqr_api || { enabled: true };
        if (!config.enabled) {
            alert('Tính năng tra cứu MST đã bị quản trị viên tắt.');
            return;
        }

        setLoadingTax(true);
        try {
            const url = `https://api.vietqr.io/v2/business/${newCustomer.taxCode}`;
            const headers = config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {};

            const res = await fetch(url, { headers });
            const data = await res.json();
            if (data.code === '00' && data.data) {
                setNewCustomer(prev => ({
                    ...prev,
                    name: data.data.name,
                    address: data.data.address
                }));
            } else {
                alert('Không tìm thấy thông tin doanh nghiệp!');
            }
        } catch (e) {
            console.error("Tax lookup error", e);
            alert('Lỗi kết nối API!');
        } finally {
            setLoadingTax(false);
        }
    };

    const handleSaveNewCustomer = () => {
        if (!newCustomer.name) {
            alert('Vui lòng nhập tên khách hàng!');
            return;
        }
        // Save to cart context (Temporary) - In real app, call API to create customer first
        const cust = {
            id: 'temp-' + Date.now(),
            ...newCustomer
        };
        setCustomer(cust);
        setShowAddCustomer(false);
        setNewCustomer({ phone: '', name: '', taxCode: '', address: '' });
    };

    return (
        <aside
            className={`fixed md:static inset-y-0 right-0 w-full md:w-96 bg-white border-l border-slate-200 shadow-2xl md:shadow-none transform transition-transform duration-300 z-40 flex flex-col h-full flex-shrink-0 ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
                }`}
        >
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-primary">shopping_bag</span>
                    <h2 className="font-bold text-slate-900 text-lg">Giỏ hàng ({cart.items.length})</h2>
                </div>
                <button
                    className={`text-xs font-bold text-red-500 hover:text-red-700 uppercase bg-red-50 px-3 py-1.5 rounded-lg transition-colors ${cart.items.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => cart.items.length > 0 && clearCart()}
                >
                    Xóa tất cả
                </button>
            </div>

            {/* Customer Selection */}
            <div className="px-4 pt-4 pb-2 bg-white relative z-50">
                {cart.customer ? (
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <div>
                            <p className="font-bold text-blue-900 text-sm">{cart.customer.name}</p>
                            <p className="text-xs text-blue-600">{cart.customer.phone}</p>
                        </div>
                        <button onClick={() => setCustomer(null)} className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors"><span className="material-icons text-sm">close</span></button>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-icons text-slate-400 text-lg">person_search</span>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="Tìm khách hàng (Tên/SĐT)..."
                            value={customerQuery}
                            onChange={(e) => setCustomerQuery(e.target.value)}
                            onFocus={() => customerQuery.length > 1 && setShowCustomerDropdown(true)}
                        />
                        {showCustomerDropdown && customers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50">
                                {customers.map(c => (
                                    <div
                                        key={c.id}
                                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                                        onClick={() => handleSelectCustomer(c)}
                                    >
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                                            <p className="text-xs text-slate-500">{c.phone}</p>
                                        </div>
                                        <span className="material-icons text-slate-300 text-sm">add</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Quick Add Button */}
                        <button
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary font-bold text-xl hover:text-blue-700 disabled:opacity-50"
                            title="Thêm khách mới"
                            onClick={() => setShowAddCustomer(true)}
                        >
                            +
                        </button>
                    </div>
                )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white" id="cartItemsList">
                {cart.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <span className="material-symbols-outlined text-6xl mb-2 opacity-20">shopping_cart_off</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-sm font-medium">Chưa có sản phẩm nào</p>
                    </div>
                ) : (
                    cart.items.map(item => (
                        <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all group relative">
                            {/* Remove Action (Hidden but can be added) */}

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500 bg-slate-100 px-1.5 rounded">{formatCurrency(item.price)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className="font-bold text-primary text-base">
                                    {formatCurrency(item.price * item.quantity)}
                                </span>
                                <div className="flex items-center bg-slate-100 rounded-xl p-1 shadow-inner">
                                    <button
                                        onClick={() => updateQuantity(item.id, (parseFloat(item.quantity) || 0) - 1)}
                                        className="w-9 h-9 flex items-center justify-center bg-white hover:bg-red-50 rounded-lg shadow-sm text-slate-600 hover:text-red-600 transition-all active:scale-95 font-black text-lg"
                                    >-</button>
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                                        className="w-12 bg-transparent text-center text-sm font-bold text-slate-800 border-none focus:ring-0 p-0 appearance-none"
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <button
                                        onClick={() => updateQuantity(item.id, (parseFloat(item.quantity) || 0) + 1)}
                                        className="w-9 h-9 flex items-center justify-center bg-white hover:bg-blue-50 rounded-lg shadow-sm text-slate-600 hover:text-blue-600 transition-all active:scale-95 font-black text-lg"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Cart Footer (Totals & Action) */}
            <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0 safe-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">

                {/* Discount & Tax Input */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="relative">
                        <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase">Giảm giá</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all"
                            placeholder="0đ"
                            value={cart.discount || ''}
                            onChange={(e) => setDiscount(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-slate-400 uppercase">Thuế VAT (%)</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all"
                            placeholder="0%"
                            value={cart.taxRate || ''}
                            onChange={(e) => setTaxRate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Summary Lines */}
                <div className="space-y-1.5 mb-5 text-sm">
                    <div className="flex justify-between text-slate-500">
                        <span>Tạm tính</span>
                        <span className="font-semibold">{formatCurrency(cart.subTotal || 0)}</span>
                    </div>
                    {cart.discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                            <span>Giảm giá</span>
                            <span className="font-semibold">-{formatCurrency(cart.discount)}</span>
                        </div>
                    )}
                    {cart.taxRate > 0 && (
                        <div className="flex justify-between text-orange-600">
                            <span>Thuế VAT ({cart.taxRate}%)</span>
                            <span className="font-semibold">+{formatCurrency(cart.taxAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                        <span className="text-slate-800 font-bold text-lg">Tổng cộng</span>
                        <span className="text-3xl font-black text-primary leading-none" id="cartPanelTotal">
                            {formatCurrency(cart.totalAmount || 0)}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={cart.items.length === 0}
                    className={`w-full py-4 rounded-xl font-black text-lg shadow-xl shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 
                  ${cart.items.length === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                >
                    <span className="material-icons">payments</span>
                    <span>THANH TOÁN NGAY</span>
                </button>
            </div>

            {showAddCustomer && (
                <div className="absolute inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800">Thêm khách hàng mới</h3>
                            <button onClick={() => setShowAddCustomer(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-icons">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số điện thoại</label>
                                <input
                                    type="text"
                                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary font-bold"
                                    placeholder="09..."
                                    value={newCustomer.phone}
                                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            {/* Tax Code with Lookup */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã số thuế (nếu có)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full border-slate-200 rounded-xl pl-3 pr-10 py-2 text-sm focus:ring-primary font-mono tracking-wide"
                                        placeholder="Nhập MST..."
                                        value={newCustomer.taxCode}
                                        onChange={e => setNewCustomer({ ...newCustomer, taxCode: e.target.value })}
                                        onBlur={handleTaxLookup}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        {loadingTax ? (
                                            <span className="material-icons animate-spin text-slate-400 text-sm">sync</span>
                                        ) : (
                                            <button onClick={handleTaxLookup} className="text-blue-600 hover:text-blue-800" title="Tra cứu">
                                                <span className="material-icons text-lg">search</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên khách / Công ty</label>
                                <input
                                    type="text"
                                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary font-bold"
                                    placeholder="Nguyễn Văn A..."
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Địa chỉ</label>
                                <textarea
                                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-primary"
                                    placeholder="Số 10, Đường..."
                                    rows="2"
                                    value={newCustomer.address}
                                    onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                onClick={handleSaveNewCustomer}
                                className="w-full bg-primary hover:bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all mt-2"
                            >
                                Lưu khách hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
