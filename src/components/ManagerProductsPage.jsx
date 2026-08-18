import React, { useRef, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Package, PlusCircle, Edit, Trash2, Filter, Save, UploadCloud, DownloadCloud, FileUp, Plus, X, Search } from 'lucide-react';
import * as xlsx from 'xlsx';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';
import apiClient from '../apiClient';
const ManagerProductsPage = () => {
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleExportExcel = () => {
    const exportData = products.map(p => {
      const cat = categories.find(c => c.Id === p.categoryId);
      return {
        'Tên Sản Phẩm': p.name,
        'Danh Mục': cat ? cat.Name : 'Tất cả',
        'Giá Bán (VNĐ)': p.price,
        'Giá Gốc (VNĐ)': p.oldPrice || '',
        'Số Lượng Tồn': p.stock,
        'Mô Tả': p.description || '',
        'Link Ảnh': p.imageUrl || '',
        'Trạng Thái': p.isActive || 'Hoạt động',
        'Đối Tượng': p.targetPet || 'Tất cả'
      };
    });
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Products');
    xlsx.writeFile(wb, 'DanhSachSanPham.xlsx');
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json(ws);
        
        const errors = [];
        const importedProducts = [];

        data.forEach((row, index) => {
          const rowNum = index + 2; // Dòng 1 là tiêu đề
          const catName = row['Danh Mục'];
          const pName = row['Tên Sản Phẩm'];
          const price = row['Giá Bán (VNĐ)'];

          if (!pName) {
            errors.push(`Dòng ${rowNum}: Thiếu 'Tên Sản Phẩm'.`);
            return;
          }
          if (isNaN(Number(price)) || Number(price) < 0) {
            errors.push(`Dòng ${rowNum}: 'Giá Bán' cho sản phẩm '${pName}' không hợp lệ (phải là số >= 0).`);
            return;
          }

          let catId = null;
          if (catName && catName !== 'Tất cả') {
            const cat = categories.find(c => c.Name === catName);
            if (!cat) {
              errors.push(`Dòng ${rowNum}: Danh mục '${catName || 'Trống'}' không tồn tại trong hệ thống.`);
              return;
            }
            catId = cat.Id;
          }

          let stock = row['Số Lượng Tồn'];
          if (stock === undefined || stock === null || isNaN(Number(stock)) || Number(stock) < 0) {
            errors.push(`Dòng ${rowNum}: 'Số Lượng Tồn' không hợp lệ (phải là số >= 0).`);
            return;
          }

          let targetPetId = null;
          const targetStr = row['Đối Tượng'];
          if (targetStr && targetStr !== 'Tất cả') {
            const sp = species.find(s => s.Name === targetStr);
            if (sp) {
              targetPetId = sp.Id;
            } else {
              errors.push(`Dòng ${rowNum}: 'Đối Tượng' là '${targetStr}' không tồn tại (hợp lệ: tên Loài hoặc 'Tất cả').`);
              return;
            }
          }

          importedProducts.push({
            Name: pName,
            CategoryId: catId,
            Price: price,
            OldPrice: row['Giá Gốc (VNĐ)'],
            StockQuantity: stock,
            Description: row['Mô Tả'],
            ImageUrl: row['Link Ảnh'],
            IsActive: row['Trạng Thái'] || 'Hoạt động',
            TargetPetId: targetPetId
          });
        });

        if (errors.length > 0) {
          alert('LỖI DỮ LIỆU TỪ FILE EXCEL:\n\n' + errors.join('\n') + '\n\nVui lòng sửa lại file và thử lại.');
          setLoading(false);
          e.target.value = null;
          return;
        }

        if (importedProducts.length === 0) {
          alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
          setLoading(false);
          e.target.value = null;
          return;
        }

        setLoading(true);
        const res = await apiClient.post('/manager/products/bulk', { products: importedProducts });
        alert(res.data.message + ` (Đã chèn: ${res.data.inserted}, Đã cập nhật: ${res.data.updated})`);
        fetchProducts(currentPage);
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi nhập file Excel!');
      } finally {
        setLoading(false);
        e.target.value = null; // reset input
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [debouncedSearch, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/customer/categories-breeds');
      setCategories(res.data.categories);
      setSpecies(res.data.species);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/manager/products?page=${page}&limit=10&search=${debouncedSearch}&category=${categoryFilter}`);
      setProducts((res.data.data || res.data || []).map(p => ({
        id: p.Id,
        categoryId: p.CategoryId,
        name: p.Name,
        sku: p.Slug, // map Slug to SKU for UI
        category: p.CategoryName || 'Khác',
        price: Number(p.Price),
        oldPrice: p.OldPrice ? Number(p.OldPrice) : null,
        stock: p.StockQuantity,
        targetPetId: p.TargetPetId || '',
        targetPet: p.TargetPetName || 'Tất cả',
        image: p.ImageUrl || 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=100&h=100',
        imageUrl: p.ImageUrl,
        images: p.Images ? JSON.parse(p.Images) : [],
        description: p.Description
      })));
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Image preview state
  const [imagePreview, setImagePreview] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    price: '',
    oldPrice: '',
    stock: '',
    targetPetId: '',
    image: '',
    images: [],
    description: ''
  });

  const handleOpenAdd = () => {
    setFormData({ 
      name: '', 
      sku: '', 
      categoryId: categories.length > 0 ? categories[0].Id : '', 
      price: '', 
      oldPrice: '',
      stock: '', 
      targetPetId: '', 
      image: '',
      images: [],
      description: ''
    });
    setImagePreview('');
    setSelectedProduct(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setFormData({ 
      ...product,
      categoryId: product.categoryId || (categories.length > 0 ? categories[0].Id : '')
    });
    setImagePreview(product.image);
    setSelectedProduct(product);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setImagePreview(tempUrl);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      try {
        const res = await apiClient.post('/manager/upload', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData(prev => ({ ...prev, image: res.data.url }));
        setImagePreview(res.data.url);
      } catch (error) {
        console.error(error);
        alert('Lỗi khi upload ảnh');
      }
    }
  };

  const handleMultipleImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (formData.images.length + files.length > 5) {
        return alert('Chỉ được upload tối đa 5 ảnh phụ.');
      }
      const formDataUpload = new FormData();
      files.forEach(file => formDataUpload.append('images', file));
      try {
        const res = await apiClient.post('/manager/upload-multiple', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData(prev => ({ ...prev, images: [...prev.images, ...res.data.urls] }));
      } catch (error) {
        console.error(error);
        alert('Lỗi khi upload ảnh');
      }
    }
  };

  const handleRemoveGalleryImage = (index) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  const handleSave = async () => {
    const numericData = {
      name: formData.name,
      slug: formData.sku, 
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      price: Number(formData.price),
      oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
      stockQuantity: Number(formData.stock),
      description: formData.description || '',
      targetPetId: formData.targetPetId,
      imageUrl: formData.image || 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&q=80&w=100&h=100',
      images: JSON.stringify(formData.images)
    };

    try {
      if (selectedProduct) {
        await apiClient.put(`/manager/products/${selectedProduct.id}`, numericData);
      } else {
        await apiClient.post('/manager/products', numericData);
      }
      fetchProducts(currentPage);
      setIsAddEditModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Lỗi lưu sản phẩm');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProduct) {
      try {
        await apiClient.delete(`/manager/products/${selectedProduct.id}`);
        fetchProducts(currentPage);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error(error);
        alert('Lỗi xóa sản phẩm');
      }
    }
  };

  const filteredProducts = products; // Server side filtering applies
  
    return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
                <Package className="text-primary" size={32} />
                Quản lý Sản phẩm
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Cập nhật thông tin hàng hóa, giá bán và tồn kho.</p>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0 flex-wrap">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-outline" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 bg-white border border-outline-variant/50 text-on-surface rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm font-medium text-sm"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white border border-outline-variant/50 text-on-surface rounded-xl px-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm font-bold text-sm"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(c => (
                  <option key={c.Id} value={c.Id}>{c.Name}</option>
                ))}
              </select>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImportExcel}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-variant transition-all active:scale-95 shadow-sm border border-outline-variant/30 text-sm font-bold"
                >
                  <FileUp size={18} />
                  NHẬP EXCEL
                </button>
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#107C41] text-white rounded-xl hover:bg-[#0B5A2F] transition-all active:scale-95 shadow-md shadow-[#107C41]/20 text-sm font-bold"
                >
                  <DownloadCloud size={18} />
                  XUẤT EXCEL
                </button>
                <button 
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-sm font-extrabold"
                >
                  <PlusCircle size={18} />
                  THÊM SẢN PHẨM
                </button>
              </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider w-20">Ảnh</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Thông tin Sản phẩm</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Danh mục & Thú cưng</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Giá bán</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Tồn kho</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {loading ? (
                    <tr><td colSpan="6" className="text-center py-10">Đang tải dữ liệu...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-10">Chưa có sản phẩm nào</td></tr>
                  ) : (
                    filteredProducts.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors group">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-low overflow-hidden border border-outline-variant/30">
                            <img src={item.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{item.name}</p>
                          <p className="text-[11px] font-medium text-outline mt-0.5">SKU: {item.sku}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-sm text-on-surface-variant">{item.category}</p>
                          <p className="text-[11px] font-bold text-primary mt-0.5 bg-primary/10 inline-block px-2 py-0.5 rounded uppercase tracking-wider">Dành cho: {item.targetPet}</p>
                        </td>
                        <td className="px-6 py-4 font-black text-[15px] text-primary">{Number(item.price).toLocaleString('vi-VN')}đ</td>
                        <td className="px-6 py-4">
                          {item.stock > 0 ? (
                            <span className="font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-lg text-xs">{item.stock}</span>
                          ) : (
                            <span className="font-bold text-error bg-error/10 px-2.5 py-1 rounded-lg text-xs">Hết hàng</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          {isAdmin && (<button 
                            onClick={() => handleOpenDelete(item)}
                            className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>)}
                        </td>
                      </tr>
                    ))
                  )}
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
        title={selectedProduct ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm mới"}
        icon={Package}
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
            <label className="font-bold text-sm text-on-surface">Tên sản phẩm</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              placeholder="Nhập tên sản phẩm..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Mã SKU</label>
              <input 
                type="text" 
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="VD: RC-PD-01"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Danh mục</label>
              <select 
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              >
                {categories.map(c => (
                  <option key={c.Id} value={c.Id}>{c.Name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Dành cho (Thú cưng)</label>
            <select 
              value={formData.targetPetId}
              onChange={(e) => setFormData({...formData, targetPetId: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
            >
              <option value="">Tất cả</option>
              {species.map(s => (
                <option key={s.Id} value={s.Id}>{s.Name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Giá bán (VNĐ)</label>
              <input 
                type="number" 
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Giá gốc (VNĐ)</label>
              <input 
                type="number" 
                value={formData.oldPrice || ''}
                onChange={(e) => setFormData({...formData, oldPrice: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Tồn kho</label>
              <input 
                type="number" 
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="0"
              />
            </div>
          </div>
          

          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Mô tả sản phẩm</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full h-32 p-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none resize-none"
              placeholder="Nhập mô tả chi tiết..."
            />
          </div>


          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Hình ảnh chính (Thumbnail)</label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/50 shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/50 flex items-center justify-center text-outline shrink-0">
                  <Package size={24} />
                </div>
              )}
              <label className="flex-1 flex flex-col items-center justify-center h-16 border-2 border-dashed border-outline-variant/50 rounded-xl hover:bg-surface-container-low hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <UploadCloud size={18} />
                  <span>Chọn ảnh chính</span>
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

          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Hình ảnh phụ (Tối đa 5 ảnh)</label>
            <div className="flex flex-wrap gap-4">
              {formData.images.map((imgUrl, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/50 shrink-0 group">
                  <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveGalleryImage(idx)}
                    className="absolute top-1 right-1 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {formData.images.length < 5 && (
                <label className="w-16 h-16 rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant/50 flex items-center justify-center text-primary cursor-pointer hover:border-primary/50 transition-all">
                  <Plus size={20} />
                  <input 
                    type="file" 
                    accept="image/*"
                    multiple
                    onChange={handleMultipleImagesChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

        </div>
      </GenericModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedProduct?.name}
        title="Xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default ManagerProductsPage;
