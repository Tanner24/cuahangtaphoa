import { createContext, useContext, useState, useEffect } from 'react';

const ShopContext = createContext();

export function ShopProvider({ children }) {
    const [shopSettings, setShopSettings] = useState({
        shopName: 'POS Pro',
        logoUrl: '',
        address: ''
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('shopSettings');
        if (savedSettings) {
            setShopSettings(JSON.parse(savedSettings));
        }
    }, []);

    const updateShopSettings = (newSettings) => {
        setShopSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('shopSettings', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <ShopContext.Provider value={{ ...shopSettings, updateShopSettings }}>
            {children}
        </ShopContext.Provider>
    );
}

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};
