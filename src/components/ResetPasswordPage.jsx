import React, { useState, useEffect } from 'react';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ hoặc đã bị thiếu.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự');
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp');
    
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra, token có thể đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-outline-variant/30 text-center">
          <h2 className="text-2xl font-extrabold text-error mb-4">Lỗi đường dẫn</h2>
          <p className="text-outline mb-6">{error}</p>
          <Link to="/auth" className="block w-full py-4 bg-primary text-white font-extrabold rounded-2xl hover:bg-primary/90 transition-all">
            Yêu cầu lại link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-outline-variant/30">
        
        {success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-on-surface mb-2">Đổi mật khẩu thành công!</h2>
              <p className="text-outline">Bạn đã có thể đăng nhập bằng mật khẩu mới. Hệ thống sẽ tự động chuyển hướng...</p>
            </div>
            <Link to="/auth" className="block w-full py-4 bg-primary text-white font-extrabold rounded-2xl hover:bg-primary/90 transition-all text-center">
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-on-surface mb-2">Đặt lại mật khẩu</h2>
              <p className="text-outline">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            {error && (
              <div className="p-4 bg-error/10 text-error rounded-xl mb-6 text-sm font-bold border border-error/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full pl-11 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-on-surface">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="w-full pl-11 pr-4 py-4 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-primary text-white font-extrabold rounded-2xl hover:bg-primary/90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'XÁC NHẬN'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
