import React, { useState } from 'react';

// Mock categories for UI matching if not provided
const MOCK_CATS = ['Tất cả', 'Thực phẩm', 'Đồ uống', 'Rau củ', 'Hóa mỹ phẩm'];

export default function ProductGrid({ products, onAddToCart, categories = MOCK_CATS }) {
    const [activeCat, setActiveCat] = useState('Tất cả');

    const filteredProducts = activeCat === 'Tất cả'
        ? products
        : products.filter(p => p.category === activeCat);

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            {/* Category Filter */}
            <div className="px-4 md:px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0 shadow-sm z-10 sticky top-0">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                    {categories.map((cat, index) => (
                        <button
                            key={index}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold border transition-all ${activeCat === cat
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                            onClick={() => setActiveCat(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32 md:pb-6">
                <div
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                    id="productGrid"
                >
                    {filteredProducts.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => onAddToCart(p)}
                            className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col group cursor-pointer h-full active:scale-95 duration-100"
                        >
                            <div className="aspect-square w-full bg-white p-4 relative flex items-center justify-center">
                                {p.imageUrl ? (
                                    <img
                                        alt={p.name}
                                        loading="lazy"
                                        className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                                        src={p.imageUrl}
                                    />
                                ) : (
                                    <div className="text-4xl text-slate-200 font-black select-none flex items-center justify-center w-full h-full bg-slate-50 rounded-lg">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <div className="absolute top-2 right-2 bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>

                                {p.currentStock <= 5 && (
                                    <span className="absolute bottom-0 inset-x-0 bg-red-500/10 text-red-600 text-[10px] font-bold text-center py-1">
                                        Sắp hết: {p.currentStock}
                                    </span>
                                )}
                            </div>

                            <div className="p-3 flex flex-col flex-grow border-t border-slate-50 relative">
                                <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[2.5em]">
                                    {p.name}
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{p.category || 'Chung'}</span>
                                    <span className="text-red-600 font-black text-lg">
                                        {Number(p.price).toLocaleString()}đ
                                    </span>
                                </div>
                                {/* Visual + Button */}
                                <button className="absolute bottom-3 right-0 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 bg-primary text-white p-1.5 rounded-lg shadow-lg hover:bg-blue-700 active:scale-90">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            <p>Không tìm thấy sản phẩm nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
