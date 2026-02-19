// POS Logic
let cart = [];

// Load cart from LocalStorage on init
try {
    const saved = JSON.parse(localStorage.getItem('cart'));
    if (saved && saved.items) cart = saved.items;
} catch (e) { }

function renderCart() {
    const container = document.getElementById('cartItemsList');
    const countSpan = document.getElementById('cartCountItem');
    const totalSpan = document.getElementById('cartPanelTotal');
    const floatTotal = document.getElementById('floatTotal');
    const floatCount = document.getElementById('floatCount');
    const mobileBadges = document.querySelectorAll('.mobile-badge');

    let totalQty = 0;
    let totalPrice = 0;

    if (cart.length === 0) {
        container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
            <span class="material-symbols-outlined text-6xl mb-2 opacity-20">shopping_cart_off</span>
            <p class="text-sm font-medium">Chưa có sản phẩm nào</p>
        </div>`;
        if (document.getElementById('mobileFloatBtn')) document.getElementById('mobileFloatBtn').classList.add('translate-y-20');
    } else {
        container.innerHTML = '';
        cart.forEach((item, index) => {
            totalQty += item.qty;
            totalPrice += item.price * item.qty;

            const hasImg = item.img ? `<img src="${item.img}" class="w-12 h-12 object-contain bg-white rounded-lg border border-slate-100 p-1">` : '';

            const html = `
        <div class="flex gap-3 bg-white p-2 rounded-xl border border-slate-50 hover:border-slate-200 transition-colors group">
            ${hasImg}
            <div class="flex-grow min-w-0">
                <div class="flex justify-between items-start mb-1">
                    <h4 class="text-sm font-semibold text-slate-800 truncate pr-2 leading-tight" title="${item.name}">${item.name}</h4>
                    <button onclick="removeFromCart(${item.id})" class="text-slate-300 hover:text-red-500 transition-colors">
                        <span class="material-icons text-lg">delete</span>
                    </button>
                </div>
                <div class="flex justify-between items-end">
                    <p class="text-xs font-bold text-primary">${new Intl.NumberFormat('vi-VN').format(item.price)}đ</p>
                    
                    <div class="flex items-center gap-3 bg-slate-50 rounded-lg px-2 py-1 border border-slate-100">
                        <button onclick="updateQty(${item.id}, -1)" class="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-primary active:scale-90 transition-all font-bold text-sm">-</button>
                        <span class="text-xs font-bold w-4 text-center select-none">${item.qty}</span>
                        <button onclick="updateQty(${item.id}, 1)" class="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 hover:text-primary active:scale-90 transition-all font-bold text-sm">+</button>
                    </div>
                </div>
            </div>
        </div>`;
            container.innerHTML += html;
        });
        if (document.getElementById('mobileFloatBtn')) document.getElementById('mobileFloatBtn').classList.remove('translate-y-20');
    }

    const formattedTotal = new Intl.NumberFormat('vi-VN').format(totalPrice) + 'đ';

    if (countSpan) countSpan.innerText = totalQty;
    if (totalSpan) totalSpan.innerText = formattedTotal;
    if (floatTotal) floatTotal.innerText = formattedTotal;
    if (floatCount) floatCount.innerText = totalQty;
    mobileBadges.forEach(b => b.innerText = totalQty);

    // Save
    localStorage.setItem('cart', JSON.stringify({ items: cart, totalQty, totalPrice }));
}

function addToCart(id, name, price, img) {
    let existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ id, name, price, qty: 1, img });
    }
    renderCart();
    if (navigator.vibrate) navigator.vibrate(50);

    // UX: Auto focus back to search
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    // Reset filters to show all products after adding (if using client side filter, but here it's mostly AJAX)
    // For AJAX search, maybe we just clear and focus
    searchInput.focus();
}

function updateQty(id, change) {
    let item = cart.find(i => i.id === id);
    if (item) {
        item.qty += change;
        if (item.qty <= 0) {
            removeFromCart(id);
            return;
        }
        renderCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    renderCart();
}

function clearCart() {
    if (confirm('Bạn chắc chắn muốn xóa hết giỏ hàng?')) {
        cart = [];
        renderCart();
    }
}

function processCheckout() {
    if (cart.length === 0) {
        alert('Giỏ hàng đang trống!');
        return;
    }
    window.location.href = 'payment.php';
}

// --- UI Logic ---
function toggleCart(forceOpen) {
    const panel = document.getElementById('cartPanel');
    const backdrop = document.getElementById('cartBackdrop');
    const floatBtn = document.getElementById('mobileFloatBtn');

    const isOpen = panel.classList.contains('cart-panel-open');

    if (forceOpen === true || !isOpen) {
        // Open
        panel.classList.add('cart-panel-open');
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
        floatBtn.classList.add('translate-y-20'); // Hide float button when cart open
    } else {
        // Close
        panel.classList.remove('cart-panel-open');
        backdrop.classList.add('opacity-0');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
        if (cart.length > 0) floatBtn.classList.remove('translate-y-20'); // Show back if items exist
    }
}

// --- AJAX Search Logic ---
let searchDebounceTimer;
const productContainer = document.getElementById('productGrid');

async function fetchProducts(query = '', category = '') {
    try {
        // Show loading state (optional) or keep current view
        const url = `search_products.php?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
            renderProductGrid(data.data);
        }
    } catch (err) {
        console.error('Lỗi tìm kiếm:', err);
    }
}

