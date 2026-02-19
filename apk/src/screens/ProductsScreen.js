import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Vibration
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Feather } from '@expo/vector-icons';
import { posService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, Camera } from 'expo-camera';

export default function ProductsScreen() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        price: '',
        priceIn: '',
        currentStock: '',
        unit: 'Cái',
        minStockThreshold: '5'
    });
    const [submitting, setSubmitting] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);

    // Scanner State
    const [scannerVisible, setScannerVisible] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

    const fetchProducts = async (query = '') => {
        setLoading(true);
        try {
            const res = await posService.getProducts({ search: query });
            setProducts(res.data || []);
        } catch (e) {
            console.error('Fetch products error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    const handleSearch = (text) => {
        setSearch(text);
        if (text.length > 1 || text === '') {
            fetchProducts(text);
        }
    };

    // === BARCODE SCANNING ===
    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
        return status === 'granted';
    };

    const openScanner = async () => {
        const granted = await requestCameraPermission();
        if (granted) {
            setScanned(false);
            setScannerVisible(true);
        } else {
            Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền camera để quét mã vạch');
        }
    };

    const handleBarCodeScanned = ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        Vibration.vibrate(100);
        setScannerVisible(false);
        handleBarcodeLookup(data);
    };

    const handleBarcodeLookup = async (code) => {
        // Check if product already exists
        const existing = products.find(p => p.barcode === code);
        if (existing) {
            Alert.alert(
                'Sản phẩm đã tồn tại',
                `"${existing.name}" đã có trong hệ thống. Bạn muốn chỉnh sửa?`,
                [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Chỉnh sửa', onPress: () => handleEdit(existing) }
                ]
            );
            return;
        }

        // Set barcode and open modal
        setEditingProduct(null);
        setFormData({
            name: '',
            barcode: code,
            price: '',
            priceIn: '',
            currentStock: '',
            unit: 'Cái',
            minStockThreshold: '5'
        });
        setModalVisible(true);

        // Try to look up barcode info from Open Food Facts via backend
        setIsLookingUp(true);
        try {
            const res = await posService.lookupGlobalBarcode(code);
            const p = res.data;
            if (p) {
                setFormData(prev => ({
                    ...prev,
                    name: p.name || prev.name,
                    unit: p.unit || prev.unit,
                }));
            }
        } catch (err) {
            console.log('Lookup not found, user fills manually');
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            barcode: product.barcode || '',
            price: product.price ? product.price.toString() : '',
            priceIn: product.priceIn ? product.priceIn.toString() : '',
            currentStock: product.currentStock ? product.currentStock.toString() : '0',
            unit: product.unit || 'Cái',
            minStockThreshold: product.minStockThreshold ? product.minStockThreshold.toString() : '5'
        });
        setModalVisible(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            barcode: '',
            price: '',
            priceIn: '',
            currentStock: '',
            unit: 'Cái',
            minStockThreshold: '5'
        });
        setModalVisible(true);
    };

    const handleDelete = (id) => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa sản phẩm này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await posService.deleteProduct(id);
                        fetchProducts();
                    } catch (e) {
                        Alert.alert('Lỗi', 'Không thể xóa sản phẩm: ' + e.message);
                    }
                }
            }
        ]);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên và giá bán');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                price: Number(formData.price),
                priceIn: Number(formData.priceIn) || 0,
                currentStock: Number(formData.currentStock) || 0,
                minStockThreshold: Number(formData.minStockThreshold) || 5
            };

            if (editingProduct) {
                await posService.updateProduct(editingProduct.id, payload);
            } else {
                await posService.createProduct(payload);
            }
            setModalVisible(false);
            fetchProducts(search);
        } catch (e) {
            Alert.alert('Lỗi', 'Lưu thất bại: ' + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatMoney = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardImageContainer}>
                <Feather name="package" size={24} color={COLORS.textSecondary} />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSku}>{item.barcode || '---'}</Text>
                <View style={styles.cardRow}>
                    <Text style={styles.cardPrice}>{formatMoney(item.price)}</Text>
                    <Text style={[styles.cardStock, item.currentStock <= (item.minStockThreshold || 5) && styles.lowStock]}>
                        Kho: {item.currentStock} {item.unit}
                    </Text>
                </View>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                    <Feather name="edit-3" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                    <Feather name="trash-2" size={18} color={COLORS.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm sản phẩm..."
                        value={search}
                        onChangeText={handleSearch}
                    />
                </View>
                {/* Scan Button */}
                <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
                    <Feather name="camera" size={22} color={COLORS.white} />
                </TouchableOpacity>
                {/* Add Button */}
                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                    <Feather name="plus" size={24} color={COLORS.white} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={() => fetchProducts(search)}
                    ListEmptyComponent={
                        <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.textSecondary }}>
                            Không tìm thấy sản phẩm
                        </Text>
                    }
                />
            )}

            {/* ====== BARCODE SCANNER MODAL ====== */}
            <Modal
                visible={scannerVisible}
                animationType="slide"
                onRequestClose={() => setScannerVisible(false)}
            >
                <View style={styles.scannerContainer}>
                    <CameraView
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                            barcodeTypes: [
                                'ean13',
                                'ean8',
                                'code128',
                                'code39',
                                'upc_a',
                                'upc_e',
                                'qr',
                            ],
                        }}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Overlay */}
                    <View style={styles.scannerOverlay}>
                        {/* Top bar */}
                        <View style={styles.scannerTopBar}>
                            <TouchableOpacity
                                style={styles.scannerCloseBtn}
                                onPress={() => setScannerVisible(false)}
                            >
                                <Feather name="x" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.scannerTitle}>Quét mã vạch</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        {/* Center frame */}
                        <View style={styles.scannerFrameContainer}>
                            <View style={styles.scannerFrame}>
                                {/* Corner decorations */}
                                <View style={[styles.corner, styles.cornerTL]} />
                                <View style={[styles.corner, styles.cornerTR]} />
                                <View style={[styles.corner, styles.cornerBL]} />
                                <View style={[styles.corner, styles.cornerBR]} />
                            </View>
                        </View>

                        {/* Bottom hint */}
                        <View style={styles.scannerBottom}>
                            <Text style={styles.scannerHint}>
                                Hướng camera vào mã vạch sản phẩm
                            </Text>
                            {scanned && (
                                <TouchableOpacity
                                    style={styles.rescanButton}
                                    onPress={() => setScanned(false)}
                                >
                                    <Feather name="refresh-cw" size={18} color="#FFF" />
                                    <Text style={styles.rescanText}>Quét lại</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ====== ADD/EDIT PRODUCT MODAL ====== */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                        </Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Feather name="x" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tên sản phẩm *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.name}
                                onChangeText={text => setFormData({ ...formData, name: text })}
                                placeholder="Nhập tên sản phẩm"
                            />
                            {isLookingUp && (
                                <View style={styles.lookupHint}>
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                    <Text style={styles.lookupText}>Đang tra cứu mã vạch...</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Mã vạch</Text>
                            <View style={styles.barcodeRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    value={formData.barcode}
                                    onChangeText={text => setFormData({ ...formData, barcode: text })}
                                    placeholder="Nhập mã hoặc quét"
                                />
                                <TouchableOpacity
                                    style={styles.scanInlineBtn}
                                    onPress={() => {
                                        setModalVisible(false);
                                        setTimeout(() => openScanner(), 300);
                                    }}
                                >
                                    <Feather name="camera" size={20} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Giá bán *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.price}
                                    onChangeText={text => setFormData({ ...formData, price: text })}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Giá vốn</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.priceIn}
                                    onChangeText={text => setFormData({ ...formData, priceIn: text })}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Tồn kho</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.currentStock}
                                    onChangeText={text => setFormData({ ...formData, currentStock: text })}
                                    keyboardType="numeric"
                                    placeholder="0"
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Đơn vị</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.unit}
                                    onChangeText={text => setFormData({ ...formData, unit: text })}
                                    placeholder="VD: Cái"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>LƯU</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        padding: 16,
        paddingTop: 60,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        gap: 10,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: COLORS.text,
    },
    scanButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 44,
        height: 44,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardImageContainer: {
        width: 50,
        height: 50,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    cardSku: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    cardStock: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    lowStock: {
        color: COLORS.danger,
        fontWeight: 'bold',
    },
    cardActions: {
        justifyContent: 'space-between',
        paddingLeft: 8,
    },
    actionButton: {
        padding: 4,
    },
    // ====== SCANNER STYLES ======
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    scannerTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scannerCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    scannerFrameContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerFrame: {
        width: 260,
        height: 160,
        borderRadius: 4,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#3B82F6',
    },
    cornerTL: {
        top: 0, left: 0,
        borderTopWidth: 3, borderLeftWidth: 3,
        borderTopLeftRadius: 8,
    },
    cornerTR: {
        top: 0, right: 0,
        borderTopWidth: 3, borderRightWidth: 3,
        borderTopRightRadius: 8,
    },
    cornerBL: {
        bottom: 0, left: 0,
        borderBottomWidth: 3, borderLeftWidth: 3,
        borderBottomLeftRadius: 8,
    },
    cornerBR: {
        bottom: 0, right: 0,
        borderBottomWidth: 3, borderRightWidth: 3,
        borderBottomRightRadius: 8,
    },
    scannerBottom: {
        alignItems: 'center',
        paddingBottom: 60,
        paddingTop: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    scannerHint: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
    },
    rescanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 16,
    },
    rescanText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    // ====== MODAL STYLES ======
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    modalContent: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    barcodeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    scanInlineBtn: {
        width: 48,
        height: 48,
        backgroundColor: '#F59E0B',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lookupHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    lookupText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    row: {
        flexDirection: 'row',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    submitButtonText: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
