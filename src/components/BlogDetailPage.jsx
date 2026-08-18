import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { ChevronRight, Calendar, User, ThumbsUp, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../apiClient';

const BlogDetailPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await apiClient.get(`/blogs/${id}`);
        setBlog(res.data);
        setLikes(res.data.Likes || 0);
      } catch (err) {
        console.error('Lỗi tải bài viết:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchBlog();
      // Kiểm tra trạng thái đã like từ localStorage
      const likedBlogs = JSON.parse(localStorage.getItem('likedBlogs') || '{}');
      if (likedBlogs[id]) {
        setIsLiked(true);
      }
    }
  }, [id]);

  const handleLike = async () => {
    const action = isLiked ? 'unlike' : 'like';
    try {
      const res = await apiClient.post(`/blogs/${id}/like`, { action });
      setLikes(res.data.likes);
      setIsLiked(!isLiked);
      
      // Lưu vào localStorage
      const likedBlogs = JSON.parse(localStorage.getItem('likedBlogs') || '{}');
      if (action === 'like') {
        likedBlogs[id] = true;
      } else {
        delete likedBlogs[id];
      }
      localStorage.setItem('likedBlogs', JSON.stringify(likedBlogs));
    } catch (err) {
      console.error('Lỗi like:', err);
    }
  };
  return (
    <div className="text-on-surface bg-background overflow-x-hidden min-h-screen flex flex-col">
      <Header />
      
      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto w-full flex-grow">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-bold text-outline mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <ChevronRight size={16} />
          <Link to="/blog" className="hover:text-primary transition-colors">Bài viết</Link>
          <ChevronRight size={16} />
          <span className="text-primary truncate max-w-[200px] sm:max-w-none">Chăm sóc thú cưng mùa lạnh</span>
        </div>

        <article className="max-w-4xl mx-auto">
          {loading ? (
             <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : !blog ? (
             <div className="text-center py-20 font-bold text-outline text-xl">Không tìm thấy bài viết</div>
          ) : (
            <>
              {/* Header */}
              <header className="mb-8 text-center">
                <div className="inline-flex items-center justify-center bg-primary/10 text-primary font-black uppercase tracking-widest text-xs px-3 py-1.5 rounded-lg mb-4">
                  {blog.Category}
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface leading-tight mb-6">
                  {blog.Title}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-outline">
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    <span>{blog.AuthorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span>{new Date(blog.CreatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsUp size={18} className={isLiked ? "text-primary fill-primary" : ""} />
                    <span className={isLiked ? "text-primary font-bold" : ""}>{likes.toLocaleString('vi-VN')} lượt thích</span>
                  </div>
                </div>
              </header>

              {/* Featured Image */}
              <div className="w-full aspect-[2/1] rounded-3xl overflow-hidden shadow-sm mb-10 border-4 border-white">
                <img 
                  src={blog.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} 
                  alt={blog.Title} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              {/* Content */}
              <div 
                className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:font-medium prose-p:text-on-surface/80 prose-a:text-primary hover:prose-a:text-primary-dark"
                dangerouslySetInnerHTML={{ __html: blog.Content }}
              />

              {/* Like Button Section */}
              <div className="mt-12 flex justify-center">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-3 px-8 py-4 font-bold rounded-2xl transition-all shadow-sm active:scale-95 ${isLiked ? 'bg-primary text-white shadow-primary/30 border-2 border-primary' : 'bg-white border-2 border-outline-variant/50 text-outline hover:border-primary hover:text-primary'}`}
                >
                  <ThumbsUp size={24} className={isLiked ? "fill-white" : ""} />
                  {isLiked ? 'Đã thích bài viết' : 'Thích bài viết này'}
                </button>
              </div>

              <hr className="my-10 border-outline-variant/30" />

              {/* Author */}
              {blog.AuthorName && (
                <div className="bg-surface-container-low p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 border border-outline-variant/30 mb-12">
                  <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl">
                    {blog.AuthorName.charAt(0)}
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-extrabold text-on-surface mb-1">{blog.AuthorName}</h3>
                    <p className="text-sm font-medium text-outline">
                      Tác giả / Chuyên gia tại PetLove.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Back button */}
          <div className="text-center">
            <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-surface-container-low border border-outline-variant/50 font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-on-surface">
              <ArrowLeft size={20} /> Quay lại trang danh sách
            </Link>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogDetailPage;
