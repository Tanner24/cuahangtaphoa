
import { useState } from 'react';
import { BookOpen, ShoppingCart, Package, BarChart3, Settings, ChevronRight, X, PlayCircle } from 'lucide-react';

const GUIDE_TOPICS = [
    {
        id: 'sales',
        title: 'Bán Hàng & Thu Ngân',
        icon: <ShoppingCart size={20} />,
        color: 'bg-blue-100 text-blue-600',
        items: [
            {
                title: 'Quy trình thanh toán cơ bản',
                content: (
                    <div className="space-y-3">
                        <p>Để thực hiện một đơn hàng, hãy làm theo các bước sau:</p>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-600">
                            <li>Tại màn hình <b>Bán Hàng</b>, tìm kiếm sản phẩm bằng tên hoặc quét mã vạch.</li>
                            <li>Nhấn vào sản phẩm để thêm vào giỏ hàng bên phải.</li>
                            <li>Điều chỉnh số lượng nếu cần thiết.</li>
                            <li>Nhập số tiền khách đưa (nếu thanh toán tiền mặt) để tính tiền thừa.</li>
                            <li>Nhấn nút <b>Thanh Toán (F9)</b> để hoàn tất và in hóa đơn.</li>
                        </ol>
                    </div>
                )
            },
            {
                title: 'Thêm khách hàng vào đơn',
                content: 'Tại thanh tìm kiếm phía trên giỏ hàng, nhập tên hoặc số điện thoại khách hàng. Nếu khách hàng chưa có, nhấn nút "+" để tạo mới nhanh chóng.'
            },
            {
                title: 'Chiết khấu & Giảm giá',
                content: 'Bạn có thể giảm giá trực tiếp trên từng món hàng (nhấn vào giá tiền) hoặc giảm giá trên tổng hóa đơn (nhập số tiền hoặc % giảm giá ở mục Chiết khấu).'
            }
        ]
    },
    {
        id: 'products',
        title: 'Quản Lý Hàng Hóa',
        icon: <Package size={20} />,
        color: 'bg-emerald-100 text-emerald-600',
        items: [
            {
                title: 'Thêm sản phẩm mới',
                content: (
                    <span>
                        Vào menu <b>Hàng Hóa</b> &gt; <b>Thêm Mới</b>. Điền đầy đủ tên, giá bán, giá vốn (để tính lợi nhuận) và số lượng tồn kho ban đầu. Đừng quên thêm ảnh để dễ nhận biết.
                    </span>
                )
            },
            {
                title: 'In tem mã vạch',
                content: 'Chọn các sản phẩm cần in tem trong danh sách, sau đó nhấn nút "In Mã Vạch". Hệ thống hỗ trợ in trên giấy A4 hoặc máy in tem chuyên dụng.'
            },
            {
                title: 'Kiểm kho',
                content: 'Sử dụng tính năng Kiểm Kho để đối chiếu số lượng thực tế và trên phần mềm. Hệ thống sẽ tự động tạo phiếu cân bằng kho.'
            }
        ]
    },
    {
        id: 'reports',
        title: 'Báo Cáo & Thống Kê',
        icon: <BarChart3 size={20} />,
        color: 'bg-purple-100 text-purple-600',
        items: [
            {
                title: 'Xem doanh thu ngày',
                content: (
                    <span>
                        Màn hình <b>Tổng Quan</b> hiển thị ngay doanh thu, lợi nhuận và số đơn hàng trong ngày. Bạn có thể chọn bộ lọc thời gian để xem theo tuần hoặc tháng.
                    </span>
                )
            },
            {
                title: 'Báo cáo bán chạy',
                content: 'Giúp bạn biết mặt hàng nào đang hot để nhập thêm, và mặt hàng nào bán chậm để có kế hoạch xả hàng.'
            }
        ]
    },
    {
        id: 'settings',
        title: 'Cài Đặt Hệ Thống',
        icon: <Settings size={20} />,
        color: 'bg-orange-100 text-orange-600',
        items: [
            {
                title: 'Kết nối máy in',
                content: (
                    <span>
                        Vào <b>Cài Đặt</b> &gt; <b>Máy In</b>. Chọn loại máy in (USB/LAN/Bluetooth). Với máy in Bluetooth, hãy chắc chắn đã ghép nối thiết bị trước.
                    </span>
                )
            },
            {
                title: 'Thiết lập mẫu hóa đơn',
                content: 'Bạn có thể thay đổi lời chào cuối hóa đơn, thêm logo cửa hàng hoặc thông tin wifi trong phần Cài Đặt Cửa Hàng.'
            }
        ]
    }
];

