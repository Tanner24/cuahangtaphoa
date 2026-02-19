import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash, Search } from 'lucide-react';
import { posService } from '../../services/api';

const AccountingModal = ({ type, onClose, onSuccess }) => {
    // type: 's2', 's3', 's4', 's5' mapping to 'import', 'expense', 'tax', 'salary'

    const getType = () => {
        switch (type) {
            case 's2': return 'import';
            case 's3': return 'expense';
            case 's4': return 'tax';
            case 's5': return 'salary';
            default: return 'expense';
        }
    };

    const [formType, setFormType] = useState(getType());
    const [loading, setLoading] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        code: '',
        supplier: '',
        note: '',
        amount: 0,
        category: 'electricity',
        description: '',
        paymentMethod: 'CASH',
        taxType: 'vat',
        receiptCode: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        employeeName: '',
        baseSalary: 0,
        bonus: 0,
        deduction: 0
    });

    const [importItems, setImportItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (formType === 'import') {
            loadProducts();
        }
    }, [formType]);

    const loadProducts = async () => {
        try {
            const res = await posService.getProducts();
            setProducts(res.products || []);
        } catch (err) {
            console.error(err);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );

    const handleAddImportItem = (product) => {
        const existing = importItems.find(i => i.productId === product.id);
        if (existing) return;
        setImportItems([...importItems, {
            productId: product.id,
            name: product.name,
            quantity: 1,
            importPrice: product.priceIn || 0
        }]);
    };

    const handleUpdateItem = (index, field, value) => {
        const newItems = [...importItems];
        newItems[index][field] = value;
        setImportItems(newItems);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...importItems];
        newItems.splice(index, 1);
        setImportItems(newItems);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                type: formType,
                data: { ...formData, items: importItems }
            };

            // Call API (Need to implement in posService first, using fetch here for quick test)
            const token = localStorage.getItem('pos_token'); // Or however auth is stored
            // Using fetch directly as workaround if posService not updated yet
            const res = await fetch('http://localhost:4000/api/pos/accounting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Tạo phiếu thành công!');
                onSuccess();
                onClose();
            } else {
                alert('Có lỗi xảy ra!');
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (formType) {
            case 'import': return 'Phiếu Nhập Kho (S2)';
            case 'expense': return 'Phiếu Chi (S3)';
            case 'tax': return 'Nộp Thuế (S4)';
            case 'salary': return 'Bảng Lương (S5)';
            default: return 'Tạo Phiếu';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">{getTitle()}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Common Date Field */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày chứng từ</label>
                            <input type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {formType === 'import' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mã phiếu nhập</label>
                                <input type="text" placeholder="NK..."
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                        {(formType === 'expense' || formType === 'tax') && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Số tiền</label>
                                <input type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                                />
                            </div>
                        )}
                    </div>

                    {/* IMPORT FORM SPECIFIC */}
                    {formType === 'import' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nhà cung cấp</label>
                                <input type="text" placeholder="Tên nhà cung cấp..."
                                    value={formData.supplier}
                                    onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Product Search */}
                            <div className="relative">
                                <Search className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Tìm món hàng để nhập..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {searchTerm && (
                                    <div className="absolute top-14 left-0 right-0 bg-white shadow-xl rounded-xl border border-slate-100 max-h-60 overflow-y-auto z-10">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} onClick={() => { handleAddImportItem(p); setSearchTerm(''); }}
                                                className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                                            >
                                                <span className="font-bold text-slate-700">{p.name}</span>
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Tồn: {p.currentStock}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Import Items Table */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Tên hàng</th>
                                            <th className="p-4 w-24">SL</th>
                                            <th className="p-4 w-32">Giá nhập</th>
                                            <th className="p-4 w-32 text-right">Thành tiền</th>
                                            <th className="p-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {importItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-4 font-bold text-slate-700">{item.name}</td>
                                                <td className="p-4">
                                                    <input type="number" value={item.quantity} onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)} className="w-full bg-slate-50 p-2 rounded border border-slate-200 text-center font-bold" />
                                                </td>
                                                <td className="p-4">
                                                    <input type="number" value={item.importPrice} onChange={e => handleUpdateItem(idx, 'importPrice', e.target.value)} className="w-full bg-slate-50 p-2 rounded border border-slate-200 text-right" />
                                                </td>
                                                <td className="p-4 text-right font-black text-slate-800">
                                                    {(item.quantity * item.importPrice).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:scale-110 transition-transform"><Trash size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {importItems.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-slate-400 italic">Chưa chọn sản phẩm nào</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-slate-50">
                                        <tr>
                                            <td colSpan="3" className="p-4 text-right font-bold uppercase text-slate-500">Tổng cộng</td>
                                            <td className="p-4 text-right font-black text-blue-600 text-lg">
                                                {importItems.reduce((sum, i) => sum + (i.quantity * i.importPrice), 0).toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* EXPENSE FORM */}
                    {formType === 'expense' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Loại chi phí</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="electricity">Tiền điện</option>
                                    <option value="water">Tiền nước</option>
                                    <option value="rent">Tiền thuê mặt bằng</option>
                                    <option value="internet">Internet / Viễn thông</option>
                                    <option value="marketing">Quảng cáo / Marketing</option>
                                    <option value="other">Chi khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Diễn giải</label>
                                <textarea rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Chi tiết khoản chi..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hình thức TT</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="CASH">Tiền mặt</option>
                                        <option value="TRANSFER">Chuyển khoản</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mã chứng từ (Optional)</label>
                                    <input type="text"
                                        value={formData.invoiceCode}
                                        onChange={e => setFormData({ ...formData, invoiceCode: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAX FORM */}
                    {formType === 'tax' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Loại thuế</label>
                                <select
                                    value={formData.taxType}
                                    onChange={e => setFormData({ ...formData, taxType: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="vat">Thuế GTGT (VAT)</option>
                                    <option value="pit">Thuế TNCN</option>
                                    <option value="license">Thuế Môn bài</option>
                                    <option value="other">Thuế Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Số tiền nộp</label>
                                <input type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 font-black text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Diễn giải / Kỳ thuế</label>
                                <textarea rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-4 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="VD: Nộp thuế GTGT Quý 1/2026..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hình thức TT</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="TRANSFER">Chuyển khoản</option>
                                        <option value="CASH">Tiền mặt</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mã chứng từ (Optional)</label>
                                    <input type="text"
                                        value={formData.receiptCode}
                                        onChange={e => setFormData({ ...formData, receiptCode: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SALARY FORM */}
                    {formType === 'salary' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tháng / Năm</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} className="w-full p-4 rounded-xl border border-slate-200 font-bold" />
                                        <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full p-4 rounded-xl border border-slate-200 font-bold" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tên nhân viên</label>
                                    <input type="text"
                                        value={formData.employeeName}
                                        onChange={e => setFormData({ ...formData, employeeName: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Lương cơ bản</label>
                                    <input type="number"
                                        value={formData.baseSalary}
                                        onChange={e => setFormData({ ...formData, baseSalary: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 text-right font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thưởng</label>
                                    <input type="number"
                                        value={formData.bonus}
                                        onChange={e => setFormData({ ...formData, bonus: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 text-right font-bold text-emerald-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Khấu trừ</label>
                                    <input type="number"
                                        value={formData.deduction}
                                        onChange={e => setFormData({ ...formData, deduction: e.target.value })}
                                        className="w-full p-4 rounded-xl border border-slate-200 text-right font-bold text-rose-600"
                                    />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl flex justify-between items-center">
                                <span className="font-bold text-slate-500 uppercase">Thực lĩnh</span>
                                <span className="text-3xl font-black text-blue-600">
                                    {(parseFloat(formData.baseSalary || 0) + parseFloat(formData.bonus || 0) - parseFloat(formData.deduction || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
                    <button onClick={onClose} className="px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                        Hủy bỏ
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center gap-2">
                        {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu phiếu</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountingModal;
