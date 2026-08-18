import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import apiClient from '../apiClient';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/shop/settings');
        setSettings(res.data);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      alert('Vui lòng điền các thông tin bắt buộc (*)');
      return;
    }
    try {
      setLoading(true);
      await apiClient.post('/customer/contact', formData);
      alert('Gửi lời nhắn thành công. Chúng tôi sẽ phản hồi sớm nhất có thể!');
      setFormData({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-on-surface bg-background overflow-x-hidden min-h-screen flex flex-col">
      <Header />
      
      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto w-full flex-grow">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-4">Liên hệ với PetLove</h1>
          <p className="text-lg text-outline font-medium max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy để lại lời nhắn hoặc liên hệ trực tiếp qua các thông tin bên dưới.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-outline-variant/30 space-y-6">
              <h2 className="text-2xl font-extrabold text-on-surface mb-6">Thông tin cửa hàng</h2>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Địa chỉ</h3>
                    <p className="text-outline font-medium">{settings?.address || '123 Đường Sư Vạn Hạnh, Phường 12, Quận 10, TP. Hồ Chí Minh'}</p>
                  </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Điện thoại</h3>
                    <p className="text-outline font-medium">{settings?.phone || '1900 1234 567'}</p>
                  </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Email</h3>
                    <p className="text-outline font-medium">{settings?.email || 'contact@petlove.vn'}</p>
                  </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Giờ mở cửa</h3>
                  <p className="text-outline font-medium">Thứ 2 - Chủ nhật: 08:00 - 22:00</p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="w-full h-[300px] bg-surface-container-low rounded-[32px] border border-outline-variant/30 flex items-center justify-center shadow-sm overflow-hidden">
               <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" alt="Map Location" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-sm border border-outline-variant/30">
            <h2 className="text-2xl font-extrabold text-on-surface mb-6">Gửi lời nhắn</h2>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Họ và tên *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập họ tên của bạn"
                  className="w-full h-14 px-5 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Số điện thoại *</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Nhập số điện thoại liên hệ"
                  className="w-full h-14 px-5 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Nhập email (không bắt buộc)"
                  className="w-full h-14 px-5 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Nội dung tin nhắn *</label>
                <textarea 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Bạn cần chúng tôi hỗ trợ vấn đề gì?"
                  rows="4"
                  className="w-full p-5 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none"
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-2 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi tin nhắn'} <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContactPage;
