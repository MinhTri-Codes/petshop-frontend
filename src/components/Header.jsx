import React, { useState, useEffect, useContext, useRef } from 'react';
import { Search, ShoppingCart, User, Menu, X, Bell, Package, PawPrint } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../apiClient';

const Header = () => {
  const location = useLocation();
  const path = location.pathname;
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const [cartCount, setCartCount] = useState(0);
  const notifRef = useRef(null);

  const fetchCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const res = await apiClient.get('/shop/cart');
      const items = res.data.items || [];
      const count = items.reduce((sum, item) => sum + item.Quantity, 0);
      setCartCount(count);
    } catch (err) {
      console.error('Lỗi lấy giỏ hàng:', err);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await apiClient.get('/customer/notifications');
      setNotifications(res.data);
      if (res.data.some(n => !n.IsRead)) {
        setHasNewNotif(true);
      }
    } catch (err) {
      console.error('Lỗi lấy thông báo:', err);
    }
  };

  const markAsRead = async () => {
    if (!hasNewNotif) return;
    try {
      await apiClient.put('/customer/notifications/mark-read');
      setHasNewNotif(false);
      setNotifications(notifications.map(n => ({ ...n, IsRead: 1 })));
    } catch (err) {
      console.error('Lỗi mark as read:', err);
    }
  };

  useEffect(() => {
    fetchCartCount();
    fetchNotifications();
    
    const handleCartUpdated = () => {
      fetchCartCount();
    };
    window.addEventListener('cartUpdated', handleCartUpdated);
    return () => window.removeEventListener('cartUpdated', handleCartUpdated);
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Trang chủ', path: '/' },
    { name: 'Cửa hàng', path: '/shop' },
    { name: 'Cẩm nang', path: '/blog' },
    { name: 'Khuyến mãi', path: '/promo' }
  ];

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-2xl shadow-lg border-b border-outline-variant/30 py-2' : 'bg-white/50 backdrop-blur-md border-b border-transparent py-4'}`}>
        <nav className="flex items-center justify-between px-4 md:px-8 lg:px-12 max-w-container-max mx-auto">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-[#F2994A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:rotate-12 transition-transform duration-300">
              <PawPrint size={24} />
            </div>
            <span className="font-headline-md text-2xl md:text-3xl font-black bg-gradient-to-r from-primary to-[#F2994A] bg-clip-text text-transparent tracking-tight">
              PetLove
            </span>
          </Link>
          
          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center bg-surface-container-low/50 backdrop-blur-md rounded-full p-1 border border-outline-variant/30 shadow-inner">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`relative px-4 py-1.5 rounded-full font-bold text-sm transition-all duration-300 ${path === link.path ? 'text-primary shadow-sm' : 'text-on-surface/70 hover:text-primary hover:bg-white/50'}`}
              >
                {path === link.path && (
                  <span className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"></span>
                )}
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* Trailing Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* Smart Search */}
            <form onSubmit={handleSearch} className="hidden lg:flex relative group">
              <input 
                className="h-10 w-64 xl:w-72 rounded-full border border-outline-variant/50 bg-white px-5 pl-11 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all placeholder:text-outline/70 shadow-sm hover:shadow-md" 
                placeholder="Tìm thức ăn, đồ chơi..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
            </form>
            
            <Link to="/cart" className="relative p-2.5 bg-white border border-outline-variant/30 hover:border-primary/50 hover:shadow-md rounded-full transition-all active:scale-95 text-on-surface hover:text-primary group">
              <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center border border-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2.5 bg-white border border-outline-variant/30 hover:border-primary/50 hover:shadow-md rounded-full transition-all active:scale-95 text-on-surface hover:text-primary group"
                >
                  <Bell size={20} className={`transition-transform ${isNotifOpen ? 'rotate-12 scale-110 text-primary' : 'group-hover:scale-110'}`} />
                  {hasNewNotif && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-[1.5px] border-white animate-pulse"></span>
                  )}
                </button>
                
                {isNotifOpen && (
                  <div className="absolute top-[120%] right-0 w-80 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 origin-top-right">
                    <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest/80">
                      <h3 className="font-extrabold text-on-surface">Thông báo</h3>
                      <button onClick={markAsRead} className="text-xs text-primary font-bold hover:underline">
                        Đánh dấu đã đọc
                      </button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-outline font-medium">Chưa có thông báo nào.</div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.Id} className={`p-4 border-b border-outline-variant/20 hover:bg-surface-container-lowest transition-colors cursor-pointer ${!notif.IsRead ? 'bg-primary/5' : ''}`}>
                            <p className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
                              {notif.Type === 'ORDER' ? <Package size={16} className="text-primary"/> : <Bell size={16} className="text-primary"/>}
                              {notif.Title}
                            </p>
                            <p className="text-xs font-medium text-outline">{notif.Content}</p>
                            <p className="text-[10px] text-outline/70 font-bold mt-2">
                              {new Date(notif.CreatedAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 text-center border-t border-outline-variant/30 bg-surface-container-lowest/80">
                      <Link to="/profile" className="text-xs font-extrabold text-primary hover:underline">Xem tất cả</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {user && (
              <Link to="/profile" className="p-2.5 bg-white border border-outline-variant/30 hover:border-primary/50 hover:shadow-md rounded-full transition-all active:scale-95 text-on-surface hover:text-primary hidden sm:block group">
                <User size={20} className="group-hover:scale-110 transition-transform" />
              </Link>
            )}
            
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2.5 bg-white border border-outline-variant/30 hover:shadow-md rounded-full text-on-surface"
            >
              <Menu size={20} />
            </button>
            
            {user ? (
              <button onClick={logout} className="hidden lg:flex px-5 py-2.5 bg-error/10 text-error hover:bg-error hover:text-white rounded-full font-bold text-sm active:scale-95 transition-all shadow-sm items-center gap-2 group">
                Đăng xuất
              </button>
            ) : (
              <Link to="/auth" className="hidden lg:flex px-5 py-2.5 bg-on-surface text-white hover:bg-primary rounded-full font-bold text-sm active:scale-95 transition-all shadow-md items-center gap-2 group">
                Đăng nhập
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex flex-col animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex justify-between items-center px-6 h-20 border-b border-outline-variant/30">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-[#F2994A] rounded-xl flex items-center justify-center text-white">
                <PawPrint size={18} />
              </div>
              <span className="font-headline-md text-xl font-black bg-gradient-to-r from-primary to-[#F2994A] bg-clip-text text-transparent">
                PetLove
              </span>
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 bg-surface-container-low rounded-full text-on-surface hover:bg-surface-variant transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex flex-col px-6 pt-8 gap-2 overflow-y-auto">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`p-4 rounded-2xl font-extrabold text-lg transition-colors ${path === link.path ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-low'}`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/profile" className={`p-4 rounded-2xl font-extrabold text-lg transition-colors ${path === '/profile' ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-surface-container-low'}`}>
              Hồ sơ cá nhân
            </Link>
          </div>

          <div className="mt-auto p-6 border-t border-outline-variant/30">
            {user ? (
              <button onClick={logout} className="w-full py-4 bg-error/10 text-error text-lg rounded-2xl font-bold flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                Đăng xuất
              </button>
            ) : (
              <Link to="/auth" className="w-full py-4 bg-primary text-white text-lg rounded-2xl font-bold flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
