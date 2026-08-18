import React, { useState, useEffect, forwardRef, useRef } from 'react';
import { Search, Bell, Clock, Package, AlertCircle } from 'lucide-react';
import apiClient from '../apiClient';

const ManagerHeader = forwardRef(({ placeholder = "Tìm kiếm... (F1)", onSearch, onChange }, ref) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  
  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('newOrderReceived', fetchNotifications);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('newOrderReceived', fetchNotifications);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/manager/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Lỗi lấy thông báo:', error);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      await apiClient.put('/manager/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  return (
    <header className="sticky top-0 z-40 flex justify-between items-center w-full h-[72px] shrink-0 px-8 bg-white/80 backdrop-blur-md border-b border-outline-variant/30">
      <div className="flex items-center flex-1 max-w-2xl group">
        {/* Thanh tìm kiếm đã được chuyển vào các trang cụ thể */}
      </div>
      <div className="flex items-center gap-3 ml-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-surface-container-low text-outline hover:text-on-surface transition-all relative"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-error rounded-full border-2 border-white"></span>
            )}
          </button>
          
          {isNotifOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4">
              <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
                <h3 className="font-extrabold text-on-surface text-sm">Thông báo (Quản trị)</h3>
                <button onClick={handleMarkAsRead} className="text-[10px] text-primary font-bold hover:underline">Đánh dấu đã đọc</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-outline text-sm">Không có thông báo nào</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.Id} className={`p-4 border-b border-outline-variant/20 hover:bg-surface-container-lowest transition-colors cursor-pointer ${!n.IsRead ? 'bg-primary/5' : ''}`}>
                      <p className="text-sm font-bold text-on-surface mb-1 flex items-center gap-2">
                        {n.Type === 'ORDER' ? <Package size={16} className="text-primary"/> : <AlertCircle size={16} className="text-error"/>} 
                        {n.Title}
                      </p>
                      <p className="text-xs font-medium text-outline">{n.Content}</p>
                      <p className="text-[10px] text-outline/70 font-bold mt-2">
                        {new Date(n.CreatedAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-2xl text-on-surface-variant font-bold border border-outline-variant/20 shadow-inner">
          <Clock size={18} className="text-primary" />
          <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </header>
  );
});

export default ManagerHeader;