export default function InstructionModal({ isOpen, onClose }) {
    const [selectedTopic, setSelectedTopic] = useState('sales');
    const [expandedItem, setExpandedItem] = useState(null);

    const activeTopic = GUIDE_TOPICS.find(t => t.id === selectedTopic);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[80vh] shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* Sidebar Topics */}
                <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-100 flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <BookOpen className="text-blue-600" />
                            Hướng Dẫn Sử Dụng
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Làm chủ EPOS Pro trong 5 phút</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {GUIDE_TOPICS.map(topic => (
                            <button
                                key={topic.id}
                                onClick={() => {
                                    setSelectedTopic(topic.id);
                                    setExpandedItem(null);
                                }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${selectedTopic === topic.id
                                    ? 'bg-white shadow-md shadow-slate-200 border border-blue-100 ring-1 ring-blue-500/20'
                                    : 'hover:bg-white hover:shadow-sm text-slate-600'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${topic.color}`}>
                                    {topic.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold ${selectedTopic === topic.id ? 'text-slate-900' : 'text-slate-600'}`}>
                                        {topic.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{topic.items.length} bài hướng dẫn</p>
                                </div>
                                {selectedTopic === topic.id && <ChevronRight size={18} className="text-blue-500" />}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-200 bg-white md:hidden">
                        <button onClick={onClose} className="w-full py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Đóng</button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTopic.color}`}>
                                    {activeTopic.icon}
                                </div>
                                {activeTopic.title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                            <X size={18} className="text-slate-600" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="max-w-3xl mx-auto space-y-4">
                            {activeTopic.items.map((item, idx) => {
                                const isExpanded = expandedItem === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`border transition-all duration-300 rounded-2xl overflow-hidden ${isExpanded
                                            ? 'border-blue-200 bg-blue-50/30'
                                            : 'border-slate-100 hover:border-blue-100 bg-white'
                                            }`}
                                    >
                                        <button
                                            onClick={() => setExpandedItem(isExpanded ? null : idx)}
                                            className="w-full flex items-center justify-between p-5 text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isExpanded ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    <span className="font-bold text-sm">{idx + 1}</span>
                                                </div>
                                                <span className={`font-bold text-lg ${isExpanded ? 'text-blue-800' : 'text-slate-700'}`}>
                                                    {item.title}
                                                </span>
                                            </div>
                                            <ChevronRight
                                                className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-blue-500' : ''}`}
                                            />
                                        </button>

                                        {isExpanded && (
                                            <div className="px-5 pb-5 pl-[4.5rem] animate-fade-in-down">
                                                <div className="text-slate-600 leading-relaxed text-base">
                                                    {item.content}
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-200/50 flex gap-3">
                                                    <button className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1">
                                                        <PlayCircle size={14} /> Xem Video (Sắp có)
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Banner Footer */}
                        <div className="mt-12 p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-lg font-bold mb-1">Vẫn cần sự trợ giúp?</h4>
                                    <p className="text-slate-300 text-sm">Đội ngũ kỹ thuật của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.</p>
                                </div>
                                <div className="flex gap-3">
                                    <a
                                        href="https://zalo.me/0975421439"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm"
                                    >
                                        Chat Zalo
                                    </a>
                                    <a
                                        href="tel:0975421439"
                                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-colors text-sm"
                                    >
                                        Gọi Hotline
                                    </a>
                                </div>
                            </div>

                            {/* Decorative */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
