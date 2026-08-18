import React, { useState, useEffect, useContext } from 'react';
import { 
  X, MapPin, Phone, User, Package, Printer, 
  CheckCircle, Clock, Truck, ChevronRight
} from 'lucide-react';
import apiClient from '../apiClient';
import { AuthContext } from '../context/AuthContext';

const OrderDetailModal = ({ isOpen, onClose, order: initialOrder, onStatusUpdate }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (isOpen && initialOrder?.id) {
      fetchOrderDetails(initialOrder.id);
    }
  }, [isOpen, initialOrder]);

  const fetchOrderDetails = async (orderCode) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/manager/orders/${orderCode}`);
      const data = res.data;
      
      let orderType = 'DELIVERY';
      if (data.Type === 'POS') {
        orderType = 'POS';
      } else if (data.DeliveryMethod === 'STORE_PICKUP') {
        orderType = 'PICKUP';
      }

      let statusSteps = [];
      let statusOrder = [];

      if (orderType === 'PICKUP') {
        statusSteps = [
          { status: 'Đơn hàng tạo thành công', code: 'PENDING', time: data.CreatedAt ? new Date(data.CreatedAt).toLocaleString('vi-VN') : '' },
          { status: 'Đang chuẩn bị', code: 'PROCESSING', time: '' },
          { status: 'Đã nhận hàng', code: 'COMPLETED', time: '' }
        ];
        statusOrder = ['PENDING', 'PROCESSING', 'COMPLETED'];
      } else if (orderType === 'POS') {
        statusSteps = [
          { status: 'Mua tại quầy', code: 'COMPLETED', time: data.CreatedAt ? new Date(data.CreatedAt).toLocaleString('vi-VN') : '' }
        ];
        statusOrder = ['COMPLETED'];
      } else {
        statusSteps = [
          { status: 'Đơn hàng tạo thành công', code: 'PENDING', time: data.CreatedAt ? new Date(data.CreatedAt).toLocaleString('vi-VN') : '' },
          { status: 'Đang xử lý', code: 'PROCESSING', time: '' },
          { status: 'Đang giao hàng', code: 'DELIVERING', time: '' },
          { status: 'Giao thành công', code: 'COMPLETED', time: '' }
        ];
        statusOrder = ['PENDING', 'PROCESSING', 'DELIVERING', 'COMPLETED'];
      }

      // Determine how far the timeline goes based on current status
      const currentIndex = statusOrder.indexOf(data.Status);
      const timeline = statusSteps.map((step, idx) => {
        let stepTime = '';
        if (idx === 0) stepTime = step.time;
        else if (idx === currentIndex && data.Status !== 'COMPLETED') stepTime = 'Đang thực hiện';
        
        if (step.code === 'COMPLETED' && data.Status === 'COMPLETED') {
          stepTime = data.CompletedAt ? new Date(data.CompletedAt).toLocaleString('vi-VN') : 'Đã hoàn thành';
        }
        
        return {
          ...step,
          completed: idx <= currentIndex || data.Status === 'COMPLETED',
          time: stepTime
        };
      });

      // Cancelled has a different timeline
      if (data.Status === 'CANCELLED') {
        timeline.splice(1, 3, { status: 'Đã hủy', code: 'CANCELLED', time: 'Đã hủy đơn', completed: true });
      }

      setOrderDetails({
        id: data.OrderCode,
        uuid: data.Id,
        status: data.Status,
        orderType: orderType,
        date: data.CreatedAt ? new Date(data.CreatedAt).toLocaleString('vi-VN') : '',
        completedAt: data.CompletedAt ? new Date(data.CompletedAt).toLocaleString('vi-VN') : null,
        customer: {
          name: data.CustomerName || 'Khách vãng lai',
          phone: data.CustomerPhone || '--',
          address: data.AddressLine1 || 'Mua tại quầy',
        },
        items: data.items.map(i => ({
          id: i.Id,
          name: i.ProductName,
          variant: i.Variant || (i.StorePetId ? 'Thú cưng' : 'Sản phẩm'),
          price: Number(i.Price),
          qty: i.Quantity,
          image: i.ItemImage
        })),
        subtotal: Number(data.SubTotal),
        shippingFee: Number(data.ShippingFee || 0),
        discount: Number(data.Discount || 0),
        total: Number(data.TotalAmount),
        paymentMethod: 
          data.PaymentMethod?.toUpperCase() === 'VNPAY' ? 'Thanh toán VNPay' :
          data.PaymentMethod?.toUpperCase() === 'COD' ? 'Thanh toán khi nhận hàng (COD)' :
          data.PaymentMethod === 'CHUYỂN KHOẢN' ? 'Chuyển khoản' : 'Thanh toán tiền mặt',
        isPaid: Boolean(data.IsPaid),
        notes: data.Notes || 'Không có ghi chú',
        timeline: timeline
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading || !orderDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white p-8 rounded-3xl z-10 flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-outline">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  const handleUpdateStatus = async (newStatus) => {
    try {
      if (!orderDetails?.uuid) return;
      if (newStatus === 'COMPLETED' && !orderDetails.isPaid) {
        alert('Không thể hoàn thành đơn hàng vì khách hàng chưa thanh toán!');
        return;
      }
      await apiClient.put(`/manager/orders/${orderDetails.uuid}/status`, { status: newStatus });
      fetchOrderDetails(orderDetails.id);
      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error(error);
      alert('Lỗi cập nhật trạng thái đơn hàng');
    }
  };

  const handlePrint = () => {
    const html = `
      <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
          <title>Phiếu xuất hàng ${orderDetails.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .info { margin-bottom: 20px; font-size: 14px; }
            .info div { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; }
            .summary { text-align: right; font-size: 14px; }
            .summary div { margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 50px; font-style: italic; font-size: 12px; color: #666; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h2>CỬA HÀNG THÚ CƯNG PET SHOP</h2>
            <h3>PHIẾU XUẤT HÀNG / HÓA ĐƠN</h3>
            <p>Mã đơn: ${orderDetails.id}</p>
          </div>
          <div class="info">
            <div><strong>Khách hàng:</strong> ${orderDetails.customer.name}</div>
            <div><strong>Điện thoại:</strong> ${orderDetails.customer.phone}</div>
            <div><strong>Địa chỉ:</strong> ${orderDetails.customer.address}</div>
            <div><strong>Ngày đặt:</strong> ${orderDetails.date}</div>
            <div><strong>Ghi chú:</strong> ${orderDetails.notes}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên sản phẩm</th>
                <th>Phân loại</th>
                <th>SL</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${orderDetails.items.map((item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.variant}</td>
                  <td>${item.qty}</td>
                  <td>${item.price.toLocaleString("vi-VN")}đ</td>
                  <td>${(item.price * item.qty).toLocaleString("vi-VN")}đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="summary">
            <div>Tạm tính: ${orderDetails.subtotal.toLocaleString("vi-VN")}đ</div>
            <div>Phí vận chuyển: ${orderDetails.shippingFee.toLocaleString("vi-VN")}đ</div>
            <div>Khuyến mãi: -${orderDetails.discount.toLocaleString("vi-VN")}đ</div>
            <div class="total">Tổng cộng: ${orderDetails.total.toLocaleString("vi-VN")}đ</div>
          </div>
          <div class="footer">
            Cảm ơn quý khách đã mua sắm tại Pet Shop!<br/>
            Hẹn gặp lại quý khách!
          </div>
        </body>
        </html>
      `;
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Vui lòng cho phép popup để in phiếu');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-extrabold text-on-surface">Chi tiết đơn hàng {orderDetails.id}</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-orange-100 text-orange-600 border border-orange-200">
              {orderDetails.status}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#fbf9f8]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Order Items & Timeline */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Timeline */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  Tiến độ đơn hàng
                </h3>
                <div className="relative">
                  <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-outline-variant/30"></div>
                  <div className="space-y-4 relative">
                    {orderDetails.timeline.map((step, index) => (
                      <div key={index} className="flex gap-4">
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.completed ? 'bg-primary text-white' : 'bg-surface-container-high text-outline'}`}>
                          {step.completed ? <CheckCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-outline"></div>}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${step.completed ? 'text-on-surface' : 'text-outline'}`}>{step.status}</p>
                          {step.time && <p className="text-xs font-medium text-outline mt-0.5">{step.time}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest flex items-center gap-2">
                  <Package size={20} className="text-primary" />
                  <h3 className="text-lg font-bold text-on-surface">Sản phẩm ({orderDetails.items.length})</h3>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {orderDetails.items.map(item => (
                    <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-outline-variant/20">
                        <img src={item.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-on-surface line-clamp-2">{item.name}</h4>
                          <p className="text-sm font-medium text-outline mt-1">Phân loại: {item.variant}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold text-on-surface-variant">SL: x{item.qty}</span>
                          <span className="font-black text-primary">{item.price.toLocaleString("vi-VN")}đ</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Summary inside items block */}
                <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/30 space-y-3">
                  <div className="flex justify-between text-sm font-medium text-on-surface-variant">
                    <span>Tạm tính</span>
                    <span>{orderDetails.subtotal.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-on-surface-variant">
                    <span>Phí vận chuyển</span>
                    <span>{orderDetails.shippingFee.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-on-surface-variant">
                    <span>Khuyến mãi</span>
                    <span className="text-green-600">-{orderDetails.discount.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-outline-variant/30 flex justify-between items-center">
                    <span className="font-bold text-on-surface">Tổng cộng</span>
                    <span className="text-xl font-black text-primary">{orderDetails.total.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="text-right text-xs font-medium text-outline">
                    Đã bao gồm VAT (nếu có)
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Customer Info & Actions */}
            <div className="space-y-6">
              
              {/* Customer Info */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                  <User size={20} className="text-primary" />
                  Khách hàng
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-outline mb-1">Người nhận</p>
                    <p className="font-bold text-on-surface">{orderDetails.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-outline mb-1 flex items-center gap-1">
                      <Phone size={14} /> Số điện thoại
                    </p>
                    <p className="font-bold text-on-surface">{orderDetails.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-outline mb-1 flex items-center gap-1">
                      <MapPin size={14} /> Địa chỉ giao hàng
                    </p>
                    <p className="font-bold text-on-surface text-sm leading-relaxed">{orderDetails.customer.address}</p>
                  </div>
                </div>
              </div>

              {/* Payment & Notes */}
              <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-outline mb-1">Thanh toán</h3>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-on-surface text-sm">{orderDetails.paymentMethod}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${orderDetails.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {orderDetails.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-outline mb-1">Ghi chú của khách</h3>
                  <div className="bg-surface-container-low p-3 rounded-xl">
                    <p className="text-sm font-medium text-on-surface italic">{orderDetails.notes || 'Không có ghi chú'}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant/30 bg-white flex flex-wrap-reverse sm:flex-nowrap items-center justify-between gap-4">
          <button 
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-outline-variant/50 text-on-surface font-bold text-sm hover:bg-surface-container-low transition-all shadow-sm active:scale-95"
            onClick={onClose}
          >
            Đóng
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-outline-variant/50 rounded-xl hover:bg-surface-container-low transition-all active:scale-95 shadow-sm text-sm font-bold text-on-surface"
            >
              <Printer size={18} className="text-outline" />
              In phiếu
            </button>
            
            <div className="flex-1 flex flex-wrap items-center justify-end gap-2">
              <select
                className="w-auto min-w-[140px] h-full min-h-[44px] px-3 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-bold text-sm"
                value={orderDetails.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={orderDetails.status === 'COMPLETED' && user?.role === 'STAFF'}
              >
                <option value="PENDING">Chờ xác nhận</option>
                <option value="PROCESSING">Đang chuẩn bị</option>
                {orderDetails.orderType !== 'PICKUP' && orderDetails.orderType !== 'POS' && <option value="DELIVERING">Đang giao hàng</option>}
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
              
              {orderDetails.status !== 'CANCELLED' && orderDetails.status !== 'COMPLETED' && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus('CANCELLED')}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all active:scale-95 shadow-sm text-sm font-extrabold"
                  >
                    <X size={16} />
                    Hủy
                  </button>
                  <button 
                    onClick={() => {
                      if (orderDetails.status === 'PENDING') handleUpdateStatus('PROCESSING');
                      else if (orderDetails.status === 'PROCESSING') handleUpdateStatus(orderDetails.orderType === 'PICKUP' ? 'COMPLETED' : 'DELIVERING');
                      else if (orderDetails.status === 'DELIVERING') handleUpdateStatus('COMPLETED');
                    }}
                    className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-sm font-extrabold whitespace-nowrap"
                  >
                    <CheckCircle size={16} />
                    {orderDetails.status === 'PENDING' ? 'Xác nhận đơn' : orderDetails.status === 'PROCESSING' ? (orderDetails.orderType === 'PICKUP' ? 'Khách đã nhận' : 'Giao Shipper') : 'Hoàn thành'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderDetailModal;
