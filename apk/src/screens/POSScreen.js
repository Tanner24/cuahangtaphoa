import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    Modal,
    ActivityIndicator,
    Alert,
    ScrollView,
    Vibration,
    Dimensions
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Feather } from '@expo/vector-icons';
import { posService } from '../services/api';
const logoImg = require('../../assets/logo.png');
import { CartContext } from '../context/CartContext';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, CameraView } from 'expo-camera';


const { width } = Dimensions.get('window');

export default function POSScreen() {
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount, customer, setCustomer } = useContext(CartContext);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Cart modal
    const [showCart, setShowCart] = useState(false);

    // Checkout modal
    const [showCheckout, setShowCheckout] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [customerPay, setCustomerPay] = useState('');
    const [discount, setDiscount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Customer search
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Scanner
    const [scannerVisible, setScannerVisible] = useState(false);
    const [scanned, setScanned] = useState(false);

    // Store Info for VietQR
    const [storeInfo, setStoreInfo] = useState(null);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
            fetchStoreInfo();
        }, [])
    );

    const fetchStoreInfo = async () => {
        try {
            const res = await posService.getStore();
            setStoreInfo(res.data || res);
        } catch (e) {
            console.error('Fetch store info error:', e);
        }
    };

    const fetchProducts = async (query = '') => {
        setLoading(true);
        try {
            const res = await posService.getProducts({ search: query });
            setProducts(res.data || []);
        } catch (e) {
            console.error('Fetch products error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text) => {
        setSearch(text);
        if (text.length > 1 || text === '') {
            fetchProducts(text);
        }
    };

    // ============ BARCODE SCANNING ============
    const openScanner = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status === 'granted') {
            setScanned(false);
            setScannerVisible(true);
        } else {
            Alert.alert('Quyền truy cập', 'Cần quyền camera để quét mã vạch');
        }
    };

    const handleBarCodeScanned = ({ data }) => {
        if (scanned) return;
        setScanned(true);
        Vibration.vibrate(100);
        setScannerVisible(false);
        handleScanLookup(data);
    };

    const handleScanLookup = async (barcode) => {
        try {
            const res = await posService.getProductByBarcode(barcode);
            if (res && res.data) {
                addToCart(res.data);
                Alert.alert('✓ Đã thêm', `${res.data.name} đã được thêm vào giỏ`);
            } else {
                Alert.alert('Không tìm thấy', `Mã vạch "${barcode}" chưa có trong hệ thống`);
            }
        } catch (err) {
            Alert.alert('Không tìm thấy', `Mã vạch "${barcode}" chưa có trong hệ thống`);
        }
    };

    // ============ CUSTOMER SEARCH ============
    useEffect(() => {
        if (searchQuery.length >= 2) {
            const timer = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const res = await posService.searchCustomers(searchQuery);
                    setCustomers(res.data || []);
                } catch (e) { console.error(e); }
                finally { setIsSearching(false); }
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setCustomers([]);
        }
    }, [searchQuery]);

    // ============ CHECKOUT ============
    const finalAmount = totalAmount - discount;
    const changeDue = parseFloat(customerPay || 0) - finalAmount;

    const handleOpenCheckout = () => {
        setShowCart(false);
        setPaymentMethod('CASH');
        setCustomerPay('');
        setDiscount(0);
        setSearchQuery('');
        setCustomers([]);
        setIsSuccess(false);
        setShowCheckout(true);
    };

    const handleConfirmPayment = async () => {
        if (paymentMethod === 'DEBT' && !customer) {
            Alert.alert('Lỗi', 'Vui lòng chọn khách hàng để ghi nợ');
            return;
        }

        setProcessing(true);
        try {
            await posService.createOrder({
                items: cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalAmount: finalAmount,
                paymentMethod: paymentMethod,
                customerId: customer?.id || null,
                note: paymentMethod === 'BANK_TRANSFER' ? 'Thanh toán chuyển khoản' : '',
            });

            setIsSuccess(true);
            setTimeout(() => {
                clearCart();
                setIsSuccess(false);
                setShowCheckout(false);
            }, 1500);
        } catch (e) {
            Alert.alert('Lỗi', 'Thanh toán thất bại: ' + e.message);
        } finally {
            setProcessing(false);
        }
    };

    const formatMoney = (val) => {
        return Number(val).toLocaleString('vi-VN') + 'đ';
    };

    const getQrUrl = () => {
        if (!storeInfo?.bankName || !storeInfo?.bankAccountNumber) return null;

        const bankId = storeInfo.bankName;
        const accountNo = storeInfo.bankAccountNumber;
        const template = 'qr_only';
        const amount = Math.round(finalAmount);
        const description = encodeURIComponent(`Thanh toan don hang ${Date.now().toString().slice(-6)}`);
        const accountName = encodeURIComponent(storeInfo.bankAccountName || '');

        return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${description}&accountName=${accountName}`;
    };

    // ============ RENDERS ============
    const renderProductItem = ({ item }) => (
        <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
            <View style={styles.productImagePlaceholder}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                ) : (
                    <Feather name="package" size={24} color="#CBD5E1" />
                )}
            </View>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productPrice}>{formatMoney(item.price)}</Text>
            <View style={styles.addBtnFloat}>
                <Feather name="plus" size={14} color={COLORS.white} />
            </View>
        </TouchableOpacity>
    );

    const renderCartItem = ({ item }) => (
        <View style={styles.cartItem}>
            <View style={{ flex: 1 }}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>{formatMoney(item.price)}</Text>
            </View>
            <View style={styles.quantityControl}>
                <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyBtn}>
                    <Feather name="minus" size={14} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyBtn}>
                    <Feather name="plus" size={14} color={COLORS.text} />
                </TouchableOpacity>
            </View>
            <Text style={styles.cartItemTotal}>{formatMoney(item.price * item.quantity)}</Text>
            <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ padding: 8 }}>
                <Feather name="trash-2" size={16} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.searchBar}>
                    <Image source={logoImg} style={styles.searchLogo} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm sản phẩm..."
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
                <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
                    <Feather name="camera" size={22} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Product Grid */}
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderProductItem}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    contentContainerStyle={styles.productList}
                    columnWrapperStyle={{ gap: 12 }}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 40, color: COLORS.textSecondary }}>
                            Không tìm thấy sản phẩm
                        </Text>
                    }
                />
            )}

            {/* Cart Summary Bar */}
            {cart.length > 0 && (
                <View style={styles.cartFooter}>
                    <TouchableOpacity style={styles.cartSummary} onPress={() => setShowCart(true)}>
                        <View style={styles.cartBadge}>
                            <Feather name="shopping-cart" size={18} color={COLORS.white} />
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{cart.reduce((a, b) => a + b.quantity, 0)}</Text>
                            </View>
                        </View>
                        <View>
                            <Text style={styles.totalLabel}>Tổng</Text>
                            <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.payBtn} onPress={handleOpenCheckout}>
                        <Text style={styles.payBtnText}>THANH TOÁN</Text>
                        <Feather name="chevron-right" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            )}

            {/* ====== SCANNER MODAL ====== */}
            <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
                <View style={styles.scannerContainer}>
                    <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.scannerOverlay}>
                        <View style={styles.scannerTopBar}>
                            <TouchableOpacity style={styles.scannerClose} onPress={() => setScannerVisible(false)}>
                                <Feather name="x" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.scannerTitle}>Quét mã vạch</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <View style={styles.scannerFrameWrap}>
                            <View style={styles.scannerFrame}>
                                <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                                <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
                                <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                                <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
                            </View>
                        </View>
                        <View style={styles.scannerBottomBar}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Hướng camera vào mã vạch</Text>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ====== CART MODAL ====== */}
            <Modal visible={showCart} animationType="slide" onRequestClose={() => setShowCart(false)}>
                <View style={styles.modalFull}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Giỏ hàng ({cart.length})</Text>
                        <TouchableOpacity onPress={() => setShowCart(false)}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={cart}
                        renderItem={renderCartItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ padding: 16 }}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>Giỏ hàng trống</Text>}
                    />
                    <View style={styles.cartModalFooter}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Tổng cộng:</Text>
                            <Text style={styles.summaryValue}>{formatMoney(totalAmount)}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkoutBtn}
                            onPress={handleOpenCheckout}
                            disabled={cart.length === 0}
                        >
                            <Text style={styles.checkoutBtnText}>THANH TOÁN</Text>
                            <Feather name="chevron-right" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ====== CHECKOUT MODAL ====== */}
            <Modal visible={showCheckout} animationType="slide" onRequestClose={() => setShowCheckout(false)}>
                {isSuccess ? (
                    <View style={styles.successScreen}>
                        <View style={styles.successIcon}>
                            <Feather name="check-circle" size={64} color="#10B981" />
                        </View>
                        <Text style={styles.successTitle}>THANH TOÁN THÀNH CÔNG!</Text>
                        <Text style={styles.successSub}>Đơn hàng đã được tạo</Text>
                    </View>
                ) : (
                    <ScrollView style={styles.modalFull} contentContainerStyle={{ paddingBottom: 40 }}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { fontSize: 22, fontWeight: '900', textTransform: 'uppercase' }]}>
                                Thanh toán
                            </Text>
                            <TouchableOpacity onPress={() => setShowCheckout(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Total Amount Box */}
                        <View style={styles.totalBox}>
                            <Text style={styles.totalBoxLabel}>TỔNG CỘNG</Text>
                            <Text style={styles.totalBoxAmount}>{formatMoney(finalAmount)}</Text>
                        </View>

                        {/* Payment Methods */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PHƯƠNG THỨC THANH TOÁN</Text>
                            <View style={styles.paymentMethods}>
                                <TouchableOpacity
                                    style={[styles.pmCard, paymentMethod === 'CASH' && styles.pmCardActive]}
                                    onPress={() => setPaymentMethod('CASH')}
                                >
                                    <Feather name="dollar-sign" size={24} color={paymentMethod === 'CASH' ? '#3B82F6' : '#94A3B8'} />
                                    <Text style={[styles.pmLabel, paymentMethod === 'CASH' && styles.pmLabelActive]}>Tiền mặt</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pmCard, paymentMethod === 'BANK_TRANSFER' && styles.pmCardActive]}
                                    onPress={() => setPaymentMethod('BANK_TRANSFER')}
                                >
                                    <Feather name="credit-card" size={24} color={paymentMethod === 'BANK_TRANSFER' ? '#3B82F6' : '#94A3B8'} />
                                    <Text style={[styles.pmLabel, paymentMethod === 'BANK_TRANSFER' && styles.pmLabelActive]}>Chuyển khoản</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pmCard, paymentMethod === 'DEBT' && styles.pmCardDebt]}
                                    onPress={() => setPaymentMethod('DEBT')}
                                >
                                    <Feather name="user" size={24} color={paymentMethod === 'DEBT' ? '#EF4444' : '#94A3B8'} />
                                    <Text style={[styles.pmLabel, paymentMethod === 'DEBT' && { color: '#EF4444' }]}>Ghi nợ</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Cash Payment: Customer Pay + Change */}
                        {paymentMethod === 'CASH' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>KHÁCH TRẢ</Text>
                                <View style={styles.cashRow}>
                                    <TextInput
                                        style={styles.cashInput}
                                        placeholder="0"
                                        value={customerPay}
                                        onChangeText={setCustomerPay}
                                        keyboardType="numeric"
                                    />
                                    <View style={styles.changeBox}>
                                        <Text style={styles.changeLabel}>TIỀN THỪA</Text>
                                        <Text style={[styles.changeAmount, changeDue >= 0 && { color: '#10B981' }]}>
                                            {changeDue >= 0 ? formatMoney(changeDue) : '0đ'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.quickAmounts}>
                                    {[20000, 50000, 100000, 200000, 500000].map(val => (
                                        <TouchableOpacity
                                            key={val}
                                            style={styles.quickBtn}
                                            onPress={() => setCustomerPay(val.toString())}
                                        >
                                            <Text style={styles.quickBtnText}>+{val / 1000}k</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.quickBtn, { backgroundColor: '#3B82F6' }]}
                                        onPress={() => setCustomerPay(finalAmount.toString())}
                                    >
                                        <Text style={[styles.quickBtnText, { color: '#FFF' }]}>Đủ tiền</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* VietQR Display */}
                        {paymentMethod === 'BANK_TRANSFER' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>QUÉT MÃ VIETQR</Text>
                                <View style={styles.qrContainer}>
                                    {getQrUrl() ? (
                                        <>
                                            <Image
                                                source={{ uri: getQrUrl() }}
                                                style={styles.qrImage}
                                                resizeMode="contain"
                                            />
                                            <Text style={styles.qrHint}>Khách hàng dùng App Ngân hàng quét để thanh toán</Text>
                                            <View style={styles.bankDetail}>
                                                <Text style={styles.bankName}>{storeInfo.bankName} - {storeInfo.bankAccountNumber}</Text>
                                                <Text style={styles.bankAccountName}>{storeInfo.bankAccountName}</Text>
                                            </View>
                                        </>
                                    ) : (
                                        <View style={styles.qrPlaceholder}>
                                            <Feather name="info" size={24} color="#94A3B8" />
                                            <Text style={styles.qrPlaceholderText}>Chưa cấu hình thông tin ngân hàng trong Cài đặt</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Customer Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>KHÁCH HÀNG</Text>
                            {customer ? (
                                <View style={styles.customerCard}>
                                    <View>
                                        <Text style={styles.customerName}>{customer.name}</Text>
                                        <Text style={styles.customerPhone}>{customer.phone}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setCustomer(null)}>
                                        <Feather name="x-circle" size={20} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View>
                                    <View style={styles.customerSearch}>
                                        <Feather name="search" size={16} color="#94A3B8" />
                                        <TextInput
                                            style={styles.customerSearchInput}
                                            placeholder="Tìm khách hàng..."
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                        {isSearching && <ActivityIndicator size="small" color={COLORS.primary} />}
                                    </View>
                                    {customers.length > 0 && (
                                        <View style={styles.customerList}>
                                            {customers.map(c => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    style={styles.customerOption}
                                                    onPress={() => {
                                                        setCustomer(c);
                                                        setSearchQuery('');
                                                        setCustomers([]);
                                                    }}
                                                >
                                                    <Text style={styles.customerOptName}>{c.name}</Text>
                                                    <Text style={styles.customerOptPhone}>{c.phone}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Discount */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>KM / CHIẾT KHẤU</Text>
                            <View style={styles.discountRow}>
                                <TextInput
                                    style={styles.discountInput}
                                    value={discount ? discount.toString() : ''}
                                    onChangeText={t => setDiscount(parseFloat(t) || 0)}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                                <View style={styles.discountBtns}>
                                    {[5, 10, 15].map(pct => (
                                        <TouchableOpacity
                                            key={pct}
                                            style={styles.pctBtn}
                                            onPress={() => setDiscount(Math.round(totalAmount * pct / 100))}
                                        >
                                            <Text style={styles.pctBtnText}>{pct}%</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Order Summary */}
                        <View style={styles.orderSummary}>
                            <View style={styles.summaryLine}>
                                <Text style={styles.summaryLineLabel}>Tạm tính:</Text>
                                <Text style={styles.summaryLineValue}>{formatMoney(totalAmount)}</Text>
                            </View>
                            <View style={styles.summaryLine}>
                                <Text style={styles.summaryLineLabel}>Giảm giá:</Text>
                                <Text style={[styles.summaryLineValue, { color: '#EF4444' }]}>-{formatMoney(discount)}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryLine}>
                                <Text style={styles.summaryFinalLabel}>PHẢI THU:</Text>
                                <Text style={styles.summaryFinalValue}>{formatMoney(finalAmount)}</Text>
                            </View>
                        </View>

                        {/* Confirm Button */}
                        <View style={{ paddingHorizontal: 20 }}>
                            <TouchableOpacity
                                style={[styles.confirmBtn, processing && { opacity: 0.7 }]}
                                onPress={handleConfirmPayment}
                                disabled={processing}
                            >
                                {processing ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.confirmBtnText}>XÁC NHẬN</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Header
    header: {
        flexDirection: 'row', padding: 16, paddingTop: 60,
        backgroundColor: COLORS.white, borderBottomWidth: 1,
        borderBottomColor: COLORS.border, gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchLogo: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
    scanBtn: {
        width: 44, height: 44, backgroundColor: '#F59E0B',
        borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    },

    // Product Grid
    productList: { padding: 16, paddingBottom: 120 },
    productCard: {
        flex: 1, backgroundColor: COLORS.white, borderRadius: 16,
        padding: 8, marginBottom: 12, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
        shadowRadius: 2, elevation: 2, position: 'relative',
        aspectRatio: 0.85,
    },
    productImagePlaceholder: {
        flex: 1, backgroundColor: COLORS.background,
        borderRadius: 8, marginBottom: 6, alignItems: 'center', justifyContent: 'center',
    },
    productImage: { width: '100%', height: '100%', resizeMode: 'contain', borderRadius: 8 },
    productName: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginBottom: 2, height: 32 },
    productPrice: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
    addBtnFloat: {
        position: 'absolute', bottom: 10, right: 10, width: 26, height: 26,
        borderRadius: 13, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    },

    // Cart Footer
    cartFooter: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.white, padding: 16, paddingBottom: 32,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    cartSummary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cartBadge: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center', position: 'relative',
    },
    badge: {
        position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444',
        minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    },
    badgeText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },
    totalLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
    totalValue: { fontSize: 18, fontWeight: '900', color: COLORS.text },
    payBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 14,
        borderRadius: 14,
    },
    payBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },

    // Scanner
    scannerContainer: { flex: 1, backgroundColor: '#000' },
    scannerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
    scannerTopBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scannerClose: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    scannerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    scannerFrameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scannerFrame: { width: 260, height: 160 },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: '#3B82F6', borderRadius: 4 },
    scannerBottomBar: {
        alignItems: 'center', paddingBottom: 60, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    },

    // Cart Modal
    modalFull: { flex: 1, backgroundColor: COLORS.white, paddingTop: 20 },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    cartItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    cartItemName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    cartItemPrice: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    cartItemTotal: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginRight: 8, minWidth: 70, textAlign: 'right' },
    quantityControl: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.background, borderRadius: 8, marginHorizontal: 8,
    },
    qtyBtn: { padding: 8 },
    qtyText: { fontSize: 14, fontWeight: '700', minWidth: 24, textAlign: 'center' },
    cartModalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, paddingBottom: 40 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    summaryLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
    summaryValue: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
    checkoutBtn: {
        backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
    },
    checkoutBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

    // ====== CHECKOUT STYLES ======
    successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
    successIcon: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: '#ECFDF5',
        alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginBottom: 6 },
    successSub: { fontSize: 16, color: '#64748B', fontWeight: '500' },

    totalBox: {
        margin: 20, backgroundColor: '#EFF6FF', padding: 24,
        borderRadius: 20, borderWidth: 1, borderColor: '#DBEAFE',
    },
    totalBoxLabel: { fontSize: 12, fontWeight: '800', color: '#3B82F6', letterSpacing: 1 },
    totalBoxAmount: { fontSize: 36, fontWeight: '900', color: '#0F172A', marginTop: 4 },

    section: { paddingHorizontal: 20, marginBottom: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12 },

    paymentMethods: { flexDirection: 'row', gap: 10 },
    pmCard: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 16, borderRadius: 16, borderWidth: 2,
        borderColor: '#E2E8F0', backgroundColor: '#FFF', gap: 6,
    },
    pmCardActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
    pmCardDebt: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    pmLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
    pmLabelActive: { color: '#3B82F6' },

    cashRow: { flexDirection: 'row', gap: 12 },
    cashInput: {
        flex: 1, backgroundColor: '#F1F5F9', borderRadius: 16,
        paddingHorizontal: 16, paddingVertical: 16, fontSize: 24,
        fontWeight: '900', color: '#0F172A',
    },
    changeBox: {
        flex: 1, backgroundColor: '#ECFDF5', borderRadius: 16,
        padding: 16, borderWidth: 1, borderColor: '#D1FAE5',
    },
    changeLabel: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1 },
    changeAmount: { fontSize: 20, fontWeight: '900', color: '#94A3B8', marginTop: 4 },

    quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    quickBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E2E8F0', borderRadius: 10 },
    quickBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },

    customerCard: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0',
    },
    customerName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    customerPhone: { fontSize: 13, color: '#64748B', marginTop: 2 },
    customerSearch: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    },
    customerSearchInput: { flex: 1, fontSize: 14, color: '#334155' },
    customerList: { backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8 },
    customerOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    customerOptName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
    customerOptPhone: { fontSize: 12, color: '#64748B', marginTop: 2 },

    discountRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    discountInput: {
        flex: 1, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
        fontSize: 16, fontWeight: '700', color: '#10B981',
    },
    discountBtns: { flexDirection: 'row', gap: 6 },
    pctBtn: {
        paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#ECFDF5',
        borderRadius: 10, borderWidth: 1, borderColor: '#D1FAE5',
    },
    pctBtnText: { fontSize: 11, fontWeight: '800', color: '#10B981' },

    orderSummary: { marginHorizontal: 20, marginBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    summaryLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLineLabel: { fontSize: 14, color: '#64748B' },
    summaryLineValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    summaryDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
    summaryFinalLabel: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
    summaryFinalValue: { fontSize: 18, fontWeight: '900', color: '#3B82F6' },

    confirmBtn: {
        backgroundColor: '#3B82F6', paddingVertical: 18, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    confirmBtnText: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    // QR Styles
    qrContainer: {
        backgroundColor: '#FFF', padding: 20, borderRadius: 24, alignItems: 'center',
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    qrImage: { width: width * 0.6, height: width * 0.6, marginBottom: 16 },
    qrHint: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 12 },
    bankDetail: { alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', width: '100%' },
    bankName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
    bankAccountName: { fontSize: 12, color: '#64748B', textTransform: 'uppercase', marginTop: 2 },
    qrPlaceholder: { padding: 30, alignItems: 'center' },
    qrPlaceholderText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8 },
});
