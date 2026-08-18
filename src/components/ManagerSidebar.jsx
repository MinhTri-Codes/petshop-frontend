import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PawPrint, MonitorSmartphone, Receipt, Package, Grid,
  Dog, LineChart, Settings, LogOut, FileText, MessageSquare,
  Calendar, Clock, Users, Ticket, Wallet, Bell, X, History, Truck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../apiClient';

const ManagerSidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const { user, logout } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';

  const [notification, setNotification] = useState(null);

  const handleLogout = async () => {
    try {
      const res = await apiClient.get('/cashier/sessions/current-stats');
      if (res.data.session) {
        alert('Bạn đang có ca làm việc chưa đóng! Vui lòng vào mục "Quản lý Sổ Quỹ" để đóng ca trước khi đăng xuất.');
        window.location.href = '/cashflow';
        return;
      }
      logout();
    } catch (err) {
      console.error('Lỗi kiểm tra ca làm việc:', err);
      logout();
    }
  };

  useEffect(() => {
    // Kết nối SSE
    const evtSource = new EventSource("http://localhost:5000/api/notifications/stream");

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'NEW_ORDER') {
          // Play sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Notification sound
          audio.play().catch(e => console.log('Audio play blocked:', e));

          setNotification(data.payload);

          // Phát event để trang Order tự reload nếu đang mở
          window.dispatchEvent(new CustomEvent('newOrderReceived'));

          // Tự ẩn sau 5s
          setTimeout(() => setNotification(null), 5000);
        }
      } catch (e) {
        console.error("Lỗi parse SSE data:", e);
      }
    };

    return () => {
      evtSource.close();
    };
  }, []);

  const getLinkClasses = (activePaths) => {
    const isActive = activePaths.includes(path);
    if (isActive) {
      return "flex items-center gap-3 px-3 h-11 bg-primary/10 text-primary font-bold rounded-xl transition-all cursor-pointer";
    }
    return "flex items-center gap-3 px-3 h-11 text-outline hover:text-on-surface hover:bg-surface-container-low rounded-xl transition-all cursor-pointer font-semibold";
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[240px] flex-col bg-white border-r border-outline-variant/30 pt-6 z-50 shadow-sm">
      <div className="px-6 mb-6 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <PawPrint className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">PetLove</h1>
          <p className="text-[10px] uppercase tracking-widest text-outline font-bold">Quản lý</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col px-3 space-y-1 overflow-y-auto custom-scrollbar pb-4">

        <div className="px-3 mb-1 mt-2">
          <span className="text-[10px] font-black text-outline/70 uppercase tracking-widest">Bán hàng</span>
        </div>
        <Link to="/pos" className={getLinkClasses(['/pos'])}>
          <MonitorSmartphone size={20} />
          <span className="text-sm">[POS]Bán hàng tại chỗ</span>
        </Link>
        <Link to="/orders" className={getLinkClasses(['/orders'])}>
          <Receipt size={20} />
          <span className="text-sm">Hóa đơn</span>
        </Link>
        <Link to="/cashflow" className={getLinkClasses(['/cashflow'])}>
          <Wallet size={20} />
          <span className="text-sm">Sổ quỹ ca</span>
        </Link>
        <Link to="/vouchers" className={getLinkClasses(['/vouchers'])}>
          <Ticket size={20} />
          <span className="text-sm">Mã giảm giá</span>
        </Link>

        <div className="px-3 mb-1 mt-5">
          <span className="text-[10px] font-black text-outline/70 uppercase tracking-widest">Thú Cưng</span>
        </div>
        <Link to="/species" className={getLinkClasses(['/species'])}>
          <PawPrint size={20} />
          <span className="text-sm">Giống & Loài</span>
        </Link>
        <Link to="/pets" className={getLinkClasses(['/pets'])}>
          <Dog size={20} />
          <span className="text-sm">Hồ sơ thú cưng</span>
        </Link>

        <div className="px-3 mb-1 mt-5">
          <span className="text-[10px] font-black text-outline/70 uppercase tracking-widest">Hàng Hóa</span>
        </div>
        <Link to="/categories" className={getLinkClasses(['/categories'])}>
          <Grid size={20} />
          <span className="text-sm">Danh mục</span>
        </Link>
        <Link to="/products" className={getLinkClasses(['/products'])}>
          <Package size={20} />
          <span className="text-sm">Sản phẩm</span>
        </Link>

        <div className="px-3 mb-1 mt-5">
          <span className="text-[10px] font-black text-outline/70 uppercase tracking-widest">Nhân sự</span>
        </div>


        <Link to="/sessions" className={getLinkClasses(['/sessions'])}>
          <History size={20} />
          <span className="text-sm">Lịch sử Ca trực</span>
        </Link>
        <Link to="/shippers" className={getLinkClasses(['/shippers'])}>
          <Truck size={20} />
          <span className="text-sm">Quản lý Shipper</span>
        </Link>
        {isAdmin && (
          <Link to="/accounts" className={getLinkClasses(['/accounts'])}>
            <Users size={20} />
            <span className="text-sm">Tài khoản</span>
          </Link>
        )}

        {isAdmin && (
          <>
            <div className="px-3 mb-1 mt-5">
              <span className="text-[10px] font-black text-outline/70 uppercase tracking-widest">Nội dung & Khác</span>
            </div>
            <Link to="/blogs" className={getLinkClasses(['/blogs'])}>
              <FileText size={20} />
              <span className="text-sm">Bài viết</span>
            </Link>
            <Link to="/blog-categories" className={getLinkClasses(['/blog-categories'])}>
              <Grid size={20} />
              <span className="text-sm">Danh mục Bài viết</span>
            </Link>
            <Link to="/reviews" className={getLinkClasses(['/reviews'])}>
              <MessageSquare size={20} />
              <span className="text-sm">Đánh giá</span>
            </Link>
            <Link to="/reports" className={getLinkClasses(['/reports'])}>
              <LineChart size={20} />
              <span className="text-sm">Báo cáo</span>
            </Link>
          </>
        )}
      </nav>

      <div className="px-4 border-t border-outline-variant/30 pt-4 pb-6 flex flex-col gap-2 shrink-0 bg-white">
        {isAdmin && (
          <Link to="/settings" className="flex items-center gap-3 px-4 h-12 text-outline hover:text-on-surface hover:bg-surface-container-low rounded-xl transition-all font-semibold w-full">
            <Settings size={20} />
            <span className="text-sm">Cài đặt</span>
          </Link>
        )}

        <div className="flex items-center gap-3 p-3 mt-2 bg-surface-variant/30 rounded-2xl border border-outline-variant/30">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {(user?.fullName || 'NV').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">{user?.fullName || 'Nhân viên'}</p>
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">{user?.role === 'ADMIN' ? 'Quản trị' : 'Thu ngân'}</p>
          </div>
          <button
            onClick={() => { handleLogout(); }}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white text-outline hover:text-error transition-all shadow-sm shrink-0"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-[100] bg-white border border-primary/20 shadow-2xl shadow-primary/20 rounded-2xl p-4 w-80 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 text-primary font-bold">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Bell size={16} />
              </div>
              Đơn hàng online mới!
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-outline hover:text-error transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-on-surface mb-1">Mã đơn: <span className="font-bold">{notification.orderCode}</span></p>
          <p className="text-sm text-on-surface mb-3">Tổng tiền: <span className="font-bold text-primary">{Number(notification.totalAmount).toLocaleString('vi-VN')}đ</span></p>
          <Link
            to="/orders"
            onClick={() => setNotification(null)}
            className="block w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-center rounded-xl text-sm font-bold transition-colors"
          >
            Xem ngay
          </Link>
        </div>
      )}
    </aside>
  );
};

export default ManagerSidebar;
