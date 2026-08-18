import React, { useRef, useState, useEffect } from 'react';
import { Grid, PlusCircle, Edit, Trash2, Save, Eye, FileText } from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import apiClient from '../apiClient';

const ManagerBlogCategoriesPage = () => {
  const searchInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for viewing blogs
  const [isBlogsModalOpen, setIsBlogsModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);

  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, blogRes] = await Promise.all([
        apiClient.get('/manager/blog-categories'),
        apiClient.get('/manager/blogs')
      ]);
      setCategories(catRes.data.map(c => ({
        id: c.Id,
        name: c.Name,
        slug: c.Slug,
        blogsCount: c.BlogsCount || 0
      })));
      setAllBlogs(blogRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/manager/blog-categories');
      setCategories(res.data.map(c => ({
        id: c.Id,
        name: c.Name,
        slug: c.Slug,
        blogsCount: c.BlogsCount || 0
      })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenAdd = () => {
    setFormData({ name: '' });
    setSelectedCategory(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setFormData({ name: category.name });
    setSelectedCategory(category);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) return alert('Vui lòng nhập tên danh mục');
      // Auto-generate a basic slug from name
      const slug = formData.name.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const payload = { ...formData, slug };

      if (selectedCategory) {
        await apiClient.put(`/manager/blog-categories/${selectedCategory.id}`, payload);
        alert('Cập nhật thành công');
      } else {
        await apiClient.post('/manager/blog-categories', payload);
        alert('Tạo danh mục thành công');
      }
      setIsAddEditModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      alert('Lỗi lưu danh mục');
    }
  };

  const handleDelete = async () => {
    if (selectedCategory) {
      try {
        await apiClient.delete(`/manager/blog-categories/${selectedCategory.id}`);
        alert('Xóa thành công');
        setIsDeleteModalOpen(false);
        fetchCategories();
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.error || 'Lỗi xóa danh mục');
      }
    }
  };

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm kiếm danh mục (F1)..." />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
                <Grid className="text-primary" size={32} />
                Quản lý Danh mục Bài viết
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Quản lý các chuyên mục bài viết, tin tức, chia sẻ kinh nghiệm.</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-sm font-extrabold"
            >
              <PlusCircle size={18} />
              THÊM DANH MỤC
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">ID</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Tên Danh Mục</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Số lượng bài viết</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-6 py-5 font-mono text-sm font-bold text-outline">#{cat.id.toString().padStart(3, '0')}</td>
                      <td className="px-6 py-5 font-bold text-base text-on-surface">{cat.name}</td>
                      <td className="px-6 py-5 font-medium text-outline">{cat.slug}</td>
                      <td className="px-6 py-5 font-bold text-primary">
                        <button
                          onClick={() => {
                            setViewingCategory(cat);
                            setIsBlogsModalOpen(true);
                          }}
                          className="flex items-center gap-2 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Xem danh sách bài viết"
                        >
                          <Eye size={18} />
                          {cat.blogsCount} bài
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(cat)}
                            className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && !loading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-outline font-medium">
                        Không có danh mục nào.
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-outline font-medium">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  )}
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
        title={selectedCategory ? 'Sửa Danh mục Cẩm nang' : 'Thêm Danh mục mới'}
        icon={Grid}
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-wider">Tên Danh Mục <span className="text-error">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
              placeholder="VD: Dinh Dưỡng"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setIsAddEditModalOpen(false)}
              className="flex-1 py-3 px-4 bg-surface-container-high text-on-surface font-extrabold rounded-xl hover:bg-surface-container-highest transition-colors text-sm"
            >
              HỦY
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2 text-sm"
            >
              <Save size={18} />
              LƯU LẠI
            </button>
          </div>
        </div>
      </GenericModal>

      {/* Delete Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Xóa Danh mục Cẩm nang"
        message={`Bạn có chắc chắn muốn xóa danh mục "${selectedCategory?.name}"? Các bài viết thuộc danh mục này có thể bị mất phân loại.`}
      />

      {/* Blogs List Modal */}
      <GenericModal
        isOpen={isBlogsModalOpen}
        onClose={() => setIsBlogsModalOpen(false)}
        title={`Bài viết thuộc danh mục "${viewingCategory?.name}"`}
        icon={FileText}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden">
            {viewingCategory && allBlogs.filter(b => b.CategoryId === viewingCategory.id).length > 0 ? (
              <div className="divide-y divide-outline-variant/20 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {allBlogs.filter(b => b.CategoryId === viewingCategory.id).map(blog => (
                  <div key={blog.Id} className="flex gap-4 p-4 hover:bg-surface-variant/20 transition-colors">
                    <div className="w-16 h-16 bg-surface-container-low rounded-xl overflow-hidden flex-shrink-0">
                      {blog.ImageUrl ? (
                        <img src={blog.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={blog.Title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-outline">
                          <FileText size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-on-surface text-base truncate">{blog.Title}</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-outline font-medium">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary/70"></span>
                          {blog.AuthorName}
                        </span>
                        <span>•</span>
                        <span>{new Date(blog.CreatedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${blog.IsPublished ? 'bg-success/10 text-success' : 'bg-outline-variant/30 text-outline'}`}>
                        {blog.IsPublished ? 'Xuất bản' : 'Bản nháp'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center text-outline">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">Không có bài viết nào</p>
                  <p className="text-sm text-outline mt-1">Danh mục này hiện chưa có bài viết nào.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </GenericModal>
    </div>
  );
};

export default ManagerBlogCategoriesPage;
