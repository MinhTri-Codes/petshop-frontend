import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Dog, Cat, Bone, Gamepad2, HeartPulse, ChevronLeft, ChevronRight, ShoppingBag, Heart, ShieldPlus, Sparkles, ArrowRight, CheckCircle2, Truck, Headset, ShieldCheck, Mail, PlayCircle, PawPrint, Eye } from 'lucide-react';
import apiClient from '../apiClient';
import { AuthContext } from '../context/AuthContext';

const HomePage = () => {
  const { user } = React.useContext(AuthContext);
  const [topProducts, setTopProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [newPets, setNewPets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
    const [favoriteIds, setFavoriteIds] = useState([]);
  
  const navigate = useNavigate();
  const productsScrollRef = useRef(null);
  const categoriesScrollRef = useRef(null);
  const recommendedScrollRef = useRef(null);

    useEffect(() => {
    if (user) {
      apiClient.get('/customer/recommended-products')
        .then(res => setRecommendedProducts(res.data))
        .catch(err => console.error(err));
    } else {
      setRecommendedProducts([]);
    }
  }, [user]);

const scrollProducts = (direction) => {
    if (productsScrollRef.current) {
      const amount = window.innerWidth > 1024 ? 800 : 300;
      productsScrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const scrollRecommended = (direction) => {
    if (recommendedScrollRef.current) {
      const amount = window.innerWidth > 1024 ? 800 : 300;
      recommendedScrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const scrollCategories = (direction) => {
    if (categoriesScrollRef.current) {
      const amount = window.innerWidth > 1024 ? 600 : 300;
      categoriesScrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

    const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddToCart = async (item, type) => {
    try {
      const payload = type === 'product' ? { productId: item.Id, quantity: 1 } : { storePetId: item.Id, quantity: 1 };
      await apiClient.post('/shop/cart/add', payload);
      window.dispatchEvent(new Event('cartUpdated'));
      showToast(`Đã thêm "${item.Name}" vào giỏ hàng!`);
    } catch (error) {
      if (error.response?.status === 401) {
        showToast('Vui lòng đăng nhập để thêm vào giỏ!');
      } else {
        showToast('Có lỗi xảy ra khi thêm vào giỏ!');
      }
    }
  };
  const handleToggleFavorite = async (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const payload = type === 'pet' ? { storePetId: item.Id } : { productId: item.Id };
      const res = await apiClient.post('/customer/favorites', payload);
      
      if (favoriteIds.includes(item.Id)) {
        setFavoriteIds(prev => prev.filter(id => id !== item.Id));
        showToast('Đã bỏ yêu thích!');
      } else {
        setFavoriteIds(prev => [...prev, item.Id]);
        showToast(res.data.message || 'Đã lưu vào mục yêu thích!');
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        showToast('Vui lòng đăng nhập để lưu yêu thích!');
      } else {
        showToast('Có lỗi xảy ra, thử lại sau!');
      }
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, petsRes, categoriesRes, settingsRes] = await Promise.all([
          apiClient.get('/customer/products?limit=12'),
          apiClient.get('/customer/pets?limit=3'),
          apiClient.get('/customer/categories-breeds'),
          apiClient.get('/shop/settings')
        ]);
        setTopProducts(productsRes.data);
        setNewPets(petsRes.data);
        setCategories(categoriesRes.data.categories || []);
        setSettings(settingsRes.data || {});
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu HomePage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };
  return (
    <div className="text-on-surface bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary relative">
      <Header />
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 bg-white border border-primary/20 shadow-xl shadow-primary/10 rounded-xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="text-primary" size={20} />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      <main className="pt-24 pb-12">
        {/* Hero Section */}
        <section className="relative w-full px-4 md:px-8 lg:px-12 pt-8 md:pt-16 pb-12 max-w-container-max mx-auto overflow-hidden">
          {/* Background Decorative Gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-secondary/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8 relative z-10">
            {/* Left Column: Text Content */}
            <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left pt-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-sm tracking-wide shadow-sm">
                <Sparkles size={16} /> Nhận ngay ưu đãi 20% cho đơn hàng đầu tiên
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.15] tracking-tight text-on-surface">
                Chăm chút <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#F2994A]">từng bữa ăn</span><br className="hidden sm:block" /> cho thú cưng.
              </h1>
              
              <p className="text-lg md:text-xl font-medium text-outline max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Mang đến nguồn dinh dưỡng tốt nhất từ các thương hiệu hàng đầu thế giới để bé yêu của bạn luôn khỏe mạnh, năng động và hạnh phúc mỗi ngày.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link to="/shop" className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn">
                  Mua sắm ngay 
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                <Link to="/shop" className="w-full sm:w-auto bg-surface-container text-on-surface px-8 py-4 rounded-2xl font-bold text-lg hover:bg-surface-variant transition-all active:scale-95 flex items-center justify-center gap-2 group/play">
                  <PlayCircle size={20} className="text-primary group-hover/play:scale-110 transition-transform" />
                  Xem hướng dẫn
                </Link>
              </div>

              {/* Stats / Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-outline-variant/50 mt-8">
                <div>
                  <p className="text-3xl font-black text-on-surface">500+</p>
                  <p className="text-sm font-medium text-outline">Sản phẩm</p>
                </div>
                <div className="w-px h-10 bg-outline-variant/50"></div>
                <div>
                  <p className="text-3xl font-black text-on-surface">10k+</p>
                  <p className="text-sm font-medium text-outline">Khách hàng</p>
                </div>
                <div className="w-px h-10 bg-outline-variant/50"></div>
                <div>
                  <p className="text-3xl font-black text-on-surface">4.9⭐</p>
                  <p className="text-sm font-medium text-outline">Đánh giá</p>
                </div>
              </div>
            </div>

            {/* Right Column: Image */}
            <div className="flex-1 relative flex justify-center items-center w-full">
              <div className="relative w-full max-w-lg aspect-square mt-8 lg:mt-0">
                {/* Decorative blob behind image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FECFEF] to-[#FF9A9E] rounded-full blur-3xl opacity-40"></div>
                
                <img 
                  src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop"
                  alt="Happy Dog"
                  className="absolute inset-0 w-full h-full object-cover rounded-[3rem] shadow-2xl z-10 hover:scale-[1.02] transition-transform duration-500 border-8 border-white/50 backdrop-blur-sm"
                />
                
                {/* Floating Badges */}
                <div className="absolute -left-4 md:-left-8 top-1/4 z-20 bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center text-[#2E7D32]">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline">Chất lượng</p>
                    <p className="font-black text-sm text-on-surface">Chính hãng</p>
                  </div>
                </div>

                <div className="absolute -right-4 md:-right-8 bottom-1/4 z-20 bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-xl flex items-center gap-3" style={{animation: 'bounce 3s infinite'}}>
                  <div className="w-10 h-10 bg-[#FFF3E0] rounded-full flex items-center justify-center text-[#E65100]">
                    <HeartPulse size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline">Dinh dưỡng</p>
                    <p className="font-black text-sm text-on-surface">Đạt chuẩn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition Section */}
        <section className="px-4 md:px-8 lg:px-12 py-8 max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-5 border border-outline-variant/50 hover:border-primary/40 hover:shadow-lg transition-all group">
              <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                <Truck size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface mb-1">{settings.guarantee1Title || 'Giao hàng miễn phí'}</h3>
                <p className="text-outline text-sm">{settings.guarantee1Desc || 'Cho đơn hàng từ 500k toàn quốc'}</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-5 border border-outline-variant/50 hover:border-[#2E7D32]/40 hover:shadow-lg transition-all group">
              <div className="p-4 bg-[#E8F5E9] text-[#2E7D32] rounded-2xl group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface mb-1">{settings.guarantee2Title || 'Đảm bảo chất lượng'}</h3>
                <p className="text-outline text-sm">{settings.guarantee2Desc || 'Cam kết hàng chính hãng 100%'}</p>
              </div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-3xl flex items-center gap-5 border border-outline-variant/50 hover:border-[#1565C0]/40 hover:shadow-lg transition-all group">
              <div className="p-4 bg-[#E3F2FD] text-[#1565C0] rounded-2xl group-hover:scale-110 transition-transform">
                <Headset size={28} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface mb-1">Hỗ trợ 24/7</h3>
                <p className="text-outline text-sm">Luôn sẵn sàng giải đáp thắc mắc</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Danh mục nổi bật */}
        <section className="px-4 md:px-8 lg:px-12 py-16 max-w-container-max mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-on-surface">Khám phá theo danh mục</h2>
              <p className="text-outline mt-2 font-medium">Tất cả những gì bé cưng cần đều có ở đây</p>
            </div>
            <div className="flex items-center gap-4">
              <a className="text-primary font-bold hover:text-primary/80 transition-colors flex items-center gap-1 group whitespace-nowrap" href="/shop">
                Xem tất cả <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
          
          <div className="relative group/slider">
            {/* Left Arrow */}
            <button 
              onClick={() => scrollCategories('left')} 
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-5 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/30 rounded-full text-on-surface hover:text-primary hover:border-primary transition-all duration-300 opacity-0 group-hover/slider:opacity-100 hover:scale-110 active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>

            <div 
              ref={categoriesScrollRef}
              className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 custom-scrollbar snap-x snap-mandatory"
            >
            {categories.map((cat, index) => {
              const gradients = [
                "from-[#FF9A9E] to-[#FECFEF]",
                "from-[#a18cd1] to-[#fbc2eb]",
                "from-[#84fab0] to-[#8fd3f4]",
                "from-[#ffecd2] to-[#fcb69f]",
                "from-[#cfd9df] to-[#e2ebf0]",
                "from-[#fccb90] to-[#d57eeb]"
              ];
              const textColors = [
                "text-rose-600",
                "text-purple-700",
                "text-teal-700",
                "text-orange-600",
                "text-slate-600",
                "text-fuchsia-700"
              ];
              const bgGradient = gradients[index % gradients.length];
              const textColor = textColors[index % textColors.length];
              const firstLetter = cat.Name.charAt(0).toUpperCase();

              return (
                <Link 
                  key={cat.Id} 
                  to={`/shop?category=${cat.Id}`} 
                  className="group relative w-[160px] sm:w-[180px] md:w-[220px] shrink-0 aspect-square rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 cursor-pointer bg-white border border-outline-variant/30 hover:border-transparent snap-start"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-30 group-hover:opacity-60 transition-opacity duration-500`}></div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  {/* Watermark Letter */}
                  <div className={`absolute -bottom-6 -right-2 text-[7rem] md:text-[9rem] font-black ${textColor} opacity-10 group-hover:opacity-20 group-hover:scale-110 group-hover:-translate-y-2 group-hover:-translate-x-2 transition-all duration-500 leading-none select-none pointer-events-none`}>
                    {firstLetter}
                  </div>
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end">
                    <h3 className={`font-black text-xl md:text-2xl ${textColor} drop-shadow-sm leading-tight group-hover:-translate-y-1 transition-transform duration-300`}>
                      {cat.Name}
                    </h3>
                    <div className={`w-8 h-1 rounded-full mt-3 opacity-50 group-hover:w-16 group-hover:opacity-100 transition-all duration-500 bg-current ${textColor}`}></div>
                  </div>
                </Link>
              );
            })}
            </div>
            
            {/* Right Arrow */}
            <button 
              onClick={() => scrollCategories('right')} 
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-5 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/30 rounded-full text-on-surface hover:text-primary hover:border-primary transition-all duration-300 opacity-0 group-hover/slider:opacity-100 hover:scale-110 active:scale-95"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        {/* Section 2: Sản phẩm bán chạy */}
                  {/* Recommended Products Section */}
          {user && recommendedProducts.length > 0 && (
            <section className="relative py-16 overflow-hidden">
              <div className="absolute inset-0 bg-primary/5"></div>
              <div className="relative z-10 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto">
                <div className="flex justify-between items-end mb-10">
                  <div className="max-w-2xl">
                    <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block flex items-center gap-2"><Sparkles size={16}/> Dành riêng cho bạn</span>
                    <h2 className="text-3xl md:text-5xl font-black text-on-surface mb-4">Gợi ý theo thú cưng</h2>
                    <p className="text-outline text-lg">Những sản phẩm phù hợp nhất với các bé nhà bạn.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => scrollRecommended('left')} className="p-3 bg-white shadow-sm border border-outline-variant/50 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90"><ChevronLeft size={20} /></button>
                    <button onClick={() => scrollRecommended('right')} className="p-3 bg-white shadow-sm border border-outline-variant/50 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90"><ChevronRight size={20} /></button>
                  </div>
                </div>

                <div ref={recommendedScrollRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory custom-scrollbar pb-6 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {recommendedProducts.map(product => (
                    <div key={product.Id} className="snap-start shrink-0 w-[280px] lg:w-[calc(25%-18px)] product-card bg-white p-5 rounded-[24px] shadow-sm hover:shadow-xl border border-outline-variant/40 hover:border-primary/30 transition-all duration-300 group relative flex flex-col h-full">
                      <div className="relative aspect-square rounded-[16px] overflow-hidden mb-5 bg-surface-container-low">
                        <button 
                          onClick={(e) => handleToggleFavorite(e, product, 'product')} 
                          className={`absolute top-3 right-3 z-10 p-2 backdrop-blur-md rounded-full transition-colors shadow-sm ${favoriteIds.includes(product.Id) ? 'bg-white text-error' : 'bg-white/80 text-outline hover:text-error hover:bg-white'}`}
                        >
                          <Heart size={18} className={favoriteIds.includes(product.Id) ? 'fill-current' : ''} />
                        </button>
                        
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" src={product.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={product.Name} />
                        
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] pointer-events-none">
                          <Link to={`/shop?category=${product.CategoryId}&product=${product.Id}`} className="bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 active:scale-95 pointer-events-auto">
                            <Eye size={18} /> Xem chi tiết
                          </Link>
                        </div>
                      </div>
                      
                      <span className="text-xs text-outline font-bold uppercase tracking-wider mb-2 block">{product.CategoryName}</span>
                      <Link to={`/shop?category=${product.CategoryId}&product=${product.Id}`} className="block flex-grow">
                        <h3 className="font-bold text-lg text-on-surface line-clamp-2 min-h-[3.5rem] mb-2 group-hover:text-primary transition-colors" title={product.Name}>
                          {product.Name}
                        </h3>
                      </Link>

                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-outline-variant/30">
                        <div className="flex flex-col">
                          {Number(product.OldPrice) > 0 && (
                            <span className="text-outline text-sm line-through decoration-error/50">{formatPrice(product.OldPrice)}</span>
                          )}
                          <span className="text-primary font-black text-xl">{formatPrice(product.Price)}</span>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault();
                            if (product.StockQuantity > 0) handleAddToCart(product, 'product'); 
                            else showToast('Sản phẩm đã hết hàng!');
                          }}
                          className={`add-to-cart flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-md ${
                            product.StockQuantity > 0 
                              ? 'bg-primary text-white hover:bg-[#a65d00] active:scale-90 shadow-primary/20' 
                              : 'bg-surface-variant text-outline cursor-not-allowed opacity-70'
                          }`}
                          title={product.StockQuantity <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                        >
                          <ShoppingBag size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

<section className="relative py-20 border-y border-outline-variant/30 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-surface-container-low/50"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-secondary/5 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-on-surface flex items-center gap-3">
                  Sản phẩm bán chạy <span className="bg-error/10 text-error px-3 py-1 rounded-full text-sm font-black animate-pulse border border-error/20 shadow-sm shadow-error/10">HOT 🔥</span>
                </h2>
              </div>
              <div className="flex gap-3">
                <button onClick={() => scrollProducts('left')} className="p-3 bg-white shadow-sm border border-outline-variant/50 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90"><ChevronLeft size={20} /></button>
                <button onClick={() => scrollProducts('right')} className="p-3 bg-white shadow-sm border border-outline-variant/50 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-90"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
            ) : (
              <div ref={productsScrollRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory custom-scrollbar pb-6 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {topProducts.map(product => (
                  <div key={product.Id} className="snap-start shrink-0 w-[280px] lg:w-[calc(25%-18px)] product-card bg-white p-5 rounded-[24px] shadow-sm hover:shadow-xl border border-outline-variant/40 hover:border-primary/30 transition-all duration-300 group relative flex flex-col h-full">
                    <div className="relative aspect-square rounded-[16px] overflow-hidden mb-5 bg-surface-container-low">
                      <button 
                        onClick={(e) => handleToggleFavorite(e, product, 'product')} 
                        className={`absolute top-3 right-3 z-10 p-2 backdrop-blur-md rounded-full transition-colors shadow-sm ${favoriteIds.includes(product.Id) ? 'bg-white text-error' : 'bg-white/80 text-outline hover:text-error hover:bg-white'}`}
                      >
                        <Heart size={18} className={favoriteIds.includes(product.Id) ? 'fill-current' : ''} />
                      </button>
                      <Link to={`/shop?category=${product.CategoryId}&product=${product.Id}`}>
                        <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out cursor-pointer" src={product.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={product.Name} />
                      </Link>
                    </div>
                    
                    <Link to={`/shop?category=${product.CategoryId}&product=${product.Id}`} className="font-bold text-lg text-on-surface line-clamp-2 min-h-[3.5rem] mb-2 group-hover:text-primary transition-colors">
                      {product.Name}
                    </Link>
                    
                    <div className="flex items-end justify-between mt-auto pt-4">
                      <div className="flex flex-col">
                        {Number(product.OldPrice) > 0 && <span className="text-outline text-sm line-through decoration-error/50">{formatPrice(product.OldPrice)}</span>}
                        <span className="text-primary font-black text-xl">{formatPrice(product.Price)}</span>
                      </div>
                        <button 
                          onClick={(e) => { 
                            e.preventDefault();
                            if (product.StockQuantity > 0) handleAddToCart(product, 'product'); 
                            else showToast('Sản phẩm đã hết hàng!');
                          }}
                          className={`add-to-cart flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-md ${
                            product.StockQuantity > 0 
                              ? 'bg-primary text-white hover:bg-[#a65d00] active:scale-90 shadow-primary/20' 
                              : 'bg-surface-variant text-outline cursor-not-allowed opacity-70'
                          }`}
                          title={product.StockQuantity <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                        >
                        <ShoppingBag size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Thú cưng mới về */}
        <section className="px-4 md:px-8 lg:px-12 py-20 max-w-container-max mx-auto relative">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-wider mb-4 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span> Live Now
            </div>
            <h2 className="text-4xl font-black tracking-tight text-on-surface mb-4">Thú cưng mới về</h2>
            <p className="text-outline text-lg">Những người bạn nhỏ đáng yêu vừa gia nhập đại gia đình của chúng tôi, đã sẵn sàng về nhà mới.</p>
          </div>
          
          {loading ? (
             <div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newPets.map(pet => (
                <div key={pet.Id} className="flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-lg shadow-surface-variant/50 border border-outline-variant/30 group hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-72 overflow-hidden">
                    <Link to={`/shop?category=${pet.SpeciesName === 'Chó' ? 'cho-cho' : 'cho-meo'}&pet=${pet.Id}`}><img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out cursor-pointer" src={pet.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={pet.Name} /></Link>
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-primary shadow-sm flex items-center gap-1.5">
                      {pet.SpeciesName === 'Chó' ? <Dog size={16} /> : pet.SpeciesName === 'Mèo' ? <Cat size={16} /> : <PawPrint size={16} />}
                      {pet.SpeciesName && `${pet.SpeciesName} • `}{pet.BreedName}
                    </div>
                    <button 
                      onClick={(e) => handleToggleFavorite(e, pet, 'pet')} 
                      className={`absolute top-4 right-4 p-2.5 rounded-full transition-colors backdrop-blur-md ${favoriteIds.includes(pet.Id) ? 'bg-white text-error shadow-md' : 'bg-white/80 text-outline hover:bg-white hover:text-error'}`}
                    >
                      <Heart size={20} className={favoriteIds.includes(pet.Id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <Link to={`/shop?category=${pet.SpeciesName === 'Chó' ? 'cho-cho' : 'cho-meo'}&pet=${pet.Id}`} className="font-extrabold text-2xl mb-2 hover:text-primary transition-colors block line-clamp-1">{pet.Name}</Link>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="bg-surface-container-low text-on-surface px-2.5 py-1 rounded-md text-xs font-bold border border-outline-variant/30 flex items-center gap-1">
                            {pet.Age}
                          </span>
                          <span className="bg-surface-container-low text-on-surface px-2.5 py-1 rounded-md text-xs font-bold border border-outline-variant/30 flex items-center gap-1">
                            {pet.Gender}
                          </span>
                          {pet.Vaccine && (
                            <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-bold border border-primary/20 flex items-center gap-1">
                              <ShieldCheck size={12} /> {pet.Vaccine}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4 flex flex-col justify-end">
                        {Number(pet.OldPrice) > 0 && (
                          <span className="text-outline text-sm line-through decoration-error/50">{formatPrice(pet.OldPrice)}</span>
                        )}
                        <p className="text-primary font-black text-xl mb-1">{formatPrice(pet.Price)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.preventDefault();
                        if (pet.Status === 'Đang tìm chủ') handleAddToCart(pet, 'pet');
                        else showToast('Thú cưng đã có chủ!');
                      }}
                      className={`mt-auto w-full py-4 border-2 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                        pet.Status === 'Đang tìm chủ'
                          ? 'border-primary text-primary hover:bg-primary hover:text-white active:scale-95 group-hover:shadow-lg group-hover:shadow-primary/20'
                          : 'border-outline-variant text-outline cursor-not-allowed bg-surface-container-low opacity-70'
                      }`}
                      title={pet.Status === 'Đang tìm chủ' ? 'Đón bé về nhà' : 'Đã bán'}
                    >
                      <Heart size={20} className={pet.Status === 'Đang tìm chủ' ? "fill-transparent group-hover:fill-current transition-colors" : "fill-current text-outline"} />
                      {pet.Status === 'Đang tìm chủ' ? 'Đón bé về nhà' : 'Đã bán'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter CTA Section */}
        

      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
