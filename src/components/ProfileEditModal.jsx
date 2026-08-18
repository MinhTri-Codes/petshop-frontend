import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiClient from '../apiClient';

const ProfileEditModal = ({ isOpen, onClose, profile, onSuccess }) => {
  const [formData, setFormData] = useState({
    FullName: '',
    PhoneNumber: '',
    AvatarUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        FullName: profile.FullName || '',
        PhoneNumber: profile.PhoneNumber || '',
        AvatarUrl: profile.AvatarUrl || ''
      });
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    try {
      setLoading(true);
      const res = await apiClient.post('/customer/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, AvatarUrl: res.data.url }));
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      setError('Lỗi upload ảnh, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiClient.put('/customer/profile', formData);
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
          <h2 className="text-xl font-extrabold text-on-surface">Cập nhật hồ sơ</h2>
          <button onClick={onClose} className="p-2 bg-surface-container hover:bg-surface-variant rounded-full transition-colors text-on-surface">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-error/10 text-error rounded-xl text-sm font-bold">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Họ và tên</label>
            <input 
              type="text" 
              name="FullName"
              value={formData.FullName} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Số điện thoại</label>
            <input 
              type="tel" 
              name="PhoneNumber"
              value={formData.PhoneNumber} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Ảnh đại diện</label>
            <div className="flex items-center gap-4">
              {formData.AvatarUrl && (
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-outline-variant/30">
                  <img src={formData.AvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full h-12 px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
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

export default ProfileEditModal;
