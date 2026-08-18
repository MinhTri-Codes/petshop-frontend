import React, { useState, useContext, useEffect } from 'react';
import { User, LogOut, FileText } from 'lucide-react';
import GenericModal from './GenericModal';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../apiClient';

const ShipperProfilePage = () => {
  const [activeModal, setActiveModal] = useState(null);
  const { user, logout } = useContext(AuthContext);

  // Vehicle state
  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/shipper/profile');
        setProfileData(res.data.user);
        if (res.data.details) {
          setVehicle(res.data.details.VehicleType || '');
          setLicensePlate(res.data.details.LicensePlate || '');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const displayName = profileData?.FullName || user?.fullName || 'Tài xế';
  const initialLetter = displayName.charAt(0).toUpperCase();
  const phone = profileData?.PhoneNumber || user?.phoneNumber || 'Chưa cập nhật';
  const email = profileData?.Email || user?.email || 'Chưa cập nhật';
  const userId = profileData?.Id || user?.id || '';

  const handleSaveVehicle = async () => {
    try {
      await apiClient.put('/shipper/profile', {
        vehicleType: vehicle,
        licensePlate: licensePlate
      });
      alert('Đã cập nhật phương tiện!');
      setActiveModal(null);
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật phương tiện');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-surface-container-lowest pb-10">

      {/* Header Profile */}
      <div className="bg-primary text-white p-6 pt-10 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/4"></div>

        <div className="w-24 h-24 bg-white/20 rounded-full border-4 border-white/30 flex items-center justify-center text-4xl font-black mb-3 relative z-10 shadow-lg">
          {initialLetter}
        </div>
        <h2 className="text-xl font-extrabold relative z-10">{displayName}</h2>
      </div>

      <div className="p-4 -mt-4 relative z-20 space-y-4">

        {/* Vehicle Info */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-outline-variant/30 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Phương tiện</p>
            <p className="font-extrabold text-on-surface">{vehicle || 'Chưa đăng ký'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Biển số</p>
            <p className="font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{licensePlate || 'Chưa đăng ký'}</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-outline-variant/30 space-y-3">
          <div className="flex flex-col gap-1 border-b border-outline-variant/20 pb-3">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">ID Nhân viên</span>
            <span className="text-xs font-bold text-on-surface break-all">{userId}</span>
          </div>
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Họ và tên</span>
            <span className="text-sm font-bold text-on-surface">{displayName}</span>
          </div>
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Email</span>
            <span className="text-sm font-bold text-on-surface">{email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Số điện thoại</span>
            <span className="text-sm font-bold text-on-surface">{phone}</span>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <button onClick={() => setActiveModal('personal')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest transition-colors border-b border-outline-variant/30 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <User size={18} />
              </div>
              <span className="font-bold text-sm text-on-surface">Chỉnh sửa phương tiện</span>
            </div>
          </button>
          <button onClick={() => setActiveModal('rules')} className="w-full flex items-center justify-between p-4 hover:bg-surface-container-lowest transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-low text-on-surface flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <FileText size={18} />
              </div>
              <span className="font-bold text-sm text-on-surface">Quy định giao hàng</span>
            </div>
          </button>
        </div>

        {/* Logout */}
        <button onClick={() => { logout(); }} className="w-full mt-4 bg-error/10 text-error font-extrabold p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-error hover:text-white transition-all active:scale-95 shadow-sm border border-error/20">
          <LogOut size={20} /> ĐĂNG XUẤT
        </button>

        <p className="text-center text-[10px] text-outline font-bold mt-4 uppercase tracking-widest">Phiên bản 1.0.0 - PetLove Shipper</p>

      </div>

      {/* Modals */}
      <GenericModal
        isOpen={activeModal === 'personal'}
        onClose={() => setActiveModal(null)}
        title="Chỉnh sửa phương tiện"
        icon={User}
        actions={
          <div className="flex gap-2 w-full justify-end">
            <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-surface-variant text-outline rounded-xl font-bold text-sm">Hủy</button>
            <button onClick={handleSaveVehicle} className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm">Lưu</button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Loại xe</label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="Ví dụ: Yamaha Exciter"
              className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-widest">Biển số xe</label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="Ví dụ: 51K1-999.99"
              className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold"
            />
          </div>
        </div>
      </GenericModal>

      <GenericModal
        isOpen={activeModal === 'rules'}
        onClose={() => setActiveModal(null)}
        title="Quy định giao hàng"
        icon={FileText}
        actions={
          <button onClick={() => setActiveModal(null)} className="px-6 py-2.5 font-bold bg-primary text-white rounded-xl">Đã hiểu</button>
        }
      >
        <ul className="space-y-3 list-disc pl-5 text-sm font-medium text-on-surface/80">
          <li>Luôn gọi điện cho khách hàng trước khi giao ít nhất 15 phút.</li>
          <li>Đảm bảo hàng hóa nguyên vẹn, không móp méo hay đổ vỡ.</li>
          <li>Thái độ lịch sự, thân thiện với khách hàng.</li>
          <li>Nếu không liên lạc được với khách, cần báo cáo trên ứng dụng và chụp ảnh bằng chứng tại địa chỉ giao hàng.</li>
          <li>Nộp lại tiền COD cho quản lý cửa hàng vào cuối mỗi ca làm việc.</li>
        </ul>
      </GenericModal>
    </div>
  );
};

export default ShipperProfilePage;
