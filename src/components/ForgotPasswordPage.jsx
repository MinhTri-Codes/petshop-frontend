import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Vui lòng nhập email');
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-outline-variant/30">
        
        {success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-on-surface mb-2">Đã gửi email</h2>
              <p className="text-outline">Chúng tôi đã gửi link khôi phục mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến của bạn.</p>
            </div>
            <Link to="/login" className="block w-full py-4 bg-primary text-white font-extrabold rounded-2xl hover:bg-primary/90 transition-all text-center">
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-on-surface mb-2">Quên mật khẩu?</h2>
              <p className="text-outline">Đừng lo lắng, hãy nhập email đã đăng ký tài khoản của bạn để nhận link khôi phục.</p>
            </div>

            {error && (
              <div className="p-4 bg-error/10 text-error rounded-xl mb-6 text-sm font-bold border border-error/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Email của bạn</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full pl-11 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-extrabold rounded-2xl hover:bg-primary/90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'GỬI LINK KHÔI PHỤC'}
              </button>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-outline font-bold hover:text-primary transition-colors">
                  <ArrowLeft size={18} />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
