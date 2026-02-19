import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { posService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import InvoicePreview from '../components/InvoicePreview';
import { Printer, CheckCircle2, RotateCw, QrCode, Building2, MapPin, Phone, CreditCard, Search, Bluetooth, BluetoothConnected } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { PrinterService } from '../services/printer';

export default function Settings() {
    const { logout, user } = useAuth();
    const { updateShopSettings } = useShop(); // Access context function
    const [store, setStore] = useState({
        name: '',
        address: '',
        phone: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        taxCode: ''
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('store'); // store, printer, einvoice, staff
    const [searchParams] = useSearchParams();
    const [staffList, setStaffList] = useState([]);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffForm, setStaffForm] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'staff',
        isActive: true
    });

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    useEffect(() => {
        if (activeTab === 'staff') {
            fetchStaff();
        }
    }, [activeTab]);

    const fetchStaff = async () => {
        try {
            const data = await posService.getUsers();
            setStaffList(data);
        } catch (e) {
            toast.error('Không thể lấy danh sách nhân viên');
        }
    };

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingStaff) {
                await posService.updateStoreUser(editingStaff.id, staffForm);
                toast.success('Đã cập nhật nhân viên');
            } else {
                await posService.createStoreUser(staffForm);
                toast.success('Đã thêm nhân viên mới');
            }
            setShowStaffModal(false);
            fetchStaff();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
        try {
            await posService.deleteStoreUser(id);
            toast.success('Đã xóa nhân viên');
            fetchStaff();
        } catch (e) {
            toast.error(e.message);
        }
    };

    const openEditStaff = (staff) => {
        setEditingStaff(staff);
        setStaffForm({
            username: staff.username,
            password: '', // Để trống nếu không muốn đổi mật khẩu
            fullName: staff.fullName,
            role: staff.role,
            isActive: staff.isActive
        });
        setShowStaffModal(true);
    };

    const openAddStaff = () => {
        setEditingStaff(null);
        setStaffForm({
            username: '',
            password: '',
            fullName: '',
            role: 'staff',
            isActive: true
        });
        setShowStaffModal(true);
    };

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

    const [connectedPrinter, setConnectedPrinter] = useState(null);

    const handleBTConnect = async () => {
        try {
            const name = await PrinterService.connect();
            setConnectedPrinter(name);
            toast.success(`Đã kết nối: ${name}`);
        } catch (e) {
            toast.error('Không thể kết nối Bluetooth. Đảm bảo máy in đã bật và nằm trong vùng phủ sóng.');
        }
    };

    const handleOpenDrawer = async () => {
        try {
            await PrinterService.openCashDrawer();
            toast.success('Đã gửi lệnh mở ngăn kéo');
        } catch (e) {
            toast.error('Lỗi: ' + e.message);
        }
    };

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
                footerText: res.footerText || '',
                taxCode: res.taxCode || ''
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

    const handleTestPrint = async () => {
        if (connectedPrinter) {
            try {
                const testItems = [
                    { name: 'Nước ngọt Coca', qty: 2, price: 10000 },
                    { name: 'Bánh Snack Khoai', qty: 1, price: 15000 },
                    { name: 'Kẹo Singum', qty: 5, price: 5000 }
                ];
                await PrinterService.printReceipt(store, testItems, 60000, { cashier: user?.username });
                toast.success('Đã gửi lệnh in Bluetooth');
                return;
            } catch (e) {
                toast.error('In Bluetooth thất bại: ' + e.message);
            }
        } else {
            toast.error('Vui lòng kết nối máy in để in trực tiếp.');
        }
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
                    <button onClick={() => setActiveTab('einvoice')}
                        className={`w-full text-left p-4 font-bold border-l-4 transition-all flex items-center gap-3 ${activeTab === 'einvoice' ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                        <span className="material-icons">receipt_long</span> Hóa đơn điện tử
                    </button>
                    {user?.role !== 'staff' && (
                        <button onClick={() => setActiveTab('staff')}
                            className={`w-full text-left p-4 font-bold border-l-4 transition-all flex items-center gap-3 ${activeTab === 'staff' ? 'border-primary text-primary bg-blue-50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}>
                            <span className="material-icons">people</span> Quản lý nhân viên
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm w-full">

                    {activeTab === 'store' && (
                        <form onSubmit={handleUpdateStore} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left Column: Input Forms */}
                            <div className="space-y-6">
                                {/* User Account Section */}
                                <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl uppercase">
                                            {user?.username?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nhân viên đang trực</p>
                                            <h4 className="font-bold text-slate-800 text-lg">{user?.username} <span className="text-sm font-normal text-slate-500">({user?.role})</span></h4>
                                        </div>
                                    </div>
                                    <button onClick={logout} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95">
                                        <span className="material-icons text-xl">logout</span> Đăng xuất
                                    </button>
                                </div>

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
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500"></div>

                                        <div className="text-center mb-6 pt-2">
                                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 text-primary">
                                                <QrCode size={32} />
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-800">Quét mã thanh toán</h2>
                                            <p className="text-sm text-slate-500 font-medium">Hỗ trợ Mobile Banking 24/7</p>
                                        </div>

                                        <div className="bg-slate-900 rounded-3xl p-4 mb-6 relative group cursor-pointer transition-transform hover:scale-[1.02] max-w-[240px] mx-auto">
                                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-lg"></div>
                                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/30 rounded-tr-lg"></div>
                                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/30 rounded-bl-lg"></div>
                                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-lg"></div>

                                            {getQrUrl() ? (
                                                <img src={getQrUrl()} alt="VietQR" className="w-full aspect-square object-contain bg-white rounded-xl" />
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
                                                <span className="font-mono font-bold text-slate-800 tracking-wider copy-text" onClick={() => { navigator.clipboard.writeText(store.bankAccountNumber); toast.success('Đã sao chép STK!') }}>{store.bankAccountNumber || '---'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                            <MapPin size={16} className="text-red-500" /> Hiển thị trên hóa đơn
                                        </h4>
                                        <div className="text-xs space-y-2 text-slate-500">
                                            <p className="flex gap-2"><span className="font-bold min-w-[60px] text-slate-700">Tên shop:</span><span>{store.name || '---'}</span></p>
                                            <p className="flex gap-2"><span className="font-bold min-w-[60px] text-slate-700">Địa chỉ:</span><span className="line-clamp-2">{store.address || '---'}</span></p>
                                            <p className="flex gap-2"><span className="font-bold min-w-[60px] text-slate-700">Hotline:</span><span>{store.phone || '---'}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {activeTab === 'printer' && (
                        <div className="space-y-6">
                            <div className={`flex items-center justify-between p-4 rounded-xl border ${connectedPrinter ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${connectedPrinter ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                                        {connectedPrinter ? <BluetoothConnected className="text-emerald-600" size={24} /> : <Bluetooth className="text-slate-400" size={24} />}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-sm ${connectedPrinter ? 'text-emerald-800' : 'text-slate-500'}`}>
                                            {connectedPrinter ? 'Máy in đang hoạt động' : 'Chưa kết nối máy in'}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {connectedPrinter && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
                                            <p className={`text-xs font-medium ${connectedPrinter ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {connectedPrinter || 'Vui lòng quét để kết nối Bluetooth'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleBTConnect}
                                    className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors shadow-sm flex items-center gap-2 ${connectedPrinter ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-primary text-white border-primary hover:bg-blue-600'}`}>
                                    <RotateCw size={14} className={connectedPrinter ? '' : 'animate-spin-slow'} />
                                    {connectedPrinter ? 'Kết nối lại' : 'Quét máy in'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                <div className="space-y-6">
                                    {/* Cash Drawer Control */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b border-slate-200 pb-2 mb-4">Điều khiển phần cứng</h3>
                                        <button
                                            onClick={handleOpenDrawer}
                                            className="w-full bg-white border border-slate-300 p-4 rounded-xl font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95">
                                            <CreditCard size={20} className="text-primary" /> Mở két tiền (Drawer Kick)
                                        </button>
                                        <p className="text-[10px] text-slate-500 mt-2 italic px-2">Lưu ý: Két tiền phải được kết nối với cổng RJ11 của máy in.</p>
                                    </div>

                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide border-b border-slate-200 pb-2">Cấu hình cơ bản</h3>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Khổ giấy</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => setPrinterConfig({ ...printerConfig, paperSize: '80mm' })}
                                                    className={`px-4 py-3 border rounded-xl font-bold transition-all text-sm flex flex-col items-center gap-1 ${printerConfig.paperSize === '80mm' ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' : 'bg-white text-slate-500 hover:border-slate-300'}`}>
                                                    <span>80mm (K80)</span>
                                                </button>
                                                <button onClick={() => setPrinterConfig({ ...printerConfig, paperSize: '58mm' })}
                                                    className={`px-4 py-3 border rounded-xl font-bold transition-all text-sm flex flex-col items-center gap-1 ${printerConfig.paperSize === '58mm' ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105' : 'bg-white text-slate-500 hover:border-slate-300'}`}>
                                                    <span>58mm (K58)</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" id="autoPrint" className="w-5 h-5 text-primary rounded focus:ring-primary" checked={printerConfig.autoPrint} onChange={e => setPrinterConfig({ ...printerConfig, autoPrint: e.target.checked })} />
                                                <label htmlFor="autoPrint" className="text-slate-700 font-bold text-sm select-none cursor-pointer">Tự động in sau thanh toán</label>
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
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button onClick={handleUpdatePrinter} className="flex-1 bg-primary hover:bg-blue-600 text-white px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"><CheckCircle2 size={20} /> Lưu cấu hình</button>
                                        <button onClick={handleTestPrint} className="flex-none bg-white border border-slate-300 px-6 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"><Printer size={20} /> In thử</button>
                                    </div>
                                </div>

                                <div className="sticky top-6">
                                    <div className="bg-slate-200/50 rounded-3xl p-6 flex flex-col items-center justify-center border border-slate-200 min-h-[500px] relative overflow-hidden">
                                        <InvoicePreview store={store} settings={printerConfig} user={user} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'einvoice' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                    <div className="bg-blue-600 text-white p-2 rounded-lg"><Building2 size={24} /></div> VNPT-Invoice / Viettel S-Invoice
                                </h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Nhà cung cấp</label>
                                            <select className="w-full border-slate-300 rounded-xl px-4 py-3 bg-white"><option>Viettel S-Invoice</option><option>VNPT Invoice</option></select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-6">
                                        <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black transition-all flex items-center gap-2"><CheckCircle2 size={20} /> Lưu & Kiểm tra kết nối</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'staff' && user?.role !== 'staff' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Danh sách nhân viên</h3>
                                <button onClick={openAddStaff} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
                                    <span className="material-icons">person_add</span> Thêm tài khoản
                                </button>
                            </div>

                            <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Họ tên / Username</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Chức vụ</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {staffList.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{s.fullName?.charAt(0)}</div>
                                                        <div><p className="font-bold text-slate-800">{s.fullName}</p><p className="text-xs text-slate-500">@{s.username}</p></div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${s.role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {s.role === 'owner' ? 'Chủ quán' : s.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-bold ${s.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>{s.isActive ? 'Hoạt động' : 'Đã khóa'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => openEditStaff(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><span className="material-icons text-sm">edit</span></button>
                                                        {s.role !== 'owner' && <button onClick={() => handleDeleteStaff(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><span className="material-icons text-sm">delete</span></button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showStaffModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800">{editingStaff ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</h3>
                            <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-icons">close</span></button>
                        </div>
                        <form onSubmit={handleStaffSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Họ và tên</label>
                                <input type="text" className="w-full border-slate-300 rounded-xl px-4 py-2.5" required value={staffForm.fullName} onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
                                <input type="text" className="w-full border-slate-300 rounded-xl px-4 py-2.5" required disabled={!!editingStaff} value={staffForm.username} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mật khẩu</label>
                                <input type="password" className="w-full border-slate-300 rounded-xl px-4 py-2.5" required={!editingStaff} value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Quyền</label>
                                <select className="w-full border-slate-300 rounded-xl px-4 py-2.5 bg-white" value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}>
                                    <option value="staff">Nhân viên bán hàng</option>
                                    <option value="manager">Quản lý cửa hàng</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input type="checkbox" id="userActive" checked={staffForm.isActive} onChange={e => setStaffForm({ ...staffForm, isActive: e.target.checked })} />
                                <label htmlFor="userActive" className="text-sm font-bold text-slate-700 cursor-pointer">Hoạt động</label>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Hủy</button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
