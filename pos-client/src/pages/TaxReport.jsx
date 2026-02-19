import { useState, useEffect } from 'react';
import { posService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Download,
    Table,
    Printer,
    Calculator,
    ClipboardList,
    TrendingUp,
    Briefcase,
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

export default function TaxReport() {
    const { isPro, loading: quotaLoading } = useQuota();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('tax'); // tax | accounting
    const [taxSubTab, setTaxSubTab] = useState('01_cnkd');
    const [bookType, setBookType] = useState('s2');
    const [showTaxDetails, setShowTaxDetails] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [signedInfo, setSignedInfo] = useState(null);

    const BOOKS = [
        { id: 's2', code: 'S2-HKD', name: 'Sổ vật tư, hàng hóa', icon: <ClipboardList size={22} /> },
        { id: 's3', code: 'S3-HKD', name: 'Sổ chi phí SXKD', icon: <Calculator size={22} /> },
        { id: 's4', code: 'S4-HKD', name: 'Sổ thanh toán thuế', icon: <ShieldCheck size={22} /> },
        { id: 's5', code: 'S5-HKD', name: 'Sổ thanh toán lương', icon: <Briefcase size={22} /> },
        { id: 's6', code: 'S6-HKD', name: 'Sổ quỹ tiền mặt', icon: <FileText size={22} /> },
        { id: 's7', code: 'S7-HKD', name: 'Sổ tiền gửi ngân hàng', icon: <Table size={22} /> },
    ];

    useEffect(() => {
        if (!quotaLoading && isPro) fetchReport();
    }, [month, year, viewMode, bookType, quotaLoading, isPro]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await posService.getReport({ month, year, type: viewMode, book: bookType });
            setData(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

    if (quotaLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold">Đang kiểm tra quyền truy cập...</div>;
    if (!isPro) return <UpgradePrompt />;

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 h-screen">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="mt-6 text-slate-500 font-black uppercase tracking-widest text-[10px]">Đang đồng bộ dữ liệu thuế & sổ sách...</p>
        </div>
    );

    const { summary = {}, bookData = [] } = data || {};

    const handleExportExcel = () => {
        if (!bookData || bookData.length === 0) {
            alert('Không có dữ liệu để xuất!');
            return;
        }

        let headers = [];
        let rows = [];

        switch (bookType) {
            case 's2':
                headers = ['Ngày', 'Chứng từ', 'Diễn giải', 'ĐVT', 'Nhập', 'Xuất', 'Tồn'];
                rows = bookData.map(d => [d.date, d.code, d.name, d.unit, d.in, d.out, d.stock]);
                break;
            case 's3': headers = ['Ngày', 'Số CT', 'Nội dung', 'Số tiền']; rows = bookData.map(d => [d.date, d.doc, d.desc, d.out]); break;
            case 's4': headers = ['Ngày nộp', 'Chứng từ', 'Loại thuế', 'Số tiền']; rows = bookData.map(d => [d.date, d.doc, d.desc, d.amount]); break;
            case 's5': headers = ['Thời gian', 'Nhân viên', 'Chức vụ', 'Tổng']; rows = bookData.map(d => [d.date, d.name, d.role, d.total]); break;
            case 's6': case 's7': headers = ['Ngày', 'Số CT', 'Diễn giải', 'Thu', 'Chi']; rows = bookData.map(d => [d.date, d.doc, d.desc, d.in, d.out]); break;
            default: return;
        }

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${bookType.toUpperCase()}_T${month}_${year}.csv`;
        link.click();
    };

    const handleExportXML = () => {
        // Simple XML generation for 01/CNKD
        const taxCode = data?.store?.taxCode || "8888888888";
        const xml = `<?xml version="1.0" encoding="UTF-8"?><HSoThue><MaSoThue>${taxCode}</MaSoThue><Ky>${month}/${year}</Ky><TongDoanhThu>${summary.total_revenue}</TongDoanhThu></HSoThue>`;
        const blob = new Blob([xml], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `01_CNKD_${taxCode}.xml`;
        a.click();
    };

    return (
        <div className="min-h-full bg-[#f8fafc] p-4 lg:p-8 overflow-y-auto hide-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">

                <header className="relative bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl p-8 lg:p-10 flex flex-col xl:flex-row justify-between items-center gap-10">
                    <section className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[12px] font-black uppercase tracking-widest">
                            <ShieldCheck size={14} className="text-blue-400" /> Hệ thống thuế & Sổ sách TT88
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Thuế <span className="text-blue-600">&</span> Kế Toán</h1>
                    </section>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            <select value={month} onChange={(e) => setMonth(e.target.value)} className="bg-white rounded-xl text-sm font-black px-4 py-2 border-none">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
                            </select>
                            <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-white rounded-xl text-sm font-black px-4 py-2 border-none ml-1">
                                <option value="2025">2025</option><option value="2026">2026</option>
                            </select>
                        </div>

                        <div className="bg-white p-1.5 rounded-[1.25rem] flex shadow-xl border border-slate-200">
                            <button onClick={() => setViewMode('tax')} className={`px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'tax' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                                <ShieldCheck size={16} /> Thuế & Tờ khai
                            </button>
                            <button onClick={() => setViewMode('accounting')} className={`px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${viewMode === 'accounting' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400'}`}>
                                <Table size={16} /> Sổ sách kế toán
                            </button>
                        </div>
                    </div>
                </header>

                <TaxComplianceWidget summary={summary} />

                {viewMode === 'tax' ? (
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <SummaryCard title="Thuế GTGT (1%)" value={summary.vat_amount} color="amber" icon={<ShieldCheck size={18} />} />
                                <SummaryCard title="Thuế TNCN (0.5%)" value={summary.pit_amount} color="orange" icon={<ShieldCheck size={18} />} />
                            </div>
                            <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
                                <p className="text-blue-100 text-sm font-black uppercase tracking-widest">Nghĩa vụ thuế kỳ này</p>
                                <h2 className="text-4xl font-black mt-2">{Number(summary.total_tax).toLocaleString()} <span className="text-lg">đ</span></h2>
                                <div className="pt-8 flex gap-3">
                                    <button onClick={handleExportXML} className="flex-1 bg-white text-blue-600 font-black py-3 rounded-xl text-[10px] uppercase">Xuất XML (HTKK)</button>
                                    <button className="bg-blue-500 text-white p-3 rounded-xl"><Printer size={16} /></button>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
                                <div className="bg-slate-50 p-2 flex gap-2 border-b border-slate-100">
                                    <button onClick={() => setTaxSubTab('01_cnkd')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-2xl ${taxSubTab === '01_cnkd' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>Tờ khai 01/CNKD</button>
                                    <button onClick={() => setTaxSubTab('reduction')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-2xl ${taxSubTab === 'reduction' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>Giảm thuế</button>
                                </div>
                                <div className="p-10 lg:p-14">
                                    {taxSubTab === '01_cnkd' && (
                                        <div className="space-y-10">
                                            <header className="text-center">
                                                <h3 className="text-xl font-black text-slate-800 uppercase">Tờ khai thuế cá nhân kinh doanh</h3>
                                                <p className="text-[10px] text-slate-400 mt-2">Kỳ tính thuế: {month} / {year}</p>
                                            </header>
                                            <div className="grid grid-cols-2 gap-6">
                                                <InfoBlock label="Mã số thuế" value={data?.store?.taxCode || "---"} />
                                                <InfoBlock label="Tên người nộp" value={data?.store?.name || "---"} />
                                            </div>
                                            <div className="border border-slate-100 rounded-[2rem] overflow-hidden">
                                                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                                                    <span className="font-black text-[12px] uppercase">Tổng tiền thuế</span>
                                                    <span className="text-xl font-black text-blue-400">{formatMoney(summary.total_tax)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {taxSubTab === 'reduction' && <div className="p-20 text-center text-slate-400 font-bold">Chưa có dữ liệu giảm thuế</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {BOOKS.map(b => (
                                <button key={b.id} onClick={() => setBookType(b.id)} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 ${bookType === b.id ? 'border-blue-600 bg-white shadow-xl scale-105' : 'border-transparent bg-white shadow-sm opacity-60'}`}>
                                    <div className={`p-3 rounded-xl ${bookType === b.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{b.icon}</div>
                                    <span className="text-[10px] font-black uppercase">{b.code}</span>
                                </button>
                            ))}
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 lg:p-14">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-slate-900 uppercase">{BOOKS.find(b => b.id === bookType)?.name}</h2>
                                <button onClick={handleExportExcel} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2">
                                    <Download size={16} /> Xuất Excel
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-slate-100 p-4">
                                {bookType === 's2' && <MaterialsTable data={bookData} formatMoney={formatMoney} />}
                                {['s6', 's7'].includes(bookType) && <CashTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's3' && <ExpenseTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's4' && <TaxPaymentTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's5' && <SalaryTable data={bookData} formatMoney={formatMoney} />}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showVerifyModal && (
                <VerifyIdentityPopup isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)}
                    reportData={{ month, year, type: 'tax', summary, bookData }}
                    onSuccess={(info) => setSignedInfo(info)}
                />
            )}
        </div>
    );
}

// Helpers
const SummaryCard = ({ title, value, color, icon }) => {
    const theme = { amber: 'bg-amber-50 border-amber-100', orange: 'bg-orange-50 border-orange-100' };
    return (
        <div className={`p-6 rounded-3xl border ${theme[color]} flex flex-col justify-between`}>
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-slate-500">{title}</span>
                <div className="text-slate-300">{icon}</div>
            </div>
            <span className="text-2xl font-black">{Number(value || 0).toLocaleString()} <span className="text-xs">đ</span></span>
        </div>
    );
};

const InfoBlock = ({ label, value }) => (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase">{label}</p>
        <p className="font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

const TaxComplianceWidget = ({ summary }) => {
    const THRESHOLD = summary?.tax_threshold || 100000000;
    const revenue = summary?.accumulated_revenue || 0;
    const percentage = Math.min((revenue / THRESHOLD) * 100, 100);
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full"><ShieldCheck size={24} /></div>
            <div className="flex-1">
                <div className="flex justify-between text-xs font-black uppercase mb-2">
                    <span>Ngưỡng doanh thu miễn thuế</span>
                    <span>{percentage.toFixed(1)}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all" style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">{Number(revenue).toLocaleString()} đ / {Number(THRESHOLD).toLocaleString()} đ nộp nội năm</p>
            </div>
        </div>
    );
};

// Reuse existing table components (simplified versions here, but full logic maintained)
const MaterialsTable = ({ data, formatMoney }) => (
    <table className="w-full text-sm">
        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase text-center">
            <tr><th className="p-4">Ngày</th><th className="p-4">Chứng từ</th><th className="p-4 text-left">Hàng hóa</th><th className="p-4">Nhập</th><th className="p-4">Xuất</th><th className="p-4">Tồn</th></tr>
        </thead>
        <tbody>
            {data.map((r, i) => (
                <tr key={i} className="border-b border-slate-50">
                    <td className="p-4 text-center text-[10px] font-bold text-slate-400">{r.date}</td>
                    <td className="p-4 text-center font-bold">{r.code}</td>
                    <td className="p-4 font-bold text-slate-800">{r.name}</td>
                    <td className="p-4 text-right text-emerald-600 font-bold">{r.in || '-'}</td>
                    <td className="p-4 text-right text-amber-600 font-bold">{r.out || '-'}</td>
                    <td className="p-4 text-right font-black">{r.stock}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const CashTable = ({ data, formatMoney }) => (
    <table className="w-full text-sm">
        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase text-center">
            <tr><th className="p-4">Ngày</th><th className="p-4">Số CT</th><th className="p-4 text-left">Diễn giải</th><th className="p-4 text-right text-emerald-400">Thu</th><th className="p-4 text-right text-rose-400">Chi</th></tr>
        </thead>
        <tbody>
            {data.map((r, i) => (
                <tr key={i} className="border-b border-slate-50">
                    <td className="p-4 text-center text-[10px] font-bold text-slate-400">{r.date}</td>
                    <td className="p-4 text-center font-bold text-blue-600">{r.doc}</td>
                    <td className="p-4 font-bold text-slate-800">{r.desc}</td>
                    <td className="p-4 text-right text-emerald-600 font-black">{r.in ? formatMoney(r.in) : '-'}</td>
                    <td className="p-4 text-right text-rose-600 font-black">{r.out ? formatMoney(r.out) : '-'}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const ExpenseTable = ({ data, formatMoney }) => (
    <table className="w-full text-sm text-left">
        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
            <tr><th className="p-4">Ngày</th><th className="p-4">Số CT</th><th className="p-4">Nội dung</th><th className="p-4 text-right">Số tiền</th></tr>
        </thead>
        <tbody>
            {data.map((r, i) => (
                <tr key={i} className="border-b border-slate-50">
                    <td className="p-4 text-[10px] font-bold text-slate-400">{r.date}</td>
                    <td className="p-4 font-bold">{r.doc}</td>
                    <td className="p-4 font-bold text-slate-800">{r.desc}</td>
                    <td className="p-4 text-right text-rose-600 font-black">{formatMoney(r.out)}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const TaxPaymentTable = ({ data, formatMoney }) => (
    <table className="w-full text-sm text-left">
        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
            <tr><th className="p-4">Ngày nộp</th><th className="p-4">Chứng từ</th><th className="p-4">Nội dung</th><th className="p-4 text-right">Số tiền</th></tr>
        </thead>
        <tbody>
            {data.map((r, i) => (
                <tr key={i} className="border-b border-slate-50">
                    <td className="p-4 text-[10px] font-bold text-slate-400">{r.date}</td>
                    <td className="p-4 font-bold">{r.doc}</td>
                    <td className="p-4 font-bold text-slate-800">{r.desc}</td>
                    <td className="p-4 text-right text-emerald-600 font-black">{formatMoney(r.amount)}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const SalaryTable = ({ data, formatMoney }) => (
    <table className="w-full text-sm text-left">
        <thead className="bg-slate-900 text-white text-[9px] font-black uppercase">
            <tr><th className="p-4">Thời gian</th><th className="p-4 text-left">Nhân viên</th><th className="p-4 text-right">Thực lĩnh</th></tr>
        </thead>
        <tbody>
            {data.map((r, i) => (
                <tr key={i} className="border-b border-slate-50">
                    <td className="p-4 text-[10px] font-bold text-slate-400">{r.date}</td>
                    <td className="p-4 font-bold text-slate-800">{r.name} <span className="block text-[10px] font-normal text-slate-400">{r.role}</span></td>
                    <td className="p-4 text-right text-blue-600 font-black">{formatMoney(r.total)}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

const UpgradePrompt = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
            <ShieldCheck size={80} className="mx-auto text-blue-500 mb-8" />
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">TÍNH NĂNG CHỨNG TỪ</h2>
            <p className="text-slate-500 mb-10 leading-relaxed font-medium">Báo cáo thuế và Sổ sách kế toán chính thức theo TT88 công cụ hỗ trợ cho các hộ kinh doanh gói <span className="text-blue-600 font-bold uppercase underline">PRO</span>.</p>
            <button onClick={() => window.location.href = '/settings'} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-transform">NÂNG CẤP NGAY</button>
        </div>
    </div>
);
