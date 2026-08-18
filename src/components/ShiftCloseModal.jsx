import React, { useState, useEffect } from 'react';
import { X, Calculator, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import apiClient from '../apiClient';

const ShiftCloseModal = ({ isOpen, onClose, onConfirm }) => {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1); // 1: Kiem ke, 2: Thanh cong
  
  const [sessionData, setSessionData] = useState({
    sessionId: null,
    openingCash: 0,
    cashSales: 0,
    transferSales: 0,
    expenses: 0,
    extraIncomes: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchSessionStats();
    } else {
      // Reset state when closed
      setStep(1);
      setActualCash('');
      setNotes('');
    }
  }, [isOpen]);

  const fetchSessionStats = async () => {
    try {
      const res = await apiClient.get('/cashier/sessions/current-stats');
      if (res.data.session) {
        setSessionData({
          sessionId: res.data.session.Id,
          openingCash: Number(res.data.session.OpeningCash),
          cashSales: Number(res.data.stats.totalCashSales),
          transferSales: Number(res.data.stats.totalTransferSales),
          expenses: Number(res.data.stats.totalExpenses),
          extraIncomes: Number(res.data.stats.totalExtraIncomes || 0)
        });
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin ca làm việc:', error);
    }
  };

  const expectedCash = sessionData.openingCash + sessionData.cashSales + sessionData.extraIncomes - sessionData.expenses;

  if (!isOpen) return null;

  const actualCashNumber = parseInt(actualCash.replace(/[.,]/g, '')) || 0;
  const discrepancy = actualCashNumber - expectedCash;

  const handleCashChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setActualCash(rawValue);
  };

  const handleConfirm = async () => {
    try {
      if (!sessionData.sessionId) {
        alert('Không tìm thấy ID ca làm việc');
        return;
      }
      await apiClient.post(`/cashier/sessions/${sessionData.sessionId}/close`, {
        closingCash: actualCashNumber,
        notes: notes
      });
      setStep(2);
      setTimeout(() => {
        onConfirm(); // Trigger logout or route change
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi đóng ca:', error);
      alert('Có lỗi xảy ra khi chốt ca');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-[#fbf9f8] rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {step === 1 ? (
          <div className="flex flex-col h-full max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant/30 bg-white flex items-center justify-between shrink-0">
              <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <Calculator className="text-primary" size={24} />
                Bàn Giao & Chốt Ca
              </h2>
              <button 
                onClick={onClose} 
                className="w-8 h-8 bg-surface-container-low hover:bg-error hover:text-white rounded-full flex items-center justify-center text-outline transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: System Stats */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-2">Thống kê hệ thống</h3>
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface font-medium">Tiền mặt đầu ca:</span>
                    <span className="font-bold">{Number(sessionData.openingCash).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface font-medium">Doanh thu tiền mặt:</span>
                    <span className="font-bold text-green-600">+{Number(sessionData.cashSales).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface font-medium">Thu khác (Thu COD...):</span>
                    <span className="font-bold text-green-600">+{Number(sessionData.extraIncomes).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface font-medium">Chi ra (phí lặt vặt):</span>
                    <span className="font-bold text-error">-{Number(sessionData.expenses).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="pt-3 mt-1 border-t border-dashed border-outline-variant/50 flex justify-between items-center">
                    <span className="font-extrabold text-on-surface">Tiền mặt lý thuyết:</span>
                    <span className="font-black text-lg text-primary">{Number(expectedCash).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                   <div className="flex justify-between text-sm">
                    <span className="text-outline font-medium">Doanh thu chuyển khoản/Thẻ:</span>
                    <span className="font-bold text-secondary">{Number(sessionData.transferSales).toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actual Count & Notes */}
              <div className="space-y-4 flex flex-col">
                <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-2">Kiểm kê thực tế</h3>
                
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Tiền mặt đếm được (trong két)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={actualCash ? Number(actualCash).toLocaleString('vi-VN') : ''}
                        onChange={handleCashChange}
                        placeholder="0"
                        className="w-full h-12 pl-4 pr-12 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-black text-lg text-right text-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-outline font-bold">đ</span>
                    </div>
                  </div>

                  {actualCash !== '' && (
                    <div className={`p-3 rounded-xl border flex items-center justify-between font-bold text-sm ${discrepancy === 0 ? 'bg-green-50 border-green-200 text-green-700' : discrepancy > 0 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <span className="flex items-center gap-2">
                        {discrepancy !== 0 && <AlertTriangle size={16} />} 
                        {discrepancy === 0 ? 'Khớp số liệu' : discrepancy > 0 ? 'Dư tiền' : 'Thiếu tiền'}
                      </span>
                      <span>{discrepancy > 0 ? '+' : ''}{Number(discrepancy).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="font-bold text-sm text-on-surface">Ghi chú bàn giao</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú lại cho ca sau (nếu có lệch tiền, hãy giải trình lý do)..."
                    className="w-full flex-1 min-h-[100px] p-4 bg-white border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none text-sm"
                  ></textarea>
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-white border-t border-outline-variant/30 flex items-center justify-between shrink-0">
               <button 
                onClick={onClose}
                className="px-6 py-3 font-bold text-outline hover:text-on-surface transition-colors"
               >
                 Hủy
               </button>
               <button 
                onClick={handleConfirm}
                disabled={!actualCash}
                className="flex items-center gap-2 px-8 py-3 bg-error text-white font-extrabold rounded-xl hover:bg-error/90 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <LogOut size={20} /> XÁC NHẬN CHỐT CA
               </button>
            </div>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
             <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle size={40} />
             </div>
             <h2 className="text-2xl font-extrabold text-on-surface mb-2">Chốt ca thành công!</h2>
             <p className="text-outline font-medium">Hệ thống đang in phiếu chốt ca và đăng xuất...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftCloseModal;
