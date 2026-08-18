import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Map, Wallet, User, Power } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../apiClient';

export const ShipperContext = React.createContext();

const ShipperLayout = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get('/shipper/profile');
        if (res.data.details) {
          setIsOnline(!!res.data.details.IsOnline);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
  }, []);

  const handleToggleStatus = async () => {
    try {
      const newStatus = !isOnline;
      // If going offline, check remittance
      if (!newStatus) {
        const remRes = await apiClient.get('/shipper/remittance');
        const amount = remRes.data.amount;
        if (amount > 0) {
          alert(`Bạn đã tắt trạng thái hoạt động. Bạn đang giữ ${amount.toLocaleString('vi-VN')}đ tiền thu hộ (COD). Vui lòng nộp lại cho Quản lý cửa hàng!`);
        }
      }

      // Optimistic update
      setIsOnline(newStatus);
      await apiClient.put('/shipper/status', { isOnline: newStatus });
    } catch (err) {
      console.error(err);
      // Revert if error
      setIsOnline(isOnline);
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const displayName = user?.fullName || 'Tài xế';
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <ShipperContext.Provider value={{ isOnline }}>
      <div className="bg-surface-container-lowest text-on-surface min-h-screen flex flex-col font-body-md max-w-md mx-auto relative overflow-hidden sm:border-x sm:border-outline-variant/30 shadow-2xl">
        
        {/* Header for Mobile */}
      <header className="px-4 py-4 bg-primary text-white shrink-0 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
            {initialLetter}
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight">{displayName}</h1>
            <button 
              onClick={handleToggleStatus}
              className="flex items-center gap-1.5 mt-1 bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-outline-variant'}`}></div>
              <span className="text-[10px] text-white font-bold">{isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}</span>
            </button>
          </div>
        </div>
        
        <button 
          onClick={handleToggleStatus}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isOnline ? 'bg-white text-primary' : 'bg-surface-variant text-outline'}`}
        >
          <Power size={18} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 relative z-0">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed sm:absolute bottom-0 w-full max-w-md bg-white border-t border-outline-variant/30 flex items-center justify-around py-2 px-4 z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        
        <Link to="/shipper/orders" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${path === '/shipper/orders' ? 'text-primary' : 'text-outline hover:text-primary'}`}>
          <div className={`${path === '/shipper/orders' ? 'bg-primary/10 p-1.5 rounded-full' : 'p-1.5'}`}>
             <Package size={22} className={path === '/shipper/orders' ? 'fill-primary/20' : ''} />
          </div>
          <span className={`text-[10px] ${path === '/shipper/orders' ? 'font-extrabold' : 'font-medium'}`}>Đơn hàng</span>
        </Link>
        
        <Link to="/shipper/earnings" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${path === '/shipper/earnings' ? 'text-primary' : 'text-outline hover:text-primary'}`}>
          <div className={`${path === '/shipper/earnings' ? 'bg-primary/10 p-1.5 rounded-full' : 'p-1.5'}`}>
             <Wallet size={22} className={path === '/shipper/earnings' ? 'fill-primary/20' : ''} />
          </div>
          <span className={`text-[10px] ${path === '/shipper/earnings' ? 'font-extrabold' : 'font-medium'}`}>Thu nhập</span>
        </Link>

        <Link to="/shipper/profile" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${path === '/shipper/profile' ? 'text-primary' : 'text-outline hover:text-primary'}`}>
          <div className={`${path === '/shipper/profile' ? 'bg-primary/10 p-1.5 rounded-full' : 'p-1.5'}`}>
             <User size={22} className={path === '/shipper/profile' ? 'fill-primary/20' : ''} />
          </div>
          <span className={`text-[10px] ${path === '/shipper/profile' ? 'font-extrabold' : 'font-medium'}`}>Tài khoản</span>
        </Link>

      </nav>
      </div>
    </ShipperContext.Provider>
  );
};

export default ShipperLayout;
