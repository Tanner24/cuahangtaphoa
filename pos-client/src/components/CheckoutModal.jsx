import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { posService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Banknote, CreditCard, User, Search, Printer, CheckCircle2 } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { cart, clearCart, setCustomer } = useCart();
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, BANK_TRANSFER, DEBT
    const [customerPay, setCustomerPay] = useState('');
    const [loading, setLoading] = useState(false);
    const [storeInfo, setStoreInfo] = useState(null);

    // Customer search state
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [autoPrint, setAutoPrint] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);

    const [printerConfig, setPrinterConfig] = useState({
        paperSize: '80mm',
        autoPrint: true,
        showLogo: true,
        showCashierName: true,
        showCustomerName: true,
        showOrderBarcode: true,
        printCopies: 1
    });

    useEffect(() => {
        if (isOpen) {
            fetchStoreInfo();
            const savedPrinter = localStorage.getItem('printerConfig');
            if (savedPrinter) {
                const config = JSON.parse(savedPrinter);
                setPrinterConfig(config);
                setAutoPrint(config.autoPrint);
            }
        }
    }, [isOpen]);

    const fetchStoreInfo = async () => {
        try {
            const res = await posService.getStore();
            setStoreInfo(res);
        } catch (e) {
            console.error("Failed to fetch store info", e);
        }
    };

    useEffect(() => {
        if (searchQuery.length >= 2) {
            const delayDebounce = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const res = await posService.searchCustomers(searchQuery);
                    setCustomers(res.data || []);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            }, 500);
            return () => clearTimeout(delayDebounce);
        } else {
            setCustomers([]);
        }
    }, [searchQuery]);

    const [discount, setDiscount] = useState(0);

    const changeDue = parseFloat(customerPay) - (cart.totalAmount - discount);

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const singleReceipt = `
            <div class="receipt">
                <div class="header">
                    ${printerConfig.showLogo && storeInfo?.logoUrl ? `<img src="${storeInfo.logoUrl}" style="max-height: 50px; margin-bottom: 5px;" />` : ''}
                    <div class="store-name">${storeInfo?.name || 'CỬA HÀNG TẠP HÓA'}</div>
                    <div class="info">${storeInfo?.address || 'Đang cập nhật địa chỉ'}</div>
                    <div class="info">Hotline: ${storeInfo?.phone || '...'}</div>
                </div>
                <div>
                    <div class="info">Ngày: ${new Date().toLocaleString('vi-VN')}</div>
                    <div class="info">Mã đơn: #${Date.now().toString().slice(-6)}</div>
                    ${printerConfig.showCashierName ? `<div class="info">Thu ngân: ${user?.username || 'Admin'}</div>` : ''}
                    ${printerConfig.showCustomerName ? `<div class="info">Khách: ${cart.customer?.name || 'Khách lẻ'}</div>` : ''}
                </div>
                <table style="margin-top: 5px;">
                    <thead>
                        <tr>
                            <th>Mặt hàng</th>
                            <th class="qty">SL</th>
                            <th class="price">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cart.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td class="qty">${item.quantity}</td>
                                <td class="price">${Math.round(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="total-row">
                    <div style="display:flex; justify-content:space-between"><span>Tổng tiền hàng:</span><span>${cart.totalAmount.toLocaleString()}</span></div>
                    ${discount > 0 ? `<div style="display:flex; justify-content:space-between; font-weight:normal"><span>Giảm giá:</span><span>-${discount.toLocaleString()}</span></div>` : ''}
                    <div style="display:flex; justify-content:space-between; font-size:14px; margin-top:3px"><span>THANH TOÁN:</span><span>${Math.round(cart.totalAmount - discount).toLocaleString()}đ</span></div>
                    <div style="display:flex; justify-content:space-between; font-weight:normal; margin-top:2px"><span>Khách đưa:</span><span>${parseFloat(customerPay) ? parseFloat(customerPay).toLocaleString() : '0'}</span></div>
                    <div style="display:flex; justify-content:space-between; font-weight:normal"><span>Tiền thừa:</span><span>${changeDue > 0 ? changeDue.toLocaleString() : '0'}</span></div>
                </div>
                ${printerConfig.showOrderBarcode ?
                `<div class="barcode">
                        <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${Date.now().toString().slice(-6)}&scale=2&height=5&incltext" alt="Barcode" />
                    </div>` : ''
            }
                <div class="footer">
                    ${storeInfo?.footerText ? storeInfo.footerText.replace(/\n/g, '<br/>') : 'Cảm ơn quý khách và hẹn gặp lại!'}
                </div>
            </div>
        `;

        // Repeat receipt based on copies
        const copies = printerConfig.printCopies || 1;
        let fullHtmlContent = '';
        for (let i = 0; i < copies; i++) {
            fullHtmlContent += singleReceipt;
            if (i < copies - 1) {
                fullHtmlContent += '<div style="page-break-after: always; height: 1px; border-bottom: 1px dashed transparent; margin-bottom: 10px;"></div>';
            }
        }

        const receiptHtml = `
            <html>
                <head>
                    <title>In hóa đơn</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; width: ${printerConfig.paperSize === '80mm' ? '72mm' : '52mm'}; margin: 0; padding: 5px; color: #000; font-size: 11px; }
                        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
                        .store-name { font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; }
                        .info { margin: 2px 0; }
                        table { width: 100%; font-size: 11px; border-collapse: collapse; }
                        th { text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
                        td { padding: 2px 0; vertical-align: top; }
                        .qty { width: 20px; text-align: center; }
                        .price { text-align: right; }
                        .total-row { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; font-weight: bold; }
                        .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; font-style: italic; font-size: 10px; }
                        .barcode { text-align: center; margin-top: 10px; }
                        .barcode img { max-width: 100%; height: 40px; }
                        .receipt { margin-bottom: 10px; }
                        @media print {
                            .receipt { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    ${fullHtmlContent}
                </body>
            </html>
        `;

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(receiptHtml);
        doc.close();

        // Print logic
        iframe.contentWindow.focus();
        setTimeout(() => {
            try {
                iframe.contentWindow.print();
            } catch (e) {
                console.error("Printing failed", e);
            } finally {
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }
        }, 500);
    };

    const handleConfirm = async () => {
        if (paymentMethod === 'DEBT' && !cart.customer) {
            alert('Vui lòng chọn khách hàng để ghi nợ');
            return;
        }

        setLoading(true);
        try {
            await posService.createOrder({
                items: cart.items.map(i => ({
                    id: i.id,
                    quantity: i.quantity,
                    price: i.price
                })),
                totalAmount: cart.totalAmount - discount,
                paymentMethod: paymentMethod,
                customerId: cart.customer?.id || null,
                note: paymentMethod === 'BANK_TRANSFER' ? 'Thanh toán chuyển khoản VietQR' : '',
            });
            if (autoPrint) {
                handlePrint();
            }

            // Show Success Screen
            setIsSuccess(true);
            setTimeout(() => {
                clearCart();
                setIsSuccess(false); // Reset state
                onClose();
            }, 1500);
        } catch (e) {
            alert('Lỗi: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    // VietQR Generator
    const getQrUrl = () => {
        if (!storeInfo?.bankName || !storeInfo?.bankAccountNumber) return null;

        const bankId = storeInfo.bankName;
        const accountNo = storeInfo.bankAccountNumber;
        const template = 'qr_only';
        const amount = Math.round(cart.totalAmount - discount);
        const description = encodeURIComponent(`Thanh toan don hang ${Date.now().toString().slice(-6)}`);
        const accountName = encodeURIComponent(storeInfo.bankAccountName || '');

        return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${description}&accountName=${accountName}`;
    };

    if (!isOpen) return null;

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center animate-in zoom-in duration-300 shadow-2xl border border-slate-100">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle2 size={48} className="text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">THANH TOÁN THÀNH CÔNG!</h2>
                    <p className="text-slate-500 font-bold text-lg">Đang in hóa đơn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in-up">

                {/* Left Side: Summary & Payment Info */}
                <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-black text-slate-800 uppercase">Thanh toán</h2>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors md:hidden">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                        <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">Tổng cộng</span>
                        <div className="text-4xl font-black text-slate-900 mt-1">
                            {Number(cart.totalAmount - discount).toLocaleString()}đ
                        </div>
                        <div className="absolute top-0 right-0 h-full w-24 bg-blue-600/5 rotate-12 -mr-8"></div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Phương thức thanh toán</label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${paymentMethod === 'CASH' ? 'border-primary bg-blue-50 text-primary shadow-lg scale-105' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                            >
                                <Banknote size={28} />
                                <span className="font-bold text-sm">Tiền mặt</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${paymentMethod === 'BANK_TRANSFER' ? 'border-primary bg-blue-50 text-primary shadow-lg scale-105' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                            >
                                <CreditCard size={28} />
                                <span className="font-bold text-sm text-center">Chuyển khoản</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('DEBT')}
                                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${paymentMethod === 'DEBT' ? 'border-red-500 bg-red-50 text-red-600 shadow-lg scale-105' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                            >
                                <User size={28} />
                                <span className="font-bold text-sm">Ghi nợ</span>
                            </button>
                        </div>
                    </div>

                    {paymentMethod === 'CASH' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-500 uppercase">Khách trả</label>
                                    <input
                                        autoFocus
                                        type="number"
                                        className="w-full mt-2 bg-slate-100 border-none rounded-2xl py-5 px-6 text-3xl font-black text-slate-900 focus:ring-4 focus:ring-primary/20 focus:bg-white transition-all shadow-inner"
                                        placeholder="0"
                                        value={customerPay}
                                        onChange={(e) => setCustomerPay(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mt-8">
                                    <span className="text-emerald-600 font-bold uppercase text-xs">Tiền thừa</span>
                                    <span className={`text-2xl font-black ${changeDue >= 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {changeDue >= 0 ? Number(changeDue).toLocaleString() + 'đ' : '0đ'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {[20000, 50000, 100000, 200000, 500000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setCustomerPay(val.toString())}
                                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        +{Number(val / 1000).toLocaleString()}k
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCustomerPay((cart.totalAmount - discount).toString())}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                                >
                                    ĐỦ TIỀN
                                </button>
                            </div>
                        </div>
                    )}

                    {paymentMethod === 'BANK_TRANSFER' && (
                        <div className="space-y-4 animate-fade-in flex flex-col items-center">
                            {getQrUrl() ? (
                                <div className="bg-white p-4 rounded-3xl border shadow-sm flex flex-col items-center gap-4 w-full">
                                    <div className="text-center">
                                        <div className="font-black text-slate-800">{storeInfo.bankAccountName}</div>
                                        <div className="text-sm text-slate-500">{storeInfo.bankName} - {storeInfo.bankAccountNumber}</div>
                                    </div>
                                    <div className="relative p-2 bg-white border-4 border-slate-50 rounded-2xl">
                                        <img src={getQrUrl()} alt="VietQR" className="w-48 h-48 md:w-64 md:h-64 object-contain" />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-700 text-center">
                                    <p className="font-bold">Chưa thiết lập Ngân hàng</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Customer & Confirm */}
                <div className="w-full md:w-96 bg-slate-50 p-6 md:p-8 border-l border-slate-100 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="hidden md:flex justify-between items-center">
                            <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Cửa hàng</h3>
                            <button onClick={onClose} className="p-1 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>

                        {/* Customer Search & Management */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">Khách hàng</label>
                            {cart.customer ? (
                                <div className="bg-white p-4 rounded-2xl border shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-slate-800">{cart.customer.name}</div>
                                        <div className="text-xs text-slate-500">{cart.customer.phone}</div>
                                    </div>
                                    <button onClick={() => setCustomer(null)} className="p-1.5 text-slate-300 hover:text-red-500"><X size={16} /></button>
                                </div>

                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Tìm khách hàng..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {customers.length > 0 && (
                                        <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border z-50 max-h-48 overflow-y-auto">
                                            {customers.map(c => (
                                                <button key={c.id} onClick={() => { setCustomer(c); setSearchQuery(''); setCustomers([]); }} className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-none">
                                                    <span className="font-bold text-slate-800 text-sm block">{c.name}</span>
                                                    <span className="text-xs text-slate-500">{c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Discounts & Promos */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wide">KM / Chiết khấu</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="flex-1 px-4 py-2 bg-white border-none rounded-xl shadow-sm text-sm font-bold text-emerald-600"
                                />
                                <div className="flex gap-1">
                                    {[5, 10, 15].map(pct => (
                                        <button
                                            key={pct}
                                            onClick={() => setDiscount(Math.round(cart.totalAmount * pct / 100))}
                                            className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200"
                                        >
                                            {pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-200">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tạm tính:</span>
                                <span className="font-bold">{cart.totalAmount.toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Giảm giá:</span>
                                <span className="font-bold text-red-500">-{discount.toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between text-lg font-black pt-2 border-t border-slate-200">
                                <span>PHẢI THU:</span>
                                <span className="text-primary">{(cart.totalAmount - discount).toLocaleString()}đ</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                        {/* Auto Print Toggle Removed - Controlled via Settings */}

                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 
                                ${loading
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-primary hover:bg-blue-700 text-white shadow-blue-200 active:scale-95'}`}
                        >
                            {loading ? 'XỬ LÝ...' : 'XÁC NHẬN'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
