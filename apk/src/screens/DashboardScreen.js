import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
    Platform,
    Alert,
    Image
} from 'react-native';
import { COLORS } from '../constants/colors';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { posService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const StatCard = React.memo(({ title, value, subtext, color, icon, iconLib: IconLib = MaterialIcons }) => (
    <View style={[styles.statCard]}>
        <View style={styles.statHeader}>
            <View style={[styles.iconBg, { backgroundColor: color + '15' }]}>
                <IconLib name={icon} size={20} color={color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={[styles.statValue]}>{value}</Text>
            </View>
        </View>
        {subtext && <Text style={styles.statSubtext}>{subtext}</Text>}
    </View>
));

const FilterButton = React.memo(({ label, active, onPress }) => (
    <TouchableOpacity
        style={[styles.filterBtn, active && styles.filterBtnActive]}
        onPress={onPress}
    >
        <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
));

export default function DashboardScreen({ navigation }) {
    const { userData, logout } = useContext(AuthContext);
    const [filter, setFilter] = useState('7days');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboard = async (currentFilter = filter) => {
        try {
            const res = await posService.getDashboard(currentFilter);
            if (res) setData(res);
        } catch (e) {
            console.error('Fetch dashboard error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [filter]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboard();
        }, [filter])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboard();
    }, [filter]);

    const formatMoney = (val) => {
        if (!val && val !== 0) return '0đ';
        return Number(val).toLocaleString('vi-VN') + 'đ';
    };

    const filterOptions = [
        { value: 'today', label: 'Hôm nay' },
        { value: 'yesterday', label: 'Hôm qua' },
        { value: '7days', label: '7 ngày qua' },
        { value: 'thisMonth', label: 'Tháng này' },
    ];

    if (loading && !data) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải thống kê...</Text>
            </View>
        );
    }

    const safeData = data || {
        overview: { revenue: 0, totalOrders: 0, profit: 0, debtAdded: 0 },
        chart: [],
        topProducts: [],
        lowStockCount: 0
    };

    const { overview, chart, lowStockCount, topProducts } = safeData;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.userName} numberOfLines={1}>{userData?.fullName || userData?.storeName || 'Chủ shop'}</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.notifBtn}
                        onPress={() => Alert.alert('Thông báo', 'Bạn chưa có thông báo mới.')}
                    >
                        <Feather name="bell" size={22} color={COLORS.text} />
                        <View style={styles.notifBadge} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Settings')}>
                        <Text style={styles.avatarText}>
                            {(userData?.fullName || 'A').substring(0, 1).toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {filterOptions.map(opt => (
                        <FilterButton
                            key={opt.value}
                            label={opt.label}
                            active={filter === opt.value}
                            onPress={() => setFilter(opt.value)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <StatCard
                            title="Doanh thu"
                            value={formatMoney(overview.revenue)}
                            color="#3B82F6"
                            icon="payments"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <StatCard
                            title="Đơn hàng"
                            value={overview.totalOrders}
                            color="#6366F1"
                            icon="shopping-bag"
                            iconLib={Feather}
                        />
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                        <StatCard
                            title="Lợi nhuận"
                            value={formatMoney(overview.profit)}
                            color="#10B981"
                            icon="trending-up"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <StatCard
                            title="Nợ mới"
                            value={formatMoney(overview.debtAdded)}
                            color="#F59E0B"
                            icon="book"
                        />
                    </View>
                </View>
            </View>

            {/* Chart Area (Simplified) */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Biểu đồ doanh thu</Text>
                {chart && chart.length > 0 ? (
                    <View style={styles.chartContainer}>
                        {chart.map((d, i) => {
                            const max = Math.max(...chart.map(c => Number(c.revenue))) || 1;
                            const h = (Number(d.revenue) / max) * 100;
                            return (
                                <View key={i} style={styles.chartColumn}>
                                    <View style={[styles.chartBar, { height: `${Math.max(h, 5)}%` }]} />
                                    <Text style={styles.chartDate}>{d.date.split('/')[0]}</Text>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <Feather name="bar-chart-2" size={40} color="#E2E8F0" />
                        <Text style={styles.emptyText}>Chưa có dữ liệu biểu đồ</Text>
                    </View>
                )}
            </View>

            {/* Top Products */}
            <View style={styles.card}>
                <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 16 }]}>
                    <Text style={styles.cardTitle}>Top bán chạy</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                        <Text style={styles.seeAll}>Tất cả</Text>
                    </TouchableOpacity>
                </View>
                {topProducts && topProducts.length > 0 ? (
                    topProducts.slice(0, 5).map((p, i) => {
                        const maxQty = Math.max(...topProducts.map(tp => tp.quantity)) || 1;
                        const barWidth = (p.quantity / maxQty) * 100;
                        return (
                            <View key={i} style={styles.productRow}>
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                                    <Text style={styles.productQty}>{p.quantity} {p.unit}</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${barWidth}%` }]} />
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.emptyText}>Chưa có dữ liệu bán hàng</Text>
                )}
            </View>

            {/* Warehouse Alert */}
            <View style={[styles.card, lowStockCount > 0 && styles.alertCard]}>
                <View style={styles.row}>
                    <View style={[styles.iconBg, { backgroundColor: lowStockCount > 0 ? '#FEF2F2' : '#F0FDF4' }]}>
                        <Feather name={lowStockCount > 0 ? 'alert-triangle' : 'check-circle'} size={20} color={lowStockCount > 0 ? '#EF4444' : '#10B981'} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cardTitle}>Kho hàng</Text>
                        <Text style={styles.cardSub}>
                            {lowStockCount > 0
                                ? `Cần nhập thêm ${lowStockCount} sản phẩm`
                                : 'Tất cả sản phẩm đều đủ tồn kho'}
                        </Text>
                    </View>
                    {lowStockCount > 0 && (
                        <TouchableOpacity style={styles.alertBtn} onPress={() => navigation.navigate('Products')}>
                            <Text style={styles.alertBtnText}>Xem</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 12,
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    userName: {
        fontSize: 22,
        fontWeight: '900',
        color: COLORS.text,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#DBEAFE',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notifBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        position: 'relative',
    },
    notifBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    avatarText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 18,
    },
    filterContainer: {
        marginBottom: 20,
    },
    filterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    filterBtnActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterBtnText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    filterBtnTextActive: {
        color: '#FFF',
    },
    statsGrid: {
        marginBottom: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        paddingBottom: 20,
        backgroundColor: '#FFF',
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statTitle: {
        fontSize: 11,
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 2,
    },
    statSubtext: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 8,
    },
    card: {
        backgroundColor: '#FFF',
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    cardSub: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    seeAll: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '700',
    },
    chartContainer: {
        height: 120,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    chartColumn: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    chartBar: {
        width: '60%',
        maxWidth: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    chartDate: {
        position: 'absolute',
        bottom: -20,
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
    },
    emptyChart: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    emptyText: {
        fontSize: 13,
        color: '#CBD5E1',
        marginTop: 8,
    },
    productRow: {
        marginBottom: 16,
    },
    productInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        flex: 1,
    },
    productQty: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    alertCard: {
        borderColor: '#FECACA',
    },
    alertBtn: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    alertBtnText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '800',
    },
    supportItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 12,
    },
    supportText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
});
