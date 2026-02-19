import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [storeFilter, setStoreFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showImport, setShowImport] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadStores();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [page, storeFilter]);

    const loadStores = async () => {
        try {
            const result = await api.getStores({ limit: 1000 });
            setStores(result.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 20 };
            if (search) params.search = search;
            if (storeFilter) params.storeId = storeFilter;
            const result = await api.getProducts(params);
            setProducts(result.data || []);
            setMeta(result.meta || {});
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadProducts();
    };

    const handleDelete = async (product) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? Thao tác này không thể hoàn tác.`)) return;
        try {
            await api.deleteProduct(product.id);
            toast.success('Đã xóa sản phẩm thành công');
            loadProducts();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImportLoading(true);
        try {
            const result = await api.importProducts(file);
            toast.success(result.message);
            if (result.errors && result.errors.length > 0) {
                console.warn('Import errors:', result.errors);
            }
            setShowImport(false);
            loadProducts();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setImportLoading(false);
            e.target.value = ''; // clear input
        }
    };

    const downloadTemplate = () => {
        const headers = ["name", "barcode", "price", "priceIn", "unit", "storeId", "categoryId", "currentStock", "minStock"];
        const rows = [
            ["Sữa đặc Cô Gái Hà Lan", "8934673601025", "24000", "20000", "Lon", "1", "", "50", "10"],
            ["Mì Hảo Hảo Tôm Chua Cay", "8934563138164", "4500", "3800", "Gói", "1", "", "100", "20"],
            ["Bia Tiger Crystal", "8888005310022", "18000", "15500", "Lon", "2", "", "240", "48"]
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add BOM for Excel UTF-8 support
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "mau_nhap_san_pham.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="products-page animate-in fade-in">
            <header className="page-header">
                <div className="flex-header">
                    <div>
                        <h1>QUẢN LÝ SẢN PHẨM</h1>
                        <p>Toàn bộ hàng hóa trong hệ thống POS</p>
                    </div>
                    <button
                        onClick={() => setShowImport(true)}
                        className="btn btn-primary"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '18px', height: '18px' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        NHẬP HÀNG LOẠT
                    </button>
                </div>
            </header>

            {/* Toolbar: Search & Filters */}
            <div className="toolbar">
                <form onSubmit={handleSearch} className="search-box">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc mã vạch..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                <select
                    className="form-input"
                    style={{ width: 'auto', minWidth: '200px' }}
                    value={storeFilter}
                    onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
                >
                    <option value="">Tất cả cửa hàng</option>
                    {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Cửa hàng</th>
                                <th style={{ textAlign: 'right' }}>Giá bán</th>
                                <th style={{ textAlign: 'right' }}>Tồn kho</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0' }}>
                                        <div className="loading-spinner"></div>
                                        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '100px 0', color: 'var(--color-text-muted)' }}>
                                        Không tìm thấy sản phẩm nào
                                    </td>
                                </tr>
                            ) : products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="product-info-cell">
                                            <div className="product-avatar">
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt="" />
                                                ) : (
                                                    <span>{p.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="product-name">{p.name}</div>
                                                <div className="product-barcode">{p.barcode || 'KHÔNG CÓ MÃ'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge info">
                                            {p.store?.name}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="price-tag">{Number(p.price).toLocaleString()}đ</div>
                                        <div className="unit-tag">/{p.unit}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className={`stock-level ${p.currentStock <= p.minStockThreshold ? 'low' : 'normal'}`}>
                                            {p.currentStock}
                                        </div>
                                        <div className="min-stock-tag">Min: {p.minStockThreshold}</div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(p)}
                                            className="btn btn-icon btn-danger"
                                            title="Xóa sản phẩm"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && (
                    <div className="pagination-bar">
                        <span className="page-info">Trang {page} / {meta.totalPages}</span>
                        <div className="page-actions">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="btn btn-secondary btn-sm"
                            >
                                Trước
                            </button>
                            <button
                                disabled={page === meta.totalPages}
                                onClick={() => setPage(page + 1)}
                                className="btn btn-primary btn-sm"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showImport && (
                <div className="modal-overlay">
                    <div className="modal-content animate-in zoom-in">
                        <div className="modal-header">
                            <h2>NHẬP HÀNG LOẠT</h2>
                            <button className="close-btn" onClick={() => setShowImport(false)}>&times;</button>
                        </div>

                        <div className="modal-body">
                            <p className="modal-desc">Tải lên tệp Excel (.xlsx) hoặc CSV để nhập sản phẩm vào hệ thống.</p>

                            <div
                                className={`dropzone ${importLoading ? 'loading' : ''}`}
                                onClick={() => !importLoading && document.getElementById('file-upload').click()}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    style={{ display: 'none' }}
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleImport}
                                    disabled={importLoading}
                                />
                                {importLoading ? (
                                    <div className="loading-spinner"></div>
                                ) : (
                                    <>
                                        <div className="dropzone-icon">📁</div>
                                        <p>Click hoặc kéo thả tệp vào đây</p>
                                        <span>Hỗ trợ .xlsx, .xls, .csv</span>
                                    </>
                                )}
                            </div>

                            <div className="import-hints">
                                <ul className="text-amber-800/70 text-xs space-y-1 font-medium list-disc ml-4">
                                    <li>Cột bắt buộc: <b>name</b> (tên), <b>price</b> (giá lẻ), <b>storeId</b> (ID cửa hàng)</li>
                                    <li>Cột bổ sung: barcode, priceIn (giá nhập), unit (đơn vị), currentStock (tồn kho)</li>
                                    <li>Mã vạch (barcode) không được trùng lặp trong cùng một cửa hàng</li>
                                </ul>
                            </div>

                            <div className="modal-actions">
                                <button onClick={downloadTemplate} className="btn btn-secondary" style={{ flex: 1 }}>
                                    TẢI MẪU CSV
                                </button>
                                <button onClick={() => setShowImport(false)} className="btn btn-danger" style={{ flex: 1 }}>
                                    HỦY BỎ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductsPage;