function renderProductGrid(products) {
    if (!products || products.length === 0) {
        productContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10">Không tìm thấy sản phẩm nào</div>`;
        return;
    }

    let html = '';
    products.forEach(p => {
        // Escape single quotes in name for onclick attribute
        const safeName = p.name ? p.name.replace(/'/g, "\\'") : '';
        const imageUrl = p.image_url || 'https://placehold.co/150x150/png?text=Product';

        html += `
        <div class="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col product-card group cursor-pointer h-full"
            onclick="addToCart(${p.id}, '${safeName}', ${p.price}, '${imageUrl}')">
            <div class="aspect-square w-full bg-white p-4 relative flex items-center justify-center">
                <img alt="${safeName}" loading="lazy"
                    class="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-300"
                    src="${imageUrl}" />
                <div class="absolute top-2 right-2 bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="material-icons text-lg">add</span>
                </div>
            </div>
            <div class="p-3 flex flex-col flex-grow border-t border-slate-50">
                <p class="text-[14px] font-semibold text-slate-800 leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    ${p.name}
                </p>
                <div class="mt-auto flex items-center justify-between">
                    <span class="text-xs text-slate-500">${p.category || 'Khác'}</span>
                    <span class="text-primary font-bold text-base">${new Intl.NumberFormat('vi-VN').format(p.price)}đ</span>
                </div>
            </div>
        </div>`;
    });
    productContainer.innerHTML = html;
}

// Handle Search Input (Debounce 300ms)
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function (e) {
        clearTimeout(searchDebounceTimer);
        const term = e.target.value;
        // Get active category if exists
        const activeCategoryBtn = document.querySelector('.category-btn.bg-slate-900');
        const category = activeCategoryBtn ? activeCategoryBtn.innerText.trim() : '';

        searchDebounceTimer = setTimeout(() => {
            // If "Tất cả" is selected, fetch all with search term
            const catParam = category === 'Tất cả' ? '' : category;
            fetchProducts(term, catParam);
        }, 300);
    });

    // UX: Keyboard Shortcut - Enter to add first result
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const firstCard = productContainer.querySelector('.product-card');
            if (firstCard) {
                firstCard.click();
            }
        }
    });
}

// Handle Category Filter
function filterCategory(btn, category) {
    // Update UI buttons
    document.querySelectorAll('.category-btn').forEach(el => {
        el.className = 'whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold border border-slate-200 active:bg-slate-50 transition-all category-btn bg-white text-slate-700 hover:bg-slate-50';
    });
    btn.className = 'whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold border border-slate-900 active:bg-slate-900 transition-all category-btn bg-slate-900 text-white';

    // Let's keep search term if any
    const term = document.getElementById('searchInput').value;
    const catParam = category === 'Tất cả' ? '' : category;

    fetchProducts(term, catParam);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(() => console.log('SW Registered'));
    }
    renderCart();
});
