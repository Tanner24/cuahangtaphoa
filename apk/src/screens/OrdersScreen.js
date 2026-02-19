import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    Modal,
    ScrollView,
    Dimensions,
    TextInput,
    Alert,
    Image
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { posService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, CameraView } from 'expo-camera';
import { Vibration } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const StatusBadge = ({ type }) => {
    let bg = '#ECFDF5';
    let color = '#10B981';
    let label = 'Tiền mặt';

    if (type === 'DEBT') {
        bg = '#FFF7ED';
        color = '#F59E0B';
        label = 'Ghi nợ';
    } else if (type === 'BANK_TRANSFER') {
        bg = '#EFF6FF';
        color = '#3B82F6';
        label = 'Chuyển khoản';
    }

    return (
        <View style={[styles.badge, { backgroundColor: bg }]}>
            <Text style={[styles.badgeText, { color }]}>{label.toUpperCase()}</Text>
        </View>
    );
};

export default function OrdersScreen() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isReturning, setIsReturning] = useState(false);
    // Scanner
    const [scannerVisible, setScannerVisible] = useState(false);
    const [scanned, setScanned] = useState(false);

    const fetchOrders = async (query = '') => {
        try {
            const res = await posService.getOrders({
                limit: 50,
                search: query
            });
            setOrders(res.data || []);
        } catch (e) {
            console.error('Fetch orders error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(searchQuery);
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        fetchOrders(text);
    };

    const openScanner = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status === 'granted') {
            setScanned(false);
            setScannerVisible(true);
        } else {
            Alert.alert('Quyền truy cập', 'Cần quyền camera để quét mã hóa đơn');
        }
    };

    const handleBarCodeScanned = ({ data }) => {
        setScanned(true);
        setScannerVisible(false);
        Vibration.vibrate();
        handleSearch(data);
    };

    const handleReturnOrder = () => {
        if (!selectedOrder) return;

        Alert.alert(
            'Xác nhận trả hàng',
            `Bạn có chắc muốn thực hiện trả hàng cho hóa đơn ${selectedOrder.code || `#${selectedOrder.id}`}? Hành động này sẽ xóa hóa đơn khỏi hệ thống.`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận trả',
                    style: 'destructive',
                    onPress: async () => {
                        setIsReturning(true);
                        try {
                            await posService.deleteOrder(selectedOrder.id);
                            setModalVisible(false);
                            Alert.alert('Thành công', 'Đã thực hiện trả hàng và cập nhật lại kho.');
                            fetchOrders(searchQuery);
                        } catch (e) {
                            Alert.alert('Lỗi', e.message || 'Không thể thực hiện trả hàng');
                        } finally {
                            setIsReturning(false);
                        }
                    }
                }
            ]
        );
    };

    const formatMoney = (val) => {
        return Number(val).toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    };

    const openDetails = (order) => {
        setSelectedOrder(order);
        setModalVisible(true);
    };

    const renderOrderItem = ({ item }) => (
        <TouchableOpacity style={styles.orderCard} onPress={() => openDetails(item)}>
            <View style={styles.cardHeader}>
                <View style={styles.codeWrap}>
                    <Text style={styles.orderCode}>{item.code || `#${item.id}`}</Text>
                </View>
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.cardContent}>
                <View style={styles.customerInfo}>
                    <View style={styles.userIconBg}>
                        <Feather name="user" size={14} color="#64748B" />
                    </View>
                    <Text style={styles.customerName}>{item.customer?.name || 'Khách lẻ'}</Text>
                </View>
                <StatusBadge type={item.paymentMethod} />
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.totalLabel}>Tổng cộng:</Text>
                <Text style={styles.totalValue}>{formatMoney(item.totalAmount)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerIcon}>
                        <Feather name="file-text" size={24} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Lịch sử hóa đơn</Text>
                        <Text style={styles.headerSub}>Quản lý các giao dịch đã thực hiện</Text>
                    </View>
                </View>

                <View style={styles.searchRow}>
                    <View style={styles.searchContainer}>
                        <Feather name="search" size={18} color="#94A3B8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm hóa đơn hoặc khách..."
                            value={searchQuery}
                            onChangeText={handleSearch}
                            placeholderTextColor="#94A3B8"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => handleSearch('')}>
                                <Feather name="x-circle" size={18} color="#CBD5E1" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
                        <MaterialIcons name="qr-code-scanner" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Feather name="database" size={48} color="#E2E8F0" />
                            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
                        </View>
                    }
                />
            )}

            {/* Order Detail Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Chi tiết hóa đơn</Text>
                                <Text style={styles.modalCode}>{selectedOrder?.code}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Feather name="x" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoCol}>
                                    <Text style={styles.infoLabel}>THỜI GIAN</Text>
                                    <Text style={styles.infoValue}>{selectedOrder ? formatDate(selectedOrder.createdAt) : ''}</Text>
                                </View>
                                <View style={styles.infoCol}>
                                    <Text style={styles.infoLabel}>THANH TOÁN</Text>
                                    {selectedOrder && <StatusBadge type={selectedOrder.paymentMethod} />}
                                </View>
                            </View>

                            <View style={styles.customerBox}>
                                <Text style={styles.infoLabel}>KHÁCH HÀNG</Text>
                                <View style={[styles.row, { justifyContent: 'space-between', marginTop: 4 }]}>
                                    <Text style={styles.infoValueBold}>{selectedOrder?.customer?.name || 'Khách lẻ'}</Text>
                                    <Text style={styles.infoLabel}>{selectedOrder?.customer?.phone || ''}</Text>
                                </View>
                            </View>

                            <Text style={[styles.infoLabel, { marginBottom: 12 }]}>DANH SÁCH SẢN PHẨM</Text>
                            {selectedOrder?.items?.map((item, idx) => (
                                <View key={idx} style={styles.itemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{item.product?.name || 'Sản phẩm đã xóa'}</Text>
                                        <Text style={styles.itemSub}>{item.quantity} x {formatMoney(item.price)}</Text>
                                    </View>
                                    <Text style={styles.itemTotal}>{formatMoney(item.price * item.quantity)}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <View>
                                <Text style={styles.footerLabel}>TỔNG CỘNG</Text>
                                <Text style={styles.footerValue}>{selectedOrder ? formatMoney(selectedOrder.totalAmount) : ''}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.returnBtn, isReturning && { opacity: 0.7 }]}
                                onPress={handleReturnOrder}
                                disabled={isReturning}
                            >
                                {isReturning ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <MaterialIcons name="assignment-return" size={18} color="#FFF" />
                                        <Text style={styles.returnBtnText}>TRẢ HÀNG</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                            <Text style={styles.scannerTitle}>Quét mã hóa đơn</Text>
                            <View style={{ width: 40 }} />
                        </View>
                        <View style={styles.scannerFrameWrap}>
                            <View style={styles.scannerFrame}>
                                <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderColor: COLORS.primary }]} />
                                <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderColor: COLORS.primary }]} />
                                <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: COLORS.primary }]} />
                                <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderColor: COLORS.primary }]} />
                            </View>
                        </View>
                        <View style={styles.scannerBottomBar}>
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Hãy đưa mã barcode hóa đơn vào khung quét</Text>
                        </View>
                    </View>
                </View>
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
        paddingTop: 60,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 10,
    },
    scanBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '500',
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    headerSub: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    codeWrap: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    orderCode: {
        fontSize: 13,
        fontWeight: '800',
        color: '#475569',
    },
    orderDate: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    userIconBg: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    totalLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    emptyWrap: {
        marginTop: 60,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        color: '#CBD5E1',
        fontWeight: '600',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SCREEN_HEIGHT * 0.85,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        textTransform: 'uppercase',
    },
    modalCode: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalScroll: {
        padding: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 24,
    },
    infoCol: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    infoValueBold: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    customerBox: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    itemSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    modalFooter: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#0F172A',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLabel: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    footerValue: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '900',
    },
    returnBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    returnBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '800',
    },
    // Scanner Styles
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
    scannerFrame: { width: 280, height: 180 },
    corner: { position: 'absolute', width: 30, height: 30, borderRadius: 4 },
    scannerBottomBar: {
        alignItems: 'center', paddingBottom: 60, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    },
});
