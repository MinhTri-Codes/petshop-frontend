import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { 
  ChevronRight, 
  Truck, 
  Store, 
  UserCircle2, 
  MapPin, 
  Navigation, 
  Wallet, 
  Landmark, 
  ShieldCheck, 
  RefreshCcw 
} from 'lucide-react';
import apiClient from '../apiClient';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [shippingMethod, setShippingMethod] = useState('delivery'); // 'delivery' or 'pickup'
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'bank'
  
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucherId, setAppliedVoucherId] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Form states
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Address states
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [street, setStreet] = useState('');
  const [note, setNote] = useState('');
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Shipping calculation states
  const [distance, setDistance] = useState(null);
  const [deliveryError, setDeliveryError] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [isGettingGps, setIsGettingGps] = useState(false);
  
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/shop/settings');
        setSettings(res.data);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  const calculateHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const fetchCartAndProfile = async () => {
      try {
        const [cartRes, profileRes] = await Promise.all([
          apiClient.get('/shop/cart'),
          apiClient.get('/customer/profile')
        ]);
        const items = cartRes.data.items.map(item => ({
          id: item.Id,
          name: item.ProductName || item.PetName,
          price: Number(item.ProductPrice || item.PetPrice),
          quantity: item.Quantity,
          variant: item.Variant,
          image: item.ProductImage || item.PetImage
        }));
        setCartItems(items);
        
        if (profileRes.data) {
          setReceiverName(profileRes.data.FullName || '');
          setReceiverPhone(profileRes.data.PhoneNumber || '');
          setEmail(profileRes.data.Email || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCartAndProfile();
    
    // Fetch provinces
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Lỗi tải tỉnh thành:', err));
  }, []);

  const handleProvinceChange = (e) => {
    const pCode = e.target.value;
    setSelectedProvince(pCode);
    setSelectedDistrict('');
    setSelectedWard('');
    setWards([]);
    if (pCode) {
      fetch(`https://provinces.open-api.vn/api/p/${pCode}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts))
        .catch(err => console.error(err));
    } else {
      setDistricts([]);
    }
  };

  const handleDistrictChange = (e) => {
    const dCode = e.target.value;
    setSelectedDistrict(dCode);
    setSelectedWard('');
    if (dCode) {
      fetch(`https://provinces.open-api.vn/api/d/${dCode}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards))
        .catch(err => console.error(err));
    } else {
      setWards([]);
    }
  };


  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    if (shippingMethod === 'pickup') {
      setShippingCost(0);
      setDistance(null);
      setDeliveryError(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (selectedProvince && selectedDistrict && selectedWard) {
        setIsCalculatingDistance(true);
        setDeliveryError(null);
        try {
          const pName = provinces.find(p => p.code == selectedProvince)?.name || '';
          const dName = districts.find(d => d.code == selectedDistrict)?.name || '';
          const wName = wards.find(w => w.code == selectedWard)?.name || '';
          
          const storeLat = parseFloat(settings?.storeLat || '10.796');
          const storeLon = parseFloat(settings?.storeLon || '106.654');
          const maxDist = parseFloat(settings?.maxShippingDistance || '8');
          const baseFee = parseInt(settings?.baseShippingFee || '15000');
          const baseDist = parseFloat(settings?.baseDistance || '3');
          const extraFee = parseInt(settings?.extraFeePerKm || '5000');
          const defaultShippingFee = parseInt(settings?.defaultShippingFee || '30000');

          const getDrivingDistance = async (lat1, lon1, lat2, lon2) => {
            try {
              const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
              const res = await fetch(url);
              const data = await res.json();
              if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return data.routes[0].distance / 1000;
              }
            } catch (e) {
              console.error("OSRM error:", e);
            }
            return null;
          };

          const processLocation = async (lat, lon) => {
            let d = await getDrivingDistance(storeLat, storeLon, lat, lon);
            
            // Fallback to Haversine straight-line if API fails
            if (d === null) {
              d = calculateHaversine(storeLat, storeLon, lat, lon);
            }
            
            // Fix 0km issue (OSM center point collision for same district/ward)
            if (d < 0.5) {
              const hash = parseInt(selectedWard || selectedDistrict || '0') % 20; 
              d = 1.2 + (hash / 10); // Returns deterministic 1.2km to 3.1km
            }
            
            setDistance(d);
            if (d > maxDist) {
              setDeliveryError(`Khoảng cách là ${d.toFixed(1)}km, vượt quá phạm vi giao hàng (${maxDist}km).`);
              setShippingCost(0);
            } else {
              let fee = baseFee;
              if (d > baseDist) {
                fee += Math.ceil(d - baseDist) * extraFee;
              }
              const freeshipThreshold = parseInt(settings?.freeshipThreshold || '500000');
              if (subtotal >= freeshipThreshold) {
                fee = 0;
              }
              setShippingCost(fee);
            }
          };

          const queriesToTry = [];
          if (street && street.trim()) {
            queriesToTry.push(`${street.trim()}, ${wName}, ${dName}, ${pName}`);
            queriesToTry.push(`${street.trim()}, ${dName}, ${pName}`);
          }
          queriesToTry.push(`${wName}, ${dName}, ${pName}`);
          queriesToTry.push(`${dName}, ${pName}`);

          let foundLoc = gpsLocation;
          if (!foundLoc) {
            for (const q of queriesToTry) {
            if (!q) continue;
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&email=petlove.admin@gmail.com`);
              const data = await res.json();
              if (data && data.length > 0) {
                foundLoc = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
                break;
              }
            } catch (e) {
              console.error("OSM fetch error", e);
            }
          }
          }

          if (foundLoc) {
            await processLocation(foundLoc.lat, foundLoc.lon);
          } else {
            setDistance(null);
            setShippingCost(defaultShippingFee);
          }
        } catch (error) {
          console.error("Lỗi Geocoding:", error);
          const defaultShippingFee = parseInt(settings?.defaultShippingFee || '30000');
          setShippingCost(defaultShippingFee);
        } finally {
          setIsCalculatingDistance(false);
        }
      } else {
        setShippingCost(0);
        setDistance(null);
        setDeliveryError(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedWard, selectedDistrict, selectedProvince, shippingMethod, provinces, districts, wards, subtotal, gpsLocation]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGpsLocation({ lat, lon });
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=vi&email=petlove.admin@gmail.com`);
          const data = await res.json();
          if (data && data.address) {
            const { road, house_number, suburb, quarter, city_district, county, city, province, state } = data.address;
            
            let streetStr = "";
            if (house_number) streetStr += house_number + " ";
            if (road) streetStr += road;
            
            const normalize = (str) => {
              if(!str) return '';
              let s = str.toLowerCase();
              s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              s = s.replace(/(thanh pho|tinh|quan|huyen|thi xa|phuong|xa|thi tran|city|district|ward|province|county)/g, '');
              s = s.replace(/ho chi minh/g, 'hcm');
              return s.trim();
            };

            const isMatch = (a, b) => {
              const nA = normalize(a);
              const nB = normalize(b);
              if (nA === nB) return true;
              if (!isNaN(nA) || !isNaN(nB)) return false; 
              return nA.includes(nB) || nB.includes(nA);
            };

            const cityName = city || province || state || '';
            const districtName = city_district || county || data.address.town || data.address.district || data.address.township || suburb || '';
            const wardName = quarter || data.address.village || data.address.hamlet || data.address.neighbourhood || data.address.ward || data.address.residential || suburb || '';
            
            if (cityName || districtName) {
              let matchedP = provinces.find(p => isMatch(p.name, cityName));
              
              if (!matchedP) {
                // Fallback: search all provinces for a matching district
                try {
                  const allRes = await fetch(`https://provinces.open-api.vn/api/?depth=2`);
                  const allData = await allRes.json();
                  for (const p of allData) {
                    if (p.districts.some(d => (cityName && isMatch(d.name, cityName)) || (districtName && isMatch(d.name, districtName)))) {
                      matchedP = provinces.find(x => x.code === p.code);
                      break;
                    }
                  }
                } catch (e) {
                  console.error("Error fetching all provinces for fallback", e);
                }
              }

              if (matchedP) {
                setSelectedProvince(matchedP.code);
                
                const pRes = await fetch(`https://provinces.open-api.vn/api/p/${matchedP.code}?depth=3`);
                const pData = await pRes.json();
                setDistricts(pData.districts);
                
                let bestDistrict = null;
                let bestWard = null;
                
                if (cityName || districtName) {
                  bestDistrict = pData.districts.find(d => 
                    (cityName && isMatch(d.name, cityName)) || 
                    (districtName && isMatch(d.name, districtName))
                  );
                }
                
                if (wardName) {
                  if (bestDistrict) {
                    bestWard = bestDistrict.wards.find(w => isMatch(w.name, wardName));
                  } else {
                    for (const d of pData.districts) {
                      const foundW = d.wards.find(w => isMatch(w.name, wardName));
                      if (foundW) {
                        bestWard = foundW;
                        bestDistrict = d;
                        break;
                      }
                    }
                  }
                }
                
                if (!bestDistrict) {
                  try {
                    const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`);
                    const bdcData = await bdcRes.json();
                    if (bdcData && bdcData.localityInfo && bdcData.localityInfo.administrative) {
                      const admins = bdcData.localityInfo.administrative;
                      for (const adm of admins) {
                        const foundD = pData.districts.find(d => isMatch(d.name, adm.name) || isMatch(d.name, bdcData.locality || ''));
                        if (foundD) {
                          bestDistrict = foundD;
                          for (const admW of admins) {
                            const foundW = foundD.wards.find(w => isMatch(w.name, admW.name));
                            if (foundW) {
                              bestWard = foundW;
                              break;
                            }
                          }
                          break;
                        }
                      }
                    }
                  } catch (e) {
                    console.error("BigDataCloud fallback failed", e);
                  }
                }
                
                if (bestDistrict) {
                  setSelectedDistrict(bestDistrict.code);
                  setWards(bestDistrict.wards);
                  if (bestWard) {
                    setSelectedWard(bestWard.code);
                  }
                }
              }
            }
            
            if (streetStr) {
               setStreet(streetStr);
            } else {
               setStreet(data.display_name);
            }
          }
        } catch (e) {
          console.error("Reverse geocode error", e);
        }
        
        setIsGettingGps(false);
      },
      (err) => {
        console.error(err);
        alert("Không thể lấy vị trí. Vui lòng bật quyền truy cập vị trí trên trình duyệt của bạn.");
        setIsGettingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const total = subtotal + shippingCost - discountAmount;

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    try {
      const res = await apiClient.post('/shop/vouchers/apply', {
        code: voucherInput.toUpperCase(),
        subTotal: subtotal,
        items: cartItems.map(item => ({ id: item.id, price: item.price, quantity: item.quantity, categoryId: item.categoryId }))
      });
      setAppliedVoucherId(res.data.voucherId);
      setDiscountAmount(res.data.discount);
      alert(`🎉 ${res.data.message} Bạn được giảm ${Number(res.data.discount).toLocaleString('vi-VN')}đ`);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Mã giảm giá không hợp lệ');
      setAppliedVoucherId(null);
      setDiscountAmount(0);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return alert('Giỏ hàng trống!');
    if (shippingMethod === 'delivery' && deliveryError) return alert(deliveryError);
    
    let fullAddress = '';
    if (shippingMethod === 'delivery') {
      if (!receiverName.trim() || !receiverPhone.trim()) {
        return alert('Vui lòng nhập họ tên và số điện thoại!');
      }
      if (!selectedProvince || !selectedDistrict || !selectedWard || !street.trim()) {
        return alert('Vui lòng chọn đầy đủ địa chỉ giao hàng!');
      }
      const pName = provinces.find(p => p.code == selectedProvince)?.name || '';
      const dName = districts.find(d => d.code == selectedDistrict)?.name || '';
      const wName = wards.find(w => w.code == selectedWard)?.name || '';
      fullAddress = `${street}, ${wName}, ${dName}, ${pName}`;
    }

    setPlacingOrder(true);
    try {
      const res = await apiClient.post('/shop/checkout', {
        shippingMethod,
        paymentMethod,
        voucherId: appliedVoucherId,
        shippingFee: shippingCost,
        distance: distance || 0,
        receiverName,
        receiverPhone,
        fullAddress,
        note
      });

      if (paymentMethod === 'vnpay') {
        // Gọi API tạo URL VNPay
        const vnpayRes = await apiClient.post('/shop/create_payment_url', {
          amount: total,
          orderInfo: 'Thanh toán đơn hàng PetLove',
          orderId: res.data.orderId
        });
        // Chuyển hướng sang VNPay
        window.location.href = vnpayRes.data.url;
      } else {
        alert(`🎉 ${res.data.message}\nMã đơn hàng: ${res.data.orderCode}\nTổng tiền: ${Number(res.data.totalAmount).toLocaleString('vi-VN')}đ`);
        navigate('/'); 
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Lỗi đặt hàng');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="text-on-surface bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary min-h-screen flex flex-col">
      <Header />
      
      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto w-full flex-grow">
        
        {/* Breadcrumb / Steps */}
        <div className="flex items-center gap-3 mb-10 overflow-x-auto whitespace-nowrap py-2 no-scrollbar">
          <span className="text-outline flex items-center gap-2 font-bold text-sm">
            Giỏ hàng <ChevronRight size={16} />
          </span>
          <span className="text-primary font-bold flex items-center gap-2 text-sm underline underline-offset-4 decoration-2">
            Thanh toán <ChevronRight size={16} />
          </span>
          <span className="text-outline-variant flex items-center gap-2 font-bold text-sm">
            Hoàn tất
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Shipping Method Tabs */}
            <section className="bg-white rounded-2xl md:rounded-[32px] shadow-sm p-4 sm:p-6 md:p-8 border border-outline-variant/30">
              <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mb-4 md:mb-6">Phương thức nhận hàng</h2>
              <div className="flex p-1.5 bg-surface-container-low rounded-2xl gap-2 border border-outline-variant/20">
                <button 
                  onClick={() => { setShippingMethod('delivery'); setDiscountAmount(0); setAppliedVoucherId(null); setVoucherInput(''); }}
                  className={`flex-1 py-4 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    shippingMethod === 'delivery' ? 'bg-primary text-white shadow-md' : 'text-outline hover:bg-surface-variant'
                  }`}
                >
                  <Truck size={20} />
                  Giao hàng tận nơi
                </button>
                <button 
                  onClick={() => { setShippingMethod('pickup'); setDiscountAmount(0); setAppliedVoucherId(null); setVoucherInput(''); }}
                  className={`flex-1 py-4 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    shippingMethod === 'pickup' ? 'bg-primary text-white shadow-md' : 'text-outline hover:bg-surface-variant'
                  }`}
                >
                  <Store size={20} />
                  Nhận tại shop
                </button>
              </div>
            </section>

            {/* Customer Info Form */}
            <section className="bg-white rounded-2xl md:rounded-[32px] shadow-sm p-4 sm:p-6 md:p-8 border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <UserCircle2 size={24} />
                </div>
                <h2 className="text-xl font-extrabold text-primary">Thông tin khách hàng</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="font-bold text-sm text-on-surface">Họ và tên <span className="text-error">*</span></label>
                  <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className="w-full h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="Nguyễn Văn A" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-sm text-on-surface">Số điện thoại <span className="text-error">*</span></label>
                  <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className="w-full h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="0901234567" type="tel" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="font-bold text-sm text-on-surface">Email <span className="text-outline font-normal">(Tùy chọn)</span></label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="email@example.com" type="email" />
                </div>
              </div>

              {/* Dynamic Delivery Content */}
              {shippingMethod === 'delivery' && (
                <div className="mt-8 space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h3 className="font-bold text-lg text-on-surface border-t border-outline-variant/20 pt-8">Địa chỉ giao hàng</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <select value={selectedProvince} onChange={handleProvinceChange} className="h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none cursor-pointer">
                      <option value="">Chọn Tỉnh/Thành</option>
                      {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                    </select>
                    <select value={selectedDistrict} onChange={handleDistrictChange} className="h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none cursor-pointer" disabled={!selectedProvince}>
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                    <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} className="h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium appearance-none cursor-pointer" disabled={!selectedDistrict}>
                      <option value="">Chọn Phường/Xã</option>
                      {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center mt-2">
                    <input value={street} onChange={(e) => setStreet(e.target.value)} className="flex-1 h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" placeholder="Số nhà, tên đường, tòa nhà..." type="text" />
                    <button type="button" onClick={handleGetLocation} disabled={isGettingGps} className={`h-14 px-4 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all font-bold flex items-center gap-2 whitespace-nowrap shadow-sm ${isGettingGps ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isGettingGps ? <RefreshCcw size={20} className="animate-spin" /> : <MapPin size={20} />}
                      <span className="hidden sm:inline">{isGettingGps ? 'Đang lấy...' : 'Lấy tọa độ hiện tại'}</span>
                    </button>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <label className="font-bold text-sm text-on-surface">Ghi chú giao hàng <span className="text-outline font-normal">(Tùy chọn)</span></label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium min-h-[100px] resize-none" placeholder="Ví dụ: Giao giờ hành chính, Gọi trước khi giao..."></textarea>
                  </div>
                  
                  {isCalculatingDistance ? (
                    <div className="text-sm font-bold text-primary animate-pulse">Đang tính toán khoảng cách và phí ship...</div>
                  ) : distance !== null && (
                    <div className={`p-4 rounded-xl font-bold text-sm flex items-center gap-2 ${deliveryError ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                      <Navigation size={18} />
                      {deliveryError 
                        ? deliveryError
                        : `Khoảng cách: ${distance.toFixed(1)} km - Phí giao hàng: ${Number(shippingCost).toLocaleString('vi-VN')}đ`
                      }
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Pickup Content */}
              {shippingMethod === 'pickup' && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h3 className="font-bold text-lg text-on-surface border-t border-outline-variant/20 pt-8 mb-5">Chọn cửa hàng</h3>
                  <div className="bg-primary/5 rounded-[20px] p-6 border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="p-3 bg-white rounded-full text-primary shadow-sm shrink-0">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <p className="font-extrabold text-lg text-on-surface mb-1">{settings?.storeName || 'PetLove Flagship Store'}</p>
                        <p className="text-on-surface-variant text-sm mb-2 leading-relaxed">{settings?.address || '123 Đường Thú Cưng, Phường 4, Quận Tân Bình, TP.HCM'}</p>
                        <span className="inline-block bg-white text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                          Giờ mở cửa: 08:00 - 21:00
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Payment Method */}
            <section className="bg-white rounded-2xl md:rounded-[32px] shadow-sm p-4 sm:p-6 md:p-8 border border-outline-variant/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <Wallet size={24} />
                </div>
                <h2 className="text-xl font-extrabold text-primary">Phương thức thanh toán</h2>
              </div>
              
              <div className="space-y-4">
                <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low'
                }`}>
                  <div className="relative flex items-center justify-center">
                    <input 
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')}
                      className="peer sr-only" 
                      name="payment" 
                      type="radio" 
                    />
                    <div className="w-6 h-6 rounded-full border-2 border-outline-variant peer-checked:border-primary peer-checked:border-[6px] transition-all"></div>
                  </div>
                  <div className="ml-5 flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'cod' ? 'bg-primary text-white' : 'bg-surface-variant text-outline'} transition-colors`}>
                      <Wallet size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-lg">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-outline mt-0.5">Thanh toán bằng tiền mặt khi shipper giao hàng</p>
                    </div>
                  </div>
                </label>

                <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                  paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/30 hover:bg-surface-container-low'
                }`}>
                  <div className="relative flex items-center justify-center">
                    <input 
                      checked={paymentMethod === 'vnpay'} 
                      onChange={() => setPaymentMethod('vnpay')}
                      className="peer sr-only" 
                      name="payment" 
                      type="radio" 
                    />
                    <div className="w-6 h-6 rounded-full border-2 border-outline-variant peer-checked:border-primary peer-checked:border-[6px] transition-all"></div>
                  </div>
                  <div className="ml-5 flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${paymentMethod === 'vnpay' ? 'bg-blue-600 text-white' : 'bg-surface-variant text-outline'} transition-colors`}>
                      <span className="font-extrabold text-sm">VNPAY</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-lg">Thanh toán VNPay</p>
                      <p className="text-sm text-outline mt-0.5">Thanh toán tự động qua Cổng VNPay (Thẻ ATM, Visa, MasterCard)</p>
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>
          
          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-2xl md:rounded-[32px] p-4 sm:p-6 md:p-8 shadow-sm border border-outline-variant/30">
                <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mb-4 md:mb-6 pb-4 border-b border-outline-variant/20">Đơn hàng của bạn</h2>
                
                {/* Product List */}
                <div className="max-h-72 overflow-y-auto custom-scrollbar pr-2 mb-6 space-y-5">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 bg-surface-container-low bg-cover bg-center rounded-xl flex-shrink-0 shadow-sm overflow-hidden relative">
                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.name} />
                        <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">x{item.quantity}</span>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="font-bold text-on-surface text-sm line-clamp-2 leading-snug hover:text-primary transition-colors cursor-pointer">{item.name}</p>
                        {item.variant && <p className="text-xs font-medium text-secondary mt-0.5">{item.variant}</p>}
                        <div className="mt-2 text-primary font-black text-base">{Number(item.price).toLocaleString('vi-VN')}đ</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Voucher Input */}
                <div className="flex gap-2 mb-6">
                  <input 
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    className="flex-1 h-14 px-5 rounded-xl border border-outline-variant/50 bg-surface-container-low focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold uppercase placeholder:normal-case placeholder:font-medium" 
                    placeholder="Mã giảm giá (Ví dụ: PETLOVE10)" 
                    type="text" 
                  />
                  <button onClick={handleApplyVoucher} className="px-6 h-14 bg-secondary text-white rounded-xl font-bold hover:bg-primary transition-colors active:scale-95 shadow-md">Áp dụng</button>
                </div>
                
                {/* Price Breakdown */}
                <div className="space-y-4 py-6 border-t border-b border-outline-variant/30 mb-6 border-dashed">
                  <div className="flex justify-between text-outline font-medium">
                    <span>Tạm tính</span>
                    <span className="text-on-surface font-bold">{Number(subtotal).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-outline font-medium transition-all duration-300">
                    <span>Phí vận chuyển</span>
                    <span className="text-on-surface font-bold">{shippingCost === 0 ? 'Miễn phí' : `${Number(shippingCost).toLocaleString('vi-VN')}đ`}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-tertiary font-bold bg-tertiary/10 p-3 rounded-lg -mx-3">
                      <span>Giảm giá</span>
                      <span>-{Number(discountAmount).toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>
                
                {/* Total */}
                <div className="flex justify-between items-end mb-8">
                  <span className="font-bold text-lg">Tổng cộng</span>
                  <div className="text-right">
                    <span className="text-xs text-outline block mb-1">Đã bao gồm VAT</span>
                    <span className="font-black text-primary text-3xl md:text-4xl leading-none">
                      {Number(Math.max(0, total)).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
                
                {/* Floating Action Button (Mobile) / Normal Button (PC) */}
                <div className="fixed bottom-[60px] left-0 right-0 p-4 bg-white border-t border-outline-variant/30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-40 md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-0 md:shadow-none md:z-auto mt-6">
                  <button disabled={placingOrder || (shippingMethod === 'delivery' && !!deliveryError)} onClick={handleCheckout} className="w-full h-14 md:h-[56px] bg-primary text-white font-extrabold rounded-2xl md:rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 group overflow-hidden relative disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed">
                    <span className="relative z-10">{placingOrder ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-in-out"></div>
                  </button>
                </div>
                
                {/* Extra spacing on mobile to avoid overlap */}
                <div className="h-16 md:hidden"></div>

                <p className="text-center text-xs text-outline mt-6">
                  Bằng cách đặt hàng, bạn đồng ý với <a href="#" className="text-primary underline">Điều khoản &amp; Chính sách</a> của PetLove.
                </p>
              </div>
              
            </div>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
