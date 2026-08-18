import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, PhoneCall, CheckCircle, Camera, AlertCircle, Package, Copy, Image as ImageIcon } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import apiClient from '../apiClient';

const ShipperOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('Đang giao'); // Đã lấy -> Đang giao -> Đã giao
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await apiClient.get(`/shipper/orders/${id}`);
      setOrder({
        id: res.data.OrderCode,
        dbId: res.data.Id,
        address: res.data.Address || 'Chưa có địa chỉ',
        customer: res.data.CustomerName,
        phone: res.data.CustomerPhone,
        cod: res.data.PaymentMethod?.toUpperCase() === 'COD' ? Number(res.data.TotalAmount) : 0,
        status: res.data.Status,
        items: res.data.items.map(i => ({ name: i.ProductName, qty: i.Quantity }))
      });
      if (res.data.Status === 'COMPLETED') setStatus('Đã giao');
      else setStatus('Đang giao');
    } catch (error) {
      console.error(error);
      alert('Không thể tải đơn hàng');
      navigate('/shipper/orders');
    }
  };

  if (!order) return <div className="p-4 text-center">Đang tải...</div>;

  const handleUpdateStatus = async () => {
    if (status === 'Đang giao') {
      try {
        await apiClient.put(`/shipper/orders/${order.dbId}/status`, { status: 'COMPLETED' });
        setStatus('Đã giao');
      } catch (error) {
        console.error(error);
        alert('Lỗi cập nhật');
      }
    }
  };

  const handleFailDelivery = () => {
    setIsFailModalOpen(true);
  };

  const confirmFail = async () => {
    try {
      await apiClient.put(`/shipper/orders/${order.dbId}/status`, { status: 'CANCELLED' });
      setIsFailModalOpen(false);
      navigate('/shipper/orders');
    } catch (error) {
      console.error(error);
      alert('Lỗi cập nhật');
    }
  };

  const handleCopyAddress = () => {
    // In a real app: navigator.clipboard.writeText(order.address);
    alert('Đã sao chép địa chỉ: ' + order.address);
  };

  return (
    <div className="flex flex-col min-h-full bg-surface-container-lowest pb-24">
      
      {/* Header */}
      <div className="bg-primary text-white p-4 sticky top-0 z-20 flex items-center gap-3 shadow-md">
        <Link to="/shipper/orders" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-extrabold text-lg flex-1">Đơn {order.id}</h1>
      </div>

      <div className="p-4 space-y-4">
        
        {/* Status Tracker */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center justify-between text-xs font-bold text-outline">
          <div className="flex flex-col items-center gap-1 text-primary">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"><CheckCircle size={14} /></div>
            <span>Đã lấy</span>
          </div>
          <div className={`h-1 flex-1 mx-2 rounded-full ${status === 'Đã giao' ? 'bg-primary' : 'bg-outline-variant/30'}`}></div>
          <div className={`flex flex-col items-center gap-1 ${status === 'Đã giao' || status === 'Đang giao' ? 'text-primary' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'Đã giao' || status === 'Đang giao' ? 'bg-primary text-white' : 'bg-surface-variant'}`}>{status === 'Đã giao' ? <CheckCircle size={14} /> : '2'}</div>
            <span>Đang giao</span>
          </div>
          <div className={`h-1 flex-1 mx-2 rounded-full ${status === 'Đã giao' ? 'bg-primary' : 'bg-outline-variant/30'}`}></div>
          <div className={`flex flex-col items-center gap-1 ${status === 'Đã giao' ? 'text-primary' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'Đã giao' ? 'bg-primary text-white' : 'bg-surface-variant'}`}>{status === 'Đã giao' ? <CheckCircle size={14} /> : '3'}</div>
            <span>Hoàn thành</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-extrabold text-on-surface text-lg">{order.customer}</h2>
              <p className="text-sm font-medium text-outline mt-1">{order.phone}</p>
            </div>
            <a href={`tel:${order.phone}`} className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm">
              <PhoneCall size={18} />
            </a>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-xl relative group">
            <MapPin className="text-error shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium text-on-surface pr-8">{order.address}</p>
            <button onClick={handleCopyAddress} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-outline hover:text-primary transition-colors hover:bg-white rounded-full">
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 space-y-3">
          <h3 className="font-extrabold text-sm text-outline uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-2">
             <Package size={16} /> Chi tiết đơn hàng
          </h3>
          <ul className="space-y-2">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm font-medium text-on-surface">
                <span>{item.name}</span>
                <span className="font-bold">x{item.qty}</span>
              </li>
            ))}
          </ul>
          <div className="pt-3 mt-3 border-t border-dashed border-outline-variant/50 flex justify-between items-center bg-primary/5 p-3 rounded-xl">
            <span className="font-extrabold text-sm text-primary uppercase tracking-widest">Tiền thu hộ (COD)</span>
            <span className="font-black text-xl text-primary">{Number(order.cod).toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

      </div>

      {/* Floating Action Area */}
      <div className="fixed bottom-0 left-0 w-full max-w-md bg-white border-t border-outline-variant/30 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] pb-safe z-30 transform -translate-x-1/2 left-1/2">
        {status === 'Đã giao' ? (
          <div className="w-full bg-green-100 text-green-700 font-extrabold p-4 rounded-xl text-center flex items-center justify-center gap-2">
            <CheckCircle size={20} /> ĐÃ HOÀN THÀNH
          </div>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={handleFailDelivery}
              className="flex-1 bg-surface-container-low text-error font-bold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-error/10 transition-colors"
            >
              <AlertCircle size={20} /> Thất bại
            </button>
            <button 
              onClick={handleUpdateStatus}
              className="flex-[2] bg-primary text-white font-extrabold p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-transform shadow-md"
            >
              GIAO THÀNH CÔNG
            </button>
          </div>
        )}
      </div>


      <ConfirmDeleteModal 
        isOpen={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        onConfirm={confirmFail}
        itemName={`Đơn hàng ${order.id}`}
        title="Báo cáo giao thất bại"
        message="Bạn có chắc chắn muốn báo cáo đơn hàng này giao thất bại? Bạn sẽ cần giải trình lý do với cửa hàng sau đó."
        confirmText="Xác nhận thất bại"
      />

    </div>
  );
};

export default ShipperOrderDetailPage;
