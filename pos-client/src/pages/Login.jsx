import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Store, Eye, EyeOff, Phone, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import loginImg from '../assets/login-illustration.png';

export default function Login() {
    const { login, register, user, forgotPassword } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    useEffect(() => {
        if (user) {
            navigate('/pos');
        }
    }, [user, navigate]);

    // Login States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const savedUsername = localStorage.getItem('remembered_username');
        const savedPassword = localStorage.getItem('remembered_password');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
        if (savedPassword) {
            setPassword(savedPassword);
        }
    }, []);

    // Register States
    const [storeName, setStoreName] = useState('');
    const [phone, setPhone] = useState(''); // This will be the username
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Handle remember me
        if (rememberMe) {
            localStorage.setItem('remembered_username', username);
            localStorage.setItem('remembered_password', password);
        } else {
            localStorage.removeItem('remembered_username');
            localStorage.removeItem('remembered_password');
        }

        // Toast loading promise
        const loginPromise = login(username, password);

        toast.promise(loginPromise, {
            loading: 'Đang đăng nhập...',
            success: 'Đăng nhập thành công!',
            error: (err) => err?.message || 'Đăng nhập thất bại',
        }).then((result) => {
            if (result.success) {
                navigate('/pos');
            }
        }).catch((e) => {
            // Error handled by toast
            console.error(e);
        }).finally(() => setLoading(false));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }
        if (password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        const registerPromise = register({ storeName, phone, fullName, password });

        toast.promise(registerPromise, {
            loading: 'Đang tạo cửa hàng mới...',
            success: 'Đăng ký thành công! Đang vào hệ thống...',
            error: (err) => err?.message || 'Đăng ký thất bại',
        }).then((result) => {
            if (result.success) navigate('/pos');
        }).catch((e) => {
            console.error(e);
        }).finally(() => setLoading(false));
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        const promise = forgotPassword(username);

        toast.promise(promise, {
            loading: 'Đang gửi yêu cầu khôi phục...',
            success: (res) => res.message || 'Mật khẩu đã được reset về 123456!',
            error: (err) => err?.message || 'Khôi phục mật khẩu thất bại',
        }).then(() => {
            setIsForgotPassword(false);
            setPassword('');
        }).catch(err => {
            console.error(err);
        }).finally(() => setLoading(false));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch bg-white rounded-3xl shadow-2xl overflow-hidden z-10 min-h-[600px]">

                {/* Left Side: Form */}
                <div className="w-full md:w-5/12 p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                            {isRegister ? 'Tạo Cửa Hàng Mới' : isForgotPassword ? 'Quên Mật Khẩu' : 'Chào Mừng Trở Lại!'}
                        </h2>
                        <p className="text-slate-500">
                            {isRegister ? 'Điền thông tin để bắt đầu kinh doanh ngay.' : isForgotPassword ? 'Nhập số điện thoại để khôi phục tài khoản.' : 'Đăng nhập để tiếp tục quản lý bán hàng.'}
                        </p>
                    </div>

                    {isRegister ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <InputField
                                icon={<Store className="text-blue-500" size={20} />}
                                placeholder="Tên cửa hàng (Ví dụ: Tạp Hóa A)"
                                value={storeName}
                                onChange={e => setStoreName(e.target.value)}
                                required
                                autoFocus
                            />
                            <InputField
                                icon={<User className="text-blue-500" size={20} />}
                                placeholder="Họ và tên chủ shop"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                required
                            />
                            <InputField
                                icon={<Phone className="text-blue-500" size={20} />}
                                placeholder="Số điện thoại (Dùng để đăng nhập)"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                type="tel"
                                required
                            />
                            <PasswordField
                                placeholder="Mật khẩu"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                showPassword={showPassword}
                                toggleShow={() => setShowPassword(!showPassword)}
                            />
                            <PasswordField
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                showPassword={showPassword}
                                toggleShow={() => setShowPassword(!showPassword)}
                            />

                            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all mt-4 flex items-center justify-center gap-2 group">
                                {loading ? 'Đang xử lý...' : 'Đăng Ký & Dùng Ngay'}
                                {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    ) : isForgotPassword ? (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                <h3 className="text-blue-800 font-bold mb-2 flex items-center gap-2 text-lg">
                                    <Lock className="text-blue-500" size={22} /> Khôi phục mật khẩu
                                </h3>
                                <p className="text-sm text-blue-700 leading-relaxed">
                                    Vì lý do bảo mật, vui lòng nhập số điện thoại của bạn, sau đó liên hệ quản trị viên để được hỗ trợ cấp mật khẩu mới ngay lập tức.
                                </p>
                            </div>

                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <InputField
                                    icon={<Phone className="text-blue-500" size={20} />}
                                    placeholder="Số điện thoại đã đăng ký"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 py-4">
                                    Gửi yêu cầu khôi phục
                                </button>
                            </form>

                            <button
                                onClick={() => setIsForgotPassword(false)}
                                className="w-full text-sm text-slate-500 font-bold hover:text-slate-800 transition-colors py-2"
                            >
                                ← Quay lại đăng nhập
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <InputField
                                icon={<Phone className="text-blue-500" size={20} />}
                                placeholder="Số điện thoại / Tên đăng nhập"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                autoFocus
                            />

                            <div>
                                <PasswordField
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    showPassword={showPassword}
                                    toggleShow={() => setShowPassword(!showPassword)}
                                />
                                <div className="flex items-center justify-between mt-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                                                checked={rememberMe}
                                                onChange={e => setRememberMe(e.target.checked)}
                                            />
                                            <svg
                                                className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-0.5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <span className="text-sm text-slate-500 font-semibold group-hover:text-slate-700 transition-colors">
                                            Tự động đăng nhập
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsForgotPassword(true);
                                            setIsRegister(false);
                                        }}
                                        className="text-xs text-blue-500 font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                </div>
                            </div>

                            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all mt-2 flex items-center justify-center gap-2 group">
                                {loading ? 'Đăng nhập...' : 'Đăng Nhập'}
                                {!loading && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-slate-600 text-sm">
                            {isForgotPassword ? 'Bất kỳ khó khăn nào?' : isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                            <button
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setIsForgotPassword(false);
                                }}
                                className="ml-2 text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
                            >
                                {isForgotPassword ? 'Liên hệ hỗ trợ' : isRegister ? 'Đăng nhập' : 'Đăng ký miễn phí'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Right Side: Image */}
                <div className="hidden md:flex w-7/12 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-90 z-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1556740758-90de374c12ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                        alt="POS System"
                        className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
                    />

                    <div className="relative z-20 text-white max-w-lg text-center flex flex-col h-full w-full">
                        <div className="flex-1 flex flex-col justify-center">
                            <h2 className="text-5xl font-black mb-4 tracking-tight italic">EPOS PRO</h2>
                            <p className="text-xl font-medium mb-10 text-blue-100/80 leading-relaxed">
                                Quản lý bán hàng thông minh & hiệu quả
                            </p>

                            <div className="space-y-4 text-left inline-block mx-auto bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5 text-white shadow-lg shadow-emerald-500/20">
                                        <ChevronRight size={14} />
                                    </div>
                                    <span className="text-blue-50 font-medium">Quản lý tồn kho chính xác</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5 text-white shadow-lg shadow-emerald-500/20">
                                        <ChevronRight size={14} />
                                    </div>
                                    <span className="text-blue-50 font-medium">Báo cáo doanh thu thời gian thực</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5 text-white shadow-lg shadow-emerald-500/20">
                                        <ChevronRight size={14} />
                                    </div>
                                    <span className="text-blue-50 font-medium">Dễ dàng sử dụng trên mọi thiết bị</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-8">
                            <p className="text-[13px] text-white/80 font-medium mb-1">Thiết kế & Phát triển bởi</p>
                            <a
                                href="https://web.facebook.com/profile.php?id=61575341679426"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white hover:text-blue-200 transition-all font-black uppercase tracking-widest text-[16px] border-b border-white/20 pb-1"
                            >
                                Tiền Hải Agency
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputField({ icon, ...props }) {
    return (
        <div className="group border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all bg-slate-50 focus-within:bg-white">
            <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors">{icon}</span>
            <input
                className="w-full outline-none text-slate-700 placeholder:text-slate-400 bg-transparent font-medium"
                {...props}
            />
        </div>
    );
}

function PasswordField({ showPassword, toggleShow, ...props }) {
    return (
        <div className="group border border-slate-200 rounded-xl px-4 py-3.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all bg-slate-50 focus-within:bg-white relative">
            <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors"><Lock size={20} /></span>
            <input
                type={showPassword ? "text" : "password"}
                className="w-full outline-none text-slate-700 placeholder:text-slate-400 bg-transparent font-medium"
                {...props}
            />
            <button type="button" onClick={toggleShow} className="text-slate-400 hover:text-blue-500 transition-colors p-1">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>
    );
}
