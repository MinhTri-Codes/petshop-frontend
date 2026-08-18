import React, { useRef, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Ticket, PlusCircle, Edit, Trash2, Calendar, Save } from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import apiClient from '../apiClient';

const ManagerVouchersPage = () => {
  const searchInputRef = useRef(null);
  
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vRes, pRes, cRes] = await Promise.all([
        apiClient.get('/manager/vouchers'),
        apiClient.get('/manager/products'),
        apiClient.get('/manager/categories')
      ]);

      setVouchers(vRes.data.map(v => ({
        id: v.Id,
        code: v.Code,
        type: v.Type, // 'PERCENTAGE' or 'FIXED_AMOUNT'
        value: Number(v.Value),
        maxDiscount: v.MaxDiscount ? Number(v.MaxDiscount) : null,
        minOrder: Number(v.MinOrder),
        usageLimit: v.UsageLimit,
        usedCount: v.UsedCount,
        status: v.Status,
        expiryDate: v.ExpiryDate ? new Date(v.ExpiryDate).toISOString().split('T')[0] : '',
        applicableProducts: v.ApplicableProducts || [],
        applicableCategories: v.ApplicableCategories || [],
        applicability: (v.ApplicableProducts && v.ApplicableProducts.length > 0) ? 'PRODUCTS' :
                       (v.ApplicableCategories && v.ApplicableCategories.length > 0) ? 'CATEGORIES' : 'ALL'
      })));
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async () => {
    try {
      const res = await apiClient.get('/manager/vouchers');
      setVouchers(res.data.map(v => ({
        id: v.Id,
        code: v.Code,
        type: v.Type, // 'PERCENTAGE' or 'FIXED_AMOUNT'
        value: Number(v.Value),
        maxDiscount: v.MaxDiscount ? Number(v.MaxDiscount) : null,
        minOrder: Number(v.MinOrder),
        usageLimit: v.UsageLimit,
        usedCount: v.UsedCount,
        status: v.Status,
        expiryDate: v.ExpiryDate ? new Date(v.ExpiryDate).toLocaleDateString('vi-VN') : '',
        applicableProducts: v.ApplicableProducts || [],
        applicableCategories: v.ApplicableCategories || [],
        applicability: (v.ApplicableProducts && v.ApplicableProducts.length > 0) ? 'PRODUCTS' :
                       (v.ApplicableCategories && v.ApplicableCategories.length > 0) ? 'CATEGORIES' : 'ALL'
      })));
    } catch (error) {
      console.error(error);
    }
  };

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE',
    value: '',
    maxDiscount: '',
    minOrder: '0',
    usageLimit: '1',
    status: 'Đang chạy',
    expiryDate: '',
    applicability: 'ALL',
    applicableProducts: [],
    applicableCategories: []
  });

  const handleOpenAdd = () => {
    setFormData({ 
      code: '',
      type: 'PERCENTAGE',
      value: '',
      maxDiscount: '',
      minOrder: '0',
      usageLimit: '1',
      status: 'Đang chạy',
      expiryDate: '',
      applicability: 'ALL',
      applicableProducts: [],
      applicableCategories: []
    });
    setSelectedVoucher(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (voucher) => {
    setFormData({ 
      code: voucher.code,
      type: voucher.type || 'PERCENTAGE',
      value: voucher.value,
      maxDiscount: voucher.maxDiscount || '',
      minOrder: voucher.minOrder || '0',
      usageLimit: voucher.usageLimit || '1',
      status: voucher.status || 'Đang chạy',
      expiryDate: voucher.expiryDate,
      applicability: voucher.applicability || 'ALL',
      applicableProducts: voucher.applicableProducts || [],
      applicableCategories: voucher.applicableCategories || []
    });
    setSelectedVoucher(voucher);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (voucher) => {
    setSelectedVoucher(voucher);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minOrder: Number(formData.minOrder),
        usageLimit: Number(formData.usageLimit),
        status: formData.status,
        expiryDate: formData.expiryDate || null,
        applicableProducts: formData.applicability === 'PRODUCTS' ? formData.applicableProducts : null,
        applicableCategories: formData.applicability === 'CATEGORIES' ? formData.applicableCategories : null,
      };

      if (selectedVoucher) {
        await apiClient.put(`/manager/vouchers/${selectedVoucher.id}`, dataToSave);
      } else {
        await apiClient.post('/manager/vouchers', dataToSave);
      }
      fetchVouchers();
      setIsAddEditModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Lỗi khi lưu mã giảm giá!');
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedVoucher) {
      try {
        await apiClient.delete(`/manager/vouchers/${selectedVoucher.id}`);
        fetchVouchers();
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error(error);
        alert('Lỗi khi xóa mã giảm giá!');
      }
    }
  };

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm mã giảm giá..." />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
                <Ticket className="text-primary" size={32} />
                Mã giảm giá
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Tạo và quản lý các chương trình khuyến mãi.</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-sm font-extrabold"
            >
              <PlusCircle size={18} />
              TẠO MÃ MỚI
            </button>
          </div>

          {/* Vouchers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-10 text-center text-outline">Đang tải dữ liệu...</div>
            ) : vouchers.length === 0 ? (
              <div className="col-span-full py-10 text-center text-outline">Chưa có mã giảm giá nào.</div>
            ) : vouchers.map((voucher) => (
              <div key={voucher.id} className="bg-white border border-outline-variant/30 rounded-[24px] p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-primary/50 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex flex-col">
                    <span className="font-black text-2xl text-primary tracking-wider">{voucher.code}</span>
                    <span className="text-xs font-bold text-outline uppercase tracking-wider mt-1 flex items-center gap-1">
                      <Calendar size={12} /> HSD: {voucher.expiryDate || 'Không giới hạn'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    voucher.status === 'Đang chạy' ? 'bg-green-100 text-green-700' : 
                    voucher.status === 'Hết hạn' ? 'bg-gray-100 text-gray-500' : 
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {voucher.status}
                  </span>
                </div>
                
                <div className="space-y-2 py-4 border-y border-dashed border-outline-variant/50 relative z-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-medium">Giảm giá:</span>
                    <span className="font-bold text-on-surface">
                      {voucher.type === 'PERCENTAGE' ? `${voucher.value}%` : `${Number(voucher.value).toLocaleString('vi-VN')}đ`}
                      {voucher.type === 'PERCENTAGE' && voucher.maxDiscount ? ` (Tối đa ${Number(voucher.maxDiscount).toLocaleString('vi-VN')}đ)` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-medium">Đơn tối thiểu:</span>
                    <span className="font-bold text-on-surface">{Number(voucher.minOrder).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-outline font-medium">Đã dùng / Giới hạn:</span>
                    <span className="font-bold text-on-surface">{voucher.usedCount || 0} / {voucher.usageLimit || 0}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 relative z-10">
                  <button onClick={() => handleOpenEdit(voucher)} className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <Edit size={18} />
                  </button>
                  {isAdmin && (<button onClick={() => handleOpenDelete(voucher)} className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <GenericModal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={selectedVoucher ? "Chỉnh sửa Mã giảm giá" : "Tạo Mã giảm giá"}
        icon={Ticket}
        actions={
          <>
            <button onClick={() => setIsAddEditModalOpen(false)} className="px-6 py-2.5 font-bold text-outline hover:bg-surface-container-low rounded-xl transition-colors">
              Hủy
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95">
              <Save size={18} />
              Lưu thay đổi
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Mã Code (Tự viết hoa)</label>
            <input 
              type="text" 
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none uppercase font-bold"
              placeholder="VD: SALE10"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Loại giảm giá</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                <option value="PERCENTAGE">Theo phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Mức giảm</label>
              <input 
                type="number" 
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder={formData.type === 'PERCENTAGE' ? "VD: 10 (%)" : "VD: 50000 (VNĐ)"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Giảm tối đa (Tùy chọn)</label>
              <input 
                type="number" 
                disabled={formData.type === 'FIXED_AMOUNT'}
                value={formData.maxDiscount}
                onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none disabled:bg-surface-variant disabled:text-outline"
                placeholder="VD: 100000"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Đơn tối thiểu</label>
              <input 
                type="number" 
                value={formData.minOrder}
                onChange={(e) => setFormData({...formData, minOrder: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="VD: 200000"
              />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-outline-variant/30">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Phạm vi áp dụng</label>
              <select 
                value={formData.applicability}
                onChange={(e) => setFormData({...formData, applicability: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                <option value="ALL">Áp dụng cho toàn bộ Đơn hàng</option>
                <option value="PRODUCTS">Sản phẩm cụ thể</option>
                <option value="CATEGORIES">Danh mục cụ thể</option>
              </select>
            </div>

            {formData.applicability === 'PRODUCTS' && (
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Chọn sản phẩm</label>
                <input 
                  type="text" 
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full h-10 px-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-medium text-sm mb-2"
                />
                <div className="w-full h-40 p-2 bg-white border border-outline-variant/50 rounded-xl overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {products.filter(p => p.Name.toLowerCase().includes(productSearch.toLowerCase())).map(p => {
                    const isSelected = formData.applicableProducts.includes(p.Id);
                    return (
                      <label key={p.Id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, applicableProducts: [...formData.applicableProducts, p.Id]});
                            } else {
                              setFormData({...formData, applicableProducts: formData.applicableProducts.filter(id => id !== p.Id)});
                            }
                          }}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                        <span className="font-medium text-sm line-clamp-1">{p.Name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.applicability === 'CATEGORIES' && (
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Chọn danh mục</label>
                <input 
                  type="text" 
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Tìm kiếm danh mục..."
                  className="w-full h-10 px-4 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all outline-none font-medium text-sm mb-2"
                />
                <div className="w-full h-40 p-2 bg-white border border-outline-variant/50 rounded-xl overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {categories.filter(c => c.Name.toLowerCase().includes(categorySearch.toLowerCase())).map(c => {
                    const isSelected = formData.applicableCategories.includes(c.Id);
                    return (
                      <label key={c.Id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, applicableCategories: [...formData.applicableCategories, c.Id]});
                            } else {
                              setFormData({...formData, applicableCategories: formData.applicableCategories.filter(id => id !== c.Id)});
                            }
                          }}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                        <span className="font-medium text-sm line-clamp-1">{c.Name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Số lượt sử dụng</label>
              <input 
                type="number" 
                value={formData.usageLimit}
                onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="VD: 100"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Ngày hết hạn (Tùy chọn)</label>
              <input 
                type="date" 
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Trạng thái</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
            >
              <option value="Đang chạy">Đang chạy</option>
              <option value="Chờ kích hoạt">Chờ kích hoạt</option>
              <option value="Hết hạn">Hết hạn</option>
            </select>
          </div>
        </div>
      </GenericModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`mã ${selectedVoucher?.code}`}
        title="Xóa mã giảm giá"
        message="Bạn có chắc chắn muốn xóa mã giảm giá này không?"
      />
    </div>
  );
};

export default ManagerVouchersPage;
