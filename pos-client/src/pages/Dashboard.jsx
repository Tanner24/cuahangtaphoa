import { useState, useEffect } from 'react';
import { posService } from '../services/api';
import AnnouncementPopup from '../components/AnnouncementPopup';
import SupportModal from '../components/SupportModal';
import InstructionModal from '../components/InstructionModal';

const StatCard = ({ title, value, color, icon, subtext }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color[0]} ${color[1]}`}>
                <span className="material-icons">{icon}</span>
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            </div>
        </div>
        {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
);

export default function Dashboard() {
    const [filter, setFilter] = useState('7days');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSupport, setShowSupport] = useState(false);
    const [showInstruction, setShowInstruction] = useState(false);
    const [supportInfo, setSupportInfo] = useState({
        hotline: '0975.4214.439',
        zalo: 'https://zalo.me',
        help_url: '#'
    });

    useEffect(() => {
        fetchDashboard();
        fetchSettings();
    }, [filter]);

    const fetchSettings = async () => {
        try {
            const settings = await posService.getSystemSettings();
            if (settings && settings.support_info) {
                setSupportInfo(settings.support_info);
            }
        } catch (e) {
            console.error('Fetch settings error:', e);
        }
    };

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await posService.getDashboard(filter);
            if (res) setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val) => {
        if (val === 0) return <span className="text-slate-300 font-normal">0</span>;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val).replace('₫', 'đ');
    };

    const filterOptions = [
        { value: 'today', label: 'Hôm nay' },
        { value: 'yesterday', label: 'Hôm qua' },
        { value: '7days', label: '7 ngày qua' },
        { value: 'thisMonth', label: 'Tháng này' },
        { value: 'lastMonth', label: 'Tháng trước' },
    ];

    if (loading && !data) return <div className="p-8 text-center text-slate-400">Đang tải thống kê...</div>;

    // Fallback data if API fails or returns null
    const safeData = data || {
        overview: { revenue: 0, totalOrders: 0, profit: 0, debtAdded: 0 },
        chart: [],
        topProducts: [],
        lowStockCount: 0
    };

    const { overview, chart, lowStockCount } = safeData;

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Tổng Quan Cửa Hàng</h1>

                {/* Filter Dropdown */}
                <div className="relative">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        {filterOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Doanh thu"
                    value={formatMoney(overview.revenue)}
                    color={['bg-blue-100', 'text-blue-600']}
                    icon="payments"
                    subtext="Tổng doanh thu bán hàng"
                />
                <StatCard
                    title="Số đơn hàng"
                    value={overview.totalOrders}
                    color={['bg-indigo-100', 'text-indigo-600']}
                    icon="shopping_bag"
                    subtext="Đơn hàng hoàn thành"
                />
                <StatCard
                    title="Lợi nhuận (Ước tính)"
                    value={formatMoney(overview.profit)}
                    color={['bg-emerald-100', 'text-emerald-600']}
                    icon="trending_up"
                    subtext={<span className="font-bold text-slate-500">Dựa trên giá vốn</span>}
                />
                <StatCard
                    title="Nợ mới phát sinh"
                    value={formatMoney(overview.debtAdded)}
                    color={['bg-orange-100', 'text-orange-600']}
                    icon="book"
                    subtext="Khách nợ thêm"
                />
            </div>

            {/* Chart & Others */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex justify-between">
                            Biểu đồ doanh thu
                            <span className="text-sm font-normal text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">{filterOptions.find(o => o.value === filter)?.label}</span>
                        </h3>

                        {chart && chart.length > 0 ? (
                            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 mt-8 pb-2 border-b border-slate-100 relative">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                                    {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-slate-400 dashed"></div>)}
                                </div>

                                {chart.map((d, idx) => {
                                    const max = Math.max(...chart.map(c => Number(c.revenue))) || 1;
                                    const val = Number(d.revenue);
                                    const h = (val / max) * 100;

                                    return (
                                        <div key={idx} className="flex flex-col items-center flex-1 group relative h-full justify-end z-10 hover:bg-slate-50/50 rounded-lg transition-colors pb-6">
                                            {val > 0 ? (
                                                <div
                                                    className="w-full max-w-[40px] bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all duration-300 relative shadow-sm"
                                                    style={{ height: `${Math.max(h, 2)}%` }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                                                        {formatMoney(d.revenue)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-1 w-full max-w-[20px] bg-slate-200 rounded-full mb-1"></div>
                                            )}
                                            <div className="absolute bottom-0 text-[10px] text-slate-400 font-bold w-full text-center group-hover:text-slate-800 transition-colors">{d.date.split('/')[0]}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-slate-400">Chưa có dữ liệu biểu đồ</div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[400px]">
                        <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                            <span className="material-icons text-blue-500">star</span>
                            Sản phẩm bán chạy nhất
                        </h3>

                        {safeData.topProducts && safeData.topProducts.length > 0 ? (
                            <div className="space-y-6">
                                {safeData.topProducts.map((p, i) => {
                                    const maxQty = Math.max(...safeData.topProducts.map(tp => tp.quantity)) || 1;
                                    const width = (p.quantity / maxQty) * 100;
                                    return (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-bold text-slate-700 truncate max-w-[180px]">{p.name}</span>
                                                <span className="font-black text-blue-600">{p.quantity} <span className="text-[10px] text-slate-400 font-normal uppercase">{p.unit}</span></span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${width}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                <span className="material-icons text-4xl mb-2 opacity-20">inventory_2</span>
                                <p className="text-sm">Chưa có dữ liệu bán hàng</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4 text-slate-800">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <span className="material-icons text-xl">warning</span>
                            </div>
                            <h3 className="font-bold text-lg">Cảnh Báo Kho</h3>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center py-8">
                            {lowStockCount > 0 ? (
                                <div>
                                    <p className="text-3xl font-bold text-red-600 mb-1">{lowStockCount}</p>
                                    <p className="text-slate-500 text-sm">sản phẩm sắp hết hàng</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="material-icons">check</span>
                                    </div>
                                    <p className="text-slate-600 font-medium">Kho hàng ổn định</p>
                                    <p className="text-slate-400 text-xs mt-1">Không có sản phẩm dưới định mức</p>
                                </div>
                            )}
                        </div>
                        {lowStockCount > 0 && (
                            <button onClick={() => window.location.href = '/inventory'} className="w-full mt-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 font-bold transition-colors shadow-sm">
                                Kiểm tra ngay
                            </button>
                        )}
                    </div>
                    {/* Support section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative group">
                        {/* Background Ornament */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-[40px] -mr-10 -mt-10 opacity-60 z-0"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6 text-slate-800">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <span className="material-icons text-xl">support_agent</span>
                                </div>
                                <h3 className="font-bold text-lg">Hỗ Trợ & Liên Hệ</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="material-icons text-blue-500 text-sm">phone_iphone</span>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Tổng đài hỗ trợ</span>
                                    </div>
                                    <p className="text-lg font-black text-slate-900">{supportInfo.hotline}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <a href={supportInfo.zalo} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all group">
                                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <span className="material-icons text-xl">chat</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">Zalo OA</span>
                                    </a>

                                    <button
                                        onClick={() => setShowInstruction(true)}
                                        className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <span className="material-icons text-xl">help_outline</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">Hướng dẫn</span>
                                    </button>
                                </div>

                                <button onClick={() => setShowSupport(true)} className="w-full p-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                                    Gửi yêu cầu hỗ trợ ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <AnnouncementPopup />
                <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
                <InstructionModal isOpen={showInstruction} onClose={() => setShowInstruction(false)} />
            </div>
        </div>
    );
}
