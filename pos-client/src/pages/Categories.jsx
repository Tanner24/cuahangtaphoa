import { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Plus, Trash2, Edit2, Tags, Bookmark } from 'lucide-react';

export default function Categories() {
    const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'brands'

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Phân loại</h1>
                    <p className="text-slate-500 text-sm">Quản lý danh mục sản phẩm và thương hiệu</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'categories'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Tags size={18} /> Danh mục
                </button>
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'brands'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Bookmark size={18} /> Thương hiệu
                </button>
            </div>

            {/* Content Content - Height full to allow scroll inside */}
            <div className="flex-1 overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                {activeTab === 'categories' ? <CategoriesManager /> : <BrandsManager />}
            </div>
        </div>
    );
}

// ================= Categories Component =================
function CategoriesManager() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/management/categories');
            setCategories(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;
        try {
            await api.post('/management/categories', { name, description: desc });
            setName('');
            setDesc('');
            fetchCategories();
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Xóa danh mục này?')) return;
        try {
            await api.delete(`/management/categories/${id}`);
            fetchCategories();
        } catch (error) {
            alert('Lỗi xóa danh mục');
        }
    };

    return (
        <div className="flex h-full">
            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 border-r border-slate-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase text-slate-500 font-bold">
                        <tr>
                            <th className="p-3 rounded-tl-lg">Tên danh mục</th>
                            <th className="p-3">Mô tả</th>
                            <th className="p-3">Sản phẩm</th>
                            <th className="p-3 rounded-tr-lg text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="4" className="p-4 text-center">Đang tải...</td></tr>
                        ) : categories.map(cat => (
                            <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-medium text-slate-800">{cat.name}</td>
                                <td className="p-3 text-slate-500">{cat.description || '-'}</td>
                                <td className="p-3 text-slate-500">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                                        {cat._count?.products || 0}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Form */}
            <div className="w-80 bg-slate-50 p-6 border-l border-slate-200 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800">Thêm danh mục</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Tên danh mục *</label>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ví dụ: Đồ uống" required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Mô tả</label>
                        <textarea
                            value={desc} onChange={e => setDesc(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg h-24 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Mô tả danh mục..."
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <Plus size={18} /> Thêm Mới
                    </button>
                </form>
            </div>
        </div>
    );
}

// ================= Brands Component =================
function BrandsManager() {
    const [brands, setBrands] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const res = await api.get('/management/brands');
            setBrands(res);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBrands(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/management/brands', { name });
            setName('');
            fetchBrands();
        } catch (e) { alert('Lỗi: ' + e.message); }
    };

    return (
        <div className="flex h-full">
            <div className="flex-1 overflow-y-auto p-4 border-r border-slate-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold sticky top-0">
                        <tr>
                            <th className="p-3">Tên Thương hiệu</th>
                            <th className="p-3">Sản phẩm</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? <tr><td colSpan="2" className="p-4 text-center">Loading...</td></tr> :
                            brands.map(b => (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="p-3 font-medium">{b.name}</td>
                                    <td className="p-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{b._count?.products || 0}</span></td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            <div className="w-80 bg-slate-50 p-6 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800">Thêm thương hiệu</h3>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Tên thương hiệu *</label>
                        <input value={name} onChange={e => setName(e.target.value)} required placeholder="Ví dụ: Coca Cola"
                            className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500" />
                    </div>
                    <button className="bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Plus size={18} /> Thêm Mới
                    </button>
                </form>
            </div>
        </div>
    );
}
