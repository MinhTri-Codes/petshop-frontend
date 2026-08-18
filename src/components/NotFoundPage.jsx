import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col font-body-md text-on-surface bg-[#fcfaf8]">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="text-[150px] md:text-[200px] font-black text-primary/10 leading-none select-none">
            404
          </div>
          <img 
            src="https://images.unsplash.com/photo-1537151608804-ea2f1fa3dfc7?auto=format&fit=crop&q=80&w=300&h=300" 
            alt="Dog looking confused" 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-56 md:h-56 object-cover rounded-full border-8 border-[#fcfaf8] shadow-xl shadow-primary/20"
          />
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-4">
          Oops! Lạc đường rồi...
        </h1>
        <p className="text-lg text-outline font-medium mb-10 max-w-lg mx-auto">
          Trang bạn đang tìm kiếm có vẻ không tồn tại hoặc đã bị di dời. Đừng lo, hãy để chúng tôi dẫn bạn về nhà!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/" 
            className="px-8 py-4 bg-primary text-white font-extrabold rounded-full flex items-center justify-center gap-2 hover:bg-primary/90 hover:-translate-y-1 hover:shadow-lg transition-all active:scale-95"
          >
            <Home size={20} /> VỀ TRANG CHỦ
          </Link>
          <Link 
            to="/shop" 
            className="px-8 py-4 bg-white text-on-surface font-extrabold rounded-full flex items-center justify-center gap-2 border border-outline-variant/30 hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg transition-all active:scale-95"
          >
            <Search size={20} /> TIẾP TỤC MUA SẮM
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
