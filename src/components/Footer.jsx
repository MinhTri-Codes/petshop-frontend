import React, { useState, useEffect } from 'react';
import { MessageCircle, Camera, PlayCircle, MapPin, Phone, Mail, Home, Package, BookOpen, ShoppingBag, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../apiClient';

const Footer = () => {
  const location = useLocation();
  const path = location.pathname;
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/shop/settings');
        setSettings(res.data);
      } catch (err) {
        console.error('Lỗi tải cấu hình cửa hàng:', err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <>
      <footer className="w-full mt-stack-lg bg-secondary dark:bg-on-secondary-fixed-variant text-secondary-fixed">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-gutter px-margin-desktop py-stack-lg max-w-container-max mx-auto">
          <div className="space-y-6">
            <Link className="font-headline-md text-3xl font-extrabold text-white tracking-tight" to="/">{settings?.storeName || 'PetLove'}</Link>
            <p className="text-secondary-fixed/70 font-body-md text-sm leading-relaxed">
              Hệ thống chăm sóc thú cưng chuyên nghiệp, cung cấp giải pháp toàn diện từ sản phẩm đến dịch vụ y tế. Chúng tôi luôn đồng hành cùng sức khỏe bé yêu. 
              <br/><br/><Link to="/contact" className="text-primary hover:underline font-bold">Về chúng tôi & Liên hệ</Link>
            </p>
            <div className="flex gap-3">
              <a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white hover:-translate-y-1 transition-all duration-300" href="#">
                <MessageCircle size={18} />
              </a>
              <a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white hover:-translate-y-1 transition-all duration-300" href="#">
                <Camera size={18} />
              </a>
              <a className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary hover:text-white hover:-translate-y-1 transition-all duration-300" href="#">
                <PlayCircle size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest">Hỗ trợ khách hàng</h4>
            <ul className="space-y-3">
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/shop">Hướng dẫn mua hàng</Link></li>
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/profile">Tài khoản của tôi</Link></li>
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/cart">Kiểm tra đơn hàng</Link></li>
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/contact">Câu hỏi thường gặp (FAQ)</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest">Chính sách</h4>
            <ul className="space-y-3">
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/policies">Chính sách bảo hành</Link></li>
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/policies">Chính sách đổi trả</Link></li>
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/policies">Giao hàng &amp; Thanh toán</Link></li>
              <li><Link className="text-secondary-fixed/70 hover:text-primary hover:translate-x-2 transition-all inline-block font-body-md" to="/policies">Bảo mật thông tin</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-widest">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-secondary-fixed/70 font-body-md">
                <MapPin size={20} className="shrink-0 text-primary-fixed mt-1" />
                <span className="leading-snug">{settings?.address || '123 Đường Thú Cưng, Quận 1, TP. Hồ Chí Minh'}</span>
              </li>
              <li className="flex items-center gap-3 text-secondary-fixed/70 font-body-md">
                <Phone size={20} className="shrink-0 text-primary-fixed" />
                <span>Hotline: {settings?.phone || '1900 6789'}</span>
              </li>
              <li className="flex items-center gap-3 text-secondary-fixed/70 font-body-md">
                <Mail size={20} className="shrink-0 text-primary-fixed" />
                <span>{settings?.email || 'contact@petlove.com'}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 px-margin-desktop py-6 max-w-container-max mx-auto text-center mt-6">
          <p className="text-secondary-fixed/50 font-caption text-sm tracking-wide">© 2024 PetLove Pet Shop. Thiết kế với ❤ dành cho thú cưng.</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-outline-variant/30 flex justify-around items-center py-2 px-2 z-[60] pb-safe shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
        <Link to="/" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${path === '/' ? 'text-primary bg-primary-container/20' : 'text-secondary hover:text-primary hover:bg-primary-container/10'}`}>
            <Home size={22} />
            <span className={`text-[10px] mt-1 ${path === '/' ? 'font-bold' : 'font-medium'}`}>Trang chủ</span>
          </Link>
          <Link to="/shop" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${path === '/shop' ? 'text-primary bg-primary-container/20' : 'text-secondary hover:text-primary hover:bg-primary-container/10'}`}>
            <Package size={22} />
            <span className={`text-[10px] mt-1 ${path === '/shop' ? 'font-bold' : 'font-medium'}`}>Cửa hàng</span>
          </Link>
          <Link to="/blog" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${path === '/blog' ? 'text-primary bg-primary-container/20' : 'text-secondary hover:text-primary hover:bg-primary-container/10'}`}>
            <BookOpen size={22} />
            <span className={`text-[10px] mt-1 ${path === '/blog' ? 'font-bold' : 'font-medium'}`}>Cẩm nang</span>
          </Link>
          <Link to="/cart" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors relative ${path === '/cart' ? 'text-primary bg-primary-container/20' : 'text-secondary hover:text-primary hover:bg-primary-container/10'}`}>
            <ShoppingBag size={22} />
            <span className="absolute top-1 right-2 w-2 h-2 bg-error rounded-full border border-white"></span>
            <span className={`text-[10px] mt-1 ${path === '/cart' ? 'font-bold' : 'font-medium'}`}>Giỏ hàng</span>
          </Link>
          <Link to="/profile" className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${path === '/profile' ? 'text-primary bg-primary-container/20' : 'text-secondary hover:text-primary hover:bg-primary-container/10'}`}>
            <User size={22} />
            <span className={`text-[10px] mt-1 ${path === '/profile' ? 'font-bold' : 'font-medium'}`}>Tài khoản</span>
          </Link>
        </div>
    </>
  );
};

export default Footer;
