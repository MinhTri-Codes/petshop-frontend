import React, { useState, useEffect, useRef } from 'react';
import RequireShift from './RequireShift';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, Trash2, Minus, Plus, ScanLine, PlusCircle, User, Edit3, Banknote, QrCode, Package, X, Search
} from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import apiClient from '../apiClient';

const POSPage = () => {
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TIỀN MẶT');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSelectedCategory, setModalSelectedCategory] = useState('Tất cả');

  // New checkout and loyalty states
  const [customerName, setCustomerName] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [customerCashReceived, setCustomerCashReceived] = useState('');

  const searchInputRef = useRef(null);
  const checkoutBtnRef = useRef(null);

  useEffect(() => {
    fetchProductsAndPets();
  }, []);

  const fetchProductsAndPets = async () => {
    try {
      const [prodRes, petRes] = await Promise.all([
        apiClient.get('/manager/products'),
        apiClient.get('/manager/pets')
      ]);
      const combined = [
        ...prodRes.data.map(p => ({
          id: p.Id,
          productId: p.Id,
          name: p.Name,
          sku: p.Slug,
          price: Number(p.Price),
          image: p.ImageUrl || 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=200&h=200',
          isPet: false,
          categoryName: p.CategoryName || 'Khác',
          stock: Number(p.StockQuantity)
        })),
        ...petRes.data.filter(p => p.Status === 'Đang tìm chủ' || p.Status === 'Đang bán').map(p => ({
          id: p.Id,
          petId: p.Id,
          name: p.Name,
          sku: p.Id.split('-')[0], // Generate fake sku for search
          price: Number(p.Price),
          image: p.ImageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200&h=200',
          isPet: true,
          categoryName: 'Thú cưng',
          stock: 1
        }))
      ];
      setProducts(combined);
    } catch (err) {
      console.error(err);
      alert('Lỗi tải sản phẩm: ' + (err.response?.data?.error || err.message));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discount based on voucher type
  let discount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.Type === 'PERCENTAGE') {
      discount = (subtotal * appliedVoucher.Value) / 100;
      if (appliedVoucher.MaxDiscount && discount > appliedVoucher.MaxDiscount) {
        discount = appliedVoucher.MaxDiscount;
      }
    } else {
      discount = appliedVoucher.Value;
    }
  }
  
  const total = Math.max(0, subtotal - discount);

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        // Pet không thể mua > 1 con
        if (item.isPet && item.quantity + delta > 1) return item;
        
        // Không thể mua vượt quá tồn kho
        if (!item.isPet && item.quantity + delta > item.stock) {
          alert(`Không thể thêm. Chỉ còn ${item.stock} sản phẩm trong kho.`);
          return item;
        }

        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert('Giỏ hàng trống');
    try {
      const payload = {
        items: cart,
        paymentMethod: paymentMethod,
        discount: discount,
        customerPhone: customerPhone,
        voucherId: appliedVoucher ? appliedVoucher.Id : null
      };
      const res = await apiClient.post('/cashier/pos-checkout', payload);
      if (res.data.vnpUrl) {
        alert(res.data.message);
        window.location.href = res.data.vnpUrl;
        return;
      }
      alert('Thanh toán thành công. Đơn hàng: ' + res.data.orderCode);
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setAppliedVoucher(null);
      setVoucherCode('');
      setCustomerCashReceived('');
      fetchProductsAndPets(); // Refresh available pets
    } catch (error) {
      console.error(error);
      alert('Lỗi thanh toán: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSearchCustomer = async () => {
    const trimmed = customerPhone.trim();
    if (!trimmed) {
      setCustomerName('');
      return;
    }
    try {
      const res = await apiClient.get('/manager/customers');
      const found = res.data.find(c => c.PhoneNumber === trimmed);
      if (found) {
        setCustomerName(found.FullName || 'Không có tên');
      } else {
        setCustomerName('Không tìm thấy khách hàng');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi tìm kiếm khách hàng');
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    try {
      const res = await apiClient.post('/cashier/check-voucher', { code: voucherCode });
      if (res.data.MinOrder && subtotal < res.data.MinOrder) {
        return alert(`Đơn hàng chưa đạt mức tối thiểu ${Number(res.data.MinOrder).toLocaleString('vi-VN')}đ để dùng mã này`);
      }
      setAppliedVoucher(res.data);
      alert('Áp dụng mã giảm giá thành công');
    } catch (err) {
      alert(err.response?.data?.error || 'Mã không hợp lệ');
      setAppliedVoucher(null);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const found = products.find(p => (p.sku || '').toLowerCase() === searchQuery.trim().toLowerCase());
      if (found) {
        if (!found.isPet && found.stock <= 0) {
          alert('Sản phẩm này đã hết hàng!');
          return;
        }
        // Add to cart
        const existing = cart.find(i => i.id === found.id);
        if (existing) {
          updateQuantity(found.id, 1);
        } else {
          setCart([{ ...found, quantity: 1 }, ...cart]);
        }
        setSearchQuery('');
      } else {
        alert('Không tìm thấy sản phẩm');
      }
    }
  };

  const handleProductClick = (product) => {
    if (!product.isPet && product.stock <= 0) {
      alert('Sản phẩm này đã hết hàng!');
      return;
    }
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      updateQuantity(product.id, 1);
    } else {
      setCart([{ ...product, quantity: 1 }, ...cart]);
    }
    // Optionally close modal after picking
    // setIsProductModalOpen(false);
  };

  // Lấy danh sách danh mục (để làm bộ lọc nhanh)
  const uniqueCategories = ['Tất cả', ...new Set(products.map(p => p.categoryName))];

  // Tính toán group sản phẩm theo CategoryName và lọc theo từ khóa tìm kiếm & danh mục
  const groupedProducts = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) || p.sku.toLowerCase().includes(modalSearchQuery.toLowerCase());
      const matchCategory = modalSelectedCategory === 'Tất cả' || p.categoryName === modalSelectedCategory;
      return matchSearch && matchCategory;
    })
    .reduce((groups, p) => {
      const cat = p.categoryName;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
      return groups;
    }, {});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        handleCheckout();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentMethod, customerPhone]);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#fbf9f8] font-body-md text-on-surface">
      
      <ManagerSidebar />

      {/* Main Workspace */}
      <main className="ml-0 lg:ml-[240px] flex-1 flex flex-col h-full bg-[#fbf9f8]">
        
        <ManagerHeader ref={searchInputRef} placeholder="Tìm tên sản phẩm hoặc mã vạch... (F1)" />

        {/* Content Area: Split View */}
        <RequireShift>
        <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden p-4 lg:p-6 gap-4 lg:gap-6">
          
          {/* Left Column: Cart */}
          <section className="flex-1 lg:flex-[7] flex flex-col bg-white rounded-3xl border border-outline-variant/30 shadow-sm overflow-hidden min-h-[500px] lg:min-h-0">
            <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-outline-variant/30 flex justify-between items-center bg-white/50 backdrop-blur-md">
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-on-surface">
                <ShoppingCart className="text-primary" size={24} />
                Giỏ hàng hiện tại <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full ml-2">{cart.length}</span>
              </h2>
              <button 
                onClick={() => setCart([])}
                className="text-outline hover:text-error text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-error/10 transition-colors"
              >
                <Trash2 size={16} />
                Xóa tất cả
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 lg:px-6 pb-6 pt-2">
              <div className="flex flex-col gap-3">
                {cart.length === 0 && (
                  <div className="text-center py-20 text-outline font-medium flex flex-col items-center justify-center gap-3">
                    <Package size={48} className="text-outline/30" />
                    <p>Giỏ hàng trống. Hãy quét mã vạch hoặc tìm kiếm sản phẩm.</p>
                  </div>
                )}
                {cart.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white hover:bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/30 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden gap-3"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Item Info */}
                    <div className="flex items-center gap-3 lg:gap-4 flex-1">
                      <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden border border-outline-variant/30 shrink-0 group-hover:scale-105 transition-transform">
                        <img className="object-cover w-full h-full" src={item.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.name} />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-bold text-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[11px] text-outline font-medium mt-0.5">SKU: {item.sku}</p>
                        <p className="text-sm font-extrabold text-primary mt-1">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>

                    {/* Quantity Control & Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 lg:gap-4 shrink-0 mt-2 sm:mt-0">
                      
                      {/* Quantity Control */}
                      <div className="flex items-center justify-center gap-1 bg-surface-container-low/50 p-1 rounded-xl border border-outline-variant/20 shrink-0">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg hover:bg-white flex items-center justify-center transition-all active:scale-95 text-on-surface hover:shadow-sm hover:text-error"
                        >
                          <Minus size={16} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 lg:w-10 text-center font-extrabold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg hover:bg-white hover:text-primary flex items-center justify-center transition-all active:scale-95 hover:shadow-sm"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Total & Delete */}
                      <div className="text-right flex flex-col items-end justify-center min-w-[80px]">
                        <span className="text-[10px] text-outline uppercase font-bold tracking-wider mb-0.5 hidden sm:block">Thành tiền</span>
                        <p className="font-black text-base lg:text-lg text-on-surface leading-none">{Number((item.price * item.quantity)).toLocaleString('vi-VN')}đ</p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl text-outline hover:text-error hover:bg-error/10 flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fast Add/Scan Bar */}
            <div className="p-5 bg-surface-container-lowest flex items-center gap-4 border-t border-outline-variant/30 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="flex-1 relative group">
                <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
                <input 
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="w-full h-12 pl-12 bg-white border border-outline-variant/50 rounded-xl font-semibold text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm" 
                  placeholder="Quét mã vạch (Enter) hoặc nhập tên sản phẩm..." 
                  type="text"
                />
                
                {/* Autocomplete Dropdown */}
                {searchQuery.trim() && (
                  <div className="absolute bottom-[110%] left-0 w-full bg-white border border-outline-variant/30 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 max-h-60 overflow-y-auto custom-scrollbar">
                    {products
                      .filter(p => p.sku.toLowerCase().includes(searchQuery.trim().toLowerCase()) || p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                      .slice(0, 10)
                      .map(p => (
                        <div 
                          key={p.id} 
                          onClick={() => {
                            if (!p.isPet && p.stock <= 0) {
                              alert('Sản phẩm này đã hết hàng!');
                              return;
                            }
                            const existing = cart.find(i => i.id === p.id);
                            if (existing) updateQuantity(p.id, 1);
                            else setCart([{ ...p, quantity: 1 }, ...cart]);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-surface-container cursor-pointer border-b border-outline-variant/10 last:border-0 transition-colors"
                        >
                          <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">{p.name}</p>
                            <p className="text-xs text-outline">{p.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-primary">{Number(p.price).toLocaleString('vi-VN')}đ</p>
                            {!p.isPet && <p className="text-xs text-outline font-medium">Kho: {p.stock}</p>}
                          </div>
                        </div>
                      ))}
                    {products.filter(p => p.sku.toLowerCase().includes(searchQuery.trim().toLowerCase()) || p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())).length === 0 && (
                      <div className="p-4 text-center text-sm text-outline">Không tìm thấy sản phẩm phù hợp</div>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsProductModalOpen(true)}
                className="h-12 px-6 bg-secondary text-white font-bold rounded-xl flex items-center gap-2 hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/20 active:scale-95 transition-all"
              >
                <PlusCircle size={20} />
                THÊM
              </button>
            </div>
          </section>

          {/* Right Column: Checkout */}
          <section className="flex-none lg:flex-[3] flex flex-col gap-4 w-full lg:w-80 shrink-0 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar pb-2 lg:pr-1">
            
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-3 shadow-sm flex flex-col gap-2 group hover:border-primary/30 transition-colors">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-container/10 text-primary-container rounded-xl flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text"
                      placeholder="SĐT Khách hàng..."
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearchCustomer(); }}
                      className="flex-1 bg-transparent outline-none text-sm font-bold text-on-surface placeholder:text-outline/50"
                    />
                    <button 
                      onClick={handleSearchCustomer}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-extrabold transition-colors flex-none"
                    >
                      Tìm kiếm
                    </button>
                  </div>
               </div>
               {customerName && (
                 <div className="text-xs text-secondary font-bold ml-12">
                   Khách hàng: <span className="text-primary">{customerName}</span>
                 </div>
               )}
            </div>

            <div className="bg-white rounded-2xl border border-outline-variant/30 p-3 shadow-sm flex flex-col gap-3 group hover:border-primary/30 transition-colors">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Mã giảm giá..."
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-3 outline-none text-sm font-bold focus:border-primary uppercase"
                />
                <button 
                  onClick={handleApplyVoucher}
                  className="px-4 bg-surface-container-high text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container-highest transition-colors"
                >
                  Áp dụng
                </button>
              </div>
              {appliedVoucher && (
                <div className="text-xs text-green-600 font-medium">
                  Đã áp dụng mã {appliedVoucher.Code}
                </div>
              )}
            </div>

            {/* Summary Section */}
            <div className="bg-white rounded-3xl border border-outline-variant/30 p-5 shadow-sm flex flex-col relative shrink-0 min-h-[450px]">
              <h3 className="text-xs font-bold text-outline uppercase tracking-widest mb-4 relative z-10">Chi tiết thanh toán</h3>
              
              <div className="space-y-3 mb-4 relative z-10">
                <div className="flex justify-between items-center text-on-surface-variant font-medium text-sm">
                  <span>Tạm tính ({cart.reduce((s,i)=>s+i.quantity,0)} món)</span>
                  <span className="font-bold text-on-surface">{Number(subtotal).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-secondary">Chiết khấu thành viên (10%)</span>
                  <span className="font-bold text-secondary">-{Number(discount).toLocaleString('vi-VN')}đ</span>
                </div>
                
                <div className="pt-4 mt-2 border-t border-dashed border-outline-variant/50 flex justify-between items-center">
                  <span className="font-extrabold text-lg text-on-surface">Tổng cộng</span>
                  <span className="font-black text-2xl text-primary">{Number(total).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              <div className="mt-auto space-y-4 relative z-10">
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest text-center mt-2">Phương thức thanh toán</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('TIỀN MẶT')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all shadow-md ${paymentMethod === 'TIỀN MẶT' ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary shadow-primary/10 scale-105' : 'bg-white border-2 border-outline-variant/30 hover:bg-surface-container-low scale-100 hover:scale-105'} active:scale-95`}
                  >
                    <Banknote size={24} className={paymentMethod === 'TIỀN MẶT' ? "text-primary" : "text-outline"} />
                    <span className={`font-extrabold text-[11px] ${paymentMethod === 'TIỀN MẶT' ? "text-primary" : "text-outline"}`}>TIỀN MẶT</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('CHUYỂN KHOẢN')}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all shadow-md ${paymentMethod === 'CHUYỂN KHOẢN' ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary shadow-primary/10 scale-105' : 'bg-white border-2 border-outline-variant/30 hover:bg-surface-container-low scale-100 hover:scale-105'} active:scale-95`}
                  >
                    <QrCode size={24} className={paymentMethod === 'CHUYỂN KHOẢN' ? "text-primary" : "text-outline"} />
                    <span className={`font-bold text-[11px] ${paymentMethod === 'CHUYỂN KHOẢN' ? "text-primary" : "text-outline"}`}>CHUYỂN KHOẢN</span>
                  </button>
                </div>
                
                {paymentMethod === 'TIỀN MẶT' && (
                  <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30 space-y-3 relative z-10 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-outline">Tiền khách đưa</span>
                      <input 
                        type="number"
                        value={customerCashReceived}
                        onChange={(e) => setCustomerCashReceived(e.target.value)}
                        placeholder="0"
                        className="w-32 bg-white border border-outline-variant/50 rounded-lg px-2 py-1.5 text-right font-black text-sm text-primary focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    {customerCashReceived && Number(customerCashReceived) >= total ? (
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-outline-variant/50">
                        <span className="text-xs font-bold text-outline">Tiền thừa trả khách</span>
                        <span className="font-black text-green-600">{Number((Number(customerCashReceived) - total)).toLocaleString('vi-VN')}đ</span>
                      </div>
                    ) : customerCashReceived && Number(customerCashReceived) < total ? (
                      <div className="flex justify-between items-center pt-2 border-t border-dashed border-outline-variant/50">
                        <span className="text-xs font-bold text-error">Khách đưa chưa đủ tiền!</span>
                      </div>
                    ) : null}
                  </div>
                )}
                
                <button 
                  ref={checkoutBtnRef}
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-primary via-[#F2994A] to-primary text-white py-6 rounded-2xl font-black text-xl flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(242,153,74,0.4)] hover:shadow-[0_15px_40px_rgba(242,153,74,0.6)] hover:brightness-110 active:scale-[0.98] transition-all group overflow-hidden relative bg-[length:200%_auto] hover:animate-[gradient_2s_linear_infinite]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-300 ease-in-out"></div>
                  <span className="relative z-10 tracking-wider uppercase drop-shadow-md">THANH TOÁN</span>
                  <span className="text-[10px] opacity-90 font-medium relative z-10 mt-1 uppercase tracking-widest">Phím tắt: F9</span>
                </button>
              </div>
            </div>
            
          </section>
        </div>
        </RequireShift>
      </main>

      {/* Product Selection Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="relative bg-surface rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-outline-variant/30 flex flex-col gap-4 bg-white shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-on-surface">CHỌN SẢN PHẨM / THÚ CƯNG</h2>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                <input 
                  type="text"
                  placeholder="Tìm kiếm nhanh theo tên hoặc mã sản phẩm..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 bg-surface-container-lowest border border-outline-variant/50 rounded-xl font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>

              {/* Category Chips */}
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setModalSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all border ${modalSelectedCategory === cat ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' : 'bg-white text-on-surface-variant border-outline-variant/50 hover:border-primary/50 hover:text-primary'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest custom-scrollbar">
              {Object.entries(groupedProducts).map(([category, items]) => (
                <div key={category} className="mb-10 last:mb-0">
                  <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-primary/20">{category}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map(product => {
                      const isOutOfStock = !product.isPet && product.stock <= 0;
                      return (
                        <div 
                          key={product.id}
                          onClick={() => {
                            if (isOutOfStock) return;
                            handleProductClick(product);
                          }}
                          className={`bg-white rounded-2xl p-3 border shadow-sm transition-all flex flex-col ${isOutOfStock ? 'opacity-50 cursor-not-allowed border-outline-variant/30 bg-surface-container-low' : 'hover:shadow-md hover:border-primary/50 cursor-pointer hover:-translate-y-1 group'}`}
                        >
                          <div className="w-full aspect-square rounded-xl overflow-hidden mb-3 bg-surface-container-lowest relative">
                            <img src={product.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                                <span className="bg-error text-white font-extrabold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">Hết hàng</span>
                              </div>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-on-surface line-clamp-2 leading-tight mb-1">{product.name}</h4>
                          <div className="mt-auto pt-2 flex items-center justify-between">
                            <span className="font-extrabold text-primary text-sm">{Number(product.price).toLocaleString('vi-VN')}đ</span>
                            {!isOutOfStock ? (
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <Plus size={16} />
                              </div>
                            ) : (
                              <span className="text-xs text-error font-bold">Hết hàng</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
