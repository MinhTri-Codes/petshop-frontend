import React, { useState, useEffect } from 'react';
import { History, Search, FileText, CheckCircle, Clock, X, Banknote, QrCode, ArrowDownCircle, ArrowUpCircle, Calculator } from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import Pagination from './Pagination';
import apiClient from '../apiClient';

const ManagerSessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionOrders, setSessionOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const handleRowClick = async (s) => {
    setSelectedSession(s);
    setIsModalOpen(true);
    setLoadingOrders(true);
    try {
      const [ordersRes, cashflowsRes] = await Promise.all([
        apiClient.get(`/manager/cashflow/sessions/${s.Id}/orders`),
        apiClient.get(`/manager/cashflow/sessions/${s.Id}/cashflows`)
      ]);
      setSessionOrders(ordersRes.data);
      setSelectedSession(prev => ({ ...prev, Transactions: cashflowsRes.data }));
    } catch (error) {
      console.error(error);
      setSessionOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchSessions(currentPage);
    }, [currentPage]);

  const fetchSessions = async () => {
    try {
      const res = await apiClient.get('/manager/sessions/history');
      setSessions(res.data);
    } catch (error) {
      console.error(error);
      alert('Lỗi tải dữ liệu lịch sử ca trực');
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    (s.CashierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.Id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#fbf9f8] font-body-md text-on-surface">
      <ManagerSidebar />

      <main className="ml-0 lg:ml-[240px] flex-1 flex flex-col h-full bg-[#fbf9f8]">
        <ManagerHeader placeholder="Tìm kiếm ca trực..." />

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          
          <div className="bg-white rounded-[32px] border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {/* Table Header */}
            <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <History className="text-primary" size={24} />
                Lịch sử Ca Trực
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo Mã hoặc Nhân viên..." 
                  className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary text-sm font-medium w-[300px]" 
                />
              </div>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-lowest text-outline text-[11px] uppercase tracking-widest font-bold">
                    <th className="p-4 pl-6 font-bold whitespace-nowrap">Mã Ca</th>
                    <th className="p-4 font-bold whitespace-nowrap">Người trực</th>
                    <th className="p-4 font-bold whitespace-nowrap">Thời gian</th>
                    <th className="p-4 font-bold text-right whitespace-nowrap">Đầu ca</th>
                    <th className="p-4 font-bold text-right whitespace-nowrap text-green-600">Tổng Thu</th>
                    <th className="p-4 font-bold text-right whitespace-nowrap text-error">Tổng Chi</th>
                    <th className="p-4 font-bold text-right whitespace-nowrap">Cuối ca (Đã chốt)</th>
                    <th className="p-4 font-bold text-right whitespace-nowrap">Chênh lệch</th>
                    <th className="p-4 pr-6 font-bold text-left whitespace-nowrap">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr><td colSpan="9" className="p-8 text-center text-outline">Đang tải...</td></tr>
                  ) : filteredSessions.length > 0 ? (
                    filteredSessions.map((s) => {
                      const expectedCash = s.OpeningCash + s.CashSales + s.ExtraIn - s.ExtraOut;
                      const discrepancy = s.ClosingCash !== null ? s.ClosingCash - expectedCash : null;
                      const isClosed = s.ClosedAt !== null;
                      
                      return (
                        <tr 
                          key={s.Id} 
                          onClick={() => handleRowClick(s)}
                          className={`hover:bg-surface-container-low transition-colors group cursor-pointer ${!isClosed ? 'bg-primary/5' : ''}`}
                        >
                          <td className="p-4 pl-6">
                            <span className="font-extrabold text-sm flex items-center gap-2">
                              <FileText size={16} className="text-outline group-hover:text-primary transition-colors" />
                              {s.Id.substring(0,8)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-on-surface">{s.CashierName || 'Không xác định'}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 text-xs text-on-surface-variant font-medium">
                              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {new Date(s.OpenedAt).toLocaleString('vi-VN')}</span>
                              <span className="flex items-center gap-1"><Clock size={12} className={isClosed ? "text-error" : "text-outline"} /> {isClosed ? new Date(s.ClosedAt).toLocaleString('vi-VN') : 'Đang trực...'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-medium text-sm">
                            {Number(s.OpeningCash).toLocaleString('vi-VN')}đ
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-bold text-green-600 text-sm">
                              +{Number((s.CashSales + s.ExtraIn)).toLocaleString('vi-VN')}đ
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-bold text-error text-sm">
                              -{Number(s.ExtraOut).toLocaleString('vi-VN')}đ
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {isClosed ? (
                              <span className="font-black text-primary text-sm">{Number((s.ClosingCash || 0)).toLocaleString('vi-VN')}đ</span>
                            ) : (
                              <span className="text-xs font-bold text-orange-500 px-2 py-1 bg-orange-100 rounded-md">Chưa kết ca</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {isClosed ? (
                              <span className={`font-extrabold text-sm px-2.5 py-1 rounded-md ${(discrepancy || 0) === 0 ? 'bg-green-100 text-green-700' : (discrepancy || 0) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                {(discrepancy || 0) > 0 ? '+' : ''}{Number((discrepancy || 0)).toLocaleString('vi-VN')}đ
                              </span>
                            ) : (
                              <span className="text-outline text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4 pr-6 text-left max-w-[200px]">
                            <p className="text-sm text-outline truncate" title={s.Notes || ''}>
                              {s.Notes || '-'}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="8" className="p-8 text-center text-outline font-medium">Không tìm thấy ca trực nào</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </main>

      {/* Session Detail Modal */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-surface w-full max-w-2xl rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-start bg-white">
              <div>
                <h2 className="text-2xl font-black text-on-surface flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  Chi tiết Ca Trực
                </h2>
                <p className="text-sm font-bold text-outline mt-2 tracking-widest uppercase">ID: {selectedSession.Id}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-outline"
              >
                <X size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 bg-surface-container-lowest overflow-y-auto max-h-[70vh] custom-scrollbar space-y-6">
              
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
                  <p className="text-xs font-bold text-outline uppercase mb-1 tracking-wider">Người trực</p>
                  <p className="font-extrabold text-on-surface">{selectedSession.CashierName || 'Không xác định'}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
                  <p className="text-xs font-bold text-outline uppercase mb-1 tracking-wider">Trạng thái</p>
                  <p className="font-extrabold text-on-surface">
                    {selectedSession.ClosedAt ? (
                      <span className="text-primary flex items-center gap-1.5"><CheckCircle size={16} /> Đã kết ca</span>
                    ) : (
                      <span className="text-orange-500 flex items-center gap-1.5"><Clock size={16} /> Đang trực</span>
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
                  <p className="text-xs font-bold text-outline uppercase mb-1 tracking-wider">Giờ mở ca</p>
                  <p className="font-bold text-on-surface-variant">{new Date(selectedSession.OpenedAt).toLocaleString('vi-VN')}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
                  <p className="text-xs font-bold text-outline uppercase mb-1 tracking-wider">Giờ đóng ca</p>
                  <p className="font-bold text-on-surface-variant">
                    {selectedSession.ClosedAt ? new Date(selectedSession.ClosedAt).toLocaleString('vi-VN') : '-'}
                  </p>
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
                  <Calculator size={18} className="text-primary" />
                  Tổng kết tài chính
                </h3>
                
                <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
                  
                  {/* Tiền mặt đầu ca */}
                  <div className="p-4 flex items-center justify-between border-b border-outline-variant/20">
                    <span className="font-bold text-on-surface-variant">Tiền mặt đầu ca</span>
                    <span className="font-black text-lg text-on-surface">{Number(selectedSession.OpeningCash).toLocaleString('vi-VN')}đ</span>
                  </div>

                  {/* Thu */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-outline-variant/20 bg-green-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <Banknote size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-outline uppercase">Doanh thu tiền mặt</span>
                        <span className="font-extrabold text-green-700">+{Number((selectedSession.CashSales || 0)).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <ArrowDownCircle size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-outline uppercase">Tiền nạp thêm</span>
                        <span className="font-extrabold text-green-700">+{Number((selectedSession.ExtraIn || 0)).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Chi */}
                  <div className="p-4 flex items-center justify-between border-b border-outline-variant/20 bg-red-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <ArrowUpCircle size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-outline uppercase">Tiền lấy ra</span>
                        <span className="font-extrabold text-red-700">-{Number((selectedSession.ExtraOut || 0)).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Chuyển khoản */}
                  <div className="p-4 flex items-center justify-between border-b border-outline-variant/20 bg-blue-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <QrCode size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-outline uppercase">Doanh thu chuyển khoản</span>
                        <span className="font-extrabold text-blue-700">{Number((selectedSession.TransferSales || 0)).toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  </div>

                  {/* Tổng kết */}
                  <div className="p-5 bg-surface-container-lowest">
                    {(() => {
                      const expectedCash = selectedSession.OpeningCash + selectedSession.CashSales + selectedSession.ExtraIn - selectedSession.ExtraOut;
                      const discrepancy = selectedSession.ClosingCash !== null ? selectedSession.ClosingCash - expectedCash : null;
                      return (
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-outline uppercase text-xs tracking-widest">Tiền mặt kỳ vọng (Hệ thống)</span>
                            <span className="font-black text-xl text-on-surface">{Number(expectedCash).toLocaleString('vi-VN')}đ</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-outline uppercase text-xs tracking-widest">Tiền mặt thực tế (Khai báo)</span>
                            <span className="font-black text-2xl text-primary">
                              {selectedSession.ClosingCash !== null ? selectedSession.ClosingCash.toLocaleString('vi-VN') + 'đ' : 'Chưa kết ca'}
                            </span>
                          </div>
                          {selectedSession.ClosingCash !== null && (
                            <div className="flex justify-between items-center pt-3 border-t border-dashed border-outline-variant/50">
                              <span className="font-bold text-outline uppercase text-xs tracking-widest">Chênh lệch</span>
                              <span className={`font-black text-xl px-3 py-1 rounded-lg ${discrepancy === 0 ? 'bg-green-100 text-green-700' : discrepancy > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                {discrepancy > 0 ? '+' : ''}{Number(discrepancy).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>

              {/* Transactions List */}
              {selectedSession.Transactions && selectedSession.Transactions.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-3 tracking-wide">Lịch sử Phiếu Thu / Chi</h3>
                  <div className="space-y-3">
                    {selectedSession.Transactions.map((tx, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.Type === 'THU' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {tx.Type === 'THU' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-on-surface">{tx.Reason || 'Không có lý do'}</p>
                            <p className="text-xs font-medium text-outline mt-0.5">{new Date(tx.CreatedAt).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className={`font-black text-sm ${tx.Type === 'THU' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.Type === 'THU' ? '+' : '-'}{Number(tx.Amount).toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedSession.Notes && (
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-2 tracking-wide">Ghi chú lúc đóng ca</h3>
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-200 text-sm font-medium text-orange-900">
                    {selectedSession.Notes}
                  </div>
                </div>
              )}

              {/* Completed Orders */}
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4 mt-6">
                  <CheckCircle size={18} className="text-primary" />
                  Đơn hàng hoàn thành trong ca
                </h3>
                <div className="bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-lowest text-outline text-[11px] uppercase tracking-widest font-bold">
                        <th className="p-4 font-bold">Mã Đơn</th>
                        <th className="p-4 font-bold">Loại</th>
                        <th className="p-4 font-bold">Thời gian HT</th>
                        <th className="p-4 font-bold text-right">Tổng tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {loadingOrders ? (
                        <tr><td colSpan="4" className="p-4 text-center text-outline">Đang tải...</td></tr>
                      ) : sessionOrders.length > 0 ? (
                        sessionOrders.map((o, idx) => (
                          <tr key={idx} className="hover:bg-surface-container-lowest transition-colors">
                            <td className="p-4 font-bold text-on-surface">{o.OrderCode}</td>
                            <td className="p-4">
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${o.Type === 'POS' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                {o.Type}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-on-surface-variant font-medium">
                              {new Date(o.CreatedAt).toLocaleTimeString('vi-VN')}
                            </td>
                            <td className="p-4 text-right font-black text-primary">
                              {Number(o.TotalAmount).toLocaleString('vi-VN')}đ
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="p-6 text-center text-outline">Không có đơn hàng nào</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 bg-white border-t border-outline-variant/30 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 text-sm uppercase tracking-wider"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSessionsPage;
