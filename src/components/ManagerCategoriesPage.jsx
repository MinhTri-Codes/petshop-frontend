import React, { useRef, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Grid, PlusCircle, Edit, Trash2, Save, Eye, Package, DownloadCloud, FileUp } from 'lucide-react';
import * as xlsx from 'xlsx';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';
import apiClient from '../apiClient';

const CategoriesPage = () => {
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleExportExcel = () => {
    const exportData = categories.map(c => ({
      'Tên Danh Mục': c.name,
      'URL Slug': c.slug,
      'Link Ảnh': c.imageUrl || '',
      'Trạng Thái': c.status
    }));
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Categories');
    xlsx.writeFile(wb, 'DanhSachDanhMuc.xlsx');
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(ws);
        
        const errors = [];
        const imported = [];

        data.forEach((row, idx) => {
          const rowNum = idx + 2;
          const name = row['Tên Danh Mục'];
          if (!name) {
            errors.push(`Dòng ${rowNum}: Thiếu 'Tên Danh Mục'.`);
            return;
          }
          let status = row['Trạng Thái'] || 'Hoạt động';
          const validStatuses = ['Hoạt động', 'Đã ẩn'];
          if (!validStatuses.includes(status)) {
            errors.push(`Dòng ${rowNum}: Trạng thái '${status}' không hợp lệ (chỉ chấp nhận 'Hoạt động' hoặc 'Đã ẩn').`);
            return;
          }

          imported.push({
            Name: name,
            Slug: row['URL Slug'] || '',
            ImageUrl: row['Link Ảnh'] || '',
            Status: status
          });
        });

        if (errors.length > 0) {
          alert('LỖI DỮ LIỆU TỪ FILE EXCEL:\n\n' + errors.join('\n'));
          e.target.value = null;
          return;
        }
        if (imported.length === 0) {
          alert('Không tìm thấy dữ liệu hợp lệ.'); 
          e.target.value = null;
          return;
        }

        const res = await apiClient.post('/manager/categories/bulk', { categories: imported });
        alert(res.data.message + ` (Đã chèn: ${res.data.inserted}, Đã cập nhật: ${res.data.updated})`);
        fetchCategories(currentPage);
    } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi nhập file Excel!');
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  // States for viewing products
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes] = await Promise.all([
        apiClient.get('/manager/categories'),
        apiClient.get('/manager/products')
      ]);
      setCategories(catRes.data.map(c => ({
        id: c.Id,
        name: c.Name,
        slug: c.Slug,
        imageUrl: c.ImageUrl,
        products: c.ProductsCount || 0,
        status: c.Status || 'Hoạt động'
      })));
      setAllProducts(prodRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (page = 1) => {
    try {
      const res = await apiClient.get(`/manager/categories?page=${page}&limit=10`);
setCategories((res.data.data || res.data || []).map(c => ({
        id: c.Id,
        name: c.Name,
        slug: c.Slug,
        imageUrl: c.ImageUrl,
        products: c.ProductsCount || 0,
        status: c.Status || 'Hoạt động'
      })));
    
      setTotalPages(res.data.pagination?.totalPages || 1);
} catch (error) {
      console.error(error);
    }
  };

  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
    status: 'Hoạt động'
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', imageUrl: '', status: 'Hoạt động' });
    setSelectedCategory(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setFormData({ name: category.name, imageUrl: category.imageUrl || '', status: category.status });
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
      // Auto-generate a basic slug from name if empty
      const slug = formData.name.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const payload = { ...formData, slug };

      if (selectedCategory) {
        await apiClient.put(`/manager/categories/${selectedCategory.id}`, payload);
        alert('Cập nhật thành công');
      } else {
        await apiClient.post('/manager/categories', payload);
        alert('Tạo danh mục thành công');
      }
      setIsAddEditModalOpen(false);
      fetchCategories(currentPage);
    } catch (error) {
      console.error(error);
      alert('Lỗi lưu danh mục');
    }
  };

  const handleDelete = async () => {
    if (selectedCategory) {
      try {
        await apiClient.delete(`/manager/categories/${selectedCategory.id}`);
        alert('Xóa thành công');
        setIsDeleteModalOpen(false);
        fetchCategories(currentPage);
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
                Quản lý Danh mục
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Phân loại và tổ chức các nhóm sản phẩm bán hàng.</p>
            </div>
            <div className="flex gap-3">
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportExcel} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-variant transition-all active:scale-95 shadow-sm border border-outline-variant/30 text-sm font-bold">
                <FileUp size={18} /> NHẬP EXCEL
              </button>
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-[#107C41] text-white rounded-xl hover:bg-[#0B5A2F] transition-all active:scale-95 shadow-md shadow-[#107C41]/20 text-sm font-bold">
                <DownloadCloud size={18} /> XUẤT EXCEL
              </button>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-sm font-extrabold"
              >
                <PlusCircle size={18} />
                THÊM DANH MỤC
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">ID</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Tên Danh Mục</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Số lượng SP</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-6 py-5 font-mono text-sm font-bold text-outline">#{cat.id.toString().padStart(3, '0')}</td>
                      <td className="px-6 py-5 font-bold text-base text-on-surface">{cat.name}</td>
                      <td className="px-4 py-3 font-bold text-primary">
                        <button 
                          onClick={() => {
                            setViewingCategory(cat);
                            setIsProductsModalOpen(true);
                          }}
                          className="flex items-center gap-2 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Xem danh sách sản phẩm"
                        >
                          <Package size={18} />
                          <span>{cat.products} <span className="text-xs font-medium text-outline">sản phẩm</span></span>
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${cat.status === 'Hoạt động' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                          {cat.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setViewingCategory(cat);
                            setIsProductsModalOpen(true);
                          }}
                          className="p-2 text-outline hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Xem sản phẩm"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                        {isAdmin && (<button 
                          onClick={() => handleOpenDelete(cat)}
                          className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
            />
          </div>
        </main>

      {/* Add/Edit Modal */}
      <GenericModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={selectedCategory ? 'Sửa Danh mục Sản phẩm' : 'Thêm Danh mục mới'}
        icon={Grid}
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
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Tên danh mục</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              placeholder="VD: Thức ăn cho chó"
            />
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Hình ảnh danh mục</label>
            <div className="flex items-center gap-4">
              {formData.imageUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/50 shrink-0">
                  <img src={formData.imageUrl} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=No+Image"; }} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/50 flex items-center justify-center text-outline shrink-0">
                  <Grid size={24} />
                </div>
              )}
              <label className="flex-1 flex flex-col items-center justify-center h-16 border-2 border-dashed border-outline-variant/50 rounded-xl hover:bg-surface-container-low hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <PlusCircle size={18} />
                  <span>Tải ảnh lên</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData(prev => ({...prev, imageUrl: URL.createObjectURL(file)}));
                      const fd = new FormData();
                      fd.append('image', file);
                      try {
                        const res = await apiClient.post('/manager/upload', fd, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setFormData(prev => ({...prev, imageUrl: res.data.url}));
                      } catch (err) {
                        console.error(err);
                        alert('Lỗi upload ảnh');
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Trạng thái</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Đã ẩn">Đã ẩn</option>
            </select>
          </div>
        </div>
      </GenericModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        itemName={selectedCategory?.name}
        title="Xóa danh mục"
        message="Bạn có chắc chắn muốn xóa danh mục này? Điều này có thể ảnh hưởng đến các sản phẩm thuộc danh mục."
      />

      {/* View Products Modal */}
      <GenericModal
        isOpen={isProductsModalOpen}
        onClose={() => setIsProductsModalOpen(false)}
        title={`Sản phẩm: ${viewingCategory?.name}`}
        icon={Package}
        actions={
          <button 
            onClick={() => setIsProductsModalOpen(false)}
            className="px-6 py-2.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            Đóng
          </button>
        }
      >
        <div className="w-full max-h-[400px] overflow-y-auto custom-scrollbar">
          {viewingCategory && allProducts.filter(p => p.CategoryId === viewingCategory.id).length > 0 ? (
            <div className="space-y-3">
              {allProducts.filter(p => p.CategoryId === viewingCategory.id).map(prod => (
                <div key={prod.Id} className="flex items-center gap-4 p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
                  <div className="w-12 h-12 bg-surface-container-low rounded-lg overflow-hidden flex-shrink-0">
                    {prod.ImageUrl ? (
                      <img src={prod.ImageUrl} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={prod.Name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-outline">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{prod.Name}</p>
                    <p className="text-xs font-medium text-primary mt-1">{Number(prod.Price).toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-outline">
              <Package size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">Chưa có sản phẩm nào trong danh mục này.</p>
            </div>
          )}
        </div>
      </GenericModal>
    </div>
  );
};

export default CategoriesPage;
