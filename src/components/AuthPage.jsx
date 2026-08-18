import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Home, ArrowRight, Sparkles, Phone } from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import apiClient from '../apiClient';
import { AuthContext } from '../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);
  const [mode, setMode] = useState('login'); // 'login', 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [testAccounts, setTestAccounts] = useState([]);

  useEffect(() => {
    // Lấy danh sách tài khoản test (chỉ dùng cho môi trường dev/demo)
    apiClient.get('/auth/test-accounts').then(res => {
      setTestAccounts(res.data);
    }).catch(err => console.error('Lỗi lấy tài khoản test:', err));

    if (user) {
      if (['ADMIN', 'CASHIER'].includes(user.role)) {
        navigate('/pos');
      } else if (user.role === 'SHIPPER') {
        navigate('/shipper/orders');
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await apiClient.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        login(res.data.user, res.data.token);
        // Chuyển hướng theo role (VD: ADMIN vào /manager, CUSTOMER vào /)
        if (['ADMIN', 'CASHIER'].includes(res.data.user.role)) {
          navigate('/pos');
        } else if (res.data.user.role === 'SHIPPER') {
          navigate('/shipper/orders');
        } else {
          navigate('/');
        }
      } else {
        const res = await apiClient.post('/auth/register', formData);
        alert(res.data.message);
        setMode('login'); // Chuyển qua trang đăng nhập
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#fcfaf8] flex items-center justify-center p-4 md:p-8 font-body-md text-on-surface relative overflow-hidden">
      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />

      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-multiply opacity-70 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-tertiary/20 rounded-full blur-[120px] mix-blend-multiply opacity-60 translate-x-1/3 translate-y-1/3"></div>

      {/* Back to Home */}
      <Link
        to="/"
        className="absolute top-4 left-4 md:top-10 md:left-10 group flex items-center bg-white/40 hover:bg-white/80 backdrop-blur-md p-1.5 pr-1.5 hover:pr-4 rounded-full border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 z-20"
      >
        <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center text-outline group-hover:text-primary group-hover:bg-primary/10 shadow-sm transition-colors">
          <Home size={18} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-sm text-outline group-hover:text-primary max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 transition-all duration-500 whitespace-nowrap overflow-hidden">
          Trang chủ
        </span>
      </Link>

      <div className="w-full max-w-[1000px] bg-white/70 backdrop-blur-2xl rounded-3xl md:rounded-[40px] shadow-2xl shadow-primary/5 overflow-hidden flex flex-col md:flex-row min-h-fit md:min-h-[550px] max-h-[90vh] md:max-h-[85vh] border border-white relative z-10 transition-all duration-500">

        {/* Left Side: Image / Branding */}
        <div className="hidden md:flex w-[45%] relative items-center justify-center p-12 overflow-hidden bg-surface-container-highest">
          <div className="absolute inset-0 z-0">
            <img
              src={mode === 'login'
                ? "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1000&auto=format&fit=crop"
                : mode === 'register'
                  ? "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop"
                  : "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop"
              }
              alt="Auth Background"
              className="w-full h-full object-cover opacity-90 transition-opacity duration-1000 scale-105"
            />
            {/* Elegant Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"></div>
          </div>

          <div className="relative z-10 text-white mt-auto w-full">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-white/20 shadow-sm">
              <Sparkles size={14} /> PetLove Premium
            </div>
            <h2 className="text-4xl font-extrabold mb-4 leading-tight text-white drop-shadow-lg transition-all duration-500 transform translate-y-0 opacity-100">
              {mode === 'login' ? 'Mừng bạn trở lại!' : mode === 'register' ? 'Gia nhập PetLove' : 'Khôi phục tài khoản'}
            </h2>
            <p className="text-base text-white/80 font-medium leading-relaxed drop-shadow-md">
              {mode === 'login'
                ? 'Đăng nhập để nhận hàng ngàn ưu đãi đặc quyền dành riêng cho thú cưng của bạn.'
                : mode === 'register'
                  ? 'Tạo tài khoản ngay hôm nay để mua sắm dễ dàng hơn và tích điểm thành viên.'
                  : 'Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại mật khẩu nhanh chóng chỉ với vài bước đơn giản.'}
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-[55%] p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center bg-white/50 relative overflow-y-auto custom-scrollbar">

          {/* Logo Mobile */}
          <div className="md:hidden flex justify-center mb-6">
            <span className="font-headline-md text-3xl font-extrabold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              PetLove
            </span>
          </div>

          <div className="max-w-[380px] w-full mx-auto">
            <div className="mb-6 md:mb-8 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black text-on-surface mb-2 tracking-tight">
                {mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Tạo tài khoản' : 'Quên mật khẩu?'}
              </h3>
              <p className="text-outline text-xs md:text-sm font-medium">
                {mode === 'login' ? 'Nhập email và mật khẩu của bạn để tiếp tục' : mode === 'register' ? 'Điền thông tin bên dưới để bắt đầu hành trình' : 'Nhập email của bạn để nhận mã khôi phục'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-bold flex items-center justify-center">
                {error}
              </div>
            )}

            <form className="space-y-3 md:space-y-4" onSubmit={handleSubmit}>

              {mode === 'register' && (
                <>
                  <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Họ và tên" className="peer w-full h-12 md:h-[52px] pl-12 pr-4 rounded-xl border border-outline-variant/40 bg-white hover:bg-surface-container-lowest focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-sm md:text-base text-on-surface shadow-sm" />
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                  </div>
                  <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="Số điện thoại" className="peer w-full h-12 md:h-[52px] pl-12 pr-4 rounded-xl border border-outline-variant/40 bg-white hover:bg-surface-container-lowest focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-sm md:text-base text-on-surface shadow-sm" />
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                  </div>
                </>
              )}

              <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email của bạn" className="peer w-full h-12 md:h-[52px] pl-12 pr-4 rounded-xl border border-outline-variant/40 bg-white hover:bg-surface-container-lowest focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-sm md:text-base text-on-surface shadow-sm" />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              </div>

              {mode !== 'forgot' && (
                <div className="relative group animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required placeholder="Mật khẩu" className="peer w-full h-12 md:h-[52px] pl-12 pr-12 rounded-xl border border-outline-variant/40 bg-white hover:bg-surface-container-lowest focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-bold text-sm md:text-base text-on-surface shadow-sm" />
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between pt-2 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded-[4px] border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer" />
                    <span className="text-sm font-bold text-outline group-hover:text-primary transition-colors">Ghi nhớ tôi</span>
                  </label>
                  <button type="button" onClick={() => setIsForgotOpen(true)} className="text-sm font-bold text-primary hover:text-primary-container transition-colors">
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button disabled={loading} type="submit" className="w-full h-12 md:h-[56px] mt-4 bg-primary text-white font-extrabold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 group overflow-hidden relative">
                <span className="relative z-10 flex items-center gap-2 text-sm md:text-base">
                  {loading ? 'ĐANG XỬ LÝ...' : (mode === 'login' ? 'ĐĂNG NHẬP' : mode === 'register' ? 'ĐĂNG KÝ NGAY' : 'GỬI LIÊN KẾT')}
                  {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-in-out"></div>
              </button>
            </form>

            {mode === 'login' && testAccounts.length > 0 && (
              <div className="mt-6 p-4 bg-surface-variant/30 rounded-2xl border border-outline-variant/30">
                <p className="text-xs font-bold text-outline uppercase tracking-widest mb-3 text-center">Tài khoản Test Nhanh</p>
                <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto custom-scrollbar">
                  {testAccounts.map(acc => {
                    let colorClass = "bg-blue-100 text-blue-700 hover:bg-blue-200";
                    if (acc.Role === 'ADMIN') colorClass = "bg-primary/10 text-primary hover:bg-primary/20";
                    else if (acc.Role === 'CASHIER') colorClass = "bg-orange-100 text-orange-700 hover:bg-orange-200";
                    else if (acc.Role === 'SHIPPER') colorClass = "bg-purple-100 text-purple-700 hover:bg-purple-200";
                    return (
                      <button key={acc.Id} type="button" onClick={() => setFormData({ ...formData, email: acc.Email, password: '123456' })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${colorClass}`} title={acc.Email}>
                        {acc.FullName} ({acc.Role})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Toggle Modes */}
            <div className="mt-10 text-center text-sm font-bold text-outline">
              {mode === 'login' ? (
                <>Chưa có tài khoản? <button onClick={() => setMode('register')} className="text-primary hover:text-primary-container transition-colors ml-1">Đăng ký ngay</button></>
              ) : mode === 'register' ? (
                <>Đã có tài khoản? <button onClick={() => setMode('login')} className="text-primary hover:text-primary-container transition-colors ml-1">Đăng nhập</button></>
              ) : (
                <>Nhớ mật khẩu rồi? <button onClick={() => setMode('login')} className="text-primary hover:text-primary-container transition-colors ml-1">Quay lại đăng nhập</button></>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
