import { useState, useEffect } from 'react';
import { posService } from '../services/api';

/**
 * Hook for Resource Quota and Feature Flag enforcement
 */
export const useQuota = () => {
    const [storeInfo, setStoreInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuota = async () => {
            try {
                const res = await posService.getStore();
                setStoreInfo(res);
            } catch (err) {
                console.error('Failed to fetch quota info', err);
            } finally {
                setLoading(false);
            }
        };
        fetchQuota();
    }, []);

    const plan = storeInfo?.subscriptionPlan || { name: 'Free', maxProducts: 100, maxUsers: 2, features: [] };
    const tier = plan.name.toLowerCase();
    const usage = storeInfo?.usage || { products: 0, invoices: 0, users: 0 };
    const planFeatures = Array.isArray(plan.features) ? plan.features : [];

    // 1. Feature Flags
    const hasFeature = (featureName) => {
        if (featureName === 'pro_feature') {
            return tier !== 'free' && tier !== 'dùng thử';
        }

        const featuresLiteral = planFeatures.map(f => f.toLowerCase());
        const mappings = {
            'reports': ['báo cáo', 'chuyên sâu', 'doanh thu'],
            'inventory_advanced': ['tất cả tính năng', 'quản lý kho', 'danh mục'],
            'refunds': ['trả hàng', 'hoàn tiền'],
            'logs': ['nhật ký', 'toàn bộ hệ thống']
        };

        const checks = mappings[featureName] || [featureName];
        return featuresLiteral.some(f => checks.some(check => f.includes(check.toLowerCase())));
    };

    // 2. Resource Limits Check
    const checkLimit = (resourceType) => {
        const limitMap = {
            products: plan.maxProducts,
            users: plan.maxUsers,
        };

        const limit = limitMap[resourceType];
        const current = usage[resourceType];

        if (limit === -1) return { ok: true }; // Unlimited

        return {
            ok: current < limit,
            current,
            limit,
            percentage: Math.round((current / limit) * 100)
        };
    };

    return {
        storeInfo,
        loading,
        tier,
        hasFeature,
        checkLimit,
        isPro: tier !== 'free' && tier !== 'dùng thử',
    };
};
