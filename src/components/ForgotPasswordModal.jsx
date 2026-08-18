import React, { useState } from 'react';
import { X, Mail, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import apiClient from '../apiClient';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Input email, 2: Success
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Vui lòng nhập email');
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>
      
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-6 md:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-surface-container-low hover:bg-surface-variant rounded-full flex items-center justify-center text-on-surface shadow-sm transition-all"
        >
          <X size={20} />
        </button>

        {step === 1 ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface mb-2">Quên mật khẩu?</h2>
            <p className="text-outline text-sm font-medium mb-8">
              Nhập địa chỉ email của bạn, chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-2 mb-4 bg-error/10 text-error rounded-lg text-xs font-bold text-center border border-error/20">
                  {error}
                </div>
              )}
              <div className="text-left space-y-2">
                <label className="font-bold text-sm text-on-surface">Email của bạn</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md disabled:opacity-70 disabled:pointer-events-none"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Gửi mã xác nhận <ArrowRight size={18} /></>}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface mb-2">Kiểm tra email</h2>
            <p className="text-outline font-medium mb-8">
              Chúng tôi đã gửi link đặt lại mật khẩu tới email của bạn. Vui lòng kiểm tra hộp thư đến (hoặc mục Spam).
            </p>
            
            <button 
              onClick={handleClose}
              className="w-full h-12 bg-surface-container-low text-on-surface font-extrabold rounded-xl hover:bg-surface-variant transition-all border border-outline-variant/30"
            >
              Trở về đăng nhập
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordModal;
