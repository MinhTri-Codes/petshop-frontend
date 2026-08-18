import React, { useRef, useEffect, useState } from 'react';
import { 
  FileText, Plus, Edit3, Trash2, Search, Filter, Eye, ThumbsUp, Save
} from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import apiClient from '../apiClient';

const StaffBlogsPage = () => {
  const searchInputRef = useRef(null);
  const [blogs, setBlogs] = useState([]);
  const [blogCategories, setBlogCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');

  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);

  const [imagePreview, setImagePreview] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: 'Admin',
    category: 'Cẩm nang',
    excerpt: '',
    content: '',
    readTime: 5,
    status: 'Bản nháp',
    image: ''
  });

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/manager/blogs');
      setBlogs(res.data.map(b => ({
        id: b.Id,
        title: b.Title,
        author: b.AuthorName,
        date: new Date(b.CreatedAt).toLocaleDateString('vi-VN'),
        likes: b.Likes || 0,
        status: b.IsPublished ? 'Đã xuất bản' : 'Bản nháp',
        image: b.ImageUrl || '',
        category: b.CategoryName || 'Cẩm nang',
        categoryId: b.CategoryId,
        excerpt: b.Excerpt || '',
        content: b.Content || '',
        readTime: b.ReadTime || 5
      })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/manager/blog-categories');
      const mapped = res.data.map(c => ({ id: c.Id, name: c.Name, slug: c.Slug }));
      setBlogCategories(mapped);
      if (mapped.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: mapped[0].id }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAdd = () => {
    setFormData({ 
      title: '', 
      author: 'Admin', 
      categoryId: blogCategories.length > 0 ? blogCategories[0].id : null,
      category: blogCategories.length > 0 ? blogCategories[0].name : 'Cẩm nang', 
      excerpt: '', 
      content: '', 
      readTime: 5, 
      status: 'Bản nháp', 
      image: '' 
    });
    setImagePreview('');
    setSelectedBlog(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (blog) => {
    setFormData({ 
      title: blog.title, 
      author: blog.author, 
      categoryId: blog.categoryId,
      excerpt: blog.excerpt,
      content: blog.content,
      readTime: blog.readTime,
      status: blog.status, 
      image: blog.image 
    });
    setImagePreview(blog.image || '');
    setSelectedBlog(blog);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (blog) => {
    setSelectedBlog(blog);
    setIsDeleteModalOpen(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      try {
        const res = await apiClient.post('/manager/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setImagePreview(res.data.url);
        setFormData({ ...formData, image: res.data.url });
      } catch (error) {
        alert('Lỗi tải ảnh');
      }
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        Title: formData.title,
        CategoryId: formData.categoryId,
        Excerpt: formData.excerpt,
        Content: formData.content,
        ImageUrl: formData.image,
        AuthorName: formData.author,
        ReadTime: formData.readTime,
        IsPublished: formData.status === 'Đã xuất bản'
      };

      if (selectedBlog) {
        await apiClient.put(`/manager/blogs/${selectedBlog.id}`, payload);
      } else {
        await apiClient.post('/manager/blogs', payload);
      }
      fetchBlogs();
      setIsAddEditModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu bài viết');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedBlog) {
      try {
        await apiClient.delete(`/manager/blogs/${selectedBlog.id}`);
        fetchBlogs();
      } catch (error) {
        console.error(error);
        alert('Lỗi xóa bài viết');
      }
    }
    setIsDeleteModalOpen(false);
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesStatus = true;
    if (statusFilter === 'Đã xuất bản') matchesStatus = blog.status === 'Đã xuất bản';
    if (statusFilter === 'Bản nháp') matchesStatus = blog.status === 'Bản nháp';
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm kiếm bài viết (F1)..." />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Quản lý Bài viết</h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Cập nhật tin tức, kiến thức nuôi thú cưng.</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 text-sm font-extrabold"
            >
              <Plus size={18} />
              Viết bài mới
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[280px] relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                className="w-full h-11 pl-11 pr-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 text-sm font-medium transition-all shadow-sm outline-none" 
                placeholder="Lọc theo tiêu đề..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-outline-variant/50 rounded-xl text-sm font-semibold px-4 h-11 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm outline-none"
            >
              <option value="Tất cả trạng thái">Tất cả trạng thái</option>
              <option value="Đã xuất bản">Đã xuất bản</option>
              <option value="Bản nháp">Bản nháp</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Bài viết</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Tác giả</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Ngày đăng</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-center">Lượt thích</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {blog.image ? (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-outline-variant/30 shrink-0">
                              <img src={blog.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={blog.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 border border-outline-variant/30">
                              <FileText size={20} />
                            </div>
                          )}
                          <span className="font-bold text-sm text-on-surface line-clamp-2">{blog.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">{blog.author}</td>
                      <td className="px-6 py-4 text-sm font-medium text-outline">{blog.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-1 text-sm font-bold text-on-surface">
                          <ThumbsUp size={14} className="text-outline" /> {blog.likes}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${blog.status === 'Đã xuất bản' ? 'bg-green-100 text-green-700' : 'bg-surface-variant text-outline'}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleOpenEdit(blog)}
                          className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(blog)}
                          className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>

      {/* Add/Edit Modal */}
      <GenericModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={selectedBlog ? "Chỉnh sửa Bài viết" : "Viết Bài mới"}
        icon={FileText}
        actions={
          <>
            <button 
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-6 py-2.5 font-bold text-outline hover:bg-surface-container-low rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <Save size={18} />
              Lưu thay đổi
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Tiêu đề bài viết</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              placeholder="Nhập tiêu đề..."
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Ảnh bìa bài viết</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/50 shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/50 flex items-center justify-center text-outline shrink-0">
                  <FileText size={24} />
                </div>
              )}
              <label className="flex-1 flex flex-col items-center justify-center h-16 border-2 border-dashed border-outline-variant/50 rounded-xl hover:bg-surface-container-low hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Plus size={18} />
                  <span>Chọn ảnh từ máy tính</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Tác giả</label>
              <input 
                type="text" 
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="Tên tác giả..."
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Trạng thái</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                <option value="Bản nháp">Bản nháp</option>
                <option value="Đã xuất bản">Đã xuất bản</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Danh mục</label>
                <select 
                  value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: Number(e.target.value)})}
                  className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                >
                  {blogCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  {blogCategories.length === 0 && (
                    <option value="Cẩm nang">Cẩm nang</option>
                  )}
                </select>
              </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Thời gian đọc (phút)</label>
              <input 
                type="number" 
                value={formData.readTime}
                onChange={(e) => setFormData({...formData, readTime: parseInt(e.target.value) || 0})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                min="1"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="font-bold text-sm text-on-surface">Đoạn trích (Mô tả ngắn)</label>
              <textarea 
                value={formData.excerpt}
                onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                placeholder="Nhập mô tả ngắn gọn..."
                className="w-full min-h-[80px] p-4 bg-white border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none text-sm"
              ></textarea>
            </div>
          </div>
          <div className="space-y-2 flex-1 flex flex-col">
            <label className="font-bold text-sm text-on-surface">Nội dung chi tiết</label>
            <textarea 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              placeholder="Nhập nội dung bài viết..."
              className="w-full flex-1 min-h-[150px] p-4 bg-white border border-outline-variant/50 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium resize-none text-sm"
            ></textarea>
          </div>
        </div>
      </GenericModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedBlog?.title}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default StaffBlogsPage;
