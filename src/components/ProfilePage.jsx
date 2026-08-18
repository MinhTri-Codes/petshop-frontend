import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import CustomerOrderDetailModal from './CustomerOrderDetailModal';
import ProfileEditModal from './ProfileEditModal';
import ChangePasswordModal from './ChangePasswordModal';
import PetEditModal from './PetEditModal';
import { 
  UserCircle2, ShoppingBag, Heart, MapPin, Settings, LogOut, Package, Clock, CheckCircle, Edit3, Camera, PawPrint, ShoppingCart, Eye, Star, Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // States for modals
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPetEditOpen, setIsPetEditOpen] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  
  // Filter for orders
  const [orderFilter, setOrderFilter] = useState('Tất cả đơn hàng');

  const fileInputRef = useRef(null);

  // States for data
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [pets, setPets] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const fetchProfile = async () => {
    try { const res = await apiClient.get('/customer/profile'); setProfile(res.data); } catch (e) { }
  };
  const fetchOrders = async () => {
    try { const res = await apiClient.get('/customer/orders'); setOrders(res.data); } catch (e) { }
  };
  const fetchPets = async () => {
    try { const res = await apiClient.get('/customer/my-pets'); setPets(res.data); } catch (e) { }
  };
  const fetchFavorites = async () => {
    try { const res = await apiClient.get('/customer/favorites'); setFavorites(res.data); } catch (e) { }
  };

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchOrders(), fetchPets(), fetchFavorites()]);
    } catch (error) {
      console.error('Lỗi khi tải thông tin:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/auth');
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const form = new FormData();
      form.append('image', file);
      
      const uploadRes = await apiClient.post('/customer/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newAvatarUrl = uploadRes.data.url;
      
      await apiClient.put('/customer/profile', {
        FullName: profile.FullName,
        PhoneNumber: profile.PhoneNumber,
        AvatarUrl: newAvatarUrl
      });
      
      fetchProfile();
      alert('Cập nhật ảnh đại diện thành công');
    } catch (err) {
      console.error('Lỗi upload ảnh đại diện:', err);
      alert('Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (order) => {
    try {
      setLoading(true);
      for (const item of order.items) {
        if (item.ProductId) {
          await apiClient.post('/shop/cart/add', {
            productId: item.ProductId,
            quantity: item.Quantity
          });
        } else if (item.StorePetId) {
          await apiClient.post('/shop/cart/add', {
            storePetId: item.StorePetId,
            quantity: item.Quantity
          });
        }
      }
      window.dispatchEvent(new Event('cartUpdated'));
      navigate('/cart');
    } catch (error) {
      console.error('Lỗi khi mua lại:', error);
      alert('Có lỗi khi thêm sản phẩm vào giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    try {
      await apiClient.delete(`/customer/favorites/${id}`);
      fetchFavorites();
    } catch (error) {
      console.error('Lỗi bỏ yêu thích:', error);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await apiClient.post('/shop/cart/add', {
        productId: product.Id,
        quantity: 1
      });
      window.dispatchEvent(new Event('cartUpdated'));
      alert('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Lỗi thêm giỏ hàng:', error);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'Tất cả đơn hàng') return true;
    if (orderFilter === 'Đang giao' && o.Status === 'DELIVERING') return true;
    if (orderFilter === 'Hoàn thành' && o.Status === 'COMPLETED') return true;
    if (orderFilter === 'Đã hủy' && o.Status === 'CANCELLED') return true;
    return false;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'DELIVERING': return 'bg-[#F2994A]/10 text-[#F2994A]';
      case 'COMPLETED': return 'bg-tertiary/10 text-tertiary';
      case 'CANCELLED': return 'bg-error/10 text-error';
      case 'PROCESSING': return 'bg-primary/10 text-primary';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };



  const TabButton = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all ${
        activeTab === id 
          ? 'bg-primary text-white shadow-md' 
          : 'text-outline hover:bg-surface-variant hover:text-on-surface'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="text-on-surface bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary min-h-screen flex flex-col">
      <Header />
      
      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto w-full flex-grow">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-2xl md:rounded-[32px] p-4 md:p-6 shadow-sm border border-outline-variant/30 sticky top-28">
              
              {/* User Info Overview */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-outline-variant/30 mb-6">
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                />
                <div className="relative mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                  <div className="w-24 h-24 rounded-full bg-surface-container-low overflow-hidden border-4 border-white shadow-lg">
                    <img src={profile?.AvatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"} alt="User Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <h3 className="font-extrabold text-xl mb-1 text-on-surface">{profile?.FullName || "Khách hàng"}</h3>
              </div>

              {/* Navigation Menu */}
              <div className="space-y-2">
                <TabButton id="profile" icon={UserCircle2} label="Hồ sơ cá nhân" />
                <TabButton id="orders" icon={ShoppingBag} label="Lịch sử đơn hàng" />
                <TabButton id="pets" icon={PawPrint} label="Thú cưng của tôi" />
                <TabButton id="favorites" icon={Heart} label="Yêu thích" />
                
                <div className="pt-4 mt-4 border-t border-outline-variant/30">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold text-error hover:bg-error-container/50 transition-all">
                    <LogOut size={20} />
                    Đăng xuất
                  </button>
                </div>
              </div>

            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9">
            
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl md:rounded-[32px] p-4 md:p-10 shadow-sm border border-outline-variant/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 md:mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mb-2">Hồ sơ cá nhân</h2>
                    <p className="text-outline text-sm md:text-base">Quản lý thông tin bảo mật tài khoản để nhận được dịch vụ tốt nhất.</p>
                  </div>
                  <button onClick={() => setIsProfileEditOpen(true)} className="flex items-center justify-center gap-2 text-primary font-bold bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-colors w-full sm:w-auto">
                    <Edit3 size={18} /> Chỉnh sửa
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-outline">Họ và tên</label>
                    <div className="w-full h-14 px-5 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center font-bold text-on-surface">{profile?.FullName || ''}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-outline">Số điện thoại</label>
                    <div className="w-full h-14 px-5 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center font-bold text-on-surface">{profile?.PhoneNumber || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-outline">Email</label>
                    <div className="w-full h-14 px-5 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center font-bold text-on-surface">{profile?.Email || ''}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-sm text-outline">Ngày tham gia</label>
                    <div className="w-full h-14 px-5 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center font-bold text-on-surface">
                      {profile?.CreatedAt ? new Date(profile.CreatedAt).toLocaleDateString('vi-VN') : ''}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="font-bold text-sm text-outline">Mật khẩu</label>
                    <div className="w-full h-14 px-5 rounded-xl border border-outline-variant/30 bg-surface-container-low flex justify-between items-center font-bold text-on-surface">
                      ••••••••
                      <button onClick={() => setIsChangePasswordOpen(true)} className="text-primary text-sm hover:underline">Đổi mật khẩu</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl md:rounded-[32px] p-4 md:p-10 shadow-sm border border-outline-variant/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mb-2">Lịch sử đơn hàng</h2>
                    <p className="text-outline text-sm md:text-base">Theo dõi và quản lý các đơn hàng bạn đã mua tại PetLove.</p>
                  </div>
                  <select 
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="h-12 px-4 rounded-xl border border-outline-variant/50 bg-surface-container-low font-bold text-sm focus:outline-none focus:border-primary"
                  >
                    <option>Tất cả đơn hàng</option>
                    <option>Đang giao</option>
                    <option>Hoàn thành</option>
                    <option>Đã hủy</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <p className="text-outline text-center py-8">Chưa có đơn hàng nào.</p>
                  ) : filteredOrders.map(order => (
                    <div key={order.Id} className="bg-white rounded-3xl border border-outline-variant/30 overflow-hidden hover:border-primary/30 transition-colors shadow-sm">
                      <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
                         <div>
                           <p className="font-extrabold text-on-surface text-sm md:text-base">{order.OrderCode}</p>
                           <p className="text-xs font-medium text-outline mt-0.5">{new Date(order.CreatedAt).toLocaleDateString('vi-VN')}</p>
                         </div>
                         <div className={`px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg ${getStatusColor(order.Status)}`}>
                           {order.Status}
                         </div>
                      </div>
                      
                      <div className="p-4 flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-surface-container-low rounded-xl overflow-hidden">
                              {order.items && order.items[0] && order.items[0].ImageUrl ? (
                                <img src={order.items[0].ImageUrl} alt="Product" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-full h-full p-4 text-outline/50" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-on-surface line-clamp-1">{order.items && order.items[0] ? order.items[0].ProductName : 'Đơn hàng'}</p>
                              <p className="text-xs font-bold text-on-surface mt-1">x{order.items && order.items[0] ? order.items[0].Quantity : 1}</p>
                            </div>
                          </div>
                          {order.items && order.items.length > 1 && (
                            <p className="text-xs font-medium text-outline">và {order.items.length - 1} sản phẩm khác</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col justify-end items-start sm:items-end gap-3 min-w-[120px]">
                          <div className="text-left sm:text-right w-full border-t sm:border-t-0 border-outline-variant/20 pt-3 sm:pt-0">
                            <p className="text-xs font-medium text-outline mb-1">Thành tiền</p>
                            <p className="font-black text-lg text-primary">{formatPrice(order.TotalAmount)}</p>
                          </div>
                          <div className="flex gap-2 w-full">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="flex-1 px-4 py-2 bg-surface-container-low hover:bg-surface-variant text-on-surface font-bold text-xs rounded-xl transition-colors"
                            >
                              Chi tiết
                            </button>
                            <button 
                              onClick={() => handleReorder(order)}
                              className="flex-1 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
                            >
                              Mua lại
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PETS TAB */}
            {activeTab === 'pets' && (
              <div className="bg-white rounded-2xl md:rounded-[32px] p-4 md:p-10 shadow-sm border border-outline-variant/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 md:mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mb-2">Thú cưng của tôi</h2>
                    <p className="text-outline text-sm md:text-base">Lưu trữ thông tin để nhận đề xuất thức ăn & đồ chơi phù hợp nhất.</p>
                  </div>
                  <button onClick={() => { setEditingPet(null); setIsPetEditOpen(true); }} className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                    + Thêm bé mới
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pets.length === 0 ? (
                    <p className="text-outline col-span-2">Bạn chưa thêm thú cưng nào.</p>
                  ) : pets.map(pet => (
                    <div key={pet.Id} className="relative group bg-surface-container-low rounded-[24px] p-5 border border-outline-variant/30 flex items-center gap-5 hover:border-primary/50 transition-colors">
                      <div className="w-24 h-24 rounded-full overflow-hidden shadow-sm shrink-0 border-4 border-white">
                        <img src={pet.ImageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop"} alt={pet.Name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-on-surface mb-1">{pet.Name}</h3>
                        <p className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider w-max mb-2">{pet.BreedName}</p>
                        <p className="text-sm text-outline font-medium">Giới tính: {pet.Gender} • Tuổi: {pet.Age}</p>
                      </div>
                      <button onClick={() => { setEditingPet(pet); setIsPetEditOpen(true); }} className="absolute top-4 right-4 p-2 text-outline hover:text-primary bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAVORITES TAB */}
            {activeTab === 'favorites' && (
              <div className="bg-white rounded-2xl md:rounded-[32px] p-4 md:p-10 shadow-sm border border-outline-variant/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 md:mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mb-2">Sản phẩm yêu thích</h2>
                    <p className="text-outline text-sm md:text-base">Những mặt hàng bạn đã lưu lại để mua sau.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.length === 0 ? (
                    <p className="text-outline col-span-3">Bạn chưa có sản phẩm yêu thích nào.</p>
                  ) : favorites.map(product => (
                    <div key={product.FavoriteId} className="product-card bg-surface-container-low p-5 rounded-[24px] shadow-sm hover:shadow-lg border border-outline-variant/30 hover:border-primary/50 transition-all duration-300 group relative flex flex-col h-full">
                      <div className="relative aspect-square rounded-[16px] overflow-hidden mb-5 bg-white">
                        <button onClick={() => handleRemoveFavorite(product.FavoriteId)} className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-error hover:bg-error hover:text-white transition-colors shadow-sm" title="Bỏ yêu thích">
                          <Trash2 size={18} />
                        </button>
                        
                        <Link to={`/shop?category=${product.CategoryId}&${product.Type === 'pet' ? 'pet' : 'product'}=${product.Id}`}>
                          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" src={product.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={product.Name} />
                        </Link>
                        
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm pointer-events-none">
                          <Link to={`/shop?category=${product.CategoryId}&${product.Type === 'pet' ? 'pet' : 'product'}=${product.Id}`} className="bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 active:scale-95 pointer-events-auto">
                            <Eye size={18} /> Xem chi tiết
                          </Link>
                        </div>
                      </div>
                      
                      <span className="text-xs text-outline font-bold uppercase tracking-wider mb-2 block">{product.CategoryName}</span>
                      <Link to={`/shop?category=${product.CategoryId}&${product.Type === 'pet' ? 'pet' : 'product'}=${product.Id}`}>
                        <h3 className="font-bold text-lg text-on-surface line-clamp-2 mb-2 group-hover:text-primary transition-colors flex-grow" title={product.Name}>
                          {product.Name}
                        </h3>
                      </Link>

                      <div className="flex items-end justify-between mt-auto pt-3">
                        <div className="flex flex-col">
                          {Number(product.OldPrice) > 0 && (
                            <span className="text-outline text-sm line-through decoration-error/50">{formatPrice(product.OldPrice)}</span>
                          )}
                          <span className="text-primary font-black text-xl">{formatPrice(product.Price)}</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (product.IsAvailable) handleAddToCart(product);
                            else alert('Sản phẩm đã hết hàng!');
                          }} 
                          disabled={!product.IsAvailable}
                          className={`add-to-cart flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-sm ${product.IsAvailable ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white active:scale-90' : 'bg-surface-container-high text-outline cursor-not-allowed opacity-50'}`}>
                          <ShoppingCart size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <CustomerOrderDetailModal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder} 
      />

      <ProfileEditModal 
        isOpen={isProfileEditOpen} 
        onClose={() => setIsProfileEditOpen(false)} 
        profile={profile} 
        onSuccess={fetchProfile} 
      />
      
      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
        onSuccess={() => { alert('Đổi mật khẩu thành công!'); setIsChangePasswordOpen(false); }} 
      />
      
      <PetEditModal 
        isOpen={isPetEditOpen} 
        onClose={() => setIsPetEditOpen(false)} 
        pet={editingPet} 
        onSuccess={fetchPets} 
      />

      <Footer />
    </div>
  );
};

export default ProfilePage;
