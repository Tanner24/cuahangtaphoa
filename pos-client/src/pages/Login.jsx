import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Fingerprint, Store, Eye, EyeOff } from 'lucide-react';
import loginImg from '../assets/login-illustration.png';

export default function Login() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);

    // States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Register States
    const [storeName, setStoreName] = useState('');
    const [phone, setPhone] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [remember, setRemember] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(username, password);
        setLoading(false);
        if (result.success) {
            navigate('/pos');
        } else {
            setError(result.error);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        setLoading(true);
        const result = await register({ storeName, phone, fullName, password });
        setLoading(false);
        if (result.success) navigate('/pos');
        else setError(result.error);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 font-sans text-slate-800">
            <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12">

                {/* Left Side: Form Card */}
                <div className="w-full md:w-1/2 max-w-md bg-white rounded-3xl shadow-2xl p-8 relative z-10 transition-all hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)]">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold mb-1 text-slate-800">
                            {isRegister ? 'Đăng Ký' : 'Đăng nhập'}
                        </h1>
                        {!isRegister && <p className="text-slate-400 text-sm">Chào mừng bạn trở lại!</p>}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
                            <span className="font-bold">!</span> {error}
                        </div>
                    )}

                    {isRegister ? (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-3">
                                <InputField icon={<Store size={18} />} placeholder="Tên cửa hàng" value={storeName} onChange={e => setStoreName(e.target.value)} required />
                                <InputField icon={<User size={18} />} placeholder="Họ tên chủ shop" value={fullName} onChange={e => setFullName(e.target.value)} required />
                                <InputField icon={<User size={18} />} placeholder="SĐT (Tên đăng nhập)" value={phone} onChange={e => setPhone(e.target.value)} type="tel" required />
                                <div className="relative group">
                                    <InputField
                                        icon={<Lock size={18} />}
                                        placeholder="Mật khẩu"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        type={showPassword ? "text" : "password"}
                                        required
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-blue-500 transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <InputField icon={<Lock size={18} />} placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required />
                            </div>

                            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all mt-6 active:scale-95">
                                {loading ? 'Đang tạo...' : 'Đăng Ký Ngay'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <InputField
                                icon={<User size={20} />}
                                placeholder="Tên đăng nhập"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                            />
                            <div className="relative">
                                <InputField
                                    icon={<Lock size={20} />}
                                    placeholder="Mật khẩu"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-blue-500 transition-colors">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <div
                                    className="flex items-center gap-2 cursor-pointer select-none group"
                                    onClick={() => setRemember(!remember)}
                                >
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${remember ? 'bg-blue-500' : 'bg-slate-200 group-hover:bg-slate-300'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${remember ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <span className="text-sm text-slate-600 font-medium group-hover:text-blue-600 transition-colors">Nhớ mật khẩu</span>
                                </div>
                                <a href="#" className="text-sm text-blue-500 font-bold hover:underline">Quên mật khẩu?</a>
                            </div>

                            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all text-lg mt-4 active:scale-95 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang đăng nhập...
                                    </>
                                ) : 'Đăng nhập'}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-slate-200"></div>
                                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">Hoặc</span>
                                <div className="flex-grow border-t border-slate-200"></div>
                            </div>

                            <div className="flex justify-center flex-col items-center group cursor-pointer" onClick={() => alert('Tính năng đang phát triển')}>
                                <div className="p-4 border-2 border-slate-100 rounded-2xl group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                                    <Fingerprint size={40} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-xs text-slate-400 mt-2 text-center group-hover:text-blue-500 font-medium">Đăng nhập bằng Touch ID</p>
                            </div>
                        </form>
                    )}

                    <div className="mt-8 text-center text-sm border-t border-slate-100 pt-6">
                        <span className="text-slate-500">
                            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
                        </span>
                        <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-bold ml-1 hover:underline hover:text-blue-700">
                            {isRegister ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
                        </button>
                    </div>
                </div>

                {/* Right Side: Illustration & Branding */}
                <div className="hidden md:flex flex-col w-1/2 items-center justify-center relative">
                    <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                        <img
                            src={loginImg}
                            alt="Login Illustration"
                            className="w-full h-auto object-contain drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div className="mt-8 text-center">
                        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">EPOS Pro</h2>
                        <p className="text-slate-500 text-lg">Hệ thống quản lý bán hàng chuyên nghiệp</p>
                        <p className="text-slate-500 text-lg">Phát triển bởi <a href="https://tienhai.agency" target="_blank" rel="noopener noreferrer">Tiền Hải Agency</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputField({ icon, ...props }) {
    return (
        <div className="border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
            <span className="text-slate-400">{icon}</span>
            <input
                className="w-full outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
                {...props}
            />
        </div>
    );
}
