import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { 
  ChevronRight, 
  Clock, 
  ArrowRight,
  BookOpen,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../apiClient';
const BlogPage = () => {
  const [activeCategory, setActiveCategory] = React.useState('Tất cả');
  const [toastMessage, setToastMessage] = React.useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const [articles, setArticles] = React.useState([]);
  const [blogCategories, setBlogCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBlogsAndCategories = async () => {
      try {
        const [blogRes, catRes] = await Promise.all([
          apiClient.get('/blogs'),
          apiClient.get('/blogs/categories')
        ]);
        setArticles(blogRes.data);
        setBlogCategories(catRes.data);
      } catch (err) {
        console.error('Lỗi lấy bài viết:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogsAndCategories();
  }, []);

  const filteredArticles = activeCategory === 'Tất cả' 
    ? articles 
    : articles.filter(a => a.CategoryName === activeCategory);

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
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto whitespace-nowrap py-2 no-scrollbar text-sm font-bold">
          <span className="text-outline hover:text-primary cursor-pointer transition-colors">Trang chủ</span>
          <ChevronRight size={16} className="text-outline" />
          <span className="text-primary underline underline-offset-4 decoration-2">Cẩm nang thú cưng</span>
        </div>

        {/* Header Title */}
        <div className="flex flex-col items-center justify-center mb-12 text-center">
          <div className="p-4 bg-primary/10 text-primary rounded-full mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-on-surface mb-4">Cẩm Nang Chăm Sóc</h1>
          <p className="text-outline text-lg max-w-2xl">Khám phá hàng trăm bài viết, mẹo vặt và kiến thức chuẩn y khoa để giúp bé thú cưng của bạn luôn khỏe mạnh và hạnh phúc.</p>
        </div>

        {/* Featured Article */}
        {!loading && articles.length > 0 && (() => {
          const featuredArticle = articles.reduce((prev, current) => (prev.Likes > current.Likes) ? prev : current);
          return (
            <section className="mb-16">
              <Link to={`/blog/${featuredArticle.Id}`} className="group cursor-pointer bg-white rounded-[32px] overflow-hidden shadow-lg border border-outline-variant/30 flex flex-col lg:flex-row hover:shadow-xl transition-all duration-300 block">
                <div className="w-full lg:w-3/5 h-[300px] lg:h-[450px] relative overflow-hidden">
                  <img 
                    src={featuredArticle.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} 
                    alt={featuredArticle.Title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute top-6 left-6 bg-primary text-white font-black uppercase tracking-widest text-xs px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                    Bài viết Nổi Bật 
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{featuredArticle.Likes} Likes</span>
                  </div>
                </div>
                
                <div className="w-full lg:w-2/5 p-6 md:p-8 lg:p-12 flex flex-col justify-center bg-surface-container-lowest">
                  <div className="flex items-center gap-4 text-xs font-bold text-outline uppercase tracking-wider mb-4">
                    <span className="flex items-center gap-1.5"><Tag size={14} className="text-primary"/> {featuredArticle.CategoryName}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary"/> {featuredArticle.ReadTime}</span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-on-surface mb-6 leading-tight group-hover:text-primary transition-colors">
                    {featuredArticle.Title}
                  </h2>
                  
                  <p className="text-outline text-lg mb-8 line-clamp-3 leading-relaxed">
                    {featuredArticle.Excerpt}
                  </p>
                  
                  <span className="flex items-center gap-2 text-primary font-black uppercase tracking-wider text-sm group-hover:gap-4 transition-all w-max">
                    Đọc toàn bộ <ArrowRight size={18} />
                  </span>
                </div>
              </Link>
            </section>
          );
        })()}

        {/* Categories Bar */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar mb-10 border-b border-outline-variant/30 pb-2">
          {['Tất cả', ...blogCategories.map(c => c.Name)].map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-3 rounded-t-2xl font-bold transition-all border-b-4 ${activeCategory === cat ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-outline hover:text-primary hover:bg-surface-variant/50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredArticles.map(article => (
              <Link to={`/blog/${article.Id}`} key={article.Id} className="group cursor-pointer flex flex-col h-full bg-white rounded-[24px] overflow-hidden shadow-sm border border-outline-variant/30 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <div className="w-full h-48 relative overflow-hidden bg-surface-container-low">
                  <img src={article.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={article.Title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 bg-primary/10 w-max px-2.5 py-1 rounded-md">
                    {article.CategoryName}
                  </span>
                  
                  <h3 className="font-extrabold text-lg text-on-surface mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {article.Title}
                  </h3>
                  
                  <p className="text-outline text-sm line-clamp-2 mb-5 flex-grow">
                    {article.Excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs font-bold text-outline/70 border-t border-outline-variant/30 pt-4 mt-auto">
                    <span>{new Date(article.CreatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {article.ReadTime}</span>
                  </div>
                </div>
              </Link>
            ))}
            {filteredArticles.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-outline font-bold text-lg">Chưa có bài viết nào trong chuyên mục này.</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <button 
            onClick={() => showToast('Chưa có thêm bài viết nào!')}
            className="px-8 py-4 border-2 border-outline-variant text-on-surface font-bold rounded-xl hover:border-primary hover:text-primary transition-all"
          >
            Xem thêm bài viết
          </button>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default BlogPage;
