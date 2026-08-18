import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Search, SlidersHorizontal, ChevronDown, Package, Heart } from 'lucide-react';
import apiClient from '../apiClient';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/customer/search?q=${query}`);
        setProducts(res.data.products || []);
        setPets(res.data.pets || []);
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
      } finally {
        setLoading(false);
      }
    };
    if (query) {
      fetchSearchResults();
    } else {
      setProducts([]);
      setPets([]);
      setLoading(false);
    }
  }, [query]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="text-on-surface bg-background min-h-screen flex flex-col">
      <Header />
      
      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto flex-grow w-full">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface">Kết quả tìm kiếm cho: "{query}"</h1>
          {!loading && (
            <p className="text-sm font-bold text-outline mt-3">Tìm thấy {products.length + pets.length} kết quả phù hợp</p>
          )}
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/50 rounded-xl font-bold text-sm hover:border-primary/50 transition-colors">
            <SlidersHorizontal size={18} /> Bộ lọc
          </button>
          <div className="flex items-center gap-3 text-sm font-bold">
            <span className="text-outline">Sắp xếp:</span>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant/50 rounded-xl hover:border-primary/50 transition-colors">
              Mới nhất <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : (
          <div className="space-y-12">
            {products.length > 0 && (
              <section>
                 <div className="flex items-center gap-3 mb-6">
                   <Package className="text-primary" size={24} />
                   <h2 className="text-xl font-extrabold border-l-4 border-primary pl-3">Sản phẩm ({products.length})</h2>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map(product => (
                    <div key={product.Id} className="bg-white p-4 md:p-5 rounded-[24px] shadow-sm hover:shadow-xl border border-outline-variant/40 hover:border-primary/30 transition-all duration-300 group relative flex flex-col h-full">
                      <div className="relative aspect-square rounded-[16px] overflow-hidden mb-5 bg-surface-container-low">
                        <button className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-outline hover:text-error hover:bg-white transition-colors shadow-sm">
                          <Heart size={18} />
                        </button>
                        <Link to={`/shop`}>
                          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out cursor-pointer" src={product.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={product.Name} />
                        </Link>
                      </div>
                      
                      <Link to={`/shop`} className="font-bold text-base md:text-lg text-on-surface line-clamp-2 mb-2 group-hover:text-primary transition-colors flex-grow">
                        {product.Name}
                      </Link>
                      
                      <div className="flex flex-col mt-2">
                        {Number(product.OldPrice) > 0 && <span className="text-outline text-xs line-through decoration-error/50">{formatPrice(product.OldPrice)}</span>}
                        <span className="text-primary font-black text-lg md:text-xl">{formatPrice(product.Price)}</span>
                      </div>
                    </div>
                  ))}
                 </div>
              </section>
            )}

            {pets.length > 0 && (
              <section>
                 <div className="flex items-center gap-3 mb-6">
                   <Heart className="text-secondary" size={24} />
                   <h2 className="text-xl font-extrabold border-l-4 border-secondary pl-3">Thú cưng ({pets.length})</h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {pets.map(pet => (
                    <div key={pet.Id} className="flex flex-col bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-lg hover:shadow-secondary/20 border border-outline-variant/30 group hover:-translate-y-1 transition-all duration-300">
                      <div className="relative h-64 overflow-hidden">
                        <Link to="/shop"><img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out cursor-pointer" src={pet.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={pet.Name} /></Link>
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-secondary shadow-sm">{pet.BreedName}</div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Link to="/shop" className="font-extrabold text-xl md:text-2xl mb-1 hover:text-secondary transition-colors">{pet.Name}</Link>
                            <p className="text-outline font-medium text-sm">{pet.Age} • {pet.Gender}</p>
                          </div>
                          <div className="text-right">
                            {Number(pet.OldPrice) > 0 && <p className="text-outline text-sm line-through decoration-error/50 mb-0.5">{formatPrice(pet.OldPrice)}</p>}
                            <p className="text-secondary font-black text-lg md:text-xl mb-1">{formatPrice(pet.Price)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                 </div>
              </section>
            )}

            {products.length === 0 && pets.length === 0 && (
              <div className="text-center py-20 bg-surface-container-low rounded-3xl border border-outline-variant/30">
                <Search size={48} className="mx-auto text-outline/50 mb-4" />
                <h2 className="text-xl font-extrabold text-on-surface mb-2">Không tìm thấy kết quả nào</h2>
                <p className="text-outline font-medium">Hãy thử với từ khóa khác hoặc duyệt qua danh mục của chúng tôi.</p>
                <Link to="/shop" className="inline-block mt-6 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  Tiếp tục mua sắm
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchResultsPage;
