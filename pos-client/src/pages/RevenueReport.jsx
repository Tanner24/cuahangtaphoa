import { useState, useEffect } from 'react';
import { posService } from '../services/api';
import {
    Download,
    Table,
    PieChart,
    TrendingUp,
    ShieldCheck,
    Calendar,
    ArrowRight,
    AlertTriangle,
    Wifi,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Plus
} from 'lucide-react';
import { useQuota } from '../hooks/useQuota';
import VerifyIdentityPopup from '../components/VerifyIdentityPopup';

export default function RevenueReport() {
    const { isPro, loading: quotaLoading } = useQuota();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [signedInfo, setSignedInfo] = useState(null);

    useEffect(() => {
        if (!quotaLoading && isPro) fetchReport();
    }, [month, year, quotaLoading, isPro]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await posService.getReport({ month, year, type: 'accounting', book: 's1' });
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

    if (quotaLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold">Đang kiểm tra quyền truy cập...</div>;

    if (!isPro) {
        return <UpgradePrompt />;
    }

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-xl h-screen">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp className="text-blue-600/50" size={24} />
                </div>
            </div>
            <p className="mt-6 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Đang tải dữ liệu doanh thu...</p>
        </div>
    );

    if (!data) return <div className="p-20 text-center text-rose-500 font-bold bg-white rounded-3xl m-8 shadow-2xl">Không có dữ liệu cho kỳ này</div>;

    const { summary = {}, bookData = [] } = data || {};

    const handleExportExcel = () => {
        if (!bookData || bookData.length === 0) {
            alert('Không có dữ liệu để xuất!');
            return;
        }

        const headers = ['Ngày', 'Ký hiệu', 'Số HĐ', 'Mã CQT', 'Nội dung', 'Doanh thu', 'Giảm trừ', 'DT Thuần', 'Trạng thái T-VAN'];
        const rows = bookData.map(d => [d.date, d.invoiceSymbol, d.id, d.taxCode, d.desc, d.revenue, d.returnAmount, d.revenue - (d.returnAmount || 0), d.tvanStatus === 'SENT' ? 'Đã gửi' : 'Chờ gửi']);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `S1_DoanhThu_T${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-full bg-[#f8fafc] p-4 lg:p-8 overflow-y-auto hide-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">

                <header className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/40 p-8 lg:p-10">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-blue-50/50 to-transparent -mr-20"></div>
                    <div className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                        <section className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[15px] font-black uppercase tracking-widest border border-blue-100">
                                <TrendingUp size={14} /> Quản lý Doanh thu & Hóa đơn
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                Báo Cáo <span className="text-blue-600">Doanh Thu</span>
                            </h1>
                            <p className="text-slate-500 text-sm font-medium max-w-lg">
                                Theo dõi chi tiết doanh thu bán hàng, trạng thái hóa đơn điện tử và tăng trưởng kinh doanh theo thời gian.
                            </p>
                        </section>

                        <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
                            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                <div className="flex items-center px-4 gap-2 text-slate-400">
                                    <Calendar size={18} />
                                </div>
                                <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-white border-none rounded-xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-sm px-4 py-2.5 outline-none cursor-pointer">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
                                </select>
                                <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-white border-none rounded-xl text-sm font-black text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-sm px-4 py-2.5 outline-none cursor-pointer">
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard title="Doanh thu tháng này" value={summary.total_revenue} color="slate" icon={<TrendingUp />} />
                    <SummaryCard title="Doanh thu lũy kế năm" value={summary.accumulated_revenue} color="blue" icon={<PieChart />} />
                    <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl flex flex-col justify-between group">
                        <div className="space-y-4">
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Tăng trưởng so với tháng trước</p>
                            <div className="flex items-end gap-2">
                                <h2 className="text-4xl font-black">-- %</h2>
                                <TrendingUp className="text-emerald-400 mb-2" size={24} />
                            </div>
                        </div>
                        <button onClick={handleExportExcel} className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold text-xs uppercase transition-all flex items-center justify-center gap-2">
                            <Download size={14} /> Xuất Excel Doanh thu
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 lg:p-14 overflow-hidden shadow-slate-200/30">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase">Sổ chi tiết doanh thu (S1-HKD)</h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">Kết xuất dữ liệu từ hóa đơn điện tử</p>
                        </div>
                        <div className="flex gap-4">
                            {signedInfo ? (
                                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 text-xs font-bold">
                                    <ShieldCheck size={16} /> Đã xác thực
                                </div>
                            ) : (
                                <button onClick={() => setShowVerifyModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all">
                                    <ShieldCheck size={16} /> Ký xác thực
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="relative overflow-x-auto rounded-2xl border border-slate-100 shadow-inner">
                        <RevenueTable data={bookData} formatMoney={formatMoney} />
                    </div>
                </div>
            </div>

            {showVerifyModal && (
                <VerifyIdentityPopup
                    isOpen={showVerifyModal}
                    onClose={() => setShowVerifyModal(false)}
                    reportData={{ month, year, type: 'revenue', summary, bookData }}
                    onSuccess={(info) => setSignedInfo(info)}
                />
            )}
        </div>
    );
}

// Sub-components
const SummaryCard = ({ title, value, color, icon }) => {
    const theme = {
        slate: 'border-slate-100 bg-white hover:border-slate-300 shadow-slate-200/50',
        blue: 'border-blue-100 bg-blue-50/20'
    };
    return (
        <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 shadow-xl group flex flex-col justify-between h-full relative ${theme[color]}`}>
            <div className="flex justify-between items-start mb-6">
                <p className="text-slate-900 text-[15px] font-black uppercase tracking-[0.2em]">{title}</p>
                <div className="text-slate-300 group-hover:text-slate-500 transition-colors">{icon}</div>
            </div>
            <div className="flex items-end gap-1.5 text-slate-900">
                <span className="text-3xl font-black tracking-tight">{Number(value || 0).toLocaleString()}</span>
                <span className="text-sm font-bold opacity-30 mb-1.5">đ</span>
            </div>
        </div>
    );
};

