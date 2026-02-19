import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { posService } from '../services/api';
import Quagga from '@ericblade/quagga2';
import { useQuota } from '../hooks/useQuota';
import {
    Scan,
    X,
    Plus,
    Search,
    Package,
    Tag,
    DollarSign,
    Layers,
    ChevronRight,
    Edit3,
    Trash2,
    BarChart3,
    AlertCircle,
    CheckCircle2,
    Lock,
    Crown,
    ArrowUpCircle
} from 'lucide-react';

export default function Inventory() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const { checkLimit, isPro } = useQuota();

    // Auto Deduct State
    const [isAutoDeduct, setIsAutoDeduct] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '', barcode: '', price: '', priceIn: '',
        currentStock: '', minStockThreshold: '5', categoryId: '', brandId: '', unit: 'Cái', imageUrl: ''
    });

    useEffect(() => { fetchData(); }, []);

    // Sound feedback
    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.22);
        } catch (e) { console.log("Audio failed", e); }
    };

    // Scanner logic with Quagga2
    useEffect(() => {
        if (isScanning) {
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.querySelector('#reader'),
                    constraints: {
                        width: { min: 640 },
                        height: { min: 480 },
                        facingMode: "environment",
                        aspectRatio: { min: 1, max: 2 }
                    },
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                numOfWorkers: navigator.hardwareConcurrency || 4,
                decoder: {
                    readers: [
                        "code_128_reader",
                        "ean_reader",
                        "ean_8_reader",
                        "code_39_reader",
                        "upc_reader",
                        "upc_e_reader"
                    ]
                },
                locate: true
            }, function (err) {
                if (err) {
                    console.error("Quagga init error:", err);
                    setIsScanning(false);
                    return;
                }
                Quagga.start();
            });

            const handleDetected = (result) => {
                if (result.codeResult && result.codeResult.code) {
                    const code = result.codeResult.code;
                    // Chống nhiễu: Quagga có thể trả về nhiều kết quả rác, 
                    // ta tắt quét ngay khi nhận được code hợp lệ đầu tiên
                    playBeep();
                    setIsScanning(false);
                    handleBarcodeLookup(code);
                }
            };

            Quagga.onDetected(handleDetected);

            return () => {
                Quagga.offDetected(handleDetected);
                Quagga.stop();
            };
        }
    }, [isScanning]);

    const handleBarcodeLookup = async (code) => {
        const existing = products.find(p => p.barcode === code);
        if (existing) {
            if (window.confirm(`Sản phẩm "${existing.name}" đã tồn tại. Chỉnh sửa sản phẩm này?`)) {
                handleEdit(existing);
                return;
            }
        }

        setFormData(prev => ({ ...prev, barcode: code }));
        setIsLookingUp(true);

        try {
            // Sử dụng API thông qua Backend để lấy dữ liệu từ Open Food Facts
            const res = await posService.lookupGlobalBarcode(code);
            const p = res.data;

            if (p) {
                setFormData(prev => ({
                    ...prev,
                    name: p.name || prev.name,
                    imageUrl: p.imageUrl || prev.imageUrl,
                    unit: p.unit || prev.unit,
                }));
            }
        } catch (err) {
            console.error("Lookup Error:", err);
        } finally {
            setIsLookingUp(false);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes, brandRes] = await Promise.all([
                posService.getProducts({ limit: 100 }),
                api.get('/management/categories'),
                api.get('/management/brands')
            ]);
            setProducts(prodRes.data || []);
            setCategories(catRes || []);
            setBrands(brandRes || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa bỏ sản phẩm này khối hệ thống?')) return;
        try {
            await posService.deleteProduct(id);
            fetchData();
        } catch (e) { alert('Lỗi xóa: ' + e.message); }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name, barcode: product.barcode || '', price: product.price,
            priceIn: product.priceIn || 0, currentStock: product.currentStock,
            minStockThreshold: product.minStockThreshold || 5,
            categoryId: product.categoryId || '', brandId: product.brandId || '',
            unit: product.unit || 'Cái', imageUrl: product.imageUrl || ''
        });
        setShowModal(true);
    };

    const handleAdd = () => {
        const { ok, current, limit } = checkLimit('products');
        if (!ok) {
            setShowUpgradeModal(true);
            return;
        }

        setEditingProduct(null);
        setFormData({
            name: '', barcode: '', price: '', priceIn: '',
            currentStock: '', minStockThreshold: '5', categoryId: '', brandId: '', unit: 'Cái', imageUrl: ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.categoryId) {
                const cat = categories.find(c => c.id == payload.categoryId);
                if (cat) payload.category = cat.name;
            }
            if (editingProduct) await posService.updateProduct(editingProduct.id, payload);
            else await posService.createProduct(payload);
            setShowModal(false);
            fetchData();
        } catch (e) { alert('Lỗi: ' + e.message); }
    };

    const [activeTab, setActiveTab] = useState('list'); // 'list', 'in', 'audit'
    const [auditData, setAuditData] = useState({}); // { productId: physicalCount }
    const [lotEntry, setLotEntry] = useState({ productId: '', quantity: '', priceIn: '' });

    const handleAuditAdjustment = async () => {
        try {
            const updates = Object.entries(auditData).map(([id, count]) => {
                const product = products.find(p => p.id == id);
                if (!product) return null;
                return posService.updateProduct(id, { ...product, currentStock: count });
            }).filter(Boolean);

            await Promise.all(updates);
            alert('Cập nhật kiểm kho thành công!');
            setAuditData({});
            fetchData();
        } catch (e) { alert('Lỗi: ' + e.message); }
    };

    const handleLotSubmit = async (e) => {
        e.preventDefault();
        try {
            const product = products.find(p => p.id == lotEntry.productId);
            if (!product) return;

            const newStock = Number(product.currentStock) + Number(lotEntry.quantity);
            await posService.updateProduct(lotEntry.productId, {
                ...product,
                currentStock: newStock,
                priceIn: lotEntry.priceIn || product.priceIn
            });

            alert(`Đã nhập thêm ${lotEntry.quantity} ${product.unit} vào kho.`);
            setLotEntry({ productId: '', quantity: '', priceIn: '' });
            fetchData();
        } catch (e) { alert('Lỗi: ' + e.message); }
    };

    // Secure Toggle Logic
    const handleToggleAutoDeduct = () => {
        setShowConfirmModal(true);
    };

    const confirmToggle = () => {
        setIsAutoDeduct((prev) => !prev);
        setShowConfirmModal(false);
    };

    return (
        <div className="p-6 lg:p-10 min-h-screen bg-[#f8fafc] flex flex-col gap-10 animate-fade-in font-sans">
            {/* Minimal Header */}
            <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="bg-slate-900 p-4 rounded-2xl shadow-lg ring-4 ring-slate-100">
                        <Package className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Quản Lý Kho</h1>
                        <p className="text-slate-400 text-[10px] font-bold mt-2 tracking-[0.2em] uppercase opacity-70">Sản phẩm & Tồn kho thực tế</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <nav className="flex bg-slate-200/50 p-1.5 rounded-2xl w-full sm:w-auto border border-slate-200">
                        <button onClick={() => setActiveTab('list')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Danh sách</button>
                        <button onClick={() => setActiveTab('in')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'in' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Nhập lô</button>
                        <button onClick={() => setActiveTab('audit')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Kiểm kho</button>
                    </nav>
                    <button
                        onClick={handleAdd}
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <Plus size={16} strokeWidth={3} /> Thêm Mới
                    </button>
                </div>
            </div>

            {/* Structured Grid - Defined Borders */}
            {activeTab === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<BarChart3 />} label="Giá trị vốn đầu tư" value={products.reduce((a, b) => a + (Number(b.priceIn || 0) * Number(b.currentStock)), 0)} />
                    <StatCard icon={<Tag />} label="Giá trị hàng bán" value={products.reduce((a, b) => a + (Number(b.price) * Number(b.currentStock)), 0)} />
                    <StatCard icon={<AlertCircle />} label="Mặt hàng cần nhập" value={products.filter(p => p.currentStock <= (p.minStockThreshold || 5)).length} isAlert />
                    <StatCard icon={<Layers />} label="Tổng tồn kho" value={products.reduce((a, b) => a + Number(b.currentStock), 0)} isStatus />
                </div>
            )}

            {/* Main Content Area - Clearly Split Boxes */}
            <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                {activeTab === 'list' && (
                    <>
                        {/* Search Bar Area with clear division */}
                        <div className="p-6 border-b border-slate-200 flex flex-col items-center justify-between gap-6 bg-slate-50/50">
                            <div className="relative w-full flex items-center gap-4">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    placeholder="Tìm tên sản phẩm, mã SKU, mã vạch..."
                                    className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all"
                                />

                                <button
                                    onClick={handleToggleAutoDeduct}
                                    className={`hidden md:flex items-center gap-3 px-5 py-4 border rounded-2xl whitespace-nowrap shadow-sm transition-all active:scale-95 ${isAutoDeduct ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ring-4 ${isAutoDeduct ? 'bg-emerald-500 ring-emerald-100 animate-pulse' : 'bg-slate-400 ring-slate-200'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                                        Auto Deduct: {isAutoDeduct ? 'ON' : 'OFF'}
                                    </span>
                                    <Lock size={14} className={isAutoDeduct ? 'text-emerald-400' : 'text-slate-400'} />
                                </button>
                            </div>
                        </div>

                        {/* Table with Grid Lines for easier reading */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-20">Ảnh</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Sản phẩm</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-left">Danh mục</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Giá vốn</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Giá bán</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Tồn kho</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tác vụ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="7" className="p-32 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Đang tải dữ liệu...</td></tr>
                                    ) : products.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                                            {/* Image */}
                                            <td className="px-6 py-4 text-center">
                                                <div className={`w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden mx-auto shadow-sm ${p.imageUrl ? 'bg-white' : 'bg-slate-100'}`}>
                                                    {p.imageUrl ? (
                                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package size={18} className="text-slate-300" />
                                                    )}
                                                </div>
                                            </td>
                                            {/* Product Name & SKU */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 uppercase tracking-wide bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                        {p.barcode || 'NO-CODE'}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Category */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                                    {p.categoryRel?.name || p.category || 'Chung'}
                                                </span>
                                            </td>
                                            {/* Cost Price */}
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-medium text-slate-400 tabular-nums text-xs">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.priceIn || 0)}
                                                </span>
                                            </td>
                                            {/* Selling Price */}
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-slate-900 tabular-nums text-sm">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                                                </span>
                                            </td>
                                            {/* Stock */}
                                            <td className="px-6 py-4 text-right">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${p.currentStock <= 0
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100 ring-2 ring-rose-50'
                                                    : p.currentStock <= 10
                                                        ? 'bg-orange-50 text-orange-600 border-orange-100'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                    {p.currentStock} {p.unit || 'cái'}
                                                    {p.currentStock <= 10 && <AlertCircle size={12} strokeWidth={2.5} />}
                                                </div>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Chỉnh sửa">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Xóa">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'in' && (
                    <div className="p-16 max-w-2xl mx-auto w-full animate-fade-in">
                        <header className="mb-12 border-l-4 border-slate-900 pl-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kê khai Nhập Kho</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Ghi nhận chứng từ nhập hàng thực tế</p>
                        </header>

                        <form onSubmit={handleLotSubmit} className="space-y-10">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Mặt hàng nhập kho</label>
                                <select
                                    required
                                    value={lotEntry.productId}
                                    onChange={e => setLotEntry({ ...lotEntry, productId: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-slate-900 outline-none transition-all font-bold text-slate-800 appearance-none cursor-pointer shadow-sm"
                                >
                                    <option value="">— Chọn sản phẩm trong danh sách —</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (Số dư kho: {p.currentStock})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Số lượng mới (+)</label>
                                    <input required type="number" value={lotEntry.quantity} onChange={e => setLotEntry({ ...lotEntry, quantity: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all font-black text-2xl tabular-nums shadow-sm" placeholder="0" />
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Giá vốn nhập (đ)</label>
                                    <input type="number" value={lotEntry.priceIn} onChange={e => setLotEntry({ ...lotEntry, priceIn: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-slate-900 focus:ring-4 focus:ring-slate-100 outline-none transition-all font-black text-2xl tabular-nums shadow-sm" placeholder="Giữ nguyên" />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]">Xác nhận & Cập nhật kho hàng</button>
                        </form>
                    </div>
                )}

                {activeTab === 'audit' && (
                    <div className="flex flex-col h-[700px] animate-fade-in">
                        <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <div className="border-l-4 border-slate-900 pl-6">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Đối soát kho Quầy</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Cân bằng số liệu Máy và Thực Tế</p>
                            </div>
                            <button onClick={handleAuditAdjustment} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg">
                                <CheckCircle2 size={16} /> Lưu kết quả đối soát
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#fafbfc] border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Sản phẩm</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Trên Hệ thống</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Đếm thực tế</th>
                                        <th className="px-10 py-5 text-[9px] font-black text-slate-500 uppercase tracking-widest">Chênh lệch</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map((p, idx) => {
                                        const actual = auditData[p.id] !== undefined ? auditData[p.id] : p.currentStock;
                                        const diff = actual - p.currentStock;
                                        return (
                                            <tr key={p.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                                <td className="px-10 py-6 font-black text-slate-700 uppercase text-[11px] border-r border-slate-50">{p.name}</td>
                                                <td className="px-10 py-6 font-bold text-slate-400 text-xs tabular-nums border-r border-slate-50">{p.currentStock} {p.unit}</td>
                                                <td className="px-10 py-6 border-r border-slate-50">
                                                    <input
                                                        type="number"
                                                        value={auditData[p.id] || ''}
                                                        onChange={e => setAuditData({ ...auditData, [p.id]: e.target.value === '' ? undefined : Number(e.target.value) })}
                                                        placeholder={p.currentStock}
                                                        className="w-32 px-4 py-3 border border-slate-200 rounded-xl font-black text-slate-900 text-center focus:border-slate-900 outline-none transition-all bg-white shadow-inner"
                                                    />
                                                </td>
                                                <td className="px-10 py-6">
                                                    <div className={`inline-flex px-4 py-1.5 rounded-lg font-black text-[10px] shadow-sm ${diff === 0 ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'}`}>
                                                        {diff > 0 ? `+${diff}` : diff}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <header className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-[#fafbfc]">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingProduct ? 'Cập nhật hàng hóa' : 'Khai báo hàng mới'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10">
                            {isScanning && (
                                <div className="p-0 bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner border border-slate-800 aspect-video mb-8">
                                    <div id="reader" className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:absolute [&>canvas]:top-0 [&>canvas]:left-0 [&>canvas]:w-full [&>canvas]:h-full"></div>
                                    <div className="absolute inset-0 border-2 border-emerald-500/50 pointer-events-none flex items-center justify-center">
                                        <div className="w-3/4 h-1/2 border-2 border-emerald-400 rounded-lg shadow-[0_0_50px_rgba(52,211,153,0.3)] flex items-center justify-center">
                                            <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-[scan_2s_linear_infinite]"></div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsScanning(false)}
                                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-3 rounded-2xl backdrop-blur-md z-10 transition-all active:scale-95"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}

                            <form id="productForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Tên hàng hóa *</label>
                                    <input required type="text" className={`w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-lg text-slate-900 ${isLookingUp ? 'animate-pulse' : ''}`}
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={isLookingUp ? "Đang tìm tên sản phẩm..." : "VD: Sữa đặc Cô gái Hà Lan"} />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Phân loại (Nhóm hàng)</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold text-slate-700 cursor-pointer shadow-sm"
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    >
                                        <option value="">— Chưa phân loại —</option>
                                        {categories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Mã vạch (Barcode)</label>
                                    <div className="relative">
                                        <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-black text-slate-600"
                                            value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Scan..." />
                                        <button type="button" onClick={() => setIsScanning(!isScanning)} className="absolute right-3 top-3 p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 shadow-sm transition-all"><Scan size={20} /></button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Đơn vị</label>
                                    <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-bold"
                                        value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} placeholder="Cái, Hộp, KG..." />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Giá bán niêm yết *</label>
                                    <input required type="number" className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl focus:ring-4 focus:ring-slate-100 outline-none transition-all font-black text-xl tabular-nums shadow-sm"
                                        value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Giá vốn</label>
                                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-black text-xl tabular-nums shadow-sm"
                                        value={formData.priceIn} onChange={e => setFormData({ ...formData, priceIn: e.target.value })} placeholder="0" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Số dư đầu kỳ</label>
                                    <input required type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-slate-900 outline-none transition-all font-black text-xl shadow-sm text-slate-700"
                                        value={formData.currentStock} onChange={e => setFormData({ ...formData, currentStock: e.target.value })} placeholder="0" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Cảnh báo dưới</label>
                                    <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-rose-500 transition-all font-black text-xl text-rose-500 shadow-sm"
                                        value={formData.minStockThreshold} onChange={e => setFormData({ ...formData, minStockThreshold: e.target.value })} placeholder="5" />
                                </div>
                            </form>
                        </div>
                        <footer className="px-10 py-8 border-t border-slate-100 flex justify-end gap-4 bg-[#fafbfc]">
                            <button onClick={() => setShowModal(false)} className="px-8 py-4 bg-white text-slate-400 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:text-slate-600 border border-slate-100">Đóng</button>
                            <button type="submit" form="productForm" className="px-10 py-4 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg hover:bg-slate-800 transition-all">Lưu dữ liệu</button>
                        </footer>
                    </div>
                </div>
            )}

            {showUpgradeModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-white/20">
                        <div className="relative h-48 bg-slate-900 flex flex-col items-center justify-center text-center p-8 overflow-hidden">
                            {/* Animated Background Orbs */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-600/20 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2 animate-pulse transition-delay-1000"></div>

                            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
                                <Crown size={40} className="text-amber-400 rotate-12" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">VƯỢT QUÁ GIỚI HẠN GÓI</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Dành cho khách hàng VIP</p>
                        </div>

                        <div className="p-10 text-center">
                            <p className="text-slate-600 text-lg font-medium leading-relaxed">
                                Bạn đã sử dụng hết <span className="font-black text-slate-900">{checkLimit('products').limit}</span> sản phẩm cho phép trong gói <span className="text-blue-600 font-bold uppercase tracking-tighter">BASIC</span>.
                            </p>
                            <p className="text-slate-400 text-sm mt-4">
                                Để thêm hàng nghìn sản phẩm mới và mở khóa các tính năng báo cáo chuyên sâu, hãy nâng cấp lên gói <span className="text-slate-900 font-bold">PRO</span> ngay hôm nay.
                            </p>

                            <div className="mt-10 flex flex-col gap-4">
                                <button
                                    onClick={() => navigate('/settings')}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <ArrowUpCircle size={20} /> Nâng Cấp Ngay
                                </button>
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    Để sau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Minimal Stat Card ---
const StatCard = ({ icon, label, value, isAlert, isStatus }) => {
    return (
        <div className={`p-7 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm flex flex-col justify-between h-40 group relative overflow-hidden`}>
            {/* Subtle background highlight for interaction */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-[3]"></div>

            <div className="flex justify-between items-start z-10">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 font-bold group-hover:text-slate-900 transition-colors">{label}</span>
                <div className={`p-2.5 rounded-xl transition-all duration-500 group-hover:rotate-6 bg-slate-50 text-slate-300 group-hover:text-slate-900`}>
                    {icon}
                </div>
            </div>

            <div className="flex items-baseline gap-1.5 z-10">
                <div className={`text-3xl font-black tracking-tighter leading-none ${isAlert ? 'text-rose-600' : 'text-slate-900'}`}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
                {!isAlert && !isStatus && (
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">đ</span>
                )}
                {isStatus && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 ml-2 bg-emerald-50 px-2 py-1 rounded-lg">
                        Active
                    </div>
                )}
            </div>
        </div>
    );
};
