import { useState, useEffect } from 'react';
import { posService } from '../services/api';

export default function Debt() {
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchDebts();
    }, [search]);

    const fetchDebts = async () => {
        setLoading(true);
        try {
            const res = await posService.getDebtors({ search });
            setDebtors(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (customerId) => {
        // Feature to be implemented: Modal to pay debt
        alert('Tính năng thanh toán nợ sẽ được cập nhật trong bản tới!');
    };

    const formatMoney = (val) => Number(val).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sổ Nợ Khách Hàng</h1>
                    <p className="text-slate-500 text-sm">Quản lý công nợ khách hàng.</p>
                </div>
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Tìm tên hoặc SĐT..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="material-icons absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                            <tr>
                                <th className="px-6 py-4">Tên khách hàng</th>
                                <th className="px-6 py-4">Số điện thoại</th>
                                <th className="px-6 py-4 text-right">Tổng nợ</th>
                                <th className="px-6 py-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                            ) : debtors.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-400">Không có khách nợ nào</td></tr>
                            ) : (
                                debtors.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{d.name}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono">{d.phone}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600 text-base">{formatMoney(d.debtTotal)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handlePay(d.id)}
                                                className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors text-xs uppercase"
                                            >
                                                Trả nợ
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
