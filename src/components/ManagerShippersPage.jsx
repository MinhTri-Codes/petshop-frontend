import React, { useRef, useEffect, useState } from 'react';
import { 
  Truck, Search, Clock, CheckCircle, Wallet, Calendar, History
} from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import apiClient from '../apiClient';

const ManagerShippersPage = () => {
  const searchInputRef = useRef(null);
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  
  const fetchShippers = async () => {
    try {
      const res = await apiClient.get('/manager/shippers/stats');
      setShippers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippers();
  }, []);

  const handleOpenSessions = async (shipper) => {
    setSelectedShipper(shipper);
    setIsSessionsModalOpen(true);
    setSessionsLoading(true);
    try {
      const res = await apiClient.get(`/manager/shippers/${shipper.Id}/sessions`);
      setSessions(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const filteredShippers = shippers.filter(s => 
    s.FullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.PhoneNumber?.includes(searchTerm)
  );

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm kiếm shipper..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

        <div className="p-4 md:p-8 flex-1 flex flex-col max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <Truck size={24} />
                </div>
                Quản lý Shipper
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-2">Theo dõi thống kê ca làm, thù lao và tiền thu hộ của tài xế.</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/30 flex-1 flex flex-col overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-lowest/50">
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-outline">Tài xế</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-outline">Trạng thái</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-outline">Phương tiện</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-outline text-right">Tổng ca làm</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-outline text-right">Đơn hoàn thành</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-outline text-right">Tổng thù lao</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-outline text-right">COD đang giữ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {loading ? (
                    <tr><td colSpan="7" className="p-8 text-center text-outline">Đang tải...</td></tr>
                  ) : filteredShippers.length === 0 ? (
                    <tr><td colSpan="7" className="p-8 text-center text-outline">Không tìm thấy tài xế nào</td></tr>
                  ) : (
                    filteredShippers.map((s) => (
                      <tr key={s.Id} className="hover:bg-surface-container-lowest transition-colors cursor-pointer" onClick={() => handleOpenSessions(s)}>
                        <td className="p-4">
                          <div className="font-bold text-on-surface">{s.FullName}</div>
                          <div className="text-xs text-outline">{s.PhoneNumber}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            s.IsOnline ? 'bg-green-100 text-green-700' : 'bg-surface-variant text-outline'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.IsOnline ? 'bg-green-500' : 'bg-outline/50'}`}></span>
                            {s.IsOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-medium">
                          {s.VehicleType || 'Chưa cập nhật'} <span className="text-outline">({s.LicensePlate || 'Trống'})</span>
                        </td>
                        <td className="p-4 text-right font-bold text-on-surface">{s.TotalShifts || 0}</td>
                        <td className="p-4 text-right font-bold text-on-surface">{s.TotalOrders || 0}</td>
                        <td className="p-4 text-right font-black text-primary">{Number(s.TotalEarnings || 0).toLocaleString('vi-VN')}đ</td>
                        <td className="p-4 text-right font-bold text-orange-600">{Number(s.TotalCOD || 0).toLocaleString('vi-VN')}đ</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Sessions Modal */}
      <GenericModal 
        isOpen={isSessionsModalOpen}
        onClose={() => setIsSessionsModalOpen(false)}
        title={`Ca làm việc: ${selectedShipper?.FullName}`}
        icon={History}
        maxWidth="max-w-2xl"
      >
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider block mb-1">Đơn giao</span>
              <span className="font-black text-xl text-on-surface">{selectedShipper?.TotalOrders || 0}</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider block mb-1">Thù lao</span>
              <span className="font-black text-xl text-green-600">{Number(selectedShipper?.TotalEarnings || 0).toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
              <span className="text-[10px] uppercase font-bold text-outline tracking-wider block mb-1">COD đang giữ</span>
              <span className="font-black text-xl text-orange-600">{Number(selectedShipper?.TotalCOD || 0).toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <h3 className="font-bold text-sm text-outline uppercase tracking-widest mb-3">Lịch sử ca làm</h3>
          
          <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
            {sessionsLoading ? (
               <p className="text-center text-outline text-sm py-4">Đang tải...</p>
            ) : sessions.length === 0 ? (
               <p className="text-center text-outline text-sm py-4">Shipper chưa có ca làm việc nào.</p>
            ) : (
              sessions.map((s, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-dashed border-outline-variant/50 pb-2">
                    <div>
                      <p className="font-bold text-sm text-on-surface flex items-center gap-1">
                        <Calendar size={14} className="text-primary"/>
                        {new Date(s.StartTime).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-[11px] text-outline mt-1 flex items-center gap-1">
                        <Clock size={12}/>
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
              ))
            )}
          </div>
        </div>
      </GenericModal>
      
    </div>
  );
};

export default ManagerShippersPage;
