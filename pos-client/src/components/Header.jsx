import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan, X } from 'lucide-react';

export default function Header({ user, onSearch, onScan, cartCount, onToggleCart }) {
    const [query, setQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Instant search for very short queries or clearing
        if (value.length <= 1) {
            onSearch && onSearch(value);
            return;
        }

        // Debounce search
        const handler = setTimeout(() => {
            onSearch && onSearch(value);
        }, 300);

        return () => clearTimeout(handler);
    };

    // Sound feedback
    const playBeep = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.22);
        } catch (e) { console.log("Audio failed", e); }
    };

    // Scanner logic
    useEffect(() => {
        let scanner = null;
        if (isScanning) {
            scanner = new Html5QrcodeScanner("reader-pos", {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0
            });

            scanner.render((decodedText) => {
                playBeep();
                setIsScanning(false);
                scanner.clear();
                if (onScan) onScan(decodedText);
            }, (error) => {
                // Ignore errors
            });
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(e => console.log(e));
            }
        };
    }, [isScanning, onScan]);

    return (
        <header className="flex-shrink-0 bg-white border-b border-slate-100 px-4 md:px-6 py-4 flex flex-col gap-4 z-20">
            {/* Mobile Header Top */}
            <div className="flex md:hidden items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-lg text-slate-800">Bán hàng</h1>
                </div>
                <button className="relative p-2" onClick={onToggleCart}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {cartCount || 0}
                    </span>
                </button>
            </div>

            {/* Search Bar & Scanner */}
            <div className="w-full flex items-center gap-3">
                <div className="relative w-full flex-grow">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        id="searchInput"
                        autoFocus
                        className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-12 focus:ring-2 focus:ring-primary text-sm font-semibold text-slate-900 placeholder:text-slate-500 transition-all hover:bg-slate-50 shadow-inner focus:outline-none"
                        placeholder="Tìm sản phẩm / F2"
                        type="text"
                        autoComplete="off"
                        value={query}
                        onChange={handleChange}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-bold hidden md:inline-block">F2</span>
                        <button
                            type="button"
                            onClick={() => setIsScanning(!isScanning)}
                            className={`p-1.5 rounded-lg transition-all ${isScanning ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-primary'}`}
                        >
                            <Scan size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {isScanning && (
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden border-2 border-primary shadow-xl animate-fade-in">
                    <div id="reader-pos" className="w-full"></div>
                    <button
                        onClick={() => setIsScanning(false)}
                        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg z-10 hover:bg-red-600 transition-transform active:scale-90"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="bg-black/60 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
                            Đưa mã vạch vào khung hình
                        </span>
                    </div>
                </div>
            )}

        </header>
    );
}
