import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    const [customer, setCustomer] = useState(null);

    const addToCart = (product) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const updateQuantity = (id, delta) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    return { ...item, quantity: Math.max(1, item.quantity + delta) };
                }
                return item;
            })
        );
    };

    const clearCart = () => {
        setItems([]);
        setCustomer(null);
    };

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Provide both the new { items, totalAmount } structure and backwards-compatible flat array
    const cart = items;
    cart.items = items;
    cart.totalAmount = totalAmount;
    cart.customer = customer;

    return (
        <CartContext.Provider value={{
            cart, items, addToCart, removeFromCart, updateQuantity, clearCart,
            totalAmount, customer, setCustomer
        }}>
            {children}
        </CartContext.Provider>
    );
};
