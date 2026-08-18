import React, { useState, useEffect, useContext } from 'react';
import { Package, MapPin, Clock, PhoneCall, CheckCircle, PowerOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import GenericModal from './GenericModal';
import apiClient from '../apiClient';
import { ShipperContext } from './ShipperLayout';

const ShipperOrdersPage = () => {
  const [tab, setTab] = useState('available');
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const { isOnline } = useContext(ShipperContext);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get('/shipper/orders');
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenAccept = (order) => {
    setSelectedOrder(order);
    setIsAcceptModalOpen(true);
  };

  const handleAcceptConfirm = async () => {
    if (!selectedOrder) return;
    try {
      await apiClient.put(`/shipper/orders/${selectedOrder.Id}/status`, { status: 'DELIVERING' });
      fetchOrders();
      setTab('active');
    } catch (error) {
      console.error(error);
      alert('Lỗi nhận đơn');
    }
    setIsAcceptModalOpen(false);
  };

  const availableOrders = orders.filter(o => !o.ShipperId && (o.Status === 'PENDING' || o.Status === 'PROCESSING' || o.Status === 'DELIVERING'));
  const activeOrders = orders.filter(o => o.ShipperId && o.Status === 'DELIVERING');

  return (
    <div className="flex flex-col min-h-full bg-surface-container-lowest">
      
      {/* Tab Header */}
      <div className="bg-white border-b border-outline-variant/30 flex px-4 pt-2 sticky top-0 z-10">
        <button 
          onClick={() => setTab('available')}
          className={`flex-1 py-3 text-sm font-extrabold text-center transition-all border-b-2 ${tab === 'available' ? 'border-primary text-primary' : 'border-transparent text-outline'}`}
        >
          Đơn chờ nhận ({availableOrders.length})
        </button>
        <button 
          onClick={() => setTab('active')}
          className={`flex-1 py-3 text-sm font-extrabold text-center transition-all border-b-2 ${tab === 'active' ? 'border-primary text-primary' : 'border-transparent text-outline'}`}
        >
          Đang giao ({activeOrders.length})
        </button>
      </div>

      {!isOnline ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest">
          <div className="w-20 h-20 bg-surface-variant rounded-full flex items-center justify-center mb-4">
            <PowerOff size={32} className="text-outline" />
          </div>
          <h2 className="text-lg font-extrabold text-on-surface mb-2">Bạn đang ngoại tuyến</h2>
          <p className="text-sm text-outline font-medium">Vui lòng bật trạng thái trực tuyến (góc trên bên phải) để nhận và xem đơn hàng.</p>
        </div>
      ) : (
        <div className="flex-1 p-4 flex flex-col gap-4 pb-24">
        {tab === 'available' && availableOrders.map(order => (
          <div key={order.Id} className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-4 relative overflow-hidden">
             
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="font-extrabold text-on-surface">{order.OrderCode}</span>
                 <span className="text-[10px] text-outline flex items-center gap-1"><Clock size={10} /> {new Date(order.CreatedAt).toLocaleString('vi-VN')}</span>
               </div>
               <div className="flex items-start gap-2 text-sm text-outline font-medium">
                 <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                 <span>{order.Address || 'Chưa có địa chỉ'}</span>
               </div>
             </div>

             <div className="flex items-center justify-between border-t border-dashed border-outline-variant/50 pt-3">
               <div>
                 <span className="text-[10px] text-outline font-bold uppercase tracking-widest block">Thù lao nhận được</span>
                 <span className="font-black text-primary text-lg">{Number(order.Earnings || 0).toLocaleString('vi-VN')}đ</span>
               </div>
               <button 
                 onClick={() => handleOpenAccept(order)}
                 className="bg-primary text-white font-extrabold px-6 py-2 rounded-xl text-sm hover:bg-primary/90 active:scale-95 transition-all shadow-md"
               >
                 Nhận đơn
               </button>
             </div>
          </div>
        ))}

        {tab === 'active' && activeOrders.map(order => (
          <div key={order.Id} className="bg-white rounded-2xl p-4 shadow-sm border border-primary/30 flex flex-col gap-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-bl-xl flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span> {order.Status}
             </div>
             
             <Link to={`/shipper/order/${order.OrderCode}`} className="block">
               <div className="flex items-center gap-2 mb-2">
                 <span className="font-extrabold text-on-surface">{order.OrderCode}</span>
               </div>
               <div className="flex items-start gap-2 text-sm text-on-surface font-medium mb-2">
                 <MapPin size={16} className="text-error shrink-0 mt-0.5" />
                 <span>{order.Address || 'Chưa có địa chỉ'}</span>
               </div>
               <div className="flex items-start gap-2 text-sm text-outline font-medium">
                 <Package size={16} className="text-secondary shrink-0 mt-0.5" />
                 <span>Người nhận: {order.CustomerName}</span>
               </div>
             </Link>

             <div className="flex items-center gap-2 border-t border-dashed border-outline-variant/50 pt-3">
               <div className="flex-1">
                 <span className="text-[10px] text-outline font-bold uppercase tracking-widest block">Thu hộ (COD)</span>
                 <span className="font-black text-on-surface text-lg">{Number((order.PaymentMethod?.toUpperCase() === 'COD' ? Number(order.TotalAmount) : 0)).toLocaleString('vi-VN')}đ</span>
               </div>
               <a href={`tel:${order.CustomerPhone}`} className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm">
                 <PhoneCall size={18} />
               </a>
               <Link to={`/shipper/order/${order.OrderCode}`} className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm">
                 <CheckCircle size={18} />
               </Link>
             </div>
          </div>
        ))}
      </div>
      )}

      <GenericModal 
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        title="Xác nhận nhận đơn"
        icon={Package}
        maxWidth="max-w-md"
        actions={
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setIsAcceptModalOpen(false)}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleAcceptConfirm}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm"
            >
              Nhận đơn
            </button>
          </div>
        }
      >
        <div className="text-center p-4">
          <p className="text-outline font-medium mb-4">
            Bạn có chắc chắn muốn nhận đơn hàng này để giao không?
          </p>
          {selectedOrder && (
            <div className="p-3 bg-surface-container-low rounded-xl text-on-surface font-bold text-sm border border-outline-variant/30">
              Đơn hàng {selectedOrder.OrderCode}
            </div>
          )}
        </div>
      </GenericModal>
      
    </div>
  );
};

export default ShipperOrdersPage;
