import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  RefreshCw,
  Truck, Store, MonitorSmartphone, ChevronLeft, ChevronRight, ShoppingBag, Search
} from 'lucide-react';
import RequireShift from './RequireShift';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import OrderDetailModal from './OrderDetailModal';
import Pagination from './Pagination';
import apiClient from '../apiClient';

const OrdersPage = () => {
  const searchInputRef = useRef(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderType, setOrderType] = useState('ALL');
  const [activeShippers, setActiveShippers] = useState([]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/manager/orders?page=${page}&limit=10`);
setOrders(res.data.data || res.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveShippers = async () => {
    try {
      const res = await apiClient.get('/manager/shippers/active');
      setActiveShippers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
    fetchActiveShippers();
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('newOrderReceived', fetchOrders);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('newOrderReceived', fetchOrders);
    };
  }, [currentPage]);

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.Status === 'PENDING').length,
    PROCESSING: orders.filter(o => o.Status === 'PROCESSING').length,
    DELIVERING: orders.filter(o => o.Status === 'DELIVERING').length,
    COMPLETED: orders.filter(o => o.Status === 'COMPLETED').length,
    CANCELLED: orders.filter(o => o.Status === 'CANCELLED').length,
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'ALL' || order.Status === activeTab;
    
    let matchesType = true;
    if (orderType === 'DELIVERY') {
      matchesType = order.Type === 'ONLINE' && order.DeliveryMethod === 'DELIVERY';
    } else if (orderType === 'PICKUP') {
      matchesType = order.Type === 'ONLINE' && order.DeliveryMethod === 'STORE_PICKUP';
    } else if (orderType === 'POS') {
      matchesType = order.Type === 'POS';
    }

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (order.OrderCode && order.OrderCode.toLowerCase().includes(searchLower)) ||
      (order.CustomerName && order.CustomerName.toLowerCase().includes(searchLower));
    return matchesTab && matchesSearch && matchesType;
  });

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm kiếm đơn hàng (F1)..." />

        {/* Page Content */}
        <RequireShift allowAdminBypass={true}>
        <div className="p-4 md:p-8 space-y-8 flex-1">
          
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Xử lý đơn hàng Online</h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Quản lý và thực hiện đóng gói đơn hàng từ Website & App.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={fetchOrders} className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all active:scale-95 shadow-sm text-sm font-extrabold">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Làm mới dữ liệu
              </button>
            </div>
          </div>

          {/* Active Shippers */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/40 shadow-sm flex items-center gap-3 overflow-x-auto">
            <span className="text-sm font-extrabold text-on-surface whitespace-nowrap flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              Shipper Online ({activeShippers.length}):
            </span>
            {activeShippers.length === 0 ? (
              <span className="text-sm text-outline italic">Không có Shipper nào đang trực tuyến</span>
            ) : (
              <div className="flex gap-2">
                {activeShippers.map(shipper => (
                  <div key={shipper.Id} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-full text-xs font-bold whitespace-nowrap">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    {shipper.FullName} - {shipper.PhoneNumber}
                  </div>
                ))}
              </div>
            )}
            <button onClick={fetchActiveShippers} className="ml-auto flex items-center justify-center p-1.5 hover:bg-surface-variant rounded-full text-outline transition-colors" title="Làm mới danh sách Shipper">
              <RefreshCw size={14} />
            </button>
          </div>

          {/* Status Tabs */}
          <div className="bg-white rounded-2xl p-1.5 border border-outline-variant/30 flex flex-wrap gap-1.5 shadow-sm overflow-x-auto custom-scrollbar">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PENDING', label: 'Chờ xác nhận' },
              { id: 'PROCESSING', label: 'Đang đóng gói' },
              { id: 'DELIVERING', label: 'Đang giao hàng' },
              { id: 'COMPLETED', label: 'Hoàn thành' },
              { id: 'CANCELLED', label: 'Đã hủy' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all active:scale-95 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-primary to-[#F2994A] text-white shadow-md font-extrabold' 
                    : 'text-outline hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`${
                  activeTab === tab.id 
                    ? 'bg-white/30' 
                    : 'bg-surface-container-high text-on-surface'
                } px-2.5 py-0.5 rounded-full text-xs font-bold`}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Filter Section */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[280px] relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 text-sm font-medium transition-all shadow-sm outline-none" 
                placeholder="Lọc theo mã đơn, khách hàng..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="bg-white border border-outline-variant/50 rounded-xl text-sm font-semibold px-4 py-2.5 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm outline-none appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%22%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23867366%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] bg-[length:16px_16px]"
              >
                <option value="ALL">Tất cả loại đơn</option>
                <option value="DELIVERY">Đơn Giao hàng (Online)</option>
                <option value="PICKUP">Đơn Nhận tại shop (Online)</option>
                <option value="POS">Mua tại quầy (POS)</option>
              </select>
            </div>
          </div>

          {/* Data Table Section */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Mã đơn</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Thời gian</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Loại đơn</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Tổng tiền</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-10">Đang tải dữ liệu...</td></tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-10">Không tìm thấy đơn hàng nào</td></tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr 
                        key={order.Id}
                        className="hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                        onClick={() => setSelectedOrder({ id: order.OrderCode, status: order.Status, date: order.CreatedAt, customerName: order.CustomerName, customerPhone: '' })}
                      >
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-sm text-primary group-hover:underline">{order.OrderCode}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-on-surface-variant">
                          <div>Tạo: {new Date(order.CreatedAt).toLocaleString('vi-VN')}</div>
                          {order.Status === 'COMPLETED' && order.CompletedAt && (
                            <div className="text-primary mt-1 text-[11px] font-bold">Hoàn thành: {new Date(order.CompletedAt).toLocaleString('vi-VN')}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shadow-inner">
                              {order.CustomerName ? order.CustomerName.substring(0, 2).toUpperCase() : 'KH'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-on-surface">{order.CustomerName || 'Khách vãng lai'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-secondary bg-secondary/10 w-max px-2.5 py-1 rounded-lg">
                            {order.Type === 'POS' ? (
                              <><MonitorSmartphone size={16} /><span className="text-xs font-bold">Tại quầy</span></>
                            ) : order.DeliveryMethod === 'DELIVERY' ? (
                              <><Truck size={16} /><span className="text-xs font-bold">Giao hàng</span></>
                            ) : (
                              <><Store size={16} /><span className="text-xs font-bold">Tại shop</span></>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-[15px] text-on-surface">{Number((order.TotalAmount || 0)).toLocaleString('vi-VN')}đ</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-600 border border-orange-200">
                            {order.Status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {order.Status === 'PENDING' && (
                            <button 
                              className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await apiClient.put(`/manager/orders/${order.Id}/status`, { status: 'PROCESSING' });
                                  fetchOrders(currentPage);
    } catch(error) { console.error(error); }
                              }}
                            >
                              Xác nhận đơn
                            </button>
                          )}
                            {order.Status === 'PROCESSING' && (
                              order.DeliveryMethod === 'DELIVERY' ? (
                                <button 
                                  className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await apiClient.put(`/manager/orders/${order.Id}/status`, { status: 'DELIVERING' });
                                      fetchOrders(currentPage);
    } catch(error) { console.error(error); }
                                  }}
                                >
                                  Giao Shipper
                                </button>
                              ) : (
                                <button 
                                  className="bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await apiClient.put(`/manager/orders/${order.Id}/status`, { status: 'COMPLETED' });
                                      fetchOrders(currentPage);
    } catch(error) { console.error(error); }
                                  }}
                                >
                                  Hoàn thành
                                </button>
                              )
                            )}
                          {order.Status === 'DELIVERING' && (
                            <button 
                              className="bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await apiClient.put(`/manager/orders/${order.Id}/status`, { status: 'COMPLETED' });
                                  fetchOrders(currentPage);
    } catch(error) { console.error(error); }
                              }}
                            >
                              Hoàn thành
                            </button>
                          )}
                          {(order.Status === 'COMPLETED' || order.Status === 'CANCELLED') && (
                            <span className="text-xs font-bold text-outline italic">Không khả dụng</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>

          {/* Dashboard Quick Insights (Bento Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-extrabold text-on-surface">Hiệu suất đóng gói</h3>
                <span className="text-xs text-secondary font-bold uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-lg">Hôm nay</span>
              </div>
              
              {/* Animated Chart columns */}
              <div className="flex items-end gap-3 h-40 mt-4 relative z-10">
                {(() => {
                  const today = new Date().toDateString();
                  const todayOrders = orders.filter(o => new Date(o.CreatedAt).toDateString() === today);
                  const bins = [0, 0, 0, 0, 0, 0];
                  todayOrders.forEach(o => {
                    const hour = new Date(o.CreatedAt).getHours();
                    if (hour < 10) bins[0]++;
                    else if (hour < 12) bins[1]++;
                    else if (hour < 14) bins[2]++;
                    else if (hour < 16) bins[3]++;
                    else if (hour < 18) bins[4]++;
                    else bins[5]++;
                  });
                  const maxCount = Math.max(...bins, 1);
                  const chartData = bins.map(count => ({
                    count,
                    height: Math.max((count / maxCount) * 95, 5) // At least 5% height
                  }));
                  const maxIdx = chartData.reduce((maxI, item, i, arr) => item.count > arr[maxI].count ? i : maxI, 0);

                  return chartData.map((data, idx) => {
                    const isMax = idx === maxIdx && data.count > 0;
                    return (
                      <div 
                        key={idx}
                        className={`flex-1 rounded-t-xl relative group transition-all duration-300 ${
                          isMax ? 'bg-gradient-to-t from-primary to-[#F2994A] shadow-md shadow-primary/20' : 'bg-primary/10 hover:bg-primary/20'
                        }`} 
                        style={{ height: `${data.height}%` }}
                      >
                        {data.count > 0 && (
                          <div className={`absolute -top-8 left-1/2 -translate-x-1/2 ${!isMax ? 'opacity-0 group-hover:opacity-100 group-hover:-translate-y-2' : ''} transition-all bg-on-surface text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap`}>
                            {data.count} đơn
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between mt-3 text-[10px] text-outline font-bold uppercase tracking-widest px-2">
                <span>08:00</span>
                <span>10:00</span>
                <span>12:00</span>
                <span>14:00</span>
                <span>16:00</span>
                <span>18:00</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary via-[#F2994A] to-primary bg-[length:200%_auto] hover:animate-[gradient_3s_linear_infinite] text-white border border-primary/20 rounded-3xl p-6 shadow-xl shadow-primary/20 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
              
              <div className="relative z-10">
                <p className="text-sm font-bold opacity-90 mb-2 uppercase tracking-widest">Đang chờ xử lý</p>
                <h3 className="text-6xl font-black leading-tight mb-4 drop-shadow-md">{counts.PENDING}</h3>
                <p className="text-xs font-medium opacity-90 italic max-w-[80%]">
                  {counts.PENDING > 0 ? '"Đừng để khách hàng phải chờ lâu!"' : '"Tuyệt vời! Không có đơn chờ."'}
                </p>
              </div>
              
              <div className="absolute bottom-6 right-6 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform duration-300">
                <ShoppingBag size={24} className="text-white drop-shadow-md" />
              </div>
            </div>
          </div>
          
        </div>
        </RequireShift>
      </main>

      {/* Modal */}
      <OrderDetailModal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
        onStatusUpdate={fetchOrders}
      />
    </div>
  );
};

export default OrdersPage;
