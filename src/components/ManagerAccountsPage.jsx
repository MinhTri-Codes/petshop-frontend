import React, { useRef, useEffect, useState } from 'react';
import { 
  Users, Shield, ShieldOff, Search, Lock, Unlock, Edit3, Trash2, Save
} from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import apiClient from '../apiClient';

const ManagerAccountsPage = () => {
  const searchInputRef = useRef(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tất cả vai trò');
  
  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER',
    status: 'Hoạt động'
  });

  const fetchAccounts = async () => {
    try {
      const res = await apiClient.get('/manager/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
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
      name: '', 
      email: '', 
      phone: '',
      password: '',
      role: 'CUSTOMER', 
      status: 'Hoạt động' 
    });
    setSelectedAccount(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (account) => {
    setFormData({ 
      name: account.FullName, 
      email: account.Email, 
      phone: account.PhoneNumber || '',
      password: '',
      role: account.Role, 
      status: account.IsActive ? 'Hoạt động' : 'Bị khóa' 
    });
    setSelectedAccount(account);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (account) => {
    setSelectedAccount(account);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedAccount) {
        await apiClient.put(`/manager/accounts/${selectedAccount.Id}`, {
          fullName: formData.name,
          role: formData.role,
          isActive: formData.status === 'Hoạt động'
        });
        alert('Cập nhật thành công');
      } else {
        await apiClient.post(`/manager/accounts`, {
          fullName: formData.name,
          email: formData.email,
          phoneNumber: formData.phone,
          password: formData.password,
          role: formData.role
        });
        alert('Tạo tài khoản thành công');
      }
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Lỗi khi lưu tài khoản');
    }
    setIsAddEditModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedAccount) {
      try {
        await apiClient.delete(`/manager/accounts/${selectedAccount.Id}`);
        alert('Xóa thành công');
        fetchAccounts();
      } catch (err) {
        console.error(err);
        alert('Lỗi khi xóa tài khoản');
      }
    }
    setIsDeleteModalOpen(false);
  };

  const toggleStatus = async (account) => {
    try {
      await apiClient.put(`/manager/accounts/${account.Id}`, {
        fullName: account.FullName,
        role: account.Role,
        isActive: !account.IsActive
      });
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi thay đổi trạng thái');
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.FullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          acc.Email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'Tất cả vai trò' || acc.Role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm kiếm tài khoản (F1)..." />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Quản lý Tài khoản</h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Phân quyền, khóa hoặc tạo mới tài khoản người dùng.</p>
            </div>
            <button 
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md text-sm font-extrabold"
            >
              <Users size={18} />
              Tạo tài khoản mới
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[280px] relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" />
              <input 
                className="w-full h-11 pl-11 pr-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 text-sm font-medium transition-all shadow-sm outline-none" 
                placeholder="Tìm theo tên, email..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white border border-outline-variant/50 rounded-xl text-sm font-semibold px-4 h-11 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm outline-none"
            >
              <option value="Tất cả vai trò">Tất cả vai trò</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CASHIER">CASHIER</option>
              <option value="SHIPPER">SHIPPER</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
          </div>

          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Ngày tham gia</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredAccounts.map((account) => (
                    <tr key={account.Id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 uppercase">
                            {account.FullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-on-surface">{account.FullName}</div>
                            <div className="text-xs font-medium text-outline">{account.Email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${account.Role === 'ADMIN' ? 'bg-error-container text-on-error-container' : account.Role === 'CASHIER' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-outline'}`}>
                          {account.Role === 'ADMIN' ? <Shield size={14} /> : account.Role === 'CASHIER' ? <ShieldOff size={14} /> : <Users size={14} />}
                          {account.Role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${account.IsActive ? 'bg-green-100 text-green-700' : 'bg-error-container text-on-error-container'}`}>
                          {account.IsActive ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-outline">{new Date(account.CreatedAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button 
                          onClick={() => handleOpenEdit(account)}
                          className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={18} />
                        </button>
                        {account.IsActive ? (
                          <button 
                            onClick={() => toggleStatus(account)}
                            className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors" 
                            title="Khóa tài khoản"
                          >
                            <Lock size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => toggleStatus(account)}
                            className="p-2 text-outline hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors" 
                            title="Mở khóa"
                          >
                            <Unlock size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenDelete(account)}
                          className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors" 
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {accounts.length === 0 && !loading && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-outline">Không tìm thấy tài khoản nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      <GenericModal 
        isOpen={isAddEditModalOpen} 
        onClose={() => setIsAddEditModalOpen(false)}
        title={selectedAccount ? "Chỉnh sửa tài khoản" : "Thêm tài khoản mới"}
        icon={Users}
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
              <label className="font-bold text-sm text-on-surface">Họ và tên</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="Nhập tên người dùng..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  disabled={!!selectedAccount}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full h-11 px-4 border border-outline-variant/50 rounded-xl transition-all outline-none ${selectedAccount ? 'bg-surface-container-low text-outline cursor-not-allowed' : 'bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50'}`}
                  placeholder="Email..."
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Số điện thoại</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  disabled={!!selectedAccount}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`w-full h-11 px-4 border border-outline-variant/50 rounded-xl transition-all outline-none ${selectedAccount ? 'bg-surface-container-low text-outline cursor-not-allowed' : 'bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/50'}`}
                  placeholder="Số điện thoại..."
                />
              </div>
            </div>
            {!selectedAccount && (
              <div className="space-y-2">
                <label className="font-bold text-sm text-on-surface">Mật khẩu</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Vai trò</label>
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="CASHIER">CASHIER</option>
                <option value="SHIPPER">SHIPPER</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Trạng thái</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                <option value="Hoạt động">Hoạt động</option>
                <option value="Bị khóa">Bị khóa</option>
              </select>
            </div>
          </div>
        </div>
      </GenericModal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={selectedAccount?.FullName}
        title="Xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản này? Hành động này sẽ xóa toàn bộ dữ liệu liên quan và không thể hoàn tác."
      />
    </div>
  );
};

export default ManagerAccountsPage;
