import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    Alert,
    Image
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
const logoImg = require('../../assets/logo.png');

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const { login, register } = useContext(AuthContext);
    const [isRegister, setIsRegister] = useState(false);

    // Login states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Register states
    const [storeName, setStoreName] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Load saved credentials
    useEffect(() => {
        loadSavedCredentials();
    }, []);

    const loadSavedCredentials = async () => {
        try {
            const savedUsername = await AsyncStorage.getItem('savedUsername');
            const savedPassword = await AsyncStorage.getItem('savedPassword');
            const savedRememberMe = await AsyncStorage.getItem('rememberMe');

            if (savedRememberMe === 'true') {
                if (savedUsername) setUsername(savedUsername);
                if (savedPassword) setPassword(savedPassword);
                setRememberMe(true);
            }
        } catch (e) {
            console.error('Failed to load saved credentials', e);
        }
    };

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (rememberMe) {
                await AsyncStorage.setItem('savedUsername', username);
                await AsyncStorage.setItem('savedPassword', password);
                await AsyncStorage.setItem('rememberMe', 'true');
            } else {
                await AsyncStorage.removeItem('savedUsername');
                await AsyncStorage.removeItem('savedPassword');
                await AsyncStorage.setItem('rememberMe', 'false');
            }
            await login(username, password);
        } catch (e) {
            console.error('Login error details:', e);
            setError(e.message || 'Đăng nhập thất bại');
            Alert.alert('Lỗi đăng nhập', e.message || 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng hoặc IP.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!storeName || !fullName || !phone || !regPassword) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (regPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (regPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await register({ storeName, phone, fullName, password: regPassword });
        } catch (e) {
            setError(e.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => {
        setIsRegister(!isRegister);
        setError('');
        setShowPassword(false);
    };

    const renderInput = (icon, placeholder, value, onChangeText, fieldKey, options = {}) => (
        <View style={[
            styles.inputWrapper,
            focusedField === fieldKey && styles.inputWrapperFocused
        ]}>
            <Feather
                name={icon}
                size={20}
                color={focusedField === fieldKey ? '#3B82F6' : '#94A3B8'}
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                value={value}
                onChangeText={onChangeText}
                autoCapitalize={options.autoCapitalize || 'none'}
                autoCorrect={false}
                keyboardType={options.keyboardType || 'default'}
                secureTextEntry={options.secureTextEntry || false}
                onFocus={() => setFocusedField(fieldKey)}
                onBlur={() => setFocusedField(null)}
            />
            {options.rightElement}
        </View>
    );

    const eyeButton = (
        <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#94A3B8"
            />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Background Blobs */}
            <View style={styles.blobContainer}>
                <View style={[styles.blob, styles.blob1]} />
                <View style={[styles.blob, styles.blob2]} />
                <View style={[styles.blob, styles.blob3]} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Spacer to center content vertically */}
                    <View style={{ flex: 1 }} />

                    {/* Branding on top */}
                    <View style={styles.branding}>
                        <Image source={logoImg} style={styles.logoMain} />
                        <Text style={styles.brandingSub}>Quản lý bán hàng thông minh & hiệu quả</Text>
                    </View>

                    {/* Card Container */}
                    <View style={styles.card}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>
                                {isRegister ? 'Tạo Cửa Hàng Mới' : 'Chào Mừng Trở Lại!'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {isRegister
                                    ? 'Điền thông tin để bắt đầu kinh doanh ngay.'
                                    : 'Đăng nhập để tiếp tục quản lý bán hàng.'}
                            </Text>
                        </View>

                        {/* Form */}
                        <View style={styles.form}>
                            {isRegister ? (
                                <>
                                    {renderInput('shopping-bag', 'Tên cửa hàng (Ví dụ: Tạp Hóa A)', storeName, setStoreName, 'storeName')}
                                    {renderInput('user', 'Họ và tên chủ shop', fullName, setFullName, 'fullName', { autoCapitalize: 'words' })}
                                    {renderInput('phone', 'SĐT (Dùng để đăng nhập)', phone, setPhone, 'phone', { keyboardType: 'phone-pad' })}
                                    {renderInput('lock', 'Mật khẩu', regPassword, setRegPassword, 'regPassword', {
                                        secureTextEntry: !showPassword,
                                        rightElement: eyeButton
                                    })}
                                    {renderInput('lock', 'Nhập lại mật khẩu', confirmPassword, setConfirmPassword, 'confirmPassword', {
                                        secureTextEntry: !showPassword,
                                        rightElement: eyeButton
                                    })}
                                </>
                            ) : (
                                <>
                                    {renderInput('phone', 'Số điện thoại / Tên đăng nhập', username, setUsername, 'username')}

                                    <View>
                                        {renderInput('lock', 'Mật khẩu', password, setPassword, 'password', {
                                            secureTextEntry: !showPassword,
                                            rightElement: eyeButton
                                        })}

                                        <View style={styles.rememberRow}>
                                            <TouchableOpacity
                                                style={styles.rememberMe}
                                                onPress={() => setRememberMe(!rememberMe)}
                                            >
                                                <Ionicons
                                                    name={rememberMe ? "checkbox" : "square-outline"}
                                                    size={22}
                                                    color={rememberMe ? "#3B82F6" : "#94A3B8"}
                                                />
                                                <Text style={[styles.rememberText, rememberMe && styles.rememberTextActive]}>
                                                    Ghi nhớ mật khẩu
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => Alert.alert(
                                                    'Quên mật khẩu',
                                                    'Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.\n\nHotline: 0975.4214.439'
                                                )}
                                            >
                                                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            )}

                            {/* Error */}
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Feather name="alert-circle" size={16} color="#EF4444" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                onPress={isRegister ? handleRegister : handleLogin}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                ) : (
                                    <View style={styles.loginButtonContent}>
                                        <Text style={styles.loginButtonText}>
                                            {isRegister ? 'Đăng Ký & Dùng Ngay' : 'Đăng Nhập'}
                                        </Text>
                                        <Feather name="chevron-right" size={20} color="#FFFFFF" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Footer Divider */}
                        <View style={styles.divider} />

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                {isRegister ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
                            </Text>
                            <TouchableOpacity onPress={switchMode}>
                                <Text style={styles.footerLink}>
                                    {isRegister ? 'Đăng nhập' : 'Đăng ký miễn phí'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Agency Credit */}
                    <View style={styles.agency}>
                        <Text style={styles.agencyLabel}>Thiết kế & Phát triển bởi</Text>
                        <Text style={styles.agencyName}>Tiền Hải Agency</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    blobContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
    },
    blob1: {
        width: 300,
        height: 300,
        backgroundColor: 'rgba(96, 165, 250, 0.15)',
        top: -80,
        right: -40,
    },
    blob2: {
        width: 280,
        height: 280,
        backgroundColor: 'rgba(167, 139, 250, 0.12)',
        top: -60,
        left: -100,
    },
    blob3: {
        width: 260,
        height: 260,
        backgroundColor: 'rgba(244, 114, 182, 0.10)',
        bottom: -80,
        left: width * 0.2,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 28,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.08,
        shadowRadius: 32,
        elevation: 12,
    },
    header: {
        marginBottom: 28,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    form: {
        gap: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 15 : 4,
        gap: 12,
    },
    inputWrapperFocused: {
        borderColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    rememberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rememberText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    rememberTextActive: {
        color: '#334155',
        fontWeight: '600',
    },
    forgotText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '700',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    loginButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 4,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginTop: 28,
        marginBottom: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#475569',
    },
    footerLink: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    branding: {
        alignItems: 'center',
        marginBottom: 28,
    },
    logoMain: {
        width: 100,
        height: 100,
        marginBottom: 10,
        borderRadius: 50,
    },
    brandingSub: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 6,
        fontWeight: '500',
    },
    agency: {
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: 48,
        paddingBottom: 32,
    },
    agencyLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
        marginBottom: 4,
    },
    agencyName: {
        fontSize: 15,
        color: '#0F172A',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
