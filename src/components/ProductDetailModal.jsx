import React, { useState } from 'react';
import { 
  X, Heart, ShoppingCart, Star, Minus, Plus, Truck, ShieldCheck, Tag, Activity, CheckCircle2
} from 'lucide-react';
import apiClient from '../apiClient';

const ProductDetailModal = ({ isOpen, onClose, product, onAddToCart }) => {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [settings, setSettings] = useState({});

  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [reviewFilter, setReviewFilter] = useState(0);

  React.useEffect(() => {
    if (isOpen && product) {
      fetchReviews();
      fetchSimilarProducts();
      fetchSettings();
    }
  }, [isOpen, product]);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/shop/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Lỗi lấy settings:', err);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await apiClient.get(`/shop/products/${product.id || product.Id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchSimilarProducts = async () => {
    try {
      const currentId = product.id || product.Id;
      
      if (product.type === 'pet') {
        const res = await apiClient.get('/customer/pets');
        const allPets = res.data.map(p => ({
          id: p.Id,
          name: p.Name,
          price: p.Price,
          image: p.ImageUrl || 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image',
          breedId: p.BreedId,
          speciesName: p.SpeciesName,
          type: 'pet'
        }));
        
        const currentBreedId = product.breedId || product.BreedId;
        const filtered = allPets
          .filter(p => p.id !== currentId && p.breedId === currentBreedId)
          .sort(() => 0.5 - Math.random()) // shuffle
          .slice(0, 3); // limit to 3
          
        setSimilarProducts(filtered);
      } else {
        const res = await apiClient.get('/customer/products');
        const allProducts = res.data.map(p => ({
          id: p.Id,
          name: p.Name,
          price: p.Price,
          image: p.ImageUrl || 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image',
          categoryId: p.CategoryId,
          type: 'product'
        }));
        
        const currentCatId = product.categoryId || product.CategoryId;
        const filtered = allProducts
          .filter(p => p.id !== currentId && p.categoryId === currentCatId)
          .sort(() => 0.5 - Math.random()) // shuffle
          .slice(0, 3); // limit to 3
          
        setSimilarProducts(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };



  if (!isOpen || !product) return null;

  const allImages = (() => {
    let imagesArr = [];
    if (product.Images) {
      try {
        imagesArr = typeof product.Images === 'string' ? JSON.parse(product.Images) : product.Images;
      } catch (e) { console.error(e); }
    }
    const mainImg = product.image || product.ImageUrl;
    if (mainImg) {
      return [mainImg, ...imagesArr];
    }
    return imagesArr;
  })();

  const activeImageUrl = allImages.length > 0 ? allImages[activeImageIndex] : 'https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image';

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/50 hover:bg-white rounded-full flex items-center justify-center text-on-surface shadow-sm transition-all"
        >
          <X size={24} />
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-1/2 bg-surface-container-lowest p-6 flex flex-col items-center justify-start">
          <div className="relative w-full aspect-square rounded-[24px] overflow-hidden group mb-4">
            {product.badge && (
              <span className="absolute top-4 left-4 z-10 bg-error-container text-on-error-container px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                {product.badge}
              </span>
            )}
            <img 
              src={activeImageUrl} 
              alt={product.name || product.Name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
          </div>
          
          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 w-full overflow-x-auto custom-scrollbar pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary shadow-md scale-105' : 'border-transparent hover:border-primary/50 opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="w-full md:w-1/2 flex flex-col max-h-[50vh] md:max-h-none overflow-y-auto custom-scrollbar bg-white">
          <div className="p-6 md:p-8 space-y-6 flex-1">
            
            {/* Header Info */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                {product.type === 'pet' ? (
                  <span className="text-xs text-primary font-black uppercase tracking-wider bg-primary/10 px-3 py-1.5 rounded-lg">{product.breed || 'Thú cưng'}</span>
                ) : (
                  <span className="text-xs text-outline font-black uppercase tracking-wider bg-surface-container-low px-3 py-1.5 rounded-lg">{product.brand || product.category || 'Sản phẩm'}</span>
                )}
                {product.type !== 'pet' && (
                  <div className="flex items-center gap-1 text-primary">
                    <Star size={16} className="fill-current" />
                    <span className="text-sm font-bold">5 ({reviews.length} đánh giá)</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface leading-tight mb-2">{product.name || product.Name}</h2>
              
              <div className="flex items-end gap-3 mt-4">
                <span className="text-3xl font-black text-primary">{Number(product.price || product.Price || 0).toLocaleString('vi-VN')}đ</span>
                {Number(product.oldPrice) > 0 && (
                  <span className="text-outline text-lg line-through font-medium mb-1">{Number(product.oldPrice).toLocaleString('vi-VN')}đ</span>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-outline-variant/30"></div>

            {/* Description */}
            {(product.description || product.Description) && (
              <div className="text-on-surface/80 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description || product.Description}
              </div>
            )}
            <div className="w-full h-px bg-outline-variant/30"></div>

            {/* Pet Info or Product Variants */}
            {product.type === 'pet' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Activity size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-outline font-medium">Độ tuổi</p>
                    <p className="font-bold text-on-surface line-clamp-1">{product.age || product.Age || 'Chưa rõ'}</p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-outline font-medium">Tiêm phòng</p>
                    <p className="font-bold text-on-surface line-clamp-1">{product.vaccine || product.Vaccine || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Tag size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-outline font-medium">Giới tính</p>
                    <p className="font-bold text-on-surface line-clamp-1">{product.gender || product.Gender || 'Chưa rõ'}</p>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Heart size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-outline font-medium">Tình trạng</p>
                    <p className="font-bold text-on-surface line-clamp-1">{product.status || product.Status || 'Sẵn sàng'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-3">Số lượng <span className="text-xs font-normal text-outline ml-2">(Kho: {product.stock || product.StockQuantity || 0})</span>:</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-outline-variant/50 rounded-xl bg-surface-container-lowest">
                      <button 
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-10 h-10 flex items-center justify-center text-outline hover:text-primary transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-10 text-center font-bold text-on-surface">{qty}</span>
                      <button 
                        onClick={() => setQty(Math.min(Number(product.stock || product.StockQuantity || 0), qty + 1))}
                        className="w-10 h-10 flex items-center justify-center text-outline hover:text-primary transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Promises */}
            <div className="space-y-3 bg-primary/5 p-5 rounded-2xl border border-primary/10">
              <div className="flex items-start gap-3">
                <Truck size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-on-surface">{settings.guarantee1Title || 'Miễn phí giao hàng'}</p>
                  <p className="text-xs text-outline mt-0.5">{settings.guarantee1Desc || 'Cho đơn hàng trên 500k trong bán kính 5km'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-on-surface">{settings.guarantee2Title || 'Cam kết chính hãng 100%'}</p>
                  <p className="text-xs text-outline mt-0.5">{settings.guarantee2Desc || 'Hoàn tiền 200% nếu phát hiện hàng giả'}</p>
                </div>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="mt-6 pt-6 border-t border-outline-variant/30">
              <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center justify-between">
                Khách hàng đánh giá
                {reviews.length > 3 && (
                  <span className="text-sm font-bold text-primary cursor-pointer hover:underline" onClick={() => setShowAllReviewsModal(true)}>Xem tất cả</span>
                )}
              </h3>

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-outline italic">Chưa có đánh giá nào.</p>
                ) : (
                  [...reviews].sort((a,b) => b.Rating - a.Rating).slice(0, 3).map(review => (
                    <div key={review.Id} className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm text-on-surface">{review.CustomerName}</p>
                          <div className="flex gap-0.5 mt-0.5">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} size={12} className={star <= review.Rating ? "fill-orange-400 text-orange-400" : "text-outline-variant fill-surface-variant"} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-outline">{new Date(review.CreatedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-sm text-on-surface leading-relaxed mt-2">{review.Content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Similar Products */}
            <div className="mt-6 pt-6 border-t border-outline-variant/30">
              <h3 className="text-lg font-bold text-on-surface mb-4">Có thể bạn sẽ thích</h3>
              <div className="grid grid-cols-3 gap-3 pb-2">
                {similarProducts.map(item => (
                    <div key={item.id} className="group cursor-pointer" onClick={() => {
                      if (window.location.pathname !== '/shop') {
                        if (item.type === 'pet') {
                          window.location.href = `/shop?category=${item.speciesName === 'Chó' ? 'cho-cho' : 'cho-meo'}&pet=${item.id}`;
                        } else {
                          window.location.href = `/shop?category=${item.categoryId}&product=${item.id}`;
                        }
                      } else {
                        // If already on shop page, just push state to avoid full reload
                        const newUrl = new URL(window.location);
                        if (item.type === 'pet') {
                          newUrl.searchParams.set('category', item.speciesName === 'Chó' ? 'cho-cho' : 'cho-meo');
                          newUrl.searchParams.set('pet', item.id);
                          newUrl.searchParams.delete('product');
                        } else {
                          newUrl.searchParams.set('category', item.categoryId);
                          newUrl.searchParams.set('product', item.id);
                          newUrl.searchParams.delete('pet');
                        }
                        window.history.pushState({}, '', newUrl);
                        window.dispatchEvent(new Event('popstate')); // trigger re-render in React Router
                      }
                    }}>
                      <div className="w-full aspect-square rounded-2xl overflow-hidden mb-2 border border-outline-variant/30 bg-surface-container-lowest">
                        <img src={item.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <p className="font-bold text-sm text-on-surface line-clamp-2 group-hover:text-primary transition-colors">{item.name}</p>
                      <p className="font-black text-primary mt-1">{Number(item.price || item.Price || 0).toLocaleString('vi-VN')}đ</p>
                    </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action Buttons Sticky Bottom */}
          <div className="p-6 border-t border-outline-variant/30 bg-white sticky bottom-0 flex gap-4 mt-auto">
            <button className="w-14 h-14 shrink-0 rounded-2xl border-2 border-outline-variant/50 flex items-center justify-center text-outline hover:text-error hover:border-error hover:bg-error/5 transition-all shadow-sm">
              <Heart size={24} />
            </button>
            <button 
              onClick={() => onAddToCart ? onAddToCart(qty, null) : null}
              disabled={product.type === 'pet' ? false : Number(product.stock || product.StockQuantity || 0) <= 0}
              className="flex-1 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 font-extrabold text-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <ShoppingCart size={24} />
              Thêm vào giỏ
            </button>
          </div>
        </div>

      </div>
    </div>

    {/* All Reviews Modal */}
    {showAllReviewsModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest shrink-0">
            <h2 className="text-2xl font-black text-on-surface">Tất cả đánh giá</h2>
            <button onClick={() => setShowAllReviewsModal(false)} className="p-2 bg-surface-container-highest rounded-full text-outline hover:text-error hover:bg-error/10 transition-colors">
              <X size={20} />
            </button>
          </div>
          {/* Filter */}
          <div className="px-6 py-4 border-b border-outline-variant/30 flex gap-2 overflow-x-auto custom-scrollbar shrink-0 bg-white">
            <button onClick={() => setReviewFilter(0)} className={`px-5 py-2 rounded-full font-bold text-sm transition-colors whitespace-nowrap border ${reviewFilter === 0 ? 'bg-primary text-white border-primary' : 'bg-surface-container-lowest text-outline border-outline-variant/50 hover:border-primary hover:text-primary'}`}>
              Tất cả ({reviews.length})
            </button>
            {[5,4,3,2,1].map(star => {
              const count = reviews.filter(r => r.Rating === star).length;
              return (
                <button key={star} onClick={() => setReviewFilter(star)} className={`px-5 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap border ${reviewFilter === star ? 'bg-orange-500 text-white border-orange-500' : 'bg-surface-container-lowest text-outline border-outline-variant/50 hover:border-orange-500 hover:text-orange-500'}`}>
                  {star} Sao <Star size={14} className={reviewFilter === star ? "fill-white" : "fill-current"} /> ({count})
                </button>
              );
            })}
          </div>
          {/* List */}
          <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 bg-surface-container-lowest">
            {reviews.filter(r => reviewFilter === 0 || r.Rating === reviewFilter).length === 0 ? (
              <div className="text-center py-12">
                <Star size={48} className="mx-auto text-outline-variant mb-4 opacity-50" />
                <p className="text-outline font-bold text-lg">Không có đánh giá {reviewFilter !== 0 ? `${reviewFilter} sao` : ''} nào.</p>
              </div>
            ) : (
              reviews.filter(r => reviewFilter === 0 || r.Rating === reviewFilter).map(review => (
                <div key={review.Id} className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-base text-on-surface">{review.CustomerName}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={14} className={star <= review.Rating ? "fill-orange-400 text-orange-400" : "text-outline-variant fill-surface-variant"} />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-outline bg-surface-variant/50 px-2.5 py-1 rounded-md">{new Date(review.CreatedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <p className="text-base text-on-surface leading-relaxed mt-3">{review.Content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ProductDetailModal;
