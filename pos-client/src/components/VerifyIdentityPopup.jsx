import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { posService } from '../services/api';

export default function VerifyIdentityPopup({ isOpen, onClose, reportData, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('confirm'); // confirm, processing, success, error
    const [error, setError] = useState('');
    const [certInfo, setCertInfo] = useState(null);

    const handleSign = async () => {
        setLoading(true);
        setStep('processing');
        setError('');

        try {
            // Simulate API call to Viettel S-Invoice for Remote Signing
            // Real implementation would send XML/Hash to backend
            const res = await posService.signReport(reportData);

            setCertInfo({
                owner: res.signerName || 'NGUYEN VAN A',
                time: new Date().toLocaleString('vi-VN'),
                serial: res.certSerial || '5404-2024-1234-5678'
            });
            setStep('success');
            onSuccess(res);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Lỗi kết nối đến Viettel CA. Vui lòng thử lại.');
            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <ShieldCheck className="text-blue-600" /> Xác thực Danh tính
                    </h3>
                    <button onClick={onClose} disabled={loading} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {step === 'confirm' && (
                        <div className="space-y-6 text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-blue-100">
                                <ShieldCheck size={40} className="text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-lg mb-2">Ký số & Xác thực Báo cáo</h4>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Hệ thống sẽ kết nối đến <b>Viettel CA (Remote Signing)</b> để ký số lên báo cáo này.
                                    Hành động này xác nhận tính pháp lý và tính toàn vẹn của dữ liệu.
                                </p>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-left">
                                <p className="text-xs font-bold text-amber-700 uppercase mb-1">Lưu ý:</p>
                                <p className="text-xs text-amber-600">Bạn cần có quyền chủ sở hữu hoặc kế toán trưởng mới có thể thực hiện thao tác này.</p>
                            </div>
                            <button
                                onClick={handleSign}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                Ký số ngay
                            </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                                <div className="relative bg-white p-4 rounded-full border-4 border-blue-100 shadow-xl">
                                    <Loader2 size={40} className="text-blue-600 animate-spin" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-slate-800">Đang thực hiện ký số...</h4>
                                <p className="text-xs text-slate-400 mt-2">Đang kết nối Viettel HSM...</p>
                            </div>
                        </div>
                    )}

                    {step === 'success' && certInfo && (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-emerald-100 animate-bounce">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-700 text-xl">Đã xác thực Chính chủ!</h4>
                                <p className="text-slate-500 text-sm mt-1">Báo cáo đã được ký số thành công.</p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Người ký:</span>
                                    <span className="font-bold text-slate-800">{certInfo.owner}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Thời gian:</span>
                                    <span className="font-bold text-slate-800">{certInfo.time}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Số serial:</span>
                                    <span className="font-mono text-xs font-bold text-slate-600">{certInfo.serial}</span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 active:scale-95 transition-all"
                            >
                                Hoàn tất
                            </button>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                                <X size={40} className="text-red-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-600 text-lg">Ký số thất bại</h4>
                                <p className="text-slate-500 text-sm mt-2">{error}</p>
                            </div>
                            <button
                                onClick={() => setStep('confirm')}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
