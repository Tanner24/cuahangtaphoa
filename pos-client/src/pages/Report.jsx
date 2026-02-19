import { useState, useEffect } from 'react';
import { posService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Download,
    Table,
    PieChart,
    Info,
    Printer,
    FileCode,
    Calculator,
    ClipboardList,
    TrendingUp,
    Briefcase,
    ShieldCheck,
    Calendar,
    ArrowRight,
    Search,
    AlertTriangle,
    Wifi,
    CheckCircle,
    XCircle,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff,
    Plus,
    BadgeCheck
} from 'lucide-react';
import AccountingModal from '../components/pos/AccountingModal';
import VerifyIdentityPopup from '../components/VerifyIdentityPopup';
import { useQuota } from '../hooks/useQuota';

export default function Report() {
    const { isPro, loading: quotaLoading } = useQuota();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('tax'); // tax | accounting
    const [taxSubTab, setTaxSubTab] = useState('01_cnkd'); // 01_cnkd, 01_2_bk, reduction
    const [bookType, setBookType] = useState('s1');
    const [showTaxDetails, setShowTaxDetails] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [signedInfo, setSignedInfo] = useState(null);

    const BOOKS = [
        { id: 's1', code: 'S1-HKD', name: 'Sổ doanh thu', icon: <TrendingUp size={22} />, color: 'blue' },
        { id: 's2', code: 'S2-HKD', name: 'Sổ vật tư, hàng hóa', icon: <ClipboardList size={22} />, color: 'amber' },
        { id: 's3', code: 'S3-HKD', name: 'Sổ chi phí SXKD', icon: <Calculator size={22} />, color: 'rose' },
        { id: 's4', code: 'S4-HKD', name: 'Sổ thanh toán thuế', icon: <ShieldCheck size={22} />, color: 'emerald' },
        { id: 's5', code: 'S5-HKD', name: 'Sổ thanh toán lương', icon: <Briefcase size={22} />, color: 'indigo' },
        { id: 's6', code: 'S6-HKD', name: 'Sổ quỹ tiền mặt', icon: <FileText size={22} />, color: 'orange' },
        { id: 's7', code: 'S7-HKD', name: 'Sổ tiền gửi ngân hàng', icon: <Table size={22} />, color: 'cyan' },
    ];

    useEffect(() => {
        if (!quotaLoading && isPro) fetchReport();
    }, [month, year, viewMode, bookType, quotaLoading, isPro]);

    if (quotaLoading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold">Đang kiểm tra quyền truy cập...</div>;

    if (!isPro) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl text-center border border-slate-100 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-inner">
                        <Lock size={48} className="text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">TÍNH NĂNG GIỚI HẠN</h2>
                    <p className="text-slate-500 leading-relaxed mb-10 font-medium">
                        Báo cáo thuế và Sổ sách kế toán (TT88) chỉ dành cho khách hàng sử dụng gói <span className="text-blue-600 font-bold uppercase">PRO</span> hoặc <span className="text-emerald-600 font-bold uppercase">ENTERPRISE</span>.
                    </p>
                    <button
                        onClick={() => window.location.href = '/settings'}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Crown size={20} className="text-amber-400" /> NÂNG CẤP NGAY
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

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

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-xl">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <PieChart className="text-blue-600/50" size={24} />
                </div>
            </div>
            <p className="mt-6 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Đang đồng bộ dữ liệu Thông tư 88...</p>
        </div>
    );

    if (!data) return <div className="p-20 text-center text-rose-500 font-bold bg-white rounded-3xl m-8 shadow-2xl">Không có dữ liệu cho kỳ này</div>;

    const { summary, invoices, bookData } = data;

    const handleExportExcel = () => {
        if (!bookData || bookData.length === 0) {
            alert('Không có dữ liệu để xuất!');
            return;
        }

        let headers = [];
        let rows = [];

        switch (bookType) {
            case 's1':
                headers = ['Ngày', 'Ký hiệu', 'Số HĐ', 'Mã CQT', 'Nội dung', 'Doanh thu', 'Giảm trừ', 'DT Thuần', 'Trạng thái T-VAN'];
                rows = bookData.map(d => [d.date, d.invoiceSymbol, d.id, d.taxCode, d.desc, d.revenue, d.returnAmount, d.revenue - (d.returnAmount || 0), d.tvanStatus === 'SENT' ? 'Đã gửi' : 'Chờ gửi']);
                break;
            case 's2':
                headers = ['Ngày', 'Chứng từ', 'Diễn giải', 'ĐVT', 'Nhập', 'Xuất', 'Tồn', 'Cảnh báo'];
                rows = bookData.map(d => [d.date, d.code, d.name, d.unit, d.in, d.out, d.stock, (!d.hasInvoice && d.in > 0) ? 'Thiếu HĐ' : '']);
                break;
            case 's3': // Expense
                headers = ['Ngày', 'Số CT', 'Nội dung chi phí', 'Số tiền'];
                rows = bookData.map(d => [d.date, d.doc, d.desc, d.out]);
                break;
            case 's4': // Tax
                headers = ['Ngày nộp', 'Chứng từ', 'Loại thuế', 'Số tiền đã nộp'];
                rows = bookData.map(d => [d.date, d.doc, d.desc, d.amount]);
                break;
            case 's5': // Salary
                headers = ['Thời gian', 'Nhân viên', 'Chức vụ', 'Lương CB', 'Thưởng', 'Thực lĩnh'];
                rows = bookData.map(d => [d.date, d.name, d.role, d.salary, d.bonus, d.total]);
                break;
            case 's6': // Cash
            case 's7': // Bank
                headers = ['Thời gian', 'Số Phiếu', 'Nội dung', 'Thu', 'Chi'];
                rows = bookData.map(d => [d.date, d.doc, d.desc, d.in, d.out]);
                break;
            default:
                return;
        }

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${bookType.toUpperCase()}_BaoCao_T${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportXML = () => {
        // 1. Prepare Data
        const taxCode = data?.store?.taxCode || "8888888888";
        const storeName = data?.store?.name || "Cửa Hàng Tạp Hóa";
        const reportPeriod = `Tháng ${month}/${year}`;
        const creationDate = new Date().toISOString();

        // 2. Build XML Content
        let xmlBody = '';
        bookData.forEach((item, index) => {
            xmlBody += `
                    <BangKe>
                        <STT>${index + 1}</STT>
                        <MauSo>${item.invoiceSymbol || '1C22TYY'}</MauSo>
                        <KyHieu>${item.invoiceSymbol ? item.invoiceSymbol.substring(1) : 'C22TYY'}</KyHieu>
                        <SoHoaDon>${item.id}</SoHoaDon>
                        <NgayPhatHanh>${item.date}</NgayPhatHanh>
                        <TenNguoiMua>${item.buyer || 'Khách lẻ'}</TenNguoiMua>
                        <MaSoThueNguoiMua></MaSoThueNguoiMua>
                        <MatHang>${item.desc}</MatHang>
                        <DoanhThu>${item.revenue}</DoanhThu>
                        <ThueGTGT>${item.vat}</ThueGTGT>
                        <ThueTNCN>${item.pit}</ThueTNCN>
                        <GhiChu>${item.tvanStatus === 'SENT' ? 'Đã gửi CQT' : 'Chưa gửi'}</GhiChu>
                    </BangKe>`;
        });

        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <HSoKhaiThue>
        <TTinChung>
            <PhienBan>2.0.0</PhienBan>
            <MaSoThue>${taxCode}</MaSoThue>
            <TenNguoiNopThue>${storeName}</TenNguoiNopThue>
            <KyTinhThue>${reportPeriod}</KyTinhThue>
            <LoaiToKhai>C</LoaiToKhai>
            <NgayLap>${creationDate}</NgayLap>
            <NguoiKy>${signedInfo ? signedInfo.signerName : 'Nguyễn Văn A'}</NguoiKy>
        </TTinChung>
        <CTietHKhai>
            <TenBieuMau>Bảng kê chi tiết doanh thu bán hàng hóa, dịch vụ</TenBieuMau>
            <MaBieuMau>01-1/HKD</MaBieuMau>
            <DuLieuBangKe>
                ${xmlBody}
            </DuLieuBangKe>
            <TongCong>
                <TongDoanhThu>${summary.total_revenue}</TongDoanhThu>
                <TongThueGTGT>${summary.vat_amount}</TongThueGTGT>
                <TongThueTNCN>${summary.pit_amount}</TongThueTNCN>
            </TongCong>
        </CTietHKhai>
        ${signedInfo ? `
        <Signature>
            <SignedInfo>Báo cáo đã được ký điện tử bởi ${signedInfo.signerName}</SignedInfo>
            <SignatureValue>${signedInfo.signatureValue}</SignatureValue>
            <KeyInfo>${signedInfo.certSerial}</KeyInfo>
        </Signature>` : ''}
    </HSoKhaiThue>
</HSoThueDTu>`;

        // 3. Trigger Download
        const blob = new Blob([xmlContent], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${signedInfo ? 'SIGNED_' : ''}S1_BanHang_${taxCode}_T${month}_${year}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="min-h-full bg-[#f8fafc] p-4 lg:p-8 overflow-y-auto hide-scrollbar">
            {/* Main Container */}
            <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in-up">

                {/* Visual Header */}
                <header className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/40 p-8 lg:p-10">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-blue-50/50 to-transparent -mr-20"></div>

                    <div className="relative flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                        <section className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[15px] font-black uppercase tracking-widest border border-blue-100">
                                <ShieldCheck size={14} /> Hệ thống kế toán Thông tư 88/2021/TT-BTC
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                Báo Cáo <span className="text-blue-600">&</span> Thuế
                            </h1>
                            <p className="text-slate-500 text-sm font-medium max-w-lg">
                                Tự động chuẩn hóa dữ liệu từ hóa đơn điện tử, cung cấp đầy đủ 07 loại sổ sách và tờ khai thuế cá nhân kinh doanh.
                            </p>
                        </section>

                        <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
                            {/* Time Selector */}
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

                            {/* View Selection (Tax vs Accounting) */}
                            <div className="bg-white p-1.5 rounded-[1.25rem] flex shadow-xl border border-slate-200 relative">
                                <div className="absolute -top-3 -right-3 z-10">
                                    <div className="relative group">
                                        <div className="bg-blue-600 text-white p-1.5 rounded-full shadow-lg shadow-blue-200 animate-bounce cursor-help">
                                            <HelpCircle size={14} />
                                        </div>
                                        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-none">
                                            <p className="font-bold mb-1">Chế độ xem:</p>
                                            <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-300">
                                                <li><b>Thuế:</b> Xem tờ khai mẫu, nghĩa vụ thuế phải nộp.</li>
                                                <li><b>Sổ Sách:</b> Xem chi tiết 7 loại sổ kế toán (S1-S7).</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setViewMode('tax')}
                                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-xs font-black uppercase tracking-widest ${viewMode === 'tax' ? 'bg-slate-900 text-white shadow-lg shadow-slate-500/30' : 'text-slate-400 hover:bg-slate-50'}`}>
                                    <FileText size={16} /> Báo cáo Thuế
                                </button>
                                <button onClick={() => setViewMode('accounting')}
                                    className={`px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 text-xs font-black uppercase tracking-widest ${viewMode === 'accounting' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-50'}`}>
                                    <Table size={16} /> Sổ Sách (S1-S7)
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* New Tax Compliance Widget */}
                {/* Updated to use Accumulated Revenue from Backend Summary */}
                <TaxComplianceWidget summary={summary} />

                {viewMode === 'tax' ? (
                    <div className="grid grid-cols-12 gap-8 items-start">
                        {/* Summary Sidebar */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <SummaryCard title="Doanh thu tính thuế" value={summary.total_revenue} color="slate" icon={<TrendingUp />} />
                            <div className="grid grid-cols-2 gap-4">
                                <SummaryCard title="Thuế GTGT (1%)" value={summary.vat_amount} color="amber" icon={<ShieldCheck size={18} />} compact tooltip="Thuế Giá trị gia tăng: 1% trên doanh thu chịu thuế" />
                                <SummaryCard title="Thuế TNCN (0.5%)" value={summary.pit_amount} color="orange" icon={<ShieldCheck size={18} />} compact tooltip="Thuế Thu nhập cá nhân: 0.5% trên doanh thu chịu thuế" />
                            </div>
                            <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-blue-200 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <FileText size={200} />
                                </div>
                                <div className="relative space-y-4">
                                    <p className="text-blue-100 text-[15px] font-black uppercase tracking-[0.2em]">Tổng nghĩa vụ thuế kỳ này</p>
                                    <div className="flex items-end gap-2 group relative cursor-help">
                                        <h2 className="text-4xl font-black">{Number(summary.total_tax).toLocaleString()}</h2>
                                        <span className="text-lg font-bold mb-1">đ</span>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
                                            Tổng số tiền thuế (GTGT + TNCN) bạn cần nộp trong kỳ này.
                                        </div>
                                    </div>
                                    <div className="pt-6 flex gap-3">
                                        <button className="flex-1 bg-white text-blue-600 font-black py-3 rounded-xl text-[10px] uppercase shadow-xl hover:bg-blue-50 active:scale-95 transition-all">Xuất XML (HTKK)</button>
                                        <button className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-400 transition-all"><Printer size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tax Document View */}
                        <div className="col-span-12 lg:col-span-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden shadow-slate-200/30">
                                <div className="bg-slate-50/50 p-2 flex gap-2 border-b border-slate-100">
                                    <Tab active={taxSubTab === '01_cnkd'} onClick={() => setTaxSubTab('01_cnkd')} label="Tờ khai 01/CNKD" />
                                    <Tab active={taxSubTab === '01_2_bk'} onClick={() => setTaxSubTab('01_2_bk')} label="Bảng kê 01-2/BK" />
                                    <Tab active={taxSubTab === 'reduction'} onClick={() => setTaxSubTab('reduction')} label="Giảm thuế" />
                                </div>

                                <div className="p-10 lg:p-14">
                                    {taxSubTab === '01_cnkd' && (
                                        <div className="max-w-3xl mx-auto space-y-12">
                                            <header className="text-center space-y-4">
                                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">Tờ khai thuế đối với cá nhân kinh doanh</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">(Thông tư 40/2021/TT-BTC)</p>
                                                <div className="inline-block px-10 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl">
                                                    Kỳ tính thuế: {month} / {year}
                                                </div>
                                            </header>

                                            <div className="space-y-10">
                                                <section className="bg-slate-50 p-8 rounded-3xl border border-slate-100 italic font-medium text-slate-600 text-sm">
                                                    Dữ liệu dưới đây được tự động trích xuất từ lịch sử giao dịch hóa đơn và cấu hình cửa hàng. Vui lòng kiểm tra kỹ trước khi nộp lên hệ thống của Tổng cục Thuế.
                                                </section>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <InfoBlock label="Mã số thuế" value="0102030405-999" />
                                                    <InfoBlock label="Tên người nộp" value="Nhà thuốc - Tạp hóa POS PRO" />
                                                    <InfoBlock label="Địa chỉ" value="Số 123, Đường Láng, Hà Nội" />
                                                    <InfoBlock label="Mã ngành" value="Retail_4700" />
                                                </div>

                                                <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-100/50 bg-white">
                                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setShowTaxDetails(!showTaxDetails)}>
                                                        <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                            {showTaxDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            {showTaxDetails ? 'Thu gọn chi tiết' : 'Xem chi tiết tờ khai'}
                                                        </span>
                                                        {showTaxDetails ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                    </div>

                                                    {showTaxDetails && (
                                                        <table className="w-full text-sm animate-fade-in">
                                                            <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                                                <tr>
                                                                    <th className="p-6 text-left">Chỉ tiêu kinh doanh</th>
                                                                    <th className="p-6 text-right">Doanh thu</th>
                                                                    <th className="p-6 text-right">Tiền thuế</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                <TaxRow label="Phân phối hàng hóa" amount={summary.total_revenue} tax={summary.total_tax} />
                                                                <TaxRow label="Dịch vụ, Xây dựng" amount={0} tax={0} />
                                                                <TaxRow label="Sản xuất, Vận tải" amount={0} tax={0} />
                                                            </tbody>
                                                        </table>
                                                    )}

                                                    <div className="bg-slate-900 text-white border-t border-slate-800 p-6 flex justify-between items-center">
                                                        <span className="font-black uppercase text-[10px] tracking-widest">Tổng nghĩa vụ tài chính</span>
                                                        <div className="text-right">
                                                            <div className="font-black text-xl">{formatMoney(summary.total_tax)}</div>
                                                            <div className="text-[10px] opacity-60 font-bold">Doanh thu: {formatMoney(summary.total_revenue)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {taxSubTab === '01_2_bk' && (
                                        <EmptyState icon={<ClipboardList size={60} />} title="Bảng kê 01-2/BK-HDKD" desc="Tính năng này tự động tổng hợp các hóa đơn mua vào. Hiện tại bạn chưa có dữ liệu nhà cung cấp trong kỳ này." />
                                    )}

                                    {taxSubTab === 'reduction' && (
                                        <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-[3rem] text-center shadow-xl shadow-emerald-100/30">
                                            <div className="bg-white w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200/50">
                                                <ShieldCheck className="text-emerald-500" size={40} />
                                            </div>
                                            <h3 className="text-emerald-900 font-extrabold text-2xl uppercase tracking-tight">Kê khai Giảm Thuế</h3>
                                            <p className="text-emerald-700/60 font-medium text-xs uppercase tracking-widest mt-3">Đang áp dụng Nghị quyết 101/2023/QH15 (Giảm 2% GTGT)</p>
                                            <div className="mt-12 pt-10 border-t border-emerald-200/50 flex flex-col items-center">
                                                <p className="text-emerald-800/40 text-[10px] font-black uppercase tracking-widest mb-4">Số tiền miễn giảm dự kiến</p>
                                                <div className="text-5xl font-black text-emerald-600">0 <span className="text-lg">đ</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Books Navigator */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-5">
                            {BOOKS.map(b => (
                                <button key={b.id} onClick={() => setBookType(b.id)}
                                    className={`group relative h-40 bg-white rounded-[2.5rem] border-2 transition-all duration-500 p-6 flex flex-col justify-between overflow-hidden ${bookType === b.id ? 'border-blue-600 shadow-2xl shadow-blue-200 -translate-y-2' : 'border-white hover:border-slate-200 shadow-xl shadow-slate-100'
                                        }`}>
                                    {/* Abstract background shape */}
                                    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-5 placeholder: transition-opacity ${bookType === b.id ? 'opacity-10 scale-150' : ''} bg-slate-900`}></div>

                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-2xl transition-all duration-500 ${bookType === b.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-300' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
                                            {b.icon}
                                        </div>
                                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${bookType === b.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                            {b.code}
                                        </span>
                                    </div>
                                    <p className={`font-black text-[11px] leading-tight uppercase tracking-wider transition-colors duration-500 ${bookType === b.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-800'}`}>
                                        {b.name}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Interactive Data Table */}
                        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl p-8 lg:p-14 mb-20 shadow-slate-200/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-14 opacity-[0.03] text-slate-900 pointer-events-none">
                                {BOOKS.find(b => b.id === bookType)?.icon}
                            </div>

                            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                                        {BOOKS.find(b => b.id === bookType)?.name}
                                    </h2>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Kết xuất từ hệ thống TT88
                                    </p>
                                </div>
                                {bookType === 's1' ? (
                                    <div className="flex items-center gap-4">
                                        {signedInfo ? (
                                            <div className="flex items-center gap-3">
                                                <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl border border-emerald-100 flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                                                    <BadgeCheck size={20} />
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Chính chủ - Đã xác thực</p>
                                                        <p className="text-[10px] font-bold opacity-70 mt-1">Ký bởi: {signedInfo.signerName}</p>
                                                    </div>
                                                </div>
                                                <button onClick={handleExportXML} className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95" title="Tải xuống XML đã ký">
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowVerifyModal(true)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95"
                                            >
                                                <ShieldCheck size={18} /> Ký số & Xác thực Chính chủ
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        {/* CREATE BUTTON FOR S2-S5 */}
                                        {['s2', 's3', 's4', 's5'].includes(bookType) && (
                                            <button onClick={() => setShowCreateModal(true)} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-6 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 whitespace-nowrap">
                                                <Plus size={18} className="text-blue-600" />
                                                {bookType === 's2' && 'Nhập kho'}
                                                {bookType === 's3' && 'Ghi chi phí'}
                                                {bookType === 's4' && 'Nộp thuế'}
                                                {bookType === 's5' && 'Tính lương'}
                                            </button>
                                        )}

                                        <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-200 active:scale-95 whitespace-nowrap">
                                            <Download size={18} /> Kết xuất Excel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative overflow-x-auto rounded-[2rem] border border-slate-100 shadow-inner bg-white">
                                {bookType === 's1' && <RevenueTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's2' && <MaterialsTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's3' && <ExpenseTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's4' && <TaxPaymentTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's5' && <SalaryTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's6' && <CashTable data={bookData} formatMoney={formatMoney} />}
                                {bookType === 's7' && <BankTable data={bookData} formatMoney={formatMoney} />}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showVerifyModal && (
                <VerifyIdentityPopup
                    isOpen={showVerifyModal}
                    onClose={() => setShowVerifyModal(false)}
                    reportData={{ month, year, type: 'tax', summary, bookData }}
                    onSuccess={(info) => {
                        setSignedInfo(info);
                    }}
                />
            )}
        </div>
    );
}

// --- Dynamic Styled Components ---

const TaxComplianceWidget = ({ summary }) => {
    const navigate = useNavigate();
    // Fallback constants if backend data missing
    const THRESHOLD = summary?.tax_threshold || 100000000;
    const revenue = summary?.accumulated_revenue || 0;

    const percentage = Math.min((revenue / THRESHOLD) * 100, 100);
    const isOver = revenue > THRESHOLD;
    const isNear = percentage > 80;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Threshold Warning */}
            <div className={`col-span-1 lg:col-span-2 p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-center ${isOver ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isOver ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            {isOver ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ngưỡng doanh thu miễn thuế</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Giới hạn {Number(THRESHOLD).toLocaleString()} đ/năm</p>
                        </div>
                    </div>
                    <span className={`text-2xl font-black ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>
                        {percentage.toFixed(1)}%
                    </span>
                </div>

                {/* Progress Bar Config */}
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full transition-all duration-1000 ease-out ${isOver ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-blue-500'
                            }`}
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>

                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>{Number(revenue).toLocaleString()} đ (Lũy kế năm)</span>
                    <span>{Number(THRESHOLD).toLocaleString()} đ</span>
                </div>

                {isNear && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                        <AlertTriangle size={14} />
                        {isOver ? "Đã vượt ngưỡng! Toàn bộ doanh thu sẽ chịu thuế GTGT & TNCN." : "Sắp vượt ngưỡng miễn thuế! Cần lưu ý cân đối doanh thu."}
                    </div>
                )}
            </div>

            {/* E-Invoice Connection Status */}
            <div className="p-6 rounded-[2rem] bg-slate-900 text-white flex flex-col justify-between shadow-xl shadow-slate-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>

                <div className="flex justify-between items-start z-10">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">HĐĐT Khởi tạo từ máy tính tiền</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kết nối T-VAN</p>
                    </div>
                    <Wifi className="text-emerald-400 animate-pulse" />
                </div>

                <div className="mt-6 space-y-3 z-10">
                    <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        VNPT-Invoice: <span className="text-emerald-400">Đang kết nối</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        Trạng thái gửi CQT: <span className="text-blue-400">Tự động</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/settings?tab=einvoice')}
                    className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-sm transition-all border border-white/10 active:scale-95"
                >
                    Cấu hình tích hợp
                </button>
            </div>
        </div>
    )
}

// --- Dynamic Styled Components ---

const SummaryCard = ({ title, value, color, icon, compact, tooltip }) => {
    const theme = {
        slate: 'border-slate-100 bg-white hover:border-slate-300 shadow-slate-200/50',
        amber: 'border-amber-100 bg-amber-50/20 hover:border-amber-400/50 shadow-amber-200/30',
        orange: 'border-orange-100 bg-orange-50/20 hover:border-orange-400/50 shadow-orange-200/30',
        blue: 'border-blue-100 bg-blue-50/20'
    };

    return (
        <div className={`p-8 rounded-[2rem] border-2 transition-all duration-500 shadow-xl group flex flex-col justify-between h-full relative cursor-help ${theme[color]}`}>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-center shadow-xl">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <p className="text-slate-900 text-[15px] font-black uppercase tracking-[0.2em]">{title}</p>
                <div className={`text-slate-300 group-hover:text-slate-500 transition-colors ${compact ? 'opacity-50' : ''}`}>{icon}</div>
            </div>
            <div className="flex items-end gap-1.5 text-slate-900">
                <span className={`${compact ? 'text-xl' : 'text-3xl'} font-black tracking-tight`}>{Number(value || 0).toLocaleString()}</span>
                <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold opacity-30 mb-1.5`}>đ</span>
            </div>
        </div>
    );
};

const Tab = ({ active, onClick, label }) => (
    <button onClick={onClick} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-400 rounded-2xl flex items-center justify-center gap-3 ${active ? 'bg-white text-blue-600 shadow-2xl shadow-slate-300 rotate-[0.01deg] scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
        }`}>
        {active && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>}
        {label}
    </button>
);

const InfoBlock = ({ label, value }) => (
    <div className="space-y-2 group">
        <p className="text-slate-400 text-[15px] font-black uppercase tracking-widest group-hover:text-blue-500 transition-colors">{label}</p>
        <p className="text-slate-800 font-extrabold text-sm border-b border-slate-50 pb-3 group-hover:border-blue-100 transition-all">{value}</p>
    </div>
);

const TaxRow = ({ label, amount, tax }) => (
    <tr className="hover:bg-slate-50/80 transition-all duration-300 group">
        <td className="p-7">
            <div className="flex items-center gap-3">
                <div className="w-1 y-8 bg-slate-100 group-hover:bg-blue-600 rounded-full transition-all"></div>
                <span className="font-bold text-slate-700 text-sm">{label}</span>
            </div>
        </td>
        <td className="p-7 text-right font-black text-slate-500 text-sm group-hover:text-slate-800 transition-colors">{Number(amount).toLocaleString()}</td>
        <td className="p-7 text-right">
            <div className="inline-flex px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-black shadow-lg shadow-slate-200">
                {Number(tax).toLocaleString()}
            </div>
        </td>
    </tr>
);

const RevenueTable = ({ data, formatMoney }) => {
    return (
        <div className='relative'>
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
                            <td className="p-5 text-center font-mono text-[10px] text-slate-500 bg-slate-50 rounded select-all cursor-copy" title="Mã cấp của Cơ quan thuế">
                                {row.taxCode || '---'}
                            </td>
                            <td className="p-5 font-bold text-slate-800">
                                {row.desc}
                            </td>
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
                    )) : <tr className="animate-pulse"><td colSpan="7" className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.5em]">Đang chờ tải dữ liệu đồng bộ</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

const MaterialsTable = ({ data, formatMoney }) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                        <AlertTriangle size={14} /> Cảnh báo: Kho âm
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                        <AlertTriangle size={14} /> Cảnh báo: Thiếu hóa đơn đầu vào
                    </div>
                </div>
            </div>

            <table className="w-full text-sm text-left">
                <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-[0.25em] text-center">
                    <tr>
                        <th className="p-5 border-r border-slate-800">Ngày</th>
                        <th className="p-5 border-r border-slate-800">Chứng từ</th>
                        <th className="p-5 text-left border-r border-slate-800">Diễn giải</th>
                        <th className="p-5 border-r border-slate-800 w-24">ĐVT</th>
                        <th className="p-5 text-right w-24 border-r border-slate-800 text-emerald-400">Nhập</th>
                        <th className="p-5 text-right w-24 border-r border-slate-800 text-amber-400">Xuất</th>
                        <th className="p-5 text-right w-24">Tồn</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data?.length > 0 ? data.map((row, i) => (
                        <tr key={i} className={`transition-all group ${row.stock < 0 ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-blue-50/30'}`}>
                            <td className="p-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">{row.date}</td>
                            <td className="p-5 text-center">
                                <div className="flex flex-col items-center gap-1">
                                    <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm">
                                        {row.code}
                                    </span>
                                    {!row.hasInvoice && row.in > 0 && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 rounded flex items-center gap-1">
                                            <AlertTriangle size={8} /> Thiếu HĐ
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-5 font-bold text-slate-800">
                                {row.name}
                            </td>
                            <td className="p-5 text-center text-slate-500 text-xs font-bold">{row.unit}</td>
                            <td className="p-5 text-right font-bold text-emerald-600 tabular-nums">
                                {row.in > 0 ? row.in : '-'}
                            </td>
                            <td className="p-5 text-right font-bold text-amber-600 tabular-nums">
                                {row.out > 0 ? row.out : '-'}
                            </td>
                            <td className={`p-5 text-right font-black tabular-nums ${row.stock < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                {row.stock}
                            </td>
                        </tr>
                    )) : <tr className="animate-pulse"><td colSpan="7" className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.5em]">Chưa có dữ liệu vật tư</td></tr>}
                </tbody>
            </table>
        </div>
    );
}

const CashTable = ({ data, formatMoney }) => (
    <table className="w-full text-sm text-left">
        <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-[0.25em] text-center">
            <tr>
                <th className="p-5 border-r border-slate-800">Ngày</th>
                <th className="p-5 border-r border-slate-800">Số Chứng Từ</th>
                <th className="p-5 text-left border-r border-slate-800">Diễn giải</th>
                <th className="p-5 text-right w-32 border-r border-slate-800 text-emerald-400">Thu</th>
                <th className="p-5 text-right w-32 text-rose-400">Chi</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
            {data?.length > 0 ? data.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                    <td className="p-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">{row.date}</td>
                    <td className="p-5 text-center">
                        <span className="bg-white border border-slate-200 text-blue-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm">
                            {row.doc}
                        </span>
                    </td>
                    <td className="p-5 font-bold text-slate-800">
                        {row.desc}
                    </td>
                    <td className="p-5 text-right font-black text-emerald-600 tabular-nums">
                        {row.in > 0 ? formatMoney(row.in) : '-'}
                    </td>
                    <td className="p-5 text-right font-black text-rose-600 tabular-nums">
                        {row.out > 0 ? formatMoney(row.out) : '-'}
                    </td>
                </tr>
            )) : <tr className="animate-pulse"><td colSpan="5" className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.5em]">Đang chờ tải dữ liệu đồng bộ</td></tr>}
        </tbody>
    </table>
);

const BankTable = ({ data, formatMoney }) => (
    <div className="flex flex-col">
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={18} /></div>
                <div>
                    <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Biến động số dư</h4>
                    <p className="text-[10px] font-bold text-blue-400">Sổ S7-HKD</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Số dư cuối kỳ</span>
                <span className="text-lg font-black text-slate-800">{formatMoney(data?.reduce((acc, curr) => acc + (curr.in || 0) - (curr.out || 0), 0) || 0)}</span>
            </div>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-[0.25em] text-center">
                <tr>
                    <th className="p-5 border-r border-slate-800">Ngày</th>
                    <th className="p-5 border-r border-slate-800">Số Chứng Từ</th>
                    <th className="p-5 text-left border-r border-slate-800">Diễn giải</th>
                    <th className="p-5 text-right w-32 border-r border-slate-800 text-emerald-400">Thu</th>
                    <th className="p-5 text-right w-32 text-rose-400">Chi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {data?.length > 0 ? data.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                        <td className="p-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">{row.date}</td>
                        <td className="p-5 text-center">
                            <span className="bg-white border border-slate-200 text-blue-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm">
                                {row.doc}
                            </span>
                        </td>
                        <td className="p-5 font-bold text-slate-800">
                            {row.desc}
                        </td>
                        <td className="p-5 text-right font-black text-emerald-600 tabular-nums">
                            {row.in > 0 ? formatMoney(row.in) : '-'}
                        </td>
                        <td className="p-5 text-right font-black text-rose-600 tabular-nums">
                            {row.out > 0 ? formatMoney(row.out) : '-'}
                        </td>
                    </tr>
                )) : <tr className="animate-pulse"><td colSpan="5" className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.5em]">Đang chờ tải dữ liệu đồng bộ</td></tr>}
            </tbody>
        </table>
    </div>
);

const ExpenseTable = ({ data, formatMoney }) => (
    <div className='relative'>
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-[0.25em] text-center">
                <tr>
                    <th className="p-5 border-r border-slate-800 w-32">Ngày</th>
                    <th className="p-5 border-r border-slate-800 w-32">Số CT</th>
                    <th className="p-5 text-left border-r border-slate-800">Nội dung chi phí</th>
                    <th className="p-5 text-right w-48 text-rose-400">Số tiền</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {data?.length > 0 ? data.map((row, i) => (
                    <tr key={i} className="hover:bg-rose-50/30 transition-all group">
                        <td className="p-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">{row.date}</td>
                        <td className="p-5 text-center">
                            <span className="bg-white border border-slate-200 text-rose-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm">
                                {row.doc}
                            </span>
                        </td>
                        <td className="p-5 font-bold text-slate-800">
                            {row.desc}
                        </td>
                        <td className="p-5 text-right font-black text-rose-600 tabular-nums">
                            {formatMoney(row.out)}
                        </td>
                    </tr>
                )) : <tr className="animate-pulse"><td colSpan="4" className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.5em]">Chưa có dữ liệu chi phí</td></tr>}
            </tbody>
        </table>
    </div>
);

const TaxPaymentTable = ({ data, formatMoney }) => (
    <div className='relative'>
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-[0.25em] text-center">
                <tr>
                    <th className="p-5 border-r border-slate-800 w-32">Ngày nộp</th>
                    <th className="p-5 border-r border-slate-800 w-32">Chứng từ</th>
                    <th className="p-5 text-left border-r border-slate-800">Loại thuế / Nội dung</th>
                    <th className="p-5 text-right w-48 text-emerald-400">Số tiền đã nộp</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {data?.length > 0 ? data.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-all group">
                        <td className="p-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">{row.date}</td>
                        <td className="p-5 text-center">
                            <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-sm">
                                {row.doc}
                            </span>
                        </td>
                        <td className="p-5 font-bold text-slate-800 flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${row.type === 'vat' ? 'bg-amber-400' : 'bg-orange-500'}`}></div>
                            {row.desc}
                        </td>
                        <td className="p-5 text-right font-black text-slate-900 tabular-nums">
                            {formatMoney(row.amount)}
                        </td>
                    </tr>
                )) : <tr className="animate-pulse"><td colSpan="4" className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.5em]">Chưa có dữ liệu nộp thuế</td></tr>}
            </tbody>
        </table>
    </div>
);

const SalaryTable = ({ data, formatMoney }) => (
    <div className='relative'>
        <div className="flex justify-end p-4 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng lương tháng: <span className="text-slate-900 font-black ml-2">{formatMoney(data?.reduce((a, b) => a + b.total, 0) || 0)}</span></span>
        </div>
        <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-[0.25em] text-center">
                <tr>
                    <th className="p-5 border-r border-slate-800 w-32">Thời gian</th>
                    <th className="p-5 text-left border-r border-slate-800">Nhân viên</th>
                    <th className="p-5 text-right border-r border-slate-800 w-32">Lương CB</th>
                    <th className="p-5 text-right border-r border-slate-800 w-32 text-emerald-400">Thưởng</th>
                    <th className="p-5 text-right w-48 text-blue-400">Thực lĩnh</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {data?.length > 0 ? data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-all group">
                        <td className="p-5 text-center font-black text-slate-400 text-[10px] uppercase tracking-wider">{row.date}</td>
                        <td className="p-5 font-bold text-slate-800">
                            <div>{row.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wider mt-1">{row.role}</div>
                        </td>
                        <td className="p-5 text-right font-bold text-slate-500 tabular-nums">
                            {formatMoney(row.salary)}
                        </td>
                        <td className="p-5 text-right font-bold text-emerald-600 tabular-nums">
                            {formatMoney(row.bonus)}
                        </td>
                        <td className="p-5 text-right font-black text-blue-600 tabular-nums text-base">
                            {formatMoney(row.total)}
                        </td>
                    </tr>
                )) : <tr className="animate-pulse"><td colSpan="5" className="p-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.5em]">Chưa có dữ liệu lương</td></tr>}
            </tbody>
        </table>
    </div>
);

const EmptyState = ({ icon, title, desc }) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-slate-50 p-12 rounded-[3.5rem] mb-10 text-slate-100 shadow-inner">
            {icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">{title}</h3>
        <p className="text-slate-400 font-medium text-sm max-w-sm leading-relaxed">{desc}</p>
        <button className="mt-10 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] group">
            Xem tài liệu hướng dẫn <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
        </button>
    </div>
);
