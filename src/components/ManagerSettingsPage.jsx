import React, { useState, useEffect } from 'react';
import { Save, Store, Truck, Bell } from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import apiClient from '../apiClient';

const ManagerSettingsPage = () => {
  const [settings, setSettings] = useState({
    storeName: 'My Pet Store',
    phone: '0123456789',
    email: 'contact@mypetstore.com',
    storeProvinceCode: '',
    storeDistrictCode: '',
    storeWardCode: '',
    storeStreet: '',
    address: '',
    maxShippingDistance: '8',
    baseShippingFee: '15000',
    baseDistance: '3',
    extraFeePerKm: '5000',
    defaultShippingFee: '30000',
    shipperWagePerKm: '5000',
    freeshipThreshold: '500000',
    notifyNewOrder: 'true',
    notifyNewReview: 'true',
    storeLat: '10.796',
    storeLon: '106.655',
    guarantee1Title: 'Miễn phí giao hàng',
    guarantee1Desc: 'Cho đơn hàng trên 500k trong bán kính 5km',
    guarantee2Title: 'Cam kết chính hãng 100%',
    guarantee2Desc: 'Hoàn tiền 200% nếu phát hiện hàng giả'
  });
  const [loading, setLoading] = useState(false);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (settings.storeProvinceCode) {
      fetch(`https://provinces.open-api.vn/api/p/${settings.storeProvinceCode}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts || []))
        .catch(err => console.error(err));
    } else {
      setDistricts([]);
    }
  }, [settings.storeProvinceCode]);

  useEffect(() => {
    if (settings.storeDistrictCode) {
      fetch(`https://provinces.open-api.vn/api/d/${settings.storeDistrictCode}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards || []))
        .catch(err => console.error(err));
    } else {
      setWards([]);
    }
  }, [settings.storeDistrictCode]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/manager/settings');
        if (res.data && Object.keys(res.data).length > 0) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
      } catch (error) {
        console.error('Lỗi tải cài đặt:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked.toString() : value
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      let updatedSettings = { ...settings };
      
      if (settings.storeProvinceCode && settings.storeDistrictCode && settings.storeWardCode) {
        const pName = provinces.find(p => p.code == settings.storeProvinceCode)?.name || '';
        const dName = districts.find(d => d.code == settings.storeDistrictCode)?.name || '';
        const wName = wards.find(w => w.code == settings.storeWardCode)?.name || '';
        
        updatedSettings.address = `${settings.storeStreet ? settings.storeStreet + ', ' : ''}${wName}, ${dName}, ${pName}`;
        updatedSettings.storeProvinceName = pName;
        updatedSettings.storeDistrictName = dName;
        updatedSettings.storeWardName = wName;
        
        const query = `${wName}, ${dName}, ${pName}`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=1`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.length > 0) {
            updatedSettings.storeLat = data[0].lat;
            updatedSettings.storeLon = data[0].lon;
          } else {
             const fallbackQuery = `${dName}, ${pName}`;
             const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&countrycodes=vn&limit=1`;
             const res2 = await fetch(fallbackUrl);
             const data2 = await res2.json();
             if (data2 && data2.length > 0) {
                updatedSettings.storeLat = data2[0].lat;
                updatedSettings.storeLon = data2[0].lon;
             }
          }
        } catch (e) {
          console.error("Geocode error", e);
        }
      }

      await apiClient.put('/manager/settings', updatedSettings);
      setSettings(updatedSettings);
      alert('Lưu cài đặt thành công!');
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu cài đặt!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader placeholder="Cài đặt..." />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Cài đặt hệ thống</h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Cấu hình thông tin cửa hàng, vận chuyển và thông báo.</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 text-sm font-extrabold disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Store Settings */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 lg:col-span-2">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Store size={20} />
                </div>
                <h3 className="text-lg font-bold text-on-surface">Thông tin cửa hàng</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="font-bold text-sm text-on-surface">Tên cửa hàng</label>
                  <input name="storeName" value={settings.storeName || ''} onChange={handleChange} type="text" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-on-surface">Số điện thoại</label>
                  <input name="phone" value={settings.phone || ''} onChange={handleChange} type="text" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-on-surface">Email liên hệ</label>
                  <input name="email" value={settings.email || ''} onChange={handleChange} type="email" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-bold text-sm text-on-surface">Địa chỉ cụ thể (Số nhà, tên đường)</label>
                  <input name="storeStreet" value={settings.storeStreet || ''} onChange={handleChange} type="text" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-on-surface">Tỉnh / Thành phố</label>
                  <select name="storeProvinceCode" value={settings.storeProvinceCode || ''} onChange={handleChange} className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium">
                    <option value="">Chọn Tỉnh / Thành phố</option>
                    {provinces.map(p => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-on-surface">Quận / Huyện</label>
                  <select name="storeDistrictCode" value={settings.storeDistrictCode || ''} onChange={handleChange} disabled={!settings.storeProvinceCode} className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium disabled:opacity-50">
                    <option value="">Chọn Quận / Huyện</option>
                    {districts.map(d => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-on-surface">Phường / Xã</label>
                  <select name="storeWardCode" value={settings.storeWardCode || ''} onChange={handleChange} disabled={!settings.storeDistrictCode} className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium disabled:opacity-50">
                    <option value="">Chọn Phường / Xã</option>
                    {wards.map(w => (
                      <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Other Settings (Shipping & Notifications) */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-on-surface">Vận chuyển (Giao hàng hỏa tốc)</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Khoảng cách giao tối đa (km)</label>
                    <input name="maxShippingDistance" value={settings.maxShippingDistance || ''} onChange={handleChange} type="number" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Phí giao hàng cơ bản (VNĐ)</label>
                    <input name="baseShippingFee" value={settings.baseShippingFee || ''} onChange={handleChange} type="number" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Khoảng cách cơ bản (km)</label>
                    <input name="baseDistance" value={settings.baseDistance || ''} onChange={handleChange} type="number" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Phí phát sinh mỗi km tiếp theo (VNĐ)</label>
                    <input name="extraFeePerKm" value={settings.extraFeePerKm || ''} onChange={handleChange} type="number" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Mức Freeship (VNĐ)</label>
                    <input name="freeshipThreshold" value={settings.freeshipThreshold || ''} onChange={handleChange} type="number" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Phí ship mặc định (VNĐ)</label>
                    <input name="defaultShippingFee" value={settings.defaultShippingFee || ''} onChange={handleChange} type="number" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Lương Shipper / Km (VNĐ)</label>
                    <input name="shipperWagePerKm" value={settings.shipperWagePerKm || ''} onChange={handleChange} type="number" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                </div>
              </div>

            </div>

            {/* Guarantees Settings */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6 lg:col-span-3">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/30">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Store size={20} />
                </div>
                <h3 className="text-lg font-bold text-on-surface">Cam kết hiển thị trên sản phẩm</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-primary">Cam kết 1</h4>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Tiêu đề</label>
                    <input name="guarantee1Title" value={settings.guarantee1Title || ''} onChange={handleChange} type="text" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Mô tả</label>
                    <input name="guarantee1Desc" value={settings.guarantee1Desc || ''} onChange={handleChange} type="text" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-primary">Cam kết 2</h4>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Tiêu đề</label>
                    <input name="guarantee2Title" value={settings.guarantee2Title || ''} onChange={handleChange} type="text" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-on-surface">Mô tả</label>
                    <input name="guarantee2Desc" value={settings.guarantee2Desc || ''} onChange={handleChange} type="text" className="w-full h-11 px-4 bg-surface-container-low border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary font-medium" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerSettingsPage;
