import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { 
  ChevronRight, 
  ChevronDown, 
  Star, 
  ShoppingCart, 
  Filter, 
  Eye, 
  Heart,
  SlidersHorizontal,
  Search,
  PawPrint,
  Package,
  ShieldCheck,
  Dog,
  Cat,
  ShoppingBag
} from 'lucide-react';
import ProductDetailModal from './ProductDetailModal';
import apiClient from '../apiClient';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initCategoryStr = searchParams.get('category');
  const initCategory = initCategoryStr && !isNaN(initCategoryStr) ? Number(initCategoryStr) : initCategoryStr;
  
  const [mainTab, setMainTab] = useState(initCategory && initCategory !== 'cho-cho' && initCategory !== 'cho-meo' ? 'product' : 'pet');
  const [activeSpecies, setActiveSpecies] = useState(initCategory === 'cho-meo' ? 'cat' : 'dog');
  
  const [searchBreed, setSearchBreed] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]);
  
  const [pets, setPets] = useState([]);
  const [products, setProducts] = useState([]);
  const [filtersData, setFiltersData] = useState({ species: [], categories: [] });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedBreeds, setSelectedBreeds] = useState([]);
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(initCategory && initCategory !== 'cho-cho' && initCategory !== 'cho-meo' ? [initCategory] : []);
  const [selectedTargetPets, setSelectedTargetPets] = useState([]);
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [sortBy, setSortBy] = useState('newest');
  
  const [visibleCount, setVisibleCount] = useState(9);
  const ITEMS_PER_LOAD = 9;

  // Reset visible count when any filter changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [mainTab, activeSpecies, searchBreed, selectedBreeds, selectedGender, selectedCategories, selectedTargetPets, maxPrice, sortBy]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddToCart = async (item, type, quantity = 1, variant = null) => {
    try {
      const payload = type === 'product' ? { productId: item.Id, quantity, variant } : { storePetId: item.Id, quantity, variant };
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

  // Fetch filter data once
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await apiClient.get('/customer/categories-breeds');
        setFiltersData(res.data);
      } catch (err) {
        console.error('Lỗi lấy filters:', err);
      }
    };
    fetchFilters();
  }, []);

  // Fetch products or pets when tab/species changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [petsRes, prodsRes] = await Promise.all([
          apiClient.get('/customer/pets'),
          apiClient.get('/customer/products')
        ]);
        setPets(petsRes.data.map(p => ({ ...p, type: 'pet', variants: null })));
        setProducts(prodsRes.data.map(p => ({ ...p, type: 'product', variants: p.Variants || null })));
      } catch (err) {
        console.error('Lỗi lấy data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [mainTab]);

  // Reset filter when switching main tab or species
  useEffect(() => {
    setSelectedBreeds([]);
    setSelectedGender('');
  }, [activeSpecies]);

  // Auto-open modal if query params specify product or pet
  useEffect(() => {
    let shouldClearUrl = false;
    let urlHasParams = false;

    const prodId = searchParams.get('product');
    if (prodId) {
      urlHasParams = true;
      if (products.length > 0) {
        const p = products.find(x => x.Id === prodId);
        if (p) setSelectedProduct({ ...p, type: 'product' });
        shouldClearUrl = true;
      }
    }
    
    const petId = searchParams.get('pet');
    if (petId) {
      urlHasParams = true;
      if (pets.length > 0) {
        const p = pets.find(x => x.Id === petId);
        if (p) setSelectedProduct({ ...p, type: 'pet' });
        shouldClearUrl = true;
      }
    }

    // Sync category from URL
    const catParam = searchParams.get('category');
    if (catParam) {
      urlHasParams = true;
      if (catParam === 'cho-meo') {
        setMainTab('pet');
        setActiveSpecies('cat');
      } else if (catParam === 'cho-cho') {
        setMainTab('pet');
        setActiveSpecies('dog');
      } else if (!isNaN(catParam)) {
        setMainTab('product');
        setSelectedCategories([Number(catParam)]);
      }
      shouldClearUrl = true;
    }

    // Nếu URL có params, chỉ xóa URL khi products/pets đã load (để đảm bảo modal được mở)
    // Hoặc nếu URL chỉ có category (không có product/pet), thì xóa URL luôn
    if (urlHasParams && shouldClearUrl) {
      if ((!prodId && !petId) || (products.length > 0 || pets.length > 0)) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, products, pets, setSearchParams]);

  // Derived state
  const activeSpeciesData = filtersData.species.find(s => s.Name.toLowerCase() === activeSpecies.toLowerCase() || s.Id === activeSpecies) || { Breeds: [] };
  const filteredBreeds = activeSpeciesData.Breeds.filter(b => b.Name.toLowerCase().includes(searchBreed.toLowerCase()));

  // Lọc list sản phẩm/pet hiển thị
  let displayedItems = [];
  if (mainTab === 'pet') {
    displayedItems = pets.filter(p => {
      // Logic filter theo loài
      const currentSpeciesName = activeSpeciesData.Name || '';
      if (currentSpeciesName && p.SpeciesName !== currentSpeciesName) return false;
      
      // Filter theo giống
      if (selectedBreeds.length > 0 && !selectedBreeds.includes(p.BreedId)) return false;

      // Filter theo giới tính
      if (selectedGender && p.Gender !== selectedGender) return false;

      return true;
    });
  } else {
    displayedItems = products.filter(p => {
      // Filter theo danh mục
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.CategoryId)) return false;

      // Filter theo TargetPet
      if (selectedTargetPets.length > 0 && !selectedTargetPets.includes(p.TargetPetId)) return false;

      // Filter theo giá
      if (p.Price > maxPrice) return false;

      return true;
    });
  }

  // Sắp xếp
  displayedItems.sort((a, b) => {
    if (sortBy === 'price_asc') return a.Price - b.Price;
    if (sortBy === 'price_desc') return b.Price - a.Price;
    if (sortBy === 'newest') return new Date(b.CreatedAt) - new Date(a.CreatedAt);
    return 0; // phổ biến (default tạm)
  });

  const paginatedItems = displayedItems.slice(0, visibleCount);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleToggleFavorite = async (e, item) => {
    e.stopPropagation();
    try {
      const payload = mainTab === 'pet' ? { storePetId: item.Id } : { productId: item.Id };
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

  return (
    <div className="text-on-surface bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary min-h-screen flex flex-col relative">
      <Header />
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-28 right-4 z-50 bg-white border border-primary/20 shadow-xl shadow-primary/10 rounded-xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="text-primary" size={20} />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}

      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto w-full flex-grow">
        
        {/* Top Level Shop Tabs */}
        <div className="flex flex-col items-center justify-center mb-10 space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface">Khám phá cửa hàng</h1>
          
          <div className="flex p-1.5 bg-surface-variant/50 rounded-full w-full max-w-md shadow-inner border border-outline-variant/30">
            <button 
              onClick={() => setMainTab('pet')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold transition-all duration-300 ${mainTab === 'pet' ? 'bg-primary text-white shadow-md scale-100' : 'text-outline hover:text-primary scale-95'}`}
            >
              <PawPrint size={20} /> Đón Thú Cưng
            </button>
            <button 
              onClick={() => setMainTab('product')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold transition-all duration-300 ${mainTab === 'product' ? 'bg-primary text-white shadow-md scale-100' : 'text-outline hover:text-primary scale-95'}`}
            >
              <Package size={20} /> Siêu Thị Đồ Dùng
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Mobile Filter Toggle */}
          <div className="w-full md:hidden flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30">
            <span className="font-bold">Bộ lọc tìm kiếm</span>
            <button className="p-2 bg-primary/10 text-primary rounded-xl">
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {/* Sidebar: Filters */}
          <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 hidden md:block">
            <div className="sticky top-28 space-y-6">
              
              {/* Species Toggle */}
              {mainTab === 'pet' && (
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-outline-variant/30 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2">
                  {filtersData.species.map(species => (
                    <button 
                      key={species.Id}
                      onClick={() => setActiveSpecies(species.Name)}
                      className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold transition-all text-sm ${activeSpecies.toLowerCase() === species.Name.toLowerCase() ? 'bg-primary text-white shadow-md' : 'text-outline hover:bg-surface-variant'}`}
                    >
                      {species.Name}
                    </button>
                  ))}
                </div>
              )}

              {/* DYNAMIC SIDEBAR FOR PETS */}
              {mainTab === 'pet' && (
                <>
                  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-outline-variant/30 hover:border-primary/20 transition-colors">
                    <h3 className="font-bold text-lg text-primary mb-4 flex items-center justify-between">
                      Chọn Giống <ChevronDown size={18} />
                    </h3>
                    
                    {/* Search box for breeds */}
                    <div className="relative mb-4">
                      <input 
                        type="text" 
                        placeholder="Tìm giống..." 
                        value={searchBreed}
                        onChange={(e) => setSearchBreed(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    </div>

                    {/* Scrollable Checkbox List */}
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {filteredBreeds.map(breed => (
                        <label key={breed.Id} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <input 
                              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all" 
                              type="checkbox"
                              checked={selectedBreeds.includes(breed.Id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedBreeds([...selectedBreeds, breed.Id]);
                                else setSelectedBreeds(selectedBreeds.filter(id => id !== breed.Id));
                              }}
                            />
                            <span className="font-medium text-on-surface group-hover:text-primary transition-colors">{breed.Name}</span>
                          </div>
                        </label>
                      ))}
                      {filteredBreeds.length === 0 && <p className="text-sm text-outline">Không tìm thấy giống phù hợp.</p>}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-outline-variant/30 hover:border-primary/20 transition-colors">
                    <h3 className="font-bold text-lg text-primary mb-4">Giới tính</h3>
                    <div className="flex gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input 
                          className="peer sr-only" 
                          name="gender" 
                          type="radio"
                          checked={selectedGender === 'Đực'}
                          onChange={() => setSelectedGender(selectedGender === 'Đực' ? '' : 'Đực')}
                          onClick={() => selectedGender === 'Đực' && setSelectedGender('')}
                        />
                        <div className="py-2 text-center border-2 border-outline-variant/30 rounded-xl font-bold text-outline peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 transition-all">
                          Đực
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input 
                          className="peer sr-only" 
                          name="gender" 
                          type="radio" 
                          checked={selectedGender === 'Cái'}
                          onChange={() => setSelectedGender(selectedGender === 'Cái' ? '' : 'Cái')}
                          onClick={() => selectedGender === 'Cái' && setSelectedGender('')}
                        />
                        <div className="py-2 text-center border-2 border-outline-variant/30 rounded-xl font-bold text-outline peer-checked:border-primary peer-checked:text-primary peer-checked:bg-primary/5 transition-all">
                          Cái
                        </div>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* DYNAMIC SIDEBAR FOR PRODUCTS */}
              {mainTab === 'product' && (
                <>
                  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-outline-variant/30 hover:border-primary/20 transition-colors">
                    <h3 className="font-bold text-lg text-primary mb-5">Dành cho thú cưng</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                      {[...new Set(products.map(p => p.TargetPetId).filter(Boolean))].map(targetId => {
                        const targetName = filtersData.species.find(s => s.Id === targetId)?.Name || 'Không xác định';
                        return (
                        <label key={targetId} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <input 
                              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all" 
                              type="checkbox" 
                              checked={selectedTargetPets.includes(targetId)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTargetPets([...selectedTargetPets, targetId]);
                                else setSelectedTargetPets(selectedTargetPets.filter(t => t !== targetId));
                              }}
                            />
                            <span className="font-medium text-on-surface group-hover:text-primary transition-colors">{targetName}</span>
                          </div>
                        </label>
                      )})}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-outline-variant/30 hover:border-primary/20 transition-colors">
                    <h3 className="font-bold text-lg text-primary mb-5">Danh mục Sản Phẩm</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {filtersData.categories.map(cat => (
                        <label key={cat.Id} className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <input 
                              className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all" 
                              type="checkbox" 
                              checked={selectedCategories.includes(cat.Id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCategories([...selectedCategories, cat.Id]);
                                else setSelectedCategories(selectedCategories.filter(id => id !== cat.Id));
                              }}
                            />
                            <span className="font-medium text-on-surface group-hover:text-primary transition-colors">{cat.Name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-outline-variant/30 hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="font-bold text-lg text-primary">Khoảng giá</h3>
                      <span className="text-sm font-black text-on-surface bg-surface-container-high px-3 py-1 rounded-full">
                        {maxPrice >= 5000000 ? 'Tất cả' : `Dưới ${formatPrice(maxPrice)}`}
                      </span>
                    </div>
                    <input 
                      className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary relative z-10" 
                      max="5000000" min="0" step="50000" type="range" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                    />
                    <div className="flex justify-between mt-3 text-xs font-bold text-outline/70">
                      <span>0đ</span>
                      <span>5.000.000đ+</span>
                    </div>
                  </div>
                </>
              )}

            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30">
              <p className="text-outline font-medium">
                Tìm thấy <strong className="text-primary">{displayedItems.length}</strong> {mainTab === 'pet' ? 'bé thú cưng' : 'sản phẩm'}
              </p>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial w-full sm:w-56">
                  <select 
                    className="appearance-none bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 w-full cursor-pointer hover:bg-surface-variant transition-colors"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                    <option value="popular">Phổ biến nhất</option>
                  </select>
                  <Filter size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary" />
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedItems.map(item => (mainTab === 'pet' ? (
                  <div key={item.Id} className="relative flex flex-col bg-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-outline-variant/20 group hover:-translate-y-2 transition-all duration-500 ease-out">
                    <div className="relative h-[280px] m-3 mb-0 rounded-[24px] overflow-hidden cursor-pointer bg-surface-container-lowest" onClick={() => setSelectedProduct({ ...item, type: mainTab })}>
                      <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" src={item.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.Name} />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-black text-primary shadow-sm flex items-center gap-1.5 border border-white/50">
                        {item.SpeciesName === 'Chó' ? <Dog size={14} /> : item.SpeciesName === 'Mèo' ? <Cat size={14} /> : <PawPrint size={14} />}
                        {item.BreedName}
                      </div>
                      
                      <button 
                        onClick={(e) => handleToggleFavorite(e, item)} 
                        className={`absolute top-3 right-3 p-2.5 rounded-2xl transition-all duration-300 backdrop-blur-md border border-white/50 ${favoriteIds.includes(item.Id) ? 'bg-error/10 text-error shadow-sm' : 'bg-white/80 text-outline hover:bg-white hover:text-error hover:shadow-md'}`}
                      >
                        <Heart size={18} className={favoriteIds.includes(item.Id) ? 'fill-current scale-110' : ''} />
                      </button>
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          className="mb-4 bg-white/95 backdrop-blur-md text-primary px-6 py-2.5 rounded-2xl font-bold hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 active:scale-95 text-sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedProduct({ ...item, type: mainTab }); }}
                        >
                          <Eye size={16} /> Xem chi tiết
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-full">
                          <h3 className="font-extrabold text-xl mb-3 text-on-surface hover:text-primary transition-colors line-clamp-2 cursor-pointer leading-tight" onClick={() => setSelectedProduct({ ...item, type: mainTab })} title={item.Name}>
                            {item.Name}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-xl text-xs font-bold border border-primary/10 flex items-center gap-1">
                              {item.Gender}
                            </span>
                            <span className="bg-surface-variant/30 text-on-surface px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                              {item.Age}
                            </span>
                            {item.Vaccine && (
                              <span className="bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                                <ShieldCheck size={12} /> {item.Vaccine}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-xs text-outline font-medium mb-0.5">Giá đón bé</p>
                          {Number(item.OldPrice) > 0 && (
                            <span className="text-outline text-sm line-through decoration-error/50">{formatPrice(item.OldPrice)}</span>
                          )}
                          <p className="text-primary font-black text-xl">{formatPrice(item.Price)}</p>
                        </div>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleAddToCart(item, mainTab); 
                          }}
                          className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 group/btn relative overflow-hidden"
                        >
                          <ShoppingBag size={20} className="relative z-10 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={item.Id} className="product-card bg-white p-5 rounded-[24px] shadow-sm hover:shadow-xl border border-outline-variant/40 hover:border-primary/30 transition-all duration-300 group relative flex flex-col h-full">
                    <div className="relative aspect-square rounded-[16px] overflow-hidden mb-5 bg-surface-container-low cursor-pointer" onClick={() => setSelectedProduct({ ...item, type: mainTab })}>
                      <button 
                        onClick={(e) => handleToggleFavorite(e, item)}
                        className={`absolute top-3 right-3 z-10 p-2 backdrop-blur-md rounded-full transition-colors shadow-sm ${favoriteIds.includes(item.Id) ? 'bg-white text-error' : 'bg-white/80 text-outline hover:text-error hover:bg-white'}`}
                      >
                        <Heart size={18} className={favoriteIds.includes(item.Id) ? 'fill-current' : ''} />
                      </button>
                      
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" src={item.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.Name} />
                      
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                        <button 
                          className="bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 active:scale-95"
                          onClick={(e) => { e.stopPropagation(); setSelectedProduct({ ...item, type: mainTab }); }}
                        >
                          <Eye size={18} /> Xem chi tiết
                        </button>
                      </div>
                    </div>
                    {mainTab === 'product' && (
                      <div className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1 truncate">
                        {item.CategoryName || 'Khác'}
                      </div>
                    )}
                    <Link to={`/shop`} className="font-bold text-lg text-on-surface line-clamp-2 min-h-[3.5rem] mb-2 group-hover:text-primary transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setSelectedProduct({ ...item, type: mainTab }); }} title={item.Name}>
                      {item.Name}
                    </Link>

                    <div className="flex items-end justify-between mt-auto pt-4">
                      <div className="flex flex-col">
                        {Number(item.OldPrice) > 0 && (
                          <span className="text-outline text-sm line-through decoration-error/50">{formatPrice(item.OldPrice)}</span>
                        )}
                        <span className="text-primary font-black text-xl">{formatPrice(item.Price)}</span>
                      </div>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (item.StockQuantity > 0) handleAddToCart(item, mainTab); 
                          else showToast('Sản phẩm đã hết hàng!');
                        }}
                        className={`add-to-cart flex items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-md ${
                          item.StockQuantity > 0 
                            ? 'bg-primary text-white hover:bg-[#a65d00] active:scale-90 shadow-primary/20' 
                            : 'bg-surface-variant text-outline cursor-not-allowed opacity-70'
                        }`}
                        title={item.StockQuantity <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
                      >
                        <ShoppingBag size={20} />
                      </button>
                    </div>
                  </div>
                )))}

              </div>
            )}

            {!loading && displayedItems.length === 0 && (
              <div className="w-full py-20 flex flex-col items-center justify-center text-outline">
                <PawPrint size={64} className="opacity-20 mb-4" />
                <p className="text-lg font-bold">Không tìm thấy {mainTab === 'pet' ? 'thú cưng' : 'sản phẩm'} phù hợp</p>
                <p className="text-sm mt-2">Vui lòng thử điều chỉnh lại bộ lọc</p>
              </div>
            )}

            {/* Load More */}
            {!loading && visibleCount < displayedItems.length && (
              <div className="flex justify-center items-center mt-12">
                <button 
                  onClick={() => setVisibleCount(prev => prev + ITEMS_PER_LOAD)}
                  className="px-8 py-3 bg-white border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                >
                  Tải thêm
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />

      {/* Note: ProductDetailModal might need adjusting to accept item fields like ImageUrl, Name instead of image, name */}
      <ProductDetailModal 
        isOpen={!!selectedProduct} 
        onClose={() => {
          setSelectedProduct(null);
          // Only clear URL if we are on /shop and there is a product/pet id in the query params to avoid unnecessary history states
          if (searchParams.has('pet') || searchParams.has('product')) {
             setSearchParams(new URLSearchParams());
          }
        }} 
        product={selectedProduct ? {
          ...selectedProduct,
          name: selectedProduct.Name,
          price: selectedProduct.Price,
          oldPrice: selectedProduct.OldPrice,
          image: selectedProduct.ImageUrl,
          badge: null,
          breed: selectedProduct.BreedName,
          gender: selectedProduct.Gender,
          age: selectedProduct.Age,
          brand: selectedProduct.CategoryName,
          category: selectedProduct.CategoryName,
          rating: 5,
          reviews: 0
        } : null} 
        onAddToCart={(qty, variant) => {
           handleAddToCart(selectedProduct, selectedProduct.type, qty, variant);
           setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default ShopPage;