const RevenueTable = ({ data, formatMoney }) => (
    <table className="w-full text-sm text-left">
        <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-[0.25em] text-center">
            <tr>
                <th className="p-5 border-r border-slate-800">Ngày</th>
                <th className="p-5 border-r border-slate-800">Ký hiệu</th>
                <th className="p-5 border-r border-slate-800">Số HĐ</th>
                <th className="p-5 border-r border-slate-800 w-32">Mã CQT</th>
                <th className="p-5 text-left border-r border-slate-800">Nội dung</th>
                <th className="p-5 text-right w-32 border-r border-slate-800">Doanh thu</th>
                <th className="p-5 text-center w-32">Trạng thái T-VAN</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {data?.length > 0 ? data.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                    <td className="p-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">{row.date}</td>
                    <td className="p-5 text-center font-bold text-slate-500 text-[10px]">{row.invoiceSymbol || '1C25TZA'}</td>
                    <td className="p-5 text-center">
                        <span className="bg-white border border-slate-200 text-blue-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {row.id}
                        </span>
                    </td>
                    <td className="p-5 text-center font-mono text-[10px] text-slate-500 bg-slate-50 rounded select-all cursor-copy">
                        {row.taxCode || '---'}
                    </td>
                    <td className="p-5 font-bold text-slate-800">{row.desc}</td>
                    <td className="p-5 text-right font-black text-slate-900 tabular-nums">
                        {formatMoney(row.revenue - (row.returnAmount || 0))}
                    </td>
                    <td className="p-5 text-center">
                        {row.tvanStatus === 'SENT' ? (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                <CheckCircle size={10} /> Đã gửi CQT
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-100 animate-pulse">
                                <Wifi size={10} /> Đang chờ gửi
                            </span>
                        )}
                    </td>
                </tr>
            )) : <tr><td colSpan="7" className="p-32 text-center text-slate-300 font-black uppercase text-xs">Đang chờ tải dữ liệu</td></tr>}
        </tbody>
    </table>
);

const UpgradePrompt = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl text-center border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-4">TÍNH NĂNG PRO</h2>
            <p className="text-slate-500 mb-10">Báo cáo doanh thu chuẩn TT88 chỉ dành cho khách hàng gói PRO.</p>
            <button onClick={() => window.location.href = '/settings'} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-lg">NÂNG CẤP NGAY</button>
        </div>
    </div>
);
