import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const CartContext = createContext();

const initialState = {
    items: [],
    customer: null,
    totalAmount: 0,
    discount: 0,
    taxRate: 0,
    note: ''
};

function cartReducer(state, action) {
    switch (action.type) {
        case 'ADD_ITEM':
            const existingIndex = state.items.findIndex(i => i.id === action.payload.id);
            const quantityToAdd = parseFloat(action.payload.quantity) || 1;

            if (existingIndex > -1) {
                const newItems = [...state.items];
                const existingItem = newItems[existingIndex];
                // Weight based items might not want to just add 1, but for barcode we usually do
                newItems[existingIndex] = {
                    ...existingItem,
                    quantity: Number((existingItem.quantity + quantityToAdd).toFixed(3))
                };
                return { ...state, items: newItems };
            }
            return { ...state, items: [...state.items, { ...action.payload, quantity: quantityToAdd }] };

        case 'REMOVE_ITEM':
            return { ...state, items: state.items.filter(i => i.id !== action.payload.id) };

        case 'UPDATE_QUANTITY':
            const newQty = parseFloat(action.payload.quantity);
            if (isNaN(newQty) || newQty <= 0) {
                return { ...state, items: state.items.filter(i => i.id !== action.payload.id) };
            }
            return {
                ...state,
                items: state.items.map(i =>
                    i.id === action.payload.id ? { ...i, quantity: Number(newQty.toFixed(3)) } : i
                )
            };

        case 'SET_CUSTOMER':
            return { ...state, customer: action.payload };

        case 'SET_DISCOUNT':
            return { ...state, discount: parseFloat(action.payload) || 0 };

        case 'SET_TAX_RATE':
            return { ...state, taxRate: parseFloat(action.payload) || 0 };

        case 'CLEAR_CART':
            return initialState;

        case 'SET_NOTE':
            return { ...state, note: action.payload };

        default:
            return state;
    }
}

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(cartReducer, initialState, (initial) => {
        const stored = localStorage.getItem('pos_cart');
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...parsed, items: parsed.items || [] };
        }
        return initial;
    });



    // Derived state calculations
    const subTotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = Math.round(Math.max(0, subTotal - state.discount) * (state.taxRate / 100));
    const totalAmount = Math.round(Math.max(0, subTotal - state.discount + taxAmount));

    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify({ ...state, totalAmount }));
    }, [state, totalAmount]);


    const addToCart = useCallback((product, qty = 1) => {
        dispatch({ type: 'ADD_ITEM', payload: { ...product, quantity: qty } });
    }, []);

    const removeFromCart = useCallback((productId) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { id: productId } });
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
    }, []);

    const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
    const setCustomer = useCallback((customer) => dispatch({ type: 'SET_CUSTOMER', payload: customer }), []);
    const setDiscount = useCallback((discount) => dispatch({ type: 'SET_DISCOUNT', payload: discount }), []);
    const setTaxRate = useCallback((rate) => dispatch({ type: 'SET_TAX_RATE', payload: rate }), []);

    return (
        <CartContext.Provider value={{
            cart: { ...state, subTotal, taxAmount, totalAmount },
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            setCustomer,
            setDiscount,
            setTaxRate
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
