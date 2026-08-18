import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { 
  ChevronRight, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  RefreshCcw,
  Truck
} from 'lucide-react';
import { Link } from 'react-router-dom';

import apiClient from '../apiClient';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await apiClient.get('/shop/cart');
      const items = res.data.items.map(item => ({
        id: item.Id,
        name: item.ProductName || item.PetName,
        category: item.ProductId ? 'Sản phẩm' : 'Thú cưng',
        price: Number(item.ProductPrice || item.PetPrice),
        quantity: item.Quantity,
        variant: item.Variant,
        image: item.ProductImage || item.PetImage
      }));
      setCartItems(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await apiClient.put(`/shop/cart/item/${id}`, { quantity: newQuantity });
      window.dispatchEvent(new Event('cartUpdated'));
      setCartItems(items => items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error(error);
    }
  };

  const removeItem = async (id) => {
    try {
      await apiClient.delete(`/shop/cart/item/${id}`);
      window.dispatchEvent(new Event('cartUpdated'));
      setCartItems(items => items.filter(item => item.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal; // Assuming no extra fees before checkout page

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải giỏ hàng...</div>;
  }

  return (
    <div className="text-on-surface bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary min-h-screen flex flex-col">
      <Header />
      
      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto w-full flex-grow">
        
        {/* Breadcrumb / Steps */}
        <div className="flex items-center gap-3 mb-10 overflow-x-auto whitespace-nowrap py-2 no-scrollbar">
          <span className="text-primary font-bold flex items-center gap-2 text-sm underline underline-offset-4 decoration-2">
            Giỏ hàng <ChevronRight size={16} />
          </span>
          <span className="text-outline-variant flex items-center gap-2 font-bold text-sm">
            Thanh toán <ChevronRight size={16} />
          </span>
          <span className="text-outline-variant flex items-center gap-2 font-bold text-sm">
            Hoàn tất
          </span>
        </div>

        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] shadow-sm border border-outline-variant/30">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
              <ShoppingBag size={64} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-extrabold mb-3">Giỏ hàng của bạn đang trống</h2>
            <p className="text-outline mb-8 max-w-md text-center">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. Khám phá hàng ngàn ưu đãi hấp dẫn dành cho thú cưng ngay!</p>
            <Link to="/shop" className="px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all flex items-center gap-2">
              <ArrowLeft size={20} />
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-extrabold">Giỏ hàng của bạn</h1>
                <span className="text-outline font-bold bg-surface-variant/50 px-4 py-1.5 rounded-full">{cartItems.length} sản phẩm</span>
              </div>
              
              <div className="bg-white rounded-[32px] shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="divide-y divide-outline-variant/20">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 md:gap-6 p-4 md:p-6 items-start group transition-colors hover:bg-surface-container-low/30">
                      
                      {/* Product Image */}
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-surface-container-low flex-shrink-0 overflow-hidden shadow-sm relative">
                        <img src={item.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>

                      {/* Product Details */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <span className="text-xs text-outline font-bold uppercase tracking-wider mb-1 block truncate">{item.category}</span>
                            <a href="#" className="font-bold text-on-surface text-base md:text-lg hover:text-primary transition-colors leading-snug break-words">
                              {item.name}
                            </a>
                            {item.variant && <p className="text-sm font-medium text-secondary mt-1">{item.variant}</p>}
                          </div>
                          
                          {/* Desktop Delete (Top Right) */}
                          <button onClick={() => removeItem(item.id)} className="hidden sm:flex p-2 text-outline/50 hover:text-error hover:bg-error-container/50 rounded-xl transition-all flex-shrink-0" title="Xóa sản phẩm">
                            <Trash2 size={20} />
                          </button>
                        </div>
                        
                        {/* Stacked Price & Controls */}
                        <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-outline-variant/20 pt-4">
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-outline text-sm font-medium">Đơn giá:</span>
                              <span className="font-bold text-on-surface">{Number(item.price).toLocaleString('vi-VN')}đ</span>
                            </div>
                            
                            <div className="flex items-center bg-surface-container-low rounded-xl border border-outline-variant/30 w-max p-1">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-outline hover:bg-white hover:text-primary hover:shadow-sm transition-all">
                                <Minus size={16} />
                              </button>
                              <span className="w-10 md:w-12 text-center font-bold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-outline hover:bg-white hover:text-primary hover:shadow-sm transition-all">
                                <Plus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-1">
                            <span className="text-outline text-sm font-medium hidden sm:block">Thành tiền:</span>
                            <span className="font-black text-primary text-xl md:text-2xl break-all sm:break-words">
                              {Number((item.price * item.quantity)).toLocaleString('vi-VN')}đ
                            </span>
                            
                            {/* Mobile Delete (Bottom Right) */}
                            <button onClick={() => removeItem(item.id)} className="sm:hidden flex items-center gap-1.5 text-sm font-bold text-error mt-2 w-max">
                              <Trash2 size={16} /> Xóa sản phẩm
                            </button>
                          </div>
                          
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center px-2">
                <Link to="/shop" className="flex items-center gap-2 text-outline hover:text-primary font-bold transition-colors">
                  <ArrowLeft size={20} /> Tiếp tục mua sắm
                </Link>
                <button onClick={() => setCartItems([])} className="flex items-center gap-2 text-outline hover:text-error font-bold transition-colors">
                  <Trash2 size={20} /> Xóa toàn bộ
                </button>
              </div>

            </div>
            
            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 mt-6 lg:mt-0">
              <div className="bg-white rounded-2xl md:rounded-[32px] p-6 md:p-8 shadow-sm border border-outline-variant/30 sticky top-28">
                <h2 className="text-xl md:text-2xl font-extrabold text-on-surface mb-6 md:mb-8 pb-4 border-b border-outline-variant/20">
                  Tóm tắt đơn hàng
                </h2>
                  
                  {/* Price Breakdown */}
                  <div className="space-y-4 pb-6 border-b border-outline-variant/30 mb-6">
                    <div className="flex justify-between text-outline font-medium">
                      <span>Tạm tính ({cartItems.length} sản phẩm)</span>
                      <span className="text-on-surface font-bold">{Number(subtotal).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between text-outline font-medium">
                      <span>Phí vận chuyển</span>
                      <span className="text-on-surface font-bold text-sm italic">Tính ở bước thanh toán</span>
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div className="flex justify-between items-end mb-8">
                    <span className="font-bold text-lg">Tổng cộng</span>
                    <div className="text-right">
                      <span className="font-black text-primary text-3xl md:text-4xl leading-none block mb-1">
                        {Number(total).toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-xs text-outline font-medium">Đã bao gồm VAT</span>
                    </div>
                  </div>
                  
                  {/* Floating Action Button (Mobile) / Normal Button (PC) */}
                  <div className="fixed bottom-[60px] left-0 right-0 p-4 bg-white border-t border-outline-variant/30 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] z-40 md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:bg-transparent md:border-0 md:shadow-none md:z-auto mt-6">
                    <Link to="/checkout" className="w-full h-14 md:h-[56px] bg-primary text-white font-extrabold rounded-2xl md:rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 group">
                      <span>Thanh toán ngay</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  
                  {/* Extra spacing on mobile to avoid overlap with floating bar */}
                  <div className="h-16 md:hidden"></div>
                  
                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-2 mt-6 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                    <div className="flex flex-col items-center gap-1.5">
                      <ShieldCheck size={20} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase text-outline text-center">Thanh toán<br/>an toàn</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 border-l border-r border-outline-variant/30">
                      <Truck size={20} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase text-outline text-center">Giao hàng<br/>siêu tốc</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <RefreshCcw size={20} className="text-primary" />
                      <span className="text-[10px] font-bold uppercase text-outline text-center">Đổi trả<br/>dễ dàng</span>
                    </div>
                  </div>
                </div>
                
            </div>
            
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
