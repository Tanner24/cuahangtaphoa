import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/constants/colors';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import POSScreen from './src/screens/POSScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import LoginScreen from './src/screens/LoginScreen';

// Context
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';

// Icons
import { Feather } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
import SettingsScreen from './src/screens/SettingsScreen';

function MainApp() {
    const { userToken, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!userToken) {
        return <LoginScreen />;
    }

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.border,
                    height: Platform.OS === 'ios' ? 88 : 60,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                    elevation: 8,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: -4,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Trang chủ',
                    tabBarIcon: ({ color, size }) => <Feather name="layout" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    tabBarLabel: 'Đơn hàng',
                    tabBarIcon: ({ color, size }) => <Feather name="file-text" size={24} color={color} />,
                }}
            />

            {/* POS Button - Floating Effect */}
            <Tab.Screen
                name="POS"
                component={POSScreen}
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.fabButton}>
                            <Feather name="shopping-cart" size={28} color={COLORS.white} />
                        </View>
                    ),
                    // tabBarStyle: { display: 'none' }, // Keep tab bar visible for navigation
                    // Let's keep it for navigation for now
                }}
            />

            <Tab.Screen
                name="Products"
                component={ProductsScreen}
                options={{
                    tabBarLabel: 'Hàng hóa',
                    tabBarIcon: ({ color, size }) => <Feather name="package" size={24} color={color} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Menu',
                    tabBarIcon: ({ color, size }) => <Feather name="menu" size={24} color={color} />,
                }}
            />
        </Tab.Navigator>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <NavigationContainer>
                    <StatusBar style="dark" />
                    <MainApp />
                </NavigationContainer>
            </CartProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    fabButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24, // Lift it up
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 4,
        borderColor: COLORS.background, // Match background to simulate cutout
    },
});
