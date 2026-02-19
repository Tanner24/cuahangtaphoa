import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { posService } from '../services/api';
import ProductGrid from '../components/ProductGrid';
import CartPanel from '../components/CartPanel';
import Header from '../components/Header';
import CheckoutModal from '../components/CheckoutModal';

export default function Pos() {
    const { user } = useAuth();
    const { cart, addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Initial fetch and Barcode Scanner Listener
    useEffect(() => {
        fetchProducts();

        let buffer = '';
        let lastKeyTime = Date.now();

        const handleGlobalKeyDown = (e) => {
            // Ignore events that are targeted at input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const currentTime = Date.now();

            // Typical hardware scanners send keys very quickly (< 30ms)
            if (currentTime - lastKeyTime > 100) {
                buffer = ''; // Reset buffer if typing is slow (likely a human)
            }

            lastKeyTime = currentTime;

            if (e.key === 'Enter') {
                if (buffer.length > 2) {
                    handleScan(buffer);
                    buffer = '';
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const fetchProducts = async (searchQuery) => {
        setLoading(true);
        try {
            const res = await posService.getProducts({ search: searchQuery });
            setProducts(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (q) => {
        fetchProducts(q);
    }

    const handleScan = async (barcode) => {
        try {
            console.log('Scanner capture:', barcode);
            const res = await posService.getProductByBarcode(barcode);
            if (res && res.data) {
                addToCart(res.data);
                // Visual feedback: brief toast or flash could be added here
            } else {
                console.warn('Barcode not found:', barcode);
            }
        } catch (err) {
            console.error('Scan error:', err);
        }
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    return (
        <div className="bg-slate-50 text-slate-900 font-display min-h-screen flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Desktop Sidebar (Optional - Placeholder if needed, currently hidden based on sale.php 'md:ml-64' if sidebar exists) */}
            {/* If current design is full screen POS without admin sidebar, we structure it as full width */}

            {/* Main Interface */}
            <div className="flex-grow flex flex-col h-screen overflow-hidden relative">
                <Header
                    user={user}
                    onSearch={handleSearch}
                    onScan={handleScan}
                    cartCount={cart.items.length}
                    onToggleCart={toggleCart}
                />

                <div className="flex-grow flex overflow-hidden relative">
                    {/* Main Product Area */}
                    <main className="flex-1 flex flex-col h-full bg-slate-50 relative">

                        {loading ? (
                            <div className="flex items-center justify-center h-full text-slate-400">
                                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : (
                            <ProductGrid products={products} onAddToCart={addToCart} />
                        )}
                    </main>

                    {/* Cart Panel */}
                    {/* Mobile Overlay */}
                    {isCartOpen && (
                        <div
                            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-300"
                            onClick={() => setIsCartOpen(false)}
                        ></div>
                    )}

                    {/* The Cart Panel Component handles its own visibility via CSS classes passed or internal logic */}
                    <div className={`fixed md:static inset-y-0 right-0 z-40 h-full transition-transform duration-300 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
                        <CartPanel
                            isOpen={isCartOpen}
                            onClose={() => setIsCartOpen(false)}
                            onCheckout={() => {
                                console.log("Checkout clicked");
                                setIsCheckoutOpen(true);
                            }}
                        />
                    </div>
                </div>

                {/* Mobile Floating Cart Button */}
                {!isCartOpen && cart.items.length > 0 && (
                    <div className="md:hidden fixed bottom-24 left-4 right-4 z-30 transition-transform duration-300">
                        <button
                            onClick={toggleCart}
                            className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-xl flex justify-between items-center active:scale-95 transition-transform"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                    {cart.items.length}
                                </div>
                                <span className="font-bold text-sm">Xem giỏ hàng</span>
                            </div>
                            <span className="font-bold text-lg">
                                {Number(cart.totalAmount).toLocaleString()}đ
                            </span>
                        </button>
                    </div>
                )}
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
            />
        </div>
    );
}
