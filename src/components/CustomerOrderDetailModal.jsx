import React, { useState } from 'react';
import { X, Package, MapPin, CheckCircle, Truck, Clock, Phone, Camera, Star, User } from 'lucide-react';
import apiClient from '../apiClient';

const CustomerOrderDetailModal = ({ isOpen, onClose, order }) => {
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const handleOpenReview = async (item) => {
    setReviewingItem(item);
    setReviewRating(5);
    setReviewContent('');
    setHasExistingReview(false);
    try {
      const res = await apiClient.get(`/shop/products/${item.ProductId}/reviews/me`);
      if (res.data) {
        setReviewRating(res.data.Rating);
        setReviewContent(res.data.Content);
        setHasExistingReview(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không?')) return;
    try {
      await apiClient.delete(`/shop/products/${reviewingItem.ProductId}/reviews`);
      alert('Đã xóa đánh giá thành công');
      setReviewingItem(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi: Đã xảy ra lỗi khi xóa đánh giá');
    }
  };

  const submitReview = async () => {
    if (!reviewContent.trim()) return alert('Vui lòng nhập nội dung đánh giá');
    try {
      await apiClient.post(`/shop/products/${reviewingItem.ProductId}/reviews`, {
        rating: reviewRating,
        content: reviewContent
      });
      alert('Đã gửi đánh giá thành công');
      setReviewingItem(null);
      setReviewContent('');
      setReviewRating(5);
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi: Đã xảy ra lỗi khi gửi đánh giá');
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      await apiClient.put(`/customer/orders/${order.Id || order.id}/cancel`);
      alert('Đã hủy đơn hàng thành công!');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi: Không thể hủy đơn hàng');
    }
  };

  if (!isOpen || !order) return null;

  const isStorePickup = order.Type === 'POS' || order.DeliveryMethod === 'STORE_PICKUP';

  // Render proof of delivery if order is completed
  const renderProofOfDelivery = () => {
    const status = order.status || order.Status;
    if (status === 'Hoàn thành' || status === 'COMPLETED') {
      return (
        <div className="mt-6 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
           <h4 className="text-sm font-extrabold text-on-surface mb-3 flex items-center gap-2">
             <User size={16} className="text-primary" />
             Thông tin xử lý đơn hàng
           </h4>
           <div className="flex gap-4">
             <div className="flex-1">
               <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">{isStorePickup ? 'Nhân viên hoàn thành' : 'Shipper giao hàng'}</p>
               <p className="text-sm font-extrabold text-on-surface mb-2">{isStorePickup ? (order.CashierName || 'Nhân viên cửa hàng') : (order.ShipperName || 'Chưa cập nhật')}</p>
               
               <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-black uppercase mt-2">
                 <CheckCircle size={14} /> {isStorePickup ? 'Hoàn thành tại shop' : 'Giao thành công'}
               </div>
             </div>
           </div>
        </div>
      );
    }
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-green-500 text-white';
      case 'Đang giao': return 'bg-blue-500 text-white';
      case 'Đang xử lý': return 'bg-orange-500 text-white';
      case 'Đã hủy': return 'bg-error text-white';
      default: return 'bg-outline text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest shrink-0">
          <div>
             <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
               Chi tiết đơn hàng {order.id || order.OrderCode || order.Id}
             </h2>
             <p className="text-sm font-medium text-outline mt-1">{order.date || (order.CreatedAt ? new Date(order.CreatedAt).toLocaleDateString('vi-VN') : '')}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-surface-container-low rounded-full flex items-center justify-center text-on-surface hover:bg-error hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-surface-container-lowest">
          
          {/* Status Timeline */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${getStatusColor(order.status || order.Status)}`}>
                {order.status || order.Status}
              </span>
              <span className="text-sm font-bold text-on-surface">Tổng: {Number((order.total || order.TotalAmount || 0)).toLocaleString('vi-VN')}đ</span>
            </div>
            
            {isStorePickup ? (
              order.Type === 'POS' ? (
                <div className="relative pt-6">
                  <div className="flex gap-4 relative z-10 mb-6">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm bg-green-500 text-white`}>
                     <CheckCircle size={20} />
                   </div>
                   <div className="pt-2">
                     <h4 className="font-extrabold text-on-surface">Giao dịch tại cửa hàng</h4>
                     <p className="text-xs font-medium text-outline">Thành công</p>
                   </div>
                  </div>
                </div>
              ) : (
                <div className="relative pt-6">
                  <div className="absolute left-6 top-10 bottom-10 w-1 bg-surface-container-high rounded-full overflow-hidden">
                     <div className={`w-full bg-primary transition-all duration-1000 ${
                       (order.status || order.Status) === 'COMPLETED' ? 'h-full' : 
                       (order.status || order.Status) === 'PROCESSING' ? 'h-1/2' : 'h-0'
                     }`}></div>
                   </div>

                   <div className="flex gap-4 relative z-10 mb-6">
                     <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm bg-primary text-white">
                       <Package size={20} />
                     </div>
                     <div className="pt-2">
                       <h4 className="font-extrabold text-on-surface">Đã đặt hàng</h4>
                       <p className="text-xs font-medium text-outline">{order.date || (order.CreatedAt ? new Date(order.CreatedAt).toLocaleDateString('vi-VN') : '')}</p>
                     </div>
                   </div>

                   {(order.status || order.Status) === 'CANCELLED' || (order.status || order.Status) === 'Đã hủy' ? (
                     <div className="flex gap-4 relative z-10 mb-6">
                       <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm bg-error text-white">
                         <X size={20} />
                       </div>
                       <div className="pt-2">
                         <h4 className="font-extrabold text-error">Đã hủy</h4>
                         <p className="text-xs font-medium text-error/80">Đơn hàng đã bị hủy</p>
                       </div>
                     </div>
                   ) : (
                     <>
                       <div className={`flex gap-4 relative z-10 mb-6 ${(order.status || order.Status) === 'PENDING' && 'opacity-50'}`}>
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${(order.status || order.Status) !== 'PENDING' ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'}`}>
                           <Clock size={20} />
                         </div>
                         <div className="pt-2">
                           <h4 className="font-extrabold text-on-surface">Đang chuẩn bị</h4>
                           <p className="text-xs font-medium text-outline">
                             {(order.status || order.Status) !== 'PENDING' ? 'Cửa hàng đang xử lý đơn' : 'Đang chờ xử lý'}
                           </p>
                         </div>
                       </div>

                       <div className={`flex gap-4 relative z-10 ${((order.status || order.Status) !== 'Hoàn thành' && (order.status || order.Status) !== 'COMPLETED') && 'opacity-50'}`}>
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${((order.status || order.Status) === 'Hoàn thành' || (order.status || order.Status) === 'COMPLETED') ? 'bg-green-500 text-white' : 'bg-surface-container-high text-outline'}`}>
                           <CheckCircle size={20} />
                         </div>
                         <div className="pt-2">
                           <h4 className="font-extrabold text-on-surface">Đã nhận hàng</h4>
                           <p className="text-xs font-medium text-outline">
                             {((order.status || order.Status) === 'Hoàn thành' || (order.status || order.Status) === 'COMPLETED') ? 'Hoàn tất giao dịch' : 'Chờ khách nhận'}
                           </p>
                         </div>
                       </div>
                     </>
                   )}
                </div>
              )
            ) : (
              <div className="relative pt-6">
                 <div className="absolute left-6 top-10 bottom-6 w-0.5 bg-outline-variant/50"></div>
                 
                 <div className="flex gap-4 relative z-10 mb-6">
                   <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
                     <Package size={20} />
                   </div>
                   <div className="pt-2">
                     <h4 className="font-extrabold text-on-surface">Đơn hàng đã đặt</h4>
                     <p className="text-xs font-medium text-outline">09:00 - {order.date || (order.CreatedAt ? new Date(order.CreatedAt).toLocaleDateString('vi-VN') : '')}</p>
                   </div>
                 </div>

                 {(order.status || order.Status) === 'CANCELLED' || (order.status || order.Status) === 'Đã hủy' ? (
                     <div className="flex gap-4 relative z-10 mb-6">
                       <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm bg-error text-white">
                         <X size={20} />
                       </div>
                       <div className="pt-2">
                         <h4 className="font-extrabold text-error">Đã hủy</h4>
                         <p className="text-xs font-medium text-error/80">Đơn hàng đã bị hủy</p>
                       </div>
                     </div>
                  ) : (
                    <>
                      <div className={`flex gap-4 relative z-10 mb-6 ${(order.status || order.Status) === 'Đang xử lý' && 'opacity-50'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${(order.status || order.Status) !== 'Đang xử lý' ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'}`}>
                          <Truck size={20} />
                        </div>
                        <div className="pt-2">
                          <h4 className="font-extrabold text-on-surface">Đang giao hàng</h4>
                          <p className="text-xs font-medium text-outline">
                            {(order.status || order.Status) !== 'Đang xử lý' ? '10:15 - ' + (order.date || (order.CreatedAt ? new Date(order.CreatedAt).toLocaleDateString('vi-VN') : '')) : 'Chờ lấy hàng'}
                          </p>
                        </div>
                      </div>

                      <div className={`flex gap-4 relative z-10 ${((order.status || order.Status) !== 'Hoàn thành' && (order.status || order.Status) !== 'COMPLETED') && 'opacity-50'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${((order.status || order.Status) === 'Hoàn thành' || (order.status || order.Status) === 'COMPLETED') ? 'bg-green-500 text-white' : 'bg-surface-container-high text-outline'}`}>
                          <CheckCircle size={20} />
                        </div>
                        <div className="pt-2">
                          <h4 className="font-extrabold text-on-surface">Giao hàng thành công</h4>
                          <p className="text-xs font-medium text-outline">
                            {((order.status || order.Status) === 'Hoàn thành' || (order.status || order.Status) === 'COMPLETED') ? '14:30 - ' + (order.date || (order.CreatedAt ? new Date(order.CreatedAt).toLocaleDateString('vi-VN') : '')) : 'Chờ giao hàng'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
              </div>
            )}
          </div>

          {/* Proof of Delivery */}
          {renderProofOfDelivery()}

          {/* Address & Store Info */}
          <div className="mt-8 bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
            {isStorePickup ? (
              <>
                <h3 className="font-extrabold text-on-surface mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-primary" /> Nhận tại cửa hàng
                </h3>
                <div className="text-sm font-medium text-on-surface space-y-1">
                  <p className="font-bold">Chi nhánh chính PetLove</p>
                  <p className="text-outline flex items-center gap-2"><Phone size={14}/> 1900 1234</p>
                  <p className="text-outline leading-relaxed mt-2 pt-2 border-t border-outline-variant/20">
                    268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-extrabold text-on-surface mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-primary" /> Thông tin nhận hàng
                </h3>
                <div className="text-sm font-medium text-on-surface space-y-1">
                  <p className="font-bold">{order.ReceiverName || 'Khách hàng'}</p>
                  <p className="text-outline flex items-center gap-2"><Phone size={14}/> {order.ReceiverPhone || 'Chưa cung cấp'}</p>
                  <p className="text-outline leading-relaxed mt-2 pt-2 border-t border-outline-variant/20">
                    {order.FullAddress || 'Chưa cung cấp địa chỉ'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Payment Method */}
          <div className="mt-6 bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-extrabold text-on-surface mb-3">Phương thức thanh toán</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-on-surface">
                {order.PaymentMethod?.toUpperCase() === 'VNPAY' ? 'Thanh toán VNPay' : 
                 order.PaymentMethod?.toUpperCase() === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 
                 order.PaymentMethod || (isStorePickup ? 'Tiền mặt' : 'Thanh toán khi nhận hàng')}
              </span>
              <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg ${order.IsPaid ? 'bg-green-100 text-green-700' : 'bg-surface-container-high text-outline'}`}>
                {order.IsPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="mt-6 bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
            <h3 className="font-extrabold text-on-surface mb-4">Sản phẩm đã mua</h3>
            <div className="space-y-4">
              {order.items && order.items.length > 0 ? order.items.map(item => (
                <div key={item.Id} className="flex gap-3">
                  <div className="w-16 h-16 bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center">
                    {item.ImageUrl ? (
                      <img src={item.ImageUrl} alt={item.ProductName || item.PetName} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={24} className="text-outline/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-on-surface line-clamp-1">{item.ProductName || item.PetName}</h4>
                    {item.Variant && <p className="text-xs text-outline font-medium mt-1">Phân loại: {item.Variant}</p>}
                    <div className="flex items-center justify-between mt-1">
                      <div>
                        <span className="text-xs font-black text-on-surface">x{item.Quantity}</span>
                        <span className="text-sm font-bold text-primary ml-2">{Number((item.Price || 0)).toLocaleString('vi-VN')}đ</span>
                      </div>
                      {((order.status || order.Status) === 'Hoàn thành' || (order.status || order.Status) === 'COMPLETED') && item.ProductId && (
                        <button 
                          onClick={() => handleOpenReview(item)}
                          className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors"
                        >
                          Đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-outline">Không có sản phẩm nào.</p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-2">
               <div className="flex justify-between text-sm">
                 <span className="text-outline font-medium">Tạm tính</span>
                 <span className="font-bold text-on-surface">{Number((order.SubTotal || 0)).toLocaleString('vi-VN')}đ</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-outline font-medium">Phí vận chuyển</span>
                 <span className="font-bold text-on-surface">{Number((order.ShippingFee || 0)).toLocaleString('vi-VN')}đ</span>
               </div>
               {order.Discount > 0 && (
                 <div className="flex justify-between text-sm">
                   <span className="text-outline font-medium">Giảm giá</span>
                   <span className="font-bold text-error">-{Number((order.Discount || 0)).toLocaleString('vi-VN')}đ</span>
                 </div>
               )}
               <div className="flex justify-between text-base mt-2 pt-2 border-t border-outline-variant/20">
                 <span className="font-extrabold text-on-surface">Thành tiền</span>
                 <span className="font-black text-primary text-lg">{Number((order.total || order.TotalAmount || 0)).toLocaleString('vi-VN')}đ</span>
               </div>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 bg-white shrink-0 flex justify-end gap-3">
           {(order.status === 'PENDING' || order.status === 'PENDING_PAYMENT' || order.Status === 'PENDING' || order.Status === 'PENDING_PAYMENT' || order.Status === 'Chờ xác nhận') && (
             <button onClick={handleCancelOrder} className="px-6 py-2.5 rounded-xl font-bold text-error bg-error/10 hover:bg-error/20 transition-colors mr-auto">
               Hủy đơn hàng
             </button>
           )}
           <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-outline hover:bg-surface-container-low transition-colors">
             Đóng
           </button>
           <button className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-primary hover:bg-primary/90 transition-transform active:scale-95 shadow-md">
             Mua lại
           </button>
        </div>
      </div>

      {/* Review Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setReviewingItem(null)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-on-surface mb-4">Đánh giá sản phẩm</h3>
            <p className="text-sm font-bold text-outline mb-4 line-clamp-2">{reviewingItem.ProductName}</p>
            
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={32} 
                  className={`cursor-pointer transition-all hover:scale-110 ${star <= reviewRating ? "fill-orange-400 text-orange-400" : "text-outline-variant fill-surface-variant"}`} 
                  onClick={() => setReviewRating(star)}
                />
              ))}
            </div>

            <textarea 
              className="w-full p-4 rounded-xl border border-outline-variant/50 text-sm mb-4 focus:outline-primary focus:ring-4 focus:ring-primary/10 transition-all" 
              rows="4" 
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này nhé..." 
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
            ></textarea>

            <div className="flex gap-3 justify-end w-full">
              {hasExistingReview && (
                <button 
                  onClick={handleDeleteReview} 
                  className="px-5 py-2.5 rounded-xl font-bold text-error bg-error/10 hover:bg-error/20 transition-colors mr-auto"
                >
                  Xóa
                </button>
              )}
              <button 
                onClick={() => setReviewingItem(null)} 
                className="px-5 py-2.5 rounded-xl font-bold text-outline hover:bg-surface-container-low transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={submitReview} 
                className="px-5 py-2.5 rounded-xl font-extrabold text-white bg-primary hover:bg-primary/90 transition-transform active:scale-95 shadow-md"
              >
                {hasExistingReview ? 'Lưu thay đổi' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderDetailModal;
