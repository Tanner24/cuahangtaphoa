import { Printer, Check, Smartphone, AlertCircle } from 'lucide-react';

export default function InvoicePreview({ store, settings, user }) {
    const paperWidth = settings.paperSize === '80mm' ? 'w-[300px]' : 'w-[200px]';
    const fontSize = settings.paperSize === '80mm' ? 'text-[11px]' : 'text-[9px]';

    return (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
                <div className={`w-2 h-2 rounded-full ${settings.paperSize === '80mm' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                <span className="text-xs font-medium text-slate-600">Khổ giấy {settings.paperSize}</span>
            </div>

            <div className={`${paperWidth} bg-white shadow-xl shadow-slate-200/50 p-4 font-mono text-slate-800 leading-tight transition-all duration-300 transform`}>
                {/* Header */}
                <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-2">
                    {settings.showLogo && store.logoUrl && (
                        <div className="flex justify-center mb-2">
                            <img src={store.logoUrl} alt="Store Logo" className="h-12 object-contain grayscale opacity-90" />
                        </div>
                    )}
                    <h3 className="font-bold uppercase text-sm mb-1">{store.name || 'TÊN CỬA HÀNG'}</h3>
                    <p className={`text-slate-500 ${fontSize}`}>{store.address || 'Địa chỉ cửa hàng...'}</p>
                    <p className={`text-slate-500 ${fontSize}`}>Hotline: {store.phone || '...'}</p>
                </div>

                {/* Info */}
                <div className={`${fontSize} space-y-0.5 mb-2`}>
                    <div className="flex justify-between">
                        <span>Ngày:</span>
                        <span>{new Date().toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Số phiếu:</span>
                        <span className="font-bold">#TEST-001</span>
                    </div>
                    {settings.showCashierName && (
                        <div className="flex justify-between">
                            <span>Thu ngân:</span>
                            <span>{user?.username || 'Admin'}</span>
                        </div>
                    )}
                    {settings.showCustomerName && (
                        <div className="flex justify-between">
                            <span>Khách hàng:</span>
                            <span>Nguyễn Văn A</span>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="border-t border-dashed border-slate-300 py-2">
                    <table className={`w-full ${fontSize}`}>
                        <thead>
                            <tr className="text-left font-bold border-b border-black">
                                <th className="pb-1">Tên hàng</th>
                                <th className="text-center pb-1 w-8">SL</th>
                                <th className="text-right pb-1">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dotted divide-slate-200">
                            <tr>
                                <td className="py-1">Nước ngọt Coca</td>
                                <td className="text-center py-1">2</td>
                                <td className="text-right py-1">20.000</td>
                            </tr>
                            <tr>
                                <td className="py-1">Bánh Snack</td>
                                <td className="text-center py-1">1</td>
                                <td className="text-right py-1">15.000</td>
                            </tr>
                            <tr>
                                <td className="py-1">Kẹo Singum</td>
                                <td className="text-center py-1">5</td>
                                <td className="text-right py-1">25.000</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className={`border-t border-dashed border-slate-300 pt-2 ${fontSize}`}>
                    <div className="flex justify-between mb-0.5">
                        <span>Tổng tiền hàng:</span>
                        <span className="font-bold">60.000</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold mt-1 mb-2">
                        <span>THANH TOÁN:</span>
                        <span>60.000đ</span>
                    </div>
                    <div className="flex justify-between text-xs mb-0.5">
                        <span>Khách đưa:</span>
                        <span>100.000</span>
                    </div>
                    <div className="flex justify-between text-xs mb-0.5">
                        <span>Tiền thừa:</span>
                        <span>40.000</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-4 border-t border-dashed border-slate-300 pt-3 space-y-2">
                    {settings.showOrderBarcode && (
                        <div className="h-8 bg-slate-900 mx-auto w-3/4 opacity-80" style={{ maskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px)', WebkitMaskImage: 'repeating-linear-gradient(90deg, black, black 2px, transparent 2px, transparent 4px)' }}></div>
                    )}
                    <p className={`italic whitespace-pre-line ${fontSize}`}>
                        {store.footerText || 'Cảm ơn quý khách và hẹn gặp lại!'}
                    </p>
                    <p className="text-[8px] text-slate-400">Powered by POS Pro</p>
                </div>
            </div>
        </div>
    );
}
