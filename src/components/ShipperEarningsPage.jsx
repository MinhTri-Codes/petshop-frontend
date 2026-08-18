import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../apiClient';

const ShipperEarningsPage = () => {
  const [earnings, setEarnings] = useState({ totalEarnings: 0, totalCOD: 0, history: [], isActive: false, startTime: null });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const [res, sessionRes] = await Promise.all([
        apiClient.get('/shipper/earnings'),
        apiClient.get('/shipper/sessions')
      ]);
      setSessions(sessionRes.data);
      setEarnings({
         totalEarnings: res.data.totalEarnings || 0,
         totalCOD: res.data.totalCOD || 0,
         history: res.data.history || [],
         isActive: res.data.isActive || false,
         startTime: res.data.startTime || null
      });
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="flex flex-col min-h-full bg-surface-container-lowest p-4 space-y-6">
      
      <div className="text-center mt-2 mb-4">
        <h2 className="text-xl font-extrabold text-on-surface">{earnings.isActive ? 'Ca làm việc hiện tại' : 'Đang ngoại tuyến'}</h2>
        <p className="text-sm text-outline font-medium">
          {earnings.isActive && earnings.startTime ? `Bắt đầu từ: ${new Date(earnings.startTime).toLocaleTimeString('vi-VN')} - ${new Date(earnings.startTime).toLocaleDateString('vi-VN')}` : 'Vui lòng bật trạng thái trực tuyến để nhận đơn'}
        </p>
      </div>

      {/* Main Stats */}
      <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-3xl text-white shadow-lg shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-white/80">Đã giao thành công</span>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black">{earnings.history.length}</span>
            <span className="text-lg font-bold pb-1 text-white/80">đơn</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
          <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Thù lao giao hàng</span>
          <span className="font-extrabold text-lg text-on-surface">{Number(earnings.totalEarnings).toLocaleString('vi-VN')}đ</span>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
            <Wallet size={16} />
          </div>
          <span className="text-[10px] uppercase font-bold text-outline tracking-wider">Tiền thu hộ (COD)</span>
          <span className="font-extrabold text-lg text-on-surface">{Number(earnings.totalCOD).toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* Warning/Alert */}
      {earnings.totalCOD > 1000000 && (
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex gap-3 items-start">
          <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
            <Wallet size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-on-surface">Nộp tiền COD</h3>
            <p className="text-xs text-outline font-medium mt-1 leading-relaxed">
              Bạn đang giữ quá 1,000,000đ tiền mặt thu hộ. Vui lòng nộp lại cho cửa hàng trưởng khi kết thúc ca.
            </p>
          </div>
        </div>
      )}

      {/* History List */}
      <div>
        <h3 className="font-bold text-sm text-outline uppercase tracking-widest mb-3">{earnings.isActive ? 'Chi tiết ca hiện tại' : 'Chưa có dữ liệu'}</h3>
        <div className="space-y-3">
          {earnings.history.map((h, i) => (
            <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                <CheckCircle size={18} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-on-surface">{h.OrderCode}</p>
                <p className="text-[10px] text-outline flex items-center gap-1"><Clock size={10}/> {new Date(h.CreatedAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-green-600">+{Number(h.Earnings).toLocaleString('vi-VN')}đ</p>
                <p className="text-[10px] text-outline font-medium">Thù lao</p>
              </div>
            </div>
          ))}
          {earnings.history.length === 0 && (
             <p className="text-center text-outline text-sm py-4">Chưa có đơn hàng nào hoàn thành</p>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="pb-10">
        <h3 className="font-bold text-sm text-outline uppercase tracking-widest mb-3 mt-6">Các ca làm trước đó</h3>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex justify-between items-center border-b border-dashed border-outline-variant/50 pb-2">
                <div>
                  <p className="font-bold text-sm text-on-surface flex items-center gap-1">
                    <Clock size={14} className="text-primary"/>
                    {new Date(s.StartTime).toLocaleDateString('vi-VN')}
                  </p>
                  <p className="text-[11px] text-outline mt-1">
                    {new Date(s.StartTime).toLocaleTimeString('vi-VN')} - {s.EndTime ? new Date(s.EndTime).toLocaleTimeString('vi-VN') : 'Đang hoạt động'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-primary">{s.TotalOrders} <span className="text-xs text-outline font-medium">đơn</span></span>
                </div>
              </div>
              <div className="flex justify-between pt-1">
                <div>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Thù lao</p>
                  <p className="font-extrabold text-sm text-green-600">{Number(s.TotalEarnings).toLocaleString('vi-VN')}đ</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-outline font-bold uppercase tracking-wider">Thu hộ (COD)</p>
                  <p className="font-extrabold text-sm text-on-surface">{Number(s.TotalCOD).toLocaleString('vi-VN')}đ</p>
                </div>
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
             <p className="text-center text-outline text-sm py-4">Chưa có dữ liệu ca làm</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipperEarningsPage;
