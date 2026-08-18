import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, LogOut, FileText, Search } from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ShiftCloseModal from './ShiftCloseModal';
import Pagination from './Pagination';
import apiClient from '../apiClient';

const ManagerCashFlowPage = () => {
  const [shiftStatus, setShiftStatus] = useState('not_started'); // 'not_started' or 'active'
  const [inputOpeningCash, setInputOpeningCash] = useState('');
  const [openingCash, setOpeningCash] = useState(0);

  const [isShiftCloseOpen, setIsShiftCloseOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherType, setVoucherType] = useState('THU'); // 'THU' hoặc 'CHI'
  
  // States cho form tạo phiếu
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sessionId, setSessionId] = useState(null);
  const [cashSales, setCashSales] = useState(0);
  const [completedOrders, setCompletedOrders] = useState([]);

  const totalExtraIn = transactions.filter(t => t.Type === 'THU').reduce((sum, t) => sum + parseFloat(t.Amount), 0);
  const totalExtraOut = transactions.filter(t => t.Type === 'CHI').reduce((sum, t) => sum + parseFloat(t.Amount), 0);

  const [shippersRemittance, setShippersRemittance] = useState([]);

  const fetchShippersRemittance = async () => {
    try {
      const res = await apiClient.get('/manager/shippers/remittance');
      setShippersRemittance(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Đầu tiên gọi lấy session
      const sessRes = await apiClient.get('/cashier/sessions/current-stats');
      if (sessRes.data.session) {
        setShiftStatus('active');
        setSessionId(sessRes.data.session.Id);
        setOpeningCash(Number(sessRes.data.session.OpeningCash));
        setCashSales(Number(sessRes.data.stats.totalCashSales));
        setCompletedOrders(sessRes.data.completedOrders || []);
      } else {
        setShiftStatus('not_started');
      }

      // Sau đó gọi danh sách thu chi (nếu đã mở ca)
      if (sessRes.data.session) {
        const res = await apiClient.get(`/manager/cashflow?sessionId=${sessRes.data.session.Id}&page=${currentPage}&limit=10`);
        setTransactions(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchShippersRemittance();
  }, [currentPage]);

  const currentFund = openingCash + cashSales + totalExtraIn - totalExtraOut;

  const handleOpenVoucherModal = (type) => {
    setVoucherType(type);
    setAmount('');
    setReason('');
    setIsVoucherModalOpen(true);
  };

  const handleSubmitVoucher = async (e) => {
    e.preventDefault();
    if (!sessionId) return alert('Chưa mở ca');
    const rawVal = parseInt(amount.replace(/[.,]/g, '')) || 0;
    try {
      await apiClient.post('/manager/cashflow', {
        type: voucherType,
        amount: rawVal,
        reason: reason,
        sessionId: sessionId
      });
      alert(`Đã lập phiếu ${voucherType} thành công!`);
      setIsVoucherModalOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi tạo phiếu.');
    }
  };

  const handleStartShift = async (e) => {
    e.preventDefault();
    const rawVal = parseInt(inputOpeningCash.replace(/[.,]/g, '')) || 0;
    try {
      await apiClient.post('/cashier/sessions/open', { openingCash: rawVal });
      fetchTransactions();
    } catch (error) {
      console.error(error);
      alert('Lỗi khi mở ca');
    }
  };

  const handleCloseShift = async () => {
    try {
      await apiClient.post(`/cashier/sessions/${sessionId}/close`, { closingCash: currentFund });
      setIsShiftCloseOpen(false);
      window.location.href = '/auth';
    } catch (error) {
      console.error(error);
      alert('Lỗi đóng ca');
    }
  };

  const handleCashChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, '').replace(/\D/g, '');
    if (rawValue) {
      setInputOpeningCash(parseInt(rawValue).toLocaleString('vi-VN'));
    } else {
      setInputOpeningCash('');
    }
  };

  const handleCollectRemittance = async (shipperId) => {
    if (!sessionId) return alert('Vui lòng mở ca trước khi thu tiền!');
    try {
      await apiClient.post('/manager/shippers/remit', {
        shipperId,
        sessionId
      });
      alert('Đã xác nhận thu tiền thành công!');
      fetchTransactions();
      fetchShippersRemittance();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Có lỗi khi thu tiền');
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#fbf9f8] font-body-md text-on-surface">
      
      <ShiftCloseModal 
        isOpen={isShiftCloseOpen} 
        onClose={() => setIsShiftCloseOpen(false)} 
        onConfirm={() => window.location.href = '/auth'} 
      />

      <ManagerSidebar />

      <main className="ml-0 lg:ml-[240px] flex-1 flex flex-col h-full bg-[#fbf9f8]">
        
        {shiftStatus === 'not_started' ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full p-8 rounded-[32px] border border-outline-variant/30 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Wallet size={40} />
              </div>
              <h1 className="text-2xl font-black text-on-surface mb-2">Bắt Đầu Ca Làm Việc</h1>
              <p className="text-outline font-medium mb-8">Vui lòng kiểm tra két sắt và nhập số tiền lẻ có sẵn đầu ca để hệ thống bắt đầu theo dõi dòng tiền.</p>
              
              <form onSubmit={handleStartShift} className="w-full space-y-6">
                <div className="text-left">
                  <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Tiền mặt đầu ca (VNĐ)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={inputOpeningCash}
                      onChange={handleCashChange}
                      className="w-full h-14 pl-4 pr-12 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-black text-2xl text-primary text-center"
                      placeholder="0"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline font-bold">đ</span>
                  </div>
                </div>
                
                <button type="submit" disabled={!inputOpeningCash} className="w-full bg-primary text-white font-extrabold h-14 rounded-xl shadow-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  MỞ CA & BẮT ĐẦU BÁN HÀNG
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between z-10 shrink-0">
              <h1 className="font-extrabold text-xl text-on-surface flex items-center gap-2">
                <Wallet className="text-primary" size={24} /> Quản lý Sổ Quỹ (Ca hiện tại)
              </h1>
              <div className="flex gap-3">
                 <button onClick={() => handleOpenVoucherModal('THU')} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 font-bold rounded-xl hover:bg-green-200 transition-colors">
                   <TrendingUp size={18} /> Lập Phiếu Thu
                 </button>
                 <button onClick={() => handleOpenVoucherModal('CHI')} className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200 transition-colors">
                   <TrendingDown size={18} /> Lập Phiếu Chi
                 </button>
                 <button onClick={() => setIsShiftCloseOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-error text-white font-extrabold rounded-xl hover:bg-error/90 transition-all active:scale-95 shadow-md ml-4">
                   <LogOut size={18} /> ĐÓNG CA
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-5 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                  <div className="w-10 h-10 bg-surface-container-low text-outline rounded-xl flex items-center justify-center mb-1">
                    <Wallet size={20} />
                  </div>
                  <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Đầu ca</p>
                  <h3 className="text-2xl font-black text-on-surface">{Number(openingCash).toLocaleString('vi-VN')}đ</h3>
                </div>
                
                <div className="bg-white p-5 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-2">
                  <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-1">
                    <TrendingUp size={20} />
                  </div>
                  <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Thu khác</p>
                  <h3 className="text-2xl font-black text-green-600">+{Number(totalExtraIn).toLocaleString('vi-VN')}đ</h3>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-outline-variant/30 shadow-sm flex flex-col gap-2">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-1">
                    <TrendingDown size={20} />
                  </div>
                  <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Chi ra</p>
                  <h3 className="text-2xl font-black text-error">-{Number(totalExtraOut).toLocaleString('vi-VN')}đ</h3>
                </div>

                <div className="bg-gradient-to-br from-primary to-primary-container p-5 rounded-3xl border border-primary/30 shadow-md flex flex-col gap-2 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-1">
                    <Wallet size={20} />
                  </div>
                  <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest">Tồn quỹ hiện tại</p>
                  <h3 className="text-2xl font-black">{Number(currentFund).toLocaleString('vi-VN')}đ</h3>
                  <p className="text-xs text-white/80 mt-1">*Đã bao gồm doanh thu POS</p>
                </div>
              </div>

              {/* Quản lý thu tiền COD từ Shipper */}
              {shippersRemittance.length > 0 && (
                <div className="bg-white rounded-[32px] border border-outline-variant/30 shadow-sm p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                      <Wallet size={20} className="text-primary" />
                      Tiền thu hộ (COD) cần thu từ Shipper
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-outline-variant/30 text-outline text-xs uppercase tracking-widest font-extrabold">
                          <th className="py-3 px-4">Shipper</th>
                          <th className="py-3 px-4">Số điện thoại</th>
                          <th className="py-3 px-4 text-right">Số đơn</th>
                          <th className="py-3 px-4 text-right">Số tiền cần thu</th>
                          <th className="py-3 px-4 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shippersRemittance.map(shipper => (
                          <tr key={shipper.Id} className="border-b border-outline-variant/10 hover:bg-surface-container-lowest transition-colors">
                            <td className="py-3 px-4 font-bold text-on-surface">{shipper.FullName}</td>
                            <td className="py-3 px-4 text-outline font-medium">{shipper.PhoneNumber}</td>
                            <td className="py-3 px-4 text-right font-medium">{shipper.OrderCount}</td>
                            <td className="py-3 px-4 text-right font-black text-error">
                              {Number(shipper.TotalOwed).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                onClick={() => handleCollectRemittance(shipper.Id)}
                                className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors text-sm"
                              >
                                Xác nhận Thu tiền
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div className="bg-white rounded-[32px] border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                 <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-on-surface">Lịch sử Lập phiếu trong ca</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                      <input type="text" placeholder="Tìm mã phiếu..." className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary text-sm font-medium" />
                    </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-surface-container-lowest text-outline text-[11px] uppercase tracking-widest font-bold">
                         <th className="p-4 pl-6 font-bold">Mã Phiếu</th>
                         <th className="p-4 font-bold">Loại</th>
                         <th className="p-4 font-bold">Số tiền</th>
                         <th className="p-4 font-bold">Lý do</th>
                         <th className="p-4 font-bold">Thời gian</th>
                         <th className="p-4 font-bold">Người lập</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-outline-variant/30">
                       {transactions.map((tx) => (
                         <tr key={tx.Id} className="hover:bg-surface-container-lowest transition-colors group">
                           <td className="p-4 pl-6">
                             <span className="font-extrabold text-sm flex items-center gap-2">
                               <FileText size={16} className="text-outline group-hover:text-primary transition-colors" />
                               {tx.Id.substring(0,8)}
                             </span>
                           </td>
                           <td className="p-4">
                             <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${tx.Type === 'THU' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                               {tx.Type}
                             </span>
                           </td>
                           <td className="p-4 font-black text-sm text-on-surface">
                             {Number(parseFloat(tx.Amount)).toLocaleString('vi-VN')}đ
                           </td>
                           <td className="p-4 text-sm font-medium text-outline">
                             {tx.Reason}
                           </td>
                           <td className="p-4 text-sm font-medium text-on-surface">
                             {new Date(tx.CreatedAt).toLocaleTimeString('vi-VN')}
                           </td>
                           <td className="p-4 text-sm font-medium text-outline">
                             {tx.CashierName}
                           </td>
                         </tr>
                       ))}
                       {transactions.length === 0 && !loading && (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-outline">Chưa có giao dịch nào</td>
                          </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
                 <div className="pb-4">
                   <Pagination 
                     currentPage={currentPage} 
                     totalPages={totalPages} 
                     onPageChange={setCurrentPage} 
                   />
                 </div>
               </div>

              {/* Completed Orders Table */}
              <div className="bg-white rounded-[32px] border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col mt-6">
                 <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
                    <h2 className="font-extrabold text-lg text-on-surface">Đơn hàng đã hoàn thành trong ca</h2>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr className="bg-surface-container-lowest text-outline text-[11px] uppercase tracking-widest font-bold">
                         <th className="p-4 pl-6 font-bold">Mã Đơn</th>
                         <th className="p-4 font-bold">Loại Đơn</th>
                         <th className="p-4 font-bold">Thanh Toán</th>
                         <th className="p-4 font-bold text-right">Tổng Tiền</th>
                         <th className="p-4 font-bold">Thời gian</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-outline-variant/30">
                       {completedOrders.map((ord, idx) => (
                         <tr key={idx} className="hover:bg-surface-container-lowest transition-colors group">
                           <td className="p-4 pl-6 font-extrabold text-sm text-on-surface">
                             {ord.OrderCode}
                           </td>
                           <td className="p-4 text-sm font-medium text-outline">
                             {ord.Type === 'POS' ? 'Bán tại quầy (POS)' : 'Giao hàng (Online)'}
                           </td>
                           <td className="p-4">
                             <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-primary/10 text-primary`}>
                               {ord.PaymentMethod || 'CASH'}
                             </span>
                           </td>
                           <td className="p-4 font-black text-sm text-primary text-right">
                             {Number(ord.TotalAmount).toLocaleString('vi-VN')}đ
                           </td>
                           <td className="p-4 text-sm font-medium text-outline">
                             {new Date(ord.CreatedAt).toLocaleTimeString('vi-VN')}
                           </td>
                         </tr>
                       ))}
                       {completedOrders.length === 0 && !loading && (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-outline">Chưa có đơn hàng nào hoàn thành trong ca này</td>
                          </tr>
                       )}
                     </tbody>
                   </table>
                 </div>
              </div>

            </div>
          </>
        )}
      </main>

      {/* Modal Lập Phiếu */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsVoucherModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95">
             <h2 className="text-xl font-extrabold text-on-surface mb-6 flex items-center gap-2">
               {voucherType === 'THU' ? <TrendingUp className="text-green-600"/> : <TrendingDown className="text-orange-600"/>}
               Lập phiếu {voucherType}
             </h2>
             
             <form onSubmit={handleSubmitVoucher} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Số tiền (VNĐ)</label>
                 <input 
                   type="number" 
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="w-full p-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-black text-lg text-primary"
                   placeholder="0"
                   required
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-outline uppercase tracking-widest mb-2">Lý do</label>
                 <textarea 
                   value={reason}
                   onChange={(e) => setReason(e.target.value)}
                   className="w-full p-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium text-sm resize-none h-24"
                   placeholder={`Nhập lý do ${voucherType.toLowerCase()} tiền...`}
                   required
                 ></textarea>
               </div>
               
               <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setIsVoucherModalOpen(false)} className="flex-1 py-3 font-bold text-outline hover:bg-surface-container-low rounded-xl transition-colors">Hủy</button>
                 <button type="submit" className={`flex-1 py-3 font-extrabold text-white rounded-xl transition-transform active:scale-95 ${voucherType === 'THU' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                   XÁC NHẬN
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerCashFlowPage;
