import React, { useState } from 'react';
import { X } from 'lucide-react';
import apiClient from '../apiClient';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await apiClient.put('/customer/password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/30">
          <h2 className="text-xl font-extrabold text-on-surface">Đổi mật khẩu</h2>
          <button onClick={onClose} className="p-2 bg-surface-container hover:bg-surface-variant rounded-full transition-colors text-on-surface">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-error/10 text-error rounded-xl text-sm font-bold">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Mật khẩu cũ</label>
            <input 
              type="password" 
              name="oldPassword"
              value={formData.oldPassword} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Mật khẩu mới</label>
            <input 
              type="password" 
              name="newPassword"
              value={formData.newPassword} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Xác nhận mật khẩu mới</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-variant text-on-surface hover:bg-surface-container-high transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
