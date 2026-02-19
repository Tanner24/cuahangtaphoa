import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Platform,
    Modal,
    TextInput,
    ActivityIndicator,
    Switch,
    FlatList,
    KeyboardAvoidingView,
    Linking
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Feather, MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { posService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MenuItem = React.memo(({ icon: Icon, name, label, onPress, color = '#475569', iconBg = '#F1F5F9', iconLib: IconLib = Feather, subtitle }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
            <IconLib name={name} size={18} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.menuLabel}>{label}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        <Feather name="chevron-right" size={18} color="#CBD5E1" />
    </TouchableOpacity>
));

export default function SettingsScreen({ navigation }) {
    const { logout, userData } = useContext(AuthContext);

    // Modals
    const [showStoreModal, setShowStoreModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);

    // Store Info State
    const [storeInfo, setStoreInfo] = useState({
        name: '',
        address: '',
        phone: '',
        bankName: '',
        bankAccountName: '',
        bankAccountNumber: '',
        taxCode: '',
        footerText: ''
    });
    const [loadingStore, setLoadingStore] = useState(false);

    // Revenue Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear());

    // Staff State
    const [staffList, setStaffList] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [staffForm, setStaffForm] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'staff',
        isActive: true
    });

    // Printer State
    const [printerConfig, setPrinterConfig] = useState({
        paperSize: '80mm',
        autoPrint: true,
        showLogo: true,
    });

    useEffect(() => {
        loadPrinterConfig();
    }, []);

    const loadPrinterConfig = async () => {
        try {
            const saved = await AsyncStorage.getItem('printerConfig');
            if (saved) setPrinterConfig(JSON.parse(saved));
        } catch (e) { console.error(e); }
    };

    const savePrinterConfig = async (newConfig) => {
        try {
            await AsyncStorage.setItem('printerConfig', JSON.stringify(newConfig));
            setPrinterConfig(newConfig);
            Alert.alert('Thành công', 'Đã lưu cấu hình máy in');
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể lưu cấu hình');
        }
    };

    const formatMoney = (val) => {
        return Number(val || 0).toLocaleString('vi-VN') + 'đ';
    };

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi ứng dụng?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Đăng xuất', style: 'destructive', onPress: logout }
        ]);
    };

    const fetchStore = async () => {
        setShowStoreModal(true);
        setLoadingStore(true);
        try {
            const res = await posService.getStore();
            setStoreInfo(res.data || res);
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể tải thông tin cửa hàng');
        } finally {
            setLoadingStore(false);
        }
    };

    const handleUpdateStore = async () => {
        setLoadingStore(true);
        try {
            await posService.updateStore(storeInfo);
            Alert.alert('Thành công', 'Đã cập nhật thông tin cửa hàng');
            setShowStoreModal(false);
        } catch (e) {
            Alert.alert('Lỗi', e.message);
        } finally {
            setLoadingStore(false);
        }
    };

    const fetchStaff = async () => {
        setShowStaffModal(true);
        setLoadingStaff(true);
        try {
            const res = await posService.getUsers();
            setStaffList(res.data || res);
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể lấy danh sách nhân viên');
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleStaffSubmit = async () => {
        if (!staffForm.username || (!editingStaff && !staffForm.password) || !staffForm.fullName) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        setLoadingStaff(true);
        try {
            if (editingStaff) {
                await posService.updateStoreUser(editingStaff.id, staffForm);
                Alert.alert('Thành công', 'Đã cập nhật nhân viên');
            } else {
                await posService.createStoreUser(staffForm);
                Alert.alert('Thành công', 'Đã thêm nhân viên');
            }
            setShowAddStaffModal(false);
            fetchStaff();
        } catch (e) {
            Alert.alert('Lỗi', e.message);
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleDeleteStaff = (id) => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa nhân viên này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa', style: 'destructive', onPress: async () => {
                    try {
                        await posService.deleteStoreUser(id);
                        fetchStaff();
                    } catch (e) { Alert.alert('Lỗi', e.message); }
                }
            }
        ]);
    };

    const fetchReport = async () => {
        setShowReportModal(true);
        setLoadingReport(true);
        try {
            const res = await posService.getReport({
                month: reportMonth,
                year: reportYear,
                type: 'accounting',
                book: 's1'
            });
            setReportData(res.data || res);
        } catch (e) {
            Alert.alert('Lỗi', 'Không thể tải báo cáo doanh thu');
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (showReportModal) {
            fetchReport();
        }
    }, [reportMonth, reportYear]);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header / Profile Area */}
            <View style={styles.topHeader}>
                <Text style={styles.topTitle}>Menu & Cài đặt</Text>
                <View style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {(userData?.fullName || 'S').substring(0, 1).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{userData?.fullName || 'Chủ cửa hàng'}</Text>
                            <Text style={styles.profileStore}>{userData?.storeName || 'EPOS PRO User'}</Text>
                        </View>
                        <TouchableOpacity style={styles.editBtn} onPress={fetchStore}>
                            <Feather name="edit-2" size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.roleBadge}>
                        <Feather name="shield" size={12} color={COLORS.primary} />
                        <Text style={styles.roleText}>TÀI KHOẢN {userData?.role?.toUpperCase() || 'CHỦ SHOP'}</Text>
                    </View>
                </View>
            </View>

            {/* Shop Management */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quản lý cửa hàng</Text>
                <View style={styles.menuGroup}>
                    {userData?.role !== 'staff' && (
                        <MenuItem
                            iconLib={Feather}
                            name="users"
                            label="Nhân viên & Phân quyền"
                            onPress={fetchStaff}
                            color="#F59E0B"
                            iconBg="#FFF7ED"
                        />
                    )}
                    {userData?.role !== 'staff' && (
                        <MenuItem
                            iconLib={Ionicons}
                            name="bar-chart-outline"
                            label="Báo cáo doanh thu"
                            onPress={fetchReport}
                            color="#10B981"
                            iconBg="#ECFDF4"
                        />
                    )}
                </View>
            </View>

            {/* System Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cấu hình hệ thống</Text>
                <View style={styles.menuGroup}>
                    <MenuItem
                        iconLib={Ionicons}
                        name="settings-outline"
                        label="Cài đặt cửa hàng"
                        subtitle="Tên shop, địa chỉ, VietQR..."
                        onPress={fetchStore}
                        color="#64748B"
                        iconBg="#F1F5F9"
                    />
                    <MenuItem
                        iconLib={MaterialCommunityIcons}
                        name="printer"
                        label="Máy in POS"
                        subtitle="Khổ giấy, tự động in..."
                        onPress={() => setShowPrinterModal(true)}
                        color="#64748B"
                        iconBg="#F1F5F9"
                    />
                    <MenuItem
                        iconLib={MaterialIcons}
                        name="support-agent"
                        label="Hỗ trợ kỹ thuật"
                        subtitle="Hotline & Zalo trợ giúp 24/7"
                        onPress={() => setShowSupportModal(true)}
                        color="#64748B"
                        iconBg="#F1F5F9"
                    />
                    <MenuItem
                        iconLib={Feather}
                        name="message-circle"
                        label="Góp ý ứng dụng"
                        subtitle="Gửi phản hồi cho chúng tôi"
                        onPress={() => Linking.openURL('https://zalo.me/0975421439')}
                        color="#64748B"
                        iconBg="#F1F5F9"
                    />
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Feather name="log-out" size={18} color="#EF4444" />
                <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>EPOS PRO © 2026</Text>
                <Text style={styles.footerAgency}>Developed by Tien Hai Agency</Text>
            </View>
            <View style={{ height: 40 }} />

            {/* ====== STORE MODAL ====== */}
            <Modal visible={showStoreModal} animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Thông tin cửa hàng</Text>
                            <TouchableOpacity onPress={() => setShowStoreModal(false)}>
                                <Feather name="x" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                            {loadingStore ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text style={{ marginTop: 12, color: '#94A3B8' }}>Đang tải...</Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.inputLabel}>Tên cửa hàng</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={storeInfo.name}
                                            onChangeText={t => setStoreInfo({ ...storeInfo, name: t })}
                                            placeholder="Ví dụ: Tạp hóa EPOS"
                                        />
                                    </View>

                                    <View style={styles.formRow}>
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.inputLabel}>Điện thoại</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={storeInfo.phone}
                                                onChangeText={t => setStoreInfo({ ...storeInfo, phone: t })}
                                                keyboardType="phone-pad"
                                            />
                                        </View>
                                        <View style={[styles.formGroup, { flex: 1 }]}>
                                            <Text style={styles.inputLabel}>Mã số thuế</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={storeInfo.taxCode}
                                                onChangeText={t => setStoreInfo({ ...storeInfo, taxCode: t })}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.inputLabel}>Địa chỉ</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={storeInfo.address}
                                            onChangeText={t => setStoreInfo({ ...storeInfo, address: t })}
                                            multiline
                                        />
                                    </View>

                                    <Text style={styles.modalSubTitle}>Cấu hình VietQR</Text>

                                    <View style={styles.formGroup}>
                                        <Text style={styles.inputLabel}>Tên ngân hàng (Short name)</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            value={storeInfo.bankName}
                                            onChangeText={t => setStoreInfo({ ...storeInfo, bankName: t })}
                                            placeholder="Ví dụ: MB, TCB, VCB..."
                                        />
                                    </View>

                                    <View style={styles.formRow}>
                                        <View style={[styles.formGroup, { flex: 3 }]}>
                                            <Text style={styles.inputLabel}>Số tài khoản</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={storeInfo.bankAccountNumber}
                                                onChangeText={t => setStoreInfo({ ...storeInfo, bankAccountNumber: t })}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={[styles.formGroup, { flex: 2 }]}>
                                            <Text style={styles.inputLabel}>Chủ TK</Text>
                                            <TextInput
                                                style={[styles.modalInput, { textTransform: 'uppercase' }]}
                                                value={storeInfo.bankAccountName}
                                                onChangeText={t => setStoreInfo({ ...storeInfo, bankAccountName: t })}
                                            />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.saveBtn}
                                        onPress={handleUpdateStore}
                                        disabled={loadingStore}
                                    >
                                        <Text style={styles.saveBtnText}>LƯU THAY ĐỔI</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ====== STAFF MODAL ====== */}
            <Modal visible={showStaffModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nhân viên & Phân quyền</Text>
                        <TouchableOpacity onPress={() => setShowStaffModal(false)}>
                            <Feather name="x" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.staffHeader}>
                        <Text style={styles.staffCount}>Tổng cộng {staffList.length} nhân viên</Text>
                        <TouchableOpacity
                            style={styles.addStaffBtn}
                            onPress={() => {
                                setEditingStaff(null);
                                setStaffForm({ username: '', password: '', fullName: '', role: 'staff', isActive: true });
                                setShowAddStaffModal(true);
                            }}
                        >
                            <Feather name="plus" size={16} color="#FFF" />
                            <Text style={styles.addStaffText}>Tạo mới</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={staffList}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.staffCard}>
                                <View style={styles.staffAvatar}>
                                    <Text style={styles.staffAvatarText}>{item.fullName?.substring(0, 1).toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.staffName}>{item.fullName}</Text>
                                    <Text style={styles.staffUsername}>@{item.username}</Text>
                                    <View style={styles.staffInfoRow}>
                                        <View style={[styles.roleLabel, { backgroundColor: item.role === 'owner' ? '#F3E8FF' : '#E0F2FE' }]}>
                                            <Text style={[styles.roleLabelText, { color: item.role === 'owner' ? '#9333EA' : '#0284C7' }]}>
                                                {item.role === 'owner' ? 'Chủ quán' : 'Nhân viên'}
                                            </Text>
                                        </View>
                                        {!item.isActive && <Text style={styles.lockedText}>Đã khóa</Text>}
                                    </View>
                                </View>
                                <View style={styles.staffActions}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setEditingStaff(item);
                                            setStaffForm({
                                                username: item.username,
                                                password: '',
                                                fullName: item.fullName,
                                                role: item.role,
                                                isActive: item.isActive
                                            });
                                            setShowAddStaffModal(true);
                                        }}
                                        style={styles.actionBtn}
                                    >
                                        <Feather name="edit" size={18} color="#3B82F6" />
                                    </TouchableOpacity>
                                    {item.role !== 'owner' && (
                                        <TouchableOpacity onPress={() => handleDeleteStaff(item.id)} style={styles.actionBtn}>
                                            <Feather name="trash-2" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        )}
                    />
                </View>

                {/* Sub-Modal for Add/Edit Staff */}
                <Modal visible={showAddStaffModal} transparent animationType="fade">
                    <View style={styles.overlay}>
                        <View style={styles.staffFormCard}>
                            <Text style={styles.modalSubTitle}>{editingStaff ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Họ và tên</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={staffForm.fullName}
                                    onChangeText={t => setStaffForm({ ...staffForm, fullName: t })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Username</Text>
                                <TextInput
                                    style={[styles.modalInput, editingStaff && { opacity: 0.6 }]}
                                    value={staffForm.username}
                                    onChangeText={t => setStaffForm({ ...staffForm, username: t })}
                                    editable={!editingStaff}
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Mật khẩu {editingStaff && '(Để trống nếu không đổi)'}</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={staffForm.password}
                                    onChangeText={t => setStaffForm({ ...staffForm, password: t })}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={styles.inputLabel}>Trạng thái hoạt động</Text>
                                <Switch
                                    value={staffForm.isActive}
                                    onValueChange={v => setStaffForm({ ...staffForm, isActive: v })}
                                    trackColor={{ true: '#10B981' }}
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddStaffModal(false)}>
                                    <Text style={styles.cancelBtnText}>HỦY</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.submitBtn} onPress={handleStaffSubmit}>
                                    <Text style={styles.submitBtnText}>XÁC NHẬN</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </Modal>

            {/* ====== PRINTER MODAL ====== */}
            <Modal visible={showPrinterModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Cài đặt máy in</Text>
                        <TouchableOpacity onPress={() => setShowPrinterModal(false)}>
                            <Feather name="x" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.configCard}>
                            <Text style={styles.inputLabel}>Khổ giấy hóa đơn</Text>
                            <View style={styles.paperGroup}>
                                <TouchableOpacity
                                    style={[styles.paperBtn, printerConfig.paperSize === '80mm' && styles.paperBtnActive]}
                                    onPress={() => setPrinterConfig({ ...printerConfig, paperSize: '80mm' })}
                                >
                                    <Text style={[styles.paperBtnText, printerConfig.paperSize === '80mm' && styles.paperBtnTextActive]}>K80 (80mm)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.paperBtn, printerConfig.paperSize === '58mm' && styles.paperBtnActive]}
                                    onPress={() => setPrinterConfig({ ...printerConfig, paperSize: '58mm' })}
                                >
                                    <Text style={[styles.paperBtnText, printerConfig.paperSize === '58mm' && styles.paperBtnTextActive]}>K58 (58mm)</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchLabel}>Tự động in đơn hàng</Text>
                                    <Text style={styles.switchSub}>Sau khi bấm xác nhận thanh toán</Text>
                                </View>
                                <Switch
                                    value={printerConfig.autoPrint}
                                    onValueChange={v => setPrinterConfig({ ...printerConfig, autoPrint: v })}
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchLabel}>Hiển thị Logo shop</Text>
                                    <Text style={styles.switchSub}>Hiện logo trên đầu hóa đơn</Text>
                                </View>
                                <Switch
                                    value={printerConfig.showLogo}
                                    onValueChange={v => setPrinterConfig({ ...printerConfig, showLogo: v })}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={() => savePrinterConfig(printerConfig)}
                            >
                                <Text style={styles.saveBtnText}>LƯU CẤU HÌNH</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12 }]}
                                onPress={() => Alert.alert('In thử', 'Tính năng in Bluetooth đòi hỏi kết nối phần cứng.')}
                            >
                                <Text style={[styles.saveBtnText, { color: '#64748B' }]}>IN THỬ HÓA ĐƠN</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* ====== REVENUE REPORT MODAL ====== */}
            <Modal visible={showReportModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Báo cáo doanh thu</Text>
                            <Text style={styles.modalSub}>T{reportMonth}/{reportYear}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowReportModal(false)}>
                            <Feather name="x" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.reportFilters}>
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Tháng</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <TouchableOpacity
                                        key={m}
                                        style={[styles.miniBtn, reportMonth === m && styles.miniBtnActive]}
                                        onPress={() => setReportMonth(m)}
                                    >
                                        <Text style={[styles.miniBtnText, reportMonth === m && styles.miniBtnTextActive]}>T{m}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    {loadingReport ? (
                        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>
                    ) : (
                        <ScrollView style={{ flex: 1 }}>
                            {/* Summary Cards */}
                            <View style={styles.reportSummaryRow}>
                                <View style={[styles.reportCard, { backgroundColor: '#3B82F6' }]}>
                                    <View style={styles.reportIconCircle}>
                                        <Feather name="trending-up" size={16} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.reportCardVal}>
                                        {formatMoney(reportData?.summary?.total_revenue || 0)}
                                    </Text>
                                    <Text style={styles.reportCardLabel}>Doanh thu tháng</Text>
                                </View>
                                <View style={[styles.reportCard, { backgroundColor: '#1E293B' }]}>
                                    <View style={styles.reportIconCircle}>
                                        <Feather name="pie-chart" size={16} color="#1E293B" />
                                    </View>
                                    <Text style={styles.reportCardVal}>
                                        {formatMoney(reportData?.summary?.accumulated_revenue || 0)}
                                    </Text>
                                    <Text style={styles.reportCardLabel}>Lũy kế năm</Text>
                                </View>
                            </View>

                            {/* Detailed Table */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Chi tiết hóa đơn</Text>
                                <View style={styles.reportTable}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Ngày</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Số HĐ</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Doanh thu</Text>
                                    </View>
                                    {reportData?.bookData?.length > 0 ? reportData.bookData.map((row, i) => (
                                        <View key={i} style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { flex: 1 }]}>{row.date}</Text>
                                            <Text style={[styles.tableCell, { flex: 1, fontWeight: '700' }]}>#{row.id}</Text>
                                            <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: '#10B981', fontWeight: '800' }]}>
                                                {formatMoney(row.revenue - (row.returnAmount || 0))}
                                            </Text>
                                        </View>
                                    )) : (
                                        <View style={{ padding: 40, alignItems: 'center' }}>
                                            <Text style={{ color: '#94A3B8' }}>Không có dữ liệu</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    )}
                </View>
            </Modal>

            {/* ====== SUPPORT MODAL ====== */}
            <Modal visible={showSupportModal} animationType="fade" transparent>
                <View style={[styles.overlay, { justifyContent: 'center', alignItems: 'center' }]}>
                    <View style={styles.supportModalCard}>
                        <View style={styles.supportHeader}>
                            <View style={styles.supportIconBg}>
                                <MaterialCommunityIcons name="face-agent" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.supportTitle}>Hỗ Trợ & Liên Hệ</Text>
                            <TouchableOpacity onPress={() => setShowSupportModal(false)} style={{ marginLeft: 'auto' }}>
                                <Feather name="x" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.hotlineCard}
                            onPress={() => Linking.openURL('tel:0975421439')}
                        >
                            <View style={styles.hotlineLabelRow}>
                                <Feather name="phone" size={14} color="#3B82F6" />
                                <Text style={styles.hotlineLabel}>TỔNG ĐÀI HỖ TRỢ</Text>
                            </View>
                            <Text style={styles.hotlineValue}>0975.421.439</Text>
                        </TouchableOpacity>

                        <View style={styles.supportGrid}>
                            <TouchableOpacity
                                style={styles.gridItem}
                                onPress={() => Linking.openURL('https://zalo.me/09754214439')}
                            >
                                <View style={[styles.gridIcon, { backgroundColor: '#3B82F6' }]}>
                                    <MaterialCommunityIcons name="message-text" size={24} color="#FFF" />
                                </View>
                                <Text style={styles.gridText}>Zalo OA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.gridItem}>
                                <View style={[styles.gridIcon, { backgroundColor: '#10B981' }]}>
                                    <Feather name="help-circle" size={24} color="#FFF" />
                                </View>
                                <Text style={styles.gridText}>Hướng dẫn</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.ticketBtn}
                            onPress={() => {
                                setShowSupportModal(false);
                                Alert.alert('Thông báo', 'Tính năng gửi ticket đang được đồng bộ.');
                            }}
                        >
                            <Text style={styles.ticketBtnText}>Gửi yêu cầu hỗ trợ ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topHeader: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    topTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 20,
    },
    profileCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    profileStore: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: 1,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuGroup: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#334155',
    },
    menuSubtitle: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        marginHorizontal: 20,
        marginTop: 32,
        padding: 16,
        borderRadius: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#EF4444',
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#CBD5E1',
    },
    footerAgency: {
        fontSize: 10,
        color: '#E2E8F0',
        marginTop: 4,
        fontWeight: '600',
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    formRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 8,
        marginLeft: 4,
    },
    modalInput: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 15,
        color: '#1E293B',
    },
    modalSubTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 10,
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 10,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
    },

    // Staff Styles
    staffHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    staffCount: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    addStaffBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
    },
    addStaffText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '800',
    },
    staffCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    staffAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    staffAvatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#3B82F6',
    },
    staffName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    staffUsername: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 1,
    },
    staffInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    roleLabel: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    roleLabelText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    lockedText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EF4444',
    },
    staffActions: {
        flexDirection: 'row',
        gap: 4,
    },
    actionBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    staffFormCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 4,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        fontWeight: '800',
        color: '#64748B',
    },
    submitBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    submitBtnText: {
        fontWeight: '800',
        color: '#FFF',
    },

    // Printer Config
    configCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    paperGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        marginBottom: 10,
    },
    paperBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    paperBtnActive: {
        backgroundColor: '#1E293B',
        borderColor: '#1E293B',
    },
    paperBtnText: {
        fontWeight: '700',
        color: '#64748B',
    },
    paperBtnTextActive: {
        color: '#FFF',
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    switchSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },

    // Report Styles
    reportFilters: {
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    filterGroup: {
        marginBottom: 8,
    },
    filterLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    miniBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        minWidth: 50,
        alignItems: 'center',
    },
    miniBtnActive: {
        backgroundColor: '#3B82F6',
    },
    miniBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
    },
    miniBtnTextActive: {
        color: '#FFF',
    },
    reportSummaryRow: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    reportCard: {
        flex: 1,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    reportIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    reportCardVal: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
    },
    reportCardLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    reportTable: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tableHeaderText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 13,
        color: '#1E293B',
    },

    // Support Modal Styles
    supportModalCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    supportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    supportIconBg: {
        width: 36,
        height: 36,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    supportTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    hotlineCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 16,
    },
    hotlineLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    hotlineLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    hotlineValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 4,
    },
    supportGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    gridItem: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    gridIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    gridText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
    },
    ticketBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    ticketBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
});
