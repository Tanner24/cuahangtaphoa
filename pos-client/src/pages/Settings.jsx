import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { posService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import InvoicePreview from '../components/InvoicePreview';
import { Printer, CheckCircle2, RotateCw, QrCode, Building2, MapPin, Phone, CreditCard, Search } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

export default function Settings() {
    const { logout, user } = useAuth();
    const { updateShopSettings } = useShop(); // Access context function
    const [store, setStore] = useState({
        name: '',
        address: '',
        phone: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: ''
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('store'); // store, printer, account, einvoice
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    // Printer Settings (Local Storage)

    // Printer Settings (Local Storage)
    const [printerConfig, setPrinterConfig] = useState({
        paperSize: '80mm',
        autoPrint: true,
        showLogo: true,
        showCashierName: true,
        showCustomerName: true,
        showOrderBarcode: true,
        printCopies: 1
    });

    const [bankList, setBankList] = useState([]);
    const [qrPreview, setQrPreview] = useState(null);

    useEffect(() => {
        fetchStore();
        fetchBanks();
        const savedPrinter = localStorage.getItem('printerConfig');
        if (savedPrinter) setPrinterConfig(JSON.parse(savedPrinter));
    }, []);

    const fetchBanks = async () => {
        try {
            const res = await fetch('https://api.vietqr.io/v2/banks');
            const data = await res.json();
            setBankList(data.data || []);
        } catch (e) {
            console.error("Failed to fetch banks", e);
        }
    };

    const getQrUrl = () => {
        if (!store.bankName || !store.bankAccountNumber) return null;
        return `https://img.vietqr.io/image/${store.bankName}-${store.bankAccountNumber}-compact.png?amount=0&addInfo=DEMO&accountName=${encodeURIComponent(store.bankAccountName)}`;
    };

    const fetchStore = async () => {
        try {
            const res = await posService.getStore();
            setStore({
                name: res.name || '',
                address: res.address || '',
                phone: res.phone || '',
                bankName: res.bankName || '',
                bankAccountName: res.bankAccountName || '',
                bankAccountNumber: res.bankAccountNumber || '',
                logoUrl: res.logoUrl || '',
                footerText: res.footerText || ''
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStore = async (e) => {
        e.preventDefault();
        try {
            await posService.updateStore(store);
            // Update Global Shop Context immediately for sidebar reflection
            updateShopSettings({
                shopName: store.name,
                logoUrl: store.logoUrl,
                address: store.address
            });
            toast.success('Đã cập nhật thông tin cửa hàng!');
        } catch (e) {
            toast.error('Lỗi: ' + e.message);
        }
    };

    const handleUpdatePrinter = () => {
        localStorage.setItem('printerConfig', JSON.stringify(printerConfig));
        toast.success('Đã lưu cấu hình máy in!');
    };

    const handleTestPrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const receiptHtml = `
            <html>
                <head>
                    <title>In thử hóa đơn</title>
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
                    </style>
                </head>
                <body>
                    <div class="header">
                        ${printerConfig.showLogo && store.logoUrl ? `<img src="${store.logoUrl}" style="max-height: 50px; margin-bottom: 5px;" />` : ''}
                        <div class="store-name">${store.name || 'CỬA HÀNG TẠP HÓA'}</div>
                        <div class="info">${store.address || 'Địa chỉ cửa hàng'}</div>
                        <div class="info">Hotline: ${store.phone || '...'}</div>
                    </div>
                    <div>
                        <div class="info">Ngày: ${new Date().toLocaleString('vi-VN')}</div>
                        <div class="info">Mã đơn: #TEST-001</div>
                        ${printerConfig.showCashierName ? `<div class="info">Thu ngân: ${user?.username || 'Admin'}</div>` : ''}
                        ${printerConfig.showCustomerName ? `<div class="info">Khách: Nguyễn Văn A</div>` : ''}
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
                            <tr><td>Nước ngọt Coca</td><td class="qty">2</td><td class="price">20,000</td></tr>
                            <tr><td>Bánh Snack Khoai</td><td class="qty">1</td><td class="price">15,000</td></tr>
                            <tr><td>Kẹo Singum</td><td class="qty">5</td><td class="price">25,000</td></tr>
                        </tbody>
                    </table>
                    <div class="total-row">
                        <div style="display:flex; justify-content:space-between"><span>Tổng tiền hàng:</span><span>60,000</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:14px; margin-top:3px"><span>THANH TOÁN:</span><span>60,000đ</span></div>
                        <div style="display:flex; justify-content:space-between; font-weight:normal; margin-top:2px"><span>Khách đưa:</span><span>100,000</span></div>
                        <div style="display:flex; justify-content:space-between; font-weight:normal"><span>Tiền thừa:</span><span>40,000</span></div>
                    </div>
                    ${printerConfig.showOrderBarcode ?
                `<div class="barcode">
                            <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=TEST-001&scale=2&height=5&incltext" alt="Barcode" />
                        </div>` : ''
            }
                    <div class="footer">
                        ${store.footerText ? store.footerText.replace(/\n/g, '<br/>') : 'Cảm ơn quý khách và hẹn gặp lại!'}
                    </div>
                </body>
            </html>
        `;

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(receiptHtml);
        doc.close();

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

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-50 font-sans">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="material-icons text-slate-400">settings</span> Cài Đặt
            </h1>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-64 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0">
                    <button onClick={() => setActiveTab('store')}
                        className={`w-full text-left p-4 font-bold border-l-4 transition-all flex items-center gap-3 ${activeTab === 'store' ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                        <span className="material-icons">store</span> Thông tin cửa hàng
                    </button>
                    <button onClick={() => setActiveTab('printer')}
                        className={`w-full text-left p-4 font-bold border-l-4 transition-all flex items-center gap-3 ${activeTab === 'printer' ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                        <span className="material-icons">print</span> Máy in & Hóa đơn
                    </button>
                    <button onClick={() => setActiveTab('account')}
                        className={`w-full text-left p-4 font-bold border-l-4 transition-all flex items-center gap-3 ${activeTab === 'account' ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                        <span className="material-icons">person</span> Tài khoản
                    </button>
                    <button onClick={() => setActiveTab('einvoice')}
                        className={`w-full text-left p-4 font-bold border-l-4 transition-all flex items-center gap-3 ${activeTab === 'einvoice' ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                        <span className="material-icons">receipt_long</span> Hóa đơn điện tử
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm w-full">

                    {activeTab === 'store' && (
                        <form onSubmit={handleUpdateStore} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left Column: Input Forms */}
                            <div className="space-y-6">
                                {/* Store Info Section */}
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                                        <Building2 size={16} /> Thông tin chung
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Tên cửa hàng</label>
                                            <input type="text" className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5"
                                                placeholder="Ví dụ: Tạp Hóa Cô Ba"
                                                value={store.name} onChange={e => setStore({ ...store, name: e.target.value })} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
                                                <input type="text" className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5"
                                                    placeholder="0912..."
                                                    value={store.phone} onChange={e => setStore({ ...store, phone: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Mã số thuế (MST)</label>
                                                <input
                                                    type="text"
                                                    className={`w-full border rounded-xl focus:ring-primary px-4 py-2.5 ${store.taxCode && !/^\d{10}$/.test(store.taxCode) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                                    placeholder="Nhập 10 chữ số..."
                                                    value={store.taxCode || ''}
                                                    onChange={e => setStore({ ...store, taxCode: e.target.value })}
                                                    maxLength={10}
                                                />
                                                {store.taxCode && !/^\d{10}$/.test(store.taxCode) && (
                                                    <p className="text-xs text-red-500 mt-1 font-bold">MST phải gồm đúng 10 chữ số</p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Logo URL</label>
                                            <input type="text" className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5"
                                                placeholder="https://..."
                                                value={store.logoUrl} onChange={e => setStore({ ...store, logoUrl: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Địa chỉ</label>
                                            <input type="text" className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5"
                                                placeholder="Số 10, Đường..."
                                                value={store.address} onChange={e => setStore({ ...store, address: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Lời chào (Footer)</label>
                                            <textarea className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5"
                                                placeholder="Cảm ơn quý khách..."
                                                rows="2"
                                                value={store.footerText} onChange={e => setStore({ ...store, footerText: e.target.value })}></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* VietQR Section */}
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                    <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wide border-b border-blue-200 pb-3 mb-4 flex items-center gap-2">
                                        <QrCode size={16} /> Cấu hình VietQR
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Ngân hàng</label>
                                            <select
                                                className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5 bg-white"
                                                value={store.bankName}
                                                onChange={e => setStore({ ...store, bankName: e.target.value })}
                                            >
                                                <option value="">-- Chọn ngân hàng --</option>
                                                {bankList.map(bank => (
                                                    <option key={bank.id} value={bank.shortName}>
                                                        {bank.shortName} - {bank.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Số tài khoản</label>
                                                <input type="text" className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5 font-mono tracking-wide"
                                                    placeholder="0001..."
                                                    value={store.bankAccountNumber} onChange={e => setStore({ ...store, bankAccountNumber: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">Chủ tài khoản</label>
                                                <input type="text" className="w-full border-slate-300 rounded-xl focus:ring-primary px-4 py-2.5 uppercase"
                                                    placeholder="NGUYEN VAN A"
                                                    value={store.bankAccountName} onChange={e => setStore({ ...store, bankAccountName: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-primary hover:bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                                    <CheckCircle2 size={20} /> Lưu thông tin cửa hàng
                                </button>
                            </div>

                            {/* Right Column: Live Preview */}
                            <div className="sticky top-6 space-y-6">
                                {/* QR Payment Standee Preview */}
                                <div className="relative">
                                    <div className="absolute inset-x-8 top-0 -bottom-4 bg-blue-900/10 rounded-3xl blur-xl"></div>
                                    <div className="relative bg-white rounded-[2rem] shadow-2xl p-6 border border-slate-100 overflow-hidden">
                                        {/* Standee Decoration */}
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500"></div>

                                        <div className="text-center mb-6 pt-2">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 text-primary">
                                                <QrCode size={32} />
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-800">Quét mã thanh toán</h2>
                                            <p className="text-sm text-slate-500 font-medium">Hỗ trợ Mobile Banking 24/7</p>
                                        </div>

                                        <div className="bg-slate-900 rounded-3xl p-4 mb-6 relative group cursor-pointer transition-transform hover:scale-[1.02] max-w-[240px] mx-auto">
                                            {/* Corner Accents */}
                                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg"></div>
                                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg"></div>
                                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg"></div>
                                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg"></div>

                                            {getQrUrl() ? (
                                                <img
                                                    src={getQrUrl()}
                                                    alt="VietQR"
                                                    className="w-full aspect-square object-contain bg-white rounded-xl"
                                                />
                                            ) : (
                                                <div className="w-full aspect-square bg-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500">
                                                    <QrCode size={48} className="opacity-50 mb-2" />
                                                    <span className="text-xs">Chưa có thông tin QR</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Ngân hàng</span>
                                                <span className="font-bold text-blue-700">{store.bankName || '---'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Chủ tài khoản</span>
                                                <span className="font-bold text-slate-800">{store.bankAccountName || '---'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Số tài khoản</span>
                                                <span className="font-mono font-bold text-slate-800 tracking-wider copy-text" onClick={() => { navigator.clipboard.writeText(store.bankAccountNumber); toast.success('Đã sao chép STK!') }} title="Nhấn để sao chép">{store.bankAccountNumber || '---'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                            <MapPin size={16} className="text-red-500" />
                                            Hiển thị trên hóa đơn
                                        </h4>
                                        <div className="text-xs space-y-2 text-slate-500">
                                            <p className="flex gap-2">
                                                <span className="font-bold min-w-[60px] text-slate-700">Tên shop:</span>
                                                <span>{store.name || '---'}</span>
                                            </p>
                                            <p className="flex gap-2">
                                                <span className="font-bold min-w-[60px] text-slate-700">Địa chỉ:</span>
                                                <span className="line-clamp-2">{store.address || '---'}</span>
                                            </p>
                                            <p className="flex gap-2">
                                                <span className="font-bold min-w-[60px] text-slate-700">Hotline:</span>
                                                <span>{store.phone || '---'}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {activeTab === 'printer' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-100 p-2 rounded-full">
                                        <Printer className="text-emerald-600" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-emerald-800 text-sm">Máy in đang hoạt động</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                            <p className="text-xs text-emerald-600 font-medium">Xprinter-N160 (Bluetooth)</p>
                                        </div>
                                    </div>
                                </div>
                                <button className="text-xs font-bold bg-white text-emerald-700 px-3 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-50 flex items-center gap-2 transition-colors shadow-sm">
                                    <RotateCw size={14} /> Quét lại
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                {/* Left Column: Settings Form */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Cấu hình cơ bản</h3>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Khổ giấy</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => setPrinterConfig({ ...printerConfig, paperSize: '80mm' })}
                                                    className={`px-4 py-3 border rounded-xl font-bold transition-all text-sm flex flex-col items-center gap-1 ${printerConfig.paperSize === '80mm' ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' : 'bg-white text-slate-500 hover:border-slate-300'}`}>
                                                    <span>80mm (K80)</span>
                                                    <span className="text-[10px] font-normal opacity-70">Máy in to thường dùng</span>
                                                </button>
                                                <button onClick={() => setPrinterConfig({ ...printerConfig, paperSize: '58mm' })}
                                                    className={`px-4 py-3 border rounded-xl font-bold transition-all text-sm flex flex-col items-center gap-1 ${printerConfig.paperSize === '58mm' ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' : 'bg-white text-slate-500 hover:border-slate-300'}`}>
                                                    <span>58mm (K58)</span>
                                                    <span className="text-[10px] font-normal opacity-70">Máy in cầm tay/mini</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" id="autoPrint" className="w-5 h-5 text-primary rounded focus:ring-primary"
                                                    checked={printerConfig.autoPrint}
                                                    onChange={e => setPrinterConfig({ ...printerConfig, autoPrint: e.target.checked })} />
                                                <label htmlFor="autoPrint" className="text-slate-700 font-bold text-sm select-none cursor-pointer">Tự động in sau thanh toán</label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Số liên in mặc định</label>
                                            <div className="flex items-center gap-4">
                                                <input type="range" min="1" max="5"
                                                    className="flex-1 accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                                    value={printerConfig.printCopies || 1}
                                                    onChange={e => setPrinterConfig({ ...printerConfig, printCopies: parseInt(e.target.value) || 1 })}
                                                />
                                                <span className="w-8 h-8 flex items-center justify-center bg-primary text-white font-bold rounded-lg text-sm shadow-sm">{printerConfig.printCopies || 1}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Nội dung hóa đơn</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                                                <input type="checkbox" checked={printerConfig.showLogo} onChange={e => setPrinterConfig({ ...printerConfig, showLogo: e.target.checked })} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                                                <span className="font-medium text-slate-700 text-sm">Hiển thị Logo cửa hàng</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                                                <input type="checkbox" checked={printerConfig.showCashierName} onChange={e => setPrinterConfig({ ...printerConfig, showCashierName: e.target.checked })} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                                                <span className="font-medium text-slate-700 text-sm">Hiển thị tên thu ngân</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                                                <input type="checkbox" checked={printerConfig.showCustomerName} onChange={e => setPrinterConfig({ ...printerConfig, showCustomerName: e.target.checked })} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                                                <span className="font-medium text-slate-700 text-sm">Hiển thị tên khách hàng</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                                                <input type="checkbox" checked={printerConfig.showOrderBarcode} onChange={e => setPrinterConfig({ ...printerConfig, showOrderBarcode: e.target.checked })} className="w-5 h-5 text-primary rounded focus:ring-primary" />
                                                <span className="font-medium text-slate-700 text-sm">Hiển thị mã vạch đơn hàng</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button onClick={handleUpdatePrinter} className="flex-1 bg-primary hover:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <CheckCircle2 size={20} /> Lưu cấu hình
                                        </button>
                                        <button onClick={handleTestPrint} className="flex-none bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-6 py-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2">
                                            <Printer size={20} /> In thử
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Live Preview */}
                                <div className="sticky top-6">
                                    <div className="bg-slate-200/50 rounded-3xl p-6 flex flex-col items-center justify-center border border-slate-200 min-h-[600px] relative overflow-hidden">
                                        <div className="absolute inset-0 pattern-dots opacity-5 pointer-events-none"></div>
                                        <div className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm z-10">
                                            Xem trước hóa đơn
                                        </div>

                                        <div className="z-10 transform transition-all duration-300 ease-out hover:scale-[1.02]">
                                            <InvoicePreview
                                                store={store}
                                                settings={printerConfig}
                                                user={user}
                                            />
                                        </div>

                                        <p className="mt-8 text-[10px] text-slate-400 max-w-xs text-center">
                                            * Hình ảnh mang tính chất tham khảo. Hóa đơn thực tế có thể khác đôi chút tùy thuộc vào máy in của bạn.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6 max-w-lg">
                            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Tài khoản</h2>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-sm text-slate-500 mb-1">Đang đăng nhập:</p>
                                <p className="font-bold text-lg text-slate-900">{user?.username} ({user?.role})</p>
                            </div>

                            <button onClick={logout} className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                <span className="material-icons">logout</span> Đăng xuất khỏi thiết bị
                            </button>
                        </div>
                    )}

                    {activeTab === 'einvoice' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                                        <Building2 size={24} />
                                    </div>
                                    Cấu hình VNPT-Invoice / Viettel S-Invoice
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nhà cung cấp</label>
                                            <select className="w-full border-slate-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-600">
                                                <option value="viettel">Viettel S-Invoice</option>
                                                <option value="vnpt">VNPT Invoice</option>
                                                <option value="bkav">BKAV eHoadon</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Môi trường</label>
                                            <select className="w-full border-slate-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 font-bold text-slate-600">
                                                <option value="prod">Production (Chính thức)</option>
                                                <option value="sandbox">Sandbox (Thử nghiệm)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Đường dẫn API (Base URL)</label>
                                        <input type="text" className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="https://sinvoice.viettel.vn/api" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Tên đăng nhập (Service Account)</label>
                                            <input type="text" className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" placeholder="username_ws" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
                                            <input type="password" className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 mt-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Mẫu số</label>
                                            <input type="text" className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 text-center uppercase font-bold" placeholder="1/001" defaultValue="1/001" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Ký hiệu</label>
                                            <input type="text" className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 text-center uppercase font-bold" placeholder="C25T..." defaultValue="K26TBM" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Mã cơ quan thuế (Passcode)</label>
                                            <input type="password" className="w-full border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 text-center" placeholder="•••" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6">
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center gap-2">
                                            <CheckCircle2 size={20} /> Lưu & Kiểm tra kết nối
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
