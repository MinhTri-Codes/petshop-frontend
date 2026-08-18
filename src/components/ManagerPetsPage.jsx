import React, { useRef, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Dog, Cat, Bird, Fish, Rabbit, Rat, PlusCircle, Edit, Trash2, Heart, Filter, MoreHorizontal, Save, DownloadCloud, FileUp, Plus, X, Search } from 'lucide-react';
import * as xlsx from 'xlsx';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';
import apiClient from '../apiClient';

const ManagerPetsPage = () => {
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [speciesFilter, setSpeciesFilter] = useState('');
  const [breedFilter, setBreedFilter] = useState('');
  const [pets, setPets] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleExportExcel = () => {
    const exportData = pets.map(p => {
      return {
        'Tên Thú Cưng': p.name || '',
        'Loài': p.speciesName || '',
        'Giống': p.breedName || '',
        'Tuổi': p.age || '',
        'Giới Tính': p.gender || '',
        'Giá Bán (VNĐ)': p.price || 0,
        'Giá Gốc (VNĐ)': p.oldPrice || '',
        'Tiêm Chủng': p.vaccine || '',
        'Trạng Thái': p.status || 'Đang tìm chủ',
        'Link Ảnh': p.imageUrl || '',
        'Mô Tả': p.description || '',
        'Link Ảnh Phụ': p.images && Array.isArray(p.images) ? p.images.join(', ') : ''
      };
    });
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Pets');
    xlsx.writeFile(wb, 'DanhSachThuCung.xlsx');
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
          const pName = row['Tên Thú Cưng'];
          const price = row['Giá Bán (VNĐ)'];
          const spName = row['Loài'];
          const brName = row['Giống'];

          if (!pName) { errors.push(`Dòng ${rowNum}: Thiếu 'Tên Thú Cưng'.`); return; }
          if (isNaN(Number(price)) || Number(price) < 0) { 
            errors.push(`Dòng ${rowNum}: 'Giá Bán' không hợp lệ (phải là số >= 0).`); 
            return; 
          }
          const oldPrice = row['Giá Gốc (VNĐ)'];
          if (oldPrice !== undefined && oldPrice !== null && oldPrice !== '' && (isNaN(Number(oldPrice)) || Number(oldPrice) < 0)) {
            errors.push(`Dòng ${rowNum}: 'Giá Gốc' không hợp lệ (phải là số >= 0).`); 
            return; 
          }
          
          const species = speciesList.find(s => s.Name === spName);
          if (!species) { errors.push(`Dòng ${rowNum}: Loài '${spName || 'Trống'}' không tồn tại.`); return; }
          
          const breed = species.Breeds.find(b => b.Name === brName);
          if (!breed) { errors.push(`Dòng ${rowNum}: Giống '${brName || 'Trống'}' không tồn tại trong loài ${spName}.`); return; }

          const validStatuses = ['Đang tìm chủ', 'Đã bán', 'Đang bệnh'];
          let status = row['Trạng Thái'] || 'Đang tìm chủ';
          if (!validStatuses.includes(status)) {
            errors.push(`Dòng ${rowNum}: Trạng thái '${status}' không hợp lệ (chỉ chấp nhận 'Đang tìm chủ', 'Đã bán' hoặc 'Đang bệnh').`);
            return;
          }

          const validGenders = ['Đực', 'Cái', 'Không xác định'];
          let gender = row['Giới Tính'] || 'Không xác định';
          if (!validGenders.includes(gender)) {
            errors.push(`Dòng ${rowNum}: Giới tính '${gender}' không hợp lệ (chỉ chấp nhận 'Đực', 'Cái' hoặc 'Không xác định').`);
            return;
          }

          imported.push({
            Name: pName,
            BreedId: breed.Id,
            Age: row['Tuổi'],
            Gender: gender,
            Price: price,
            OldPrice: row['Giá Gốc (VNĐ)'],
            Vaccine: row['Tiêm Chủng'],
            Status: status,
            ImageUrl: row['Link Ảnh'],
            Description: row['Mô Tả'] || '',
            Images: row['Link Ảnh Phụ'] ? JSON.stringify(row['Link Ảnh Phụ'].split(',').map(s => s.trim()).filter(Boolean)) : '[]'
          });
        });

        if (errors.length > 0) {
          alert('LỖI DỮ LIỆU TỪ FILE EXCEL:\n\n' + errors.join('\n'));
          e.target.value = null; return;
        }
        if (imported.length === 0) {
          alert('Không tìm thấy dữ liệu hợp lệ.'); e.target.value = null; return;
        }

        const res = await apiClient.post('/manager/pets/bulk', { pets: imported });
        alert(res.data.message + ` (Đã chèn: ${res.data.inserted}, Đã cập nhật: ${res.data.updated})`);
        fetchPets(currentPage);
    } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi nhập file Excel!');
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  useEffect(() => {
    fetchPets(currentPage);
  }, [currentPage]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchPets(1);
  }, [debouncedSearch, speciesFilter, breedFilter]);

  const fetchFilters = async () => {
    try {
      const res = await apiClient.get('/customer/categories-breeds');
      setSpeciesList(res.data.species);
    } catch (err) {
      console.error('Lỗi khi tải filter:', err);
    }
  }

  const fetchPets = async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/manager/pets?page=${page}&limit=10&search=${debouncedSearch}&species=${speciesFilter}&breed=${breedFilter}`);
setPets(res.data.data.map(p => ({
        id: p.Id,
        name: p.Name,
        speciesId: p.SpeciesId,
        speciesName: p.SpeciesName || 'Khác', 
        breedId: p.BreedId,
        breedName: p.BreedName || 'Khác',
        age: p.Age,
        gender: p.Gender,
        price: Number(p.Price),
        oldPrice: p.OldPrice ? Number(p.OldPrice) : null,
        status: p.Status,
        vaccine: p.Vaccine,
        imageUrl: p.ImageUrl,
        image: p.ImageUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100&h=100',
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
  const [selectedPet, setSelectedPet] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    speciesId: '',
    breedId: '',
    age: '',
    gender: 'Đực',
    price: '',
    oldPrice: '',
    status: 'Đang tìm chủ',
    vaccine: 'Chưa tiêm',
    image: '',
    images: [],
    description: ''
  });

  const [availableBreeds, setAvailableBreeds] = useState([]);

  // Handle cascading dropdowns
  useEffect(() => {
    if (speciesList.length > 0 && formData.speciesId) {
      const speciesObj = speciesList.find(s => s.Id.toString() === formData.speciesId.toString());
      const breeds = speciesObj ? speciesObj.Breeds : [];
      setAvailableBreeds(breeds);
      
      // Auto-select first breed if current breed is not in the list
      if (breeds.length > 0 && !breeds.some(b => b.Id.toString() === formData.breedId.toString())) {
        setFormData(prev => ({ ...prev, breedId: breeds[0].Id.toString() }));
      } else if (breeds.length === 0) {
        setFormData(prev => ({ ...prev, breedId: '' }));
      }
    } else {
      setAvailableBreeds([]);
    }
  }, [formData.speciesId, speciesList]);

  const filteredPets = pets;

  const getSpeciesIcon = (speciesName) => {
    switch (speciesName) {
      case 'Chó': return <Dog size={14} className="inline mr-1"/>;
      case 'Mèo': return <Cat size={14} className="inline mr-1"/>;
      case 'Chim': return <Bird size={14} className="inline mr-1"/>;
      case 'Cá': return <Fish size={14} className="inline mr-1"/>;
      case 'Thỏ': return <Rabbit size={14} className="inline mr-1"/>;
      case 'Chuột Hamster': return <Rat size={14} className="inline mr-1"/>;
      default: return <MoreHorizontal size={14} className="inline mr-1"/>;
    }
  };

  const handleOpenAdd = () => {
    const initialSpeciesId = speciesList.length > 0 ? speciesList[0].Id.toString() : '';
    setFormData({ 
      name: '', 
      speciesId: initialSpeciesId, 
      breedId: '', 
      age: '', 
      gender: 'Đực', 
      price: '', 
      oldPrice: '',
      status: 'Đang tìm chủ', 
      vaccine: 'Chưa tiêm', 
      image: '',
      images: [],
      description: '' 
    });
    setSelectedPet(null);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (pet) => {
    setFormData({ 
      name: pet.name || '',
      speciesId: pet.speciesId ? pet.speciesId.toString() : (speciesList.length > 0 ? speciesList[0].Id.toString() : ''),
      breedId: pet.breedId ? pet.breedId.toString() : '',
      age: pet.age || '',
      gender: pet.gender || 'Đực',
      price: pet.price || '',
      oldPrice: pet.oldPrice || '',
      status: pet.status || 'Đang tìm chủ',
      vaccine: pet.vaccine || 'Chưa tiêm',
      image: pet.image || '',
      images: pet.images || [],
      description: pet.description || ''
    });
    setSelectedPet(pet);
    setIsAddEditModalOpen(true);
  };

  const handleOpenDelete = (pet) => {
    setSelectedPet(pet);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
    const numericData = {
      name: formData.name,
      breedId: formData.breedId ? Number(formData.breedId) : null,
      age: formData.age,
      gender: formData.gender,
      price: Number(formData.price),
      oldPrice: formData.oldPrice ? Number(formData.oldPrice) : null,
      vaccine: formData.vaccine,
      status: formData.status,
      imageUrl: formData.image || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100&h=100',
      description: formData.description || '',
      images: JSON.stringify(formData.images)
    };

    try {
      if (selectedPet) {
        await apiClient.put(`/manager/pets/${selectedPet.id}`, numericData);
      } else {
        await apiClient.post('/manager/pets', numericData);
      }
      fetchPets(currentPage);
    setIsAddEditModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Lỗi lưu thú cưng');
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

  const handleDeleteConfirm = async () => {
    if (selectedPet) {
      try {
        await apiClient.delete(`/manager/pets/${selectedPet.id}`);
        fetchPets(currentPage);
        setIsDeleteModalOpen(false);
      } catch (error) {
        console.error(error);
        alert('Lỗi xóa thú cưng');
      }
    }
  };

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
                <Dog className="text-primary" size={32} />
                Quản lý Thú cưng
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Cập nhật hồ sơ, tình trạng sức khỏe và giá bán.</p>
            </div>
            <div className="flex gap-3 mt-4 lg:mt-0 flex-wrap">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-outline" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm thú cưng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 bg-white border border-outline-variant/50 text-on-surface rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm font-medium text-sm"
                />
              </div>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportExcel} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-variant transition-all active:scale-95 shadow-sm border border-outline-variant/30 text-sm font-bold">
                <FileUp size={18} /> NHẬP EXCEL
              </button>
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-[#107C41] text-white rounded-xl hover:bg-[#0B5A2F] transition-all active:scale-95 shadow-md shadow-[#107C41]/20 text-sm font-bold">
                <DownloadCloud size={18} /> XUẤT EXCEL
              </button>
              <select 
                value={speciesFilter}
                onChange={(e) => setSpeciesFilter(e.target.value === 'all' ? '' : e.target.value)}
                className="px-4 py-2.5 bg-white border border-outline-variant/50 text-on-surface rounded-xl hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm font-bold text-sm cursor-pointer"
              >
                <option value="all">Tất cả giống loài</option>
                {speciesList.map(s => (
                  <option key={s.Id} value={s.Id}>{s.Name}</option>
                ))}
              </select>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-sm font-extrabold"
              >
                <PlusCircle size={18} />
                THÊM THÚ CƯNG
              </button>
            </div>
          </div>

          {/* Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
              <div key={pet.id} className="bg-white border border-outline-variant/30 rounded-3xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                {pet.status === 'Đã bán' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                )}
                
                {/* Species Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <span className="bg-white/90 backdrop-blur-sm text-primary text-[10px] font-black px-2 py-1 rounded-lg border border-primary/20 shadow-sm flex items-center">
                    {getSpeciesIcon(pet.speciesName)} {pet.speciesName}
                  </span>
                </div>
                
                <div className="flex gap-4 relative z-10">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                    <img src={pet.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt={pet.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${pet.status === 'Đã bán' ? 'grayscale opacity-70' : ''}`} />
                  </div>
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-lg text-on-surface leading-tight">{pet.name || pet.breedName}</h3>
                      <p className="text-sm font-semibold text-primary">{pet.breedName}</p>
                      <p className="text-xs font-semibold text-outline mt-1">{pet.gender} • {pet.age}</p>
                      <p className="text-xs font-semibold text-outline mt-0.5 flex items-center gap-1">
                        <Heart size={12} className="text-primary" /> Tiêm: {pet.vaccine}
                      </p>
                    </div>
                    <p className="font-black text-primary text-lg">{Number(pet.price).toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30 relative z-10">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${pet.status === 'Đang tìm chủ' ? 'bg-orange-100 text-orange-700' : (pet.status === 'Đang bệnh' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500')}`}>
                    {pet.status}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(pet)}
                      className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    {isAdmin && (<button 
                      onClick={() => handleOpenDelete(pet)}
                      className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>)}
                  </div>
                </div>
              </div>
            ))}
            {filteredPets.length === 0 && !loading && (
              <div className="col-span-full py-10 text-center text-outline">
                Không tìm thấy thú cưng nào.
              </div>
            )}
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
        title={selectedPet ? "Chỉnh sửa Thú cưng" : "Thêm Thú cưng mới"}
        icon={Dog}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Loài</label>
              <select 
                value={formData.speciesId}
                onChange={(e) => setFormData({...formData, speciesId: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                {speciesList.map(s => (
                  <option key={s.Id} value={s.Id}>{s.Name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Giống</label>
              <select 
                value={formData.breedId}
                onChange={(e) => setFormData({...formData, breedId: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
                disabled={availableBreeds.length === 0}
              >
                {availableBreeds.length > 0 ? (
                  availableBreeds.map(b => <option key={b.Id} value={b.Id}>{b.Name}</option>)
                ) : (
                  <option value="">Không có giống</option>
                )}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Tên gọi (Nếu có)</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              placeholder="Ví dụ: Bé Na, Cậu Vàng..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Tuổi</label>
              <input 
                type="text" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="Ví dụ: 2 tháng"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-sm text-on-surface">Giới tính</label>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                <option value="Đực">Đực</option>
                <option value="Cái">Cái</option>
                <option value="Không xác định">Không xác định</option>
              </select>
            </div>
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
              <label className="font-bold text-sm text-on-surface">Tiêm phòng</label>
              <input 
                type="text" 
                value={formData.vaccine}
                onChange={(e) => setFormData({...formData, vaccine: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
                placeholder="Ví dụ: 2 mũi"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="font-bold text-sm text-on-surface">Trạng thái</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
              >
                <option value="Đang tìm chủ">Đang tìm chủ</option>
                <option value="Đã bán">Đã bán</option>
                <option value="Đang bệnh">Đang bệnh</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Mô tả thú cưng</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full h-32 p-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none resize-none"
              placeholder="Nhập giới thiệu chi tiết về bé..."
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Hình ảnh thú cưng</label>
            <div className="flex items-center gap-4">
              {formData.image ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/50 shrink-0">
                  <img src={formData.image || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/50 flex items-center justify-center text-outline shrink-0">
                  <Dog size={24} />
                </div>
              )}
              <label className="flex-1 flex flex-col items-center justify-center h-16 border-2 border-dashed border-outline-variant/50 rounded-xl hover:bg-surface-container-low hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <PlusCircle size={18} />
                  <span>Chọn ảnh chính</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Hiện tạm
                      setFormData(prev => ({...prev, image: URL.createObjectURL(file)}));
                      // Upload lên server
                      const fd = new FormData();
                      fd.append('image', file);
                      try {
                        const res = await apiClient.post('/manager/upload', fd, {
                          headers: { 'Content-Type': 'multipart/form-data' }
                        });
                        setFormData(prev => ({...prev, image: res.data.url}));
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
        itemName={selectedPet?.name || selectedPet?.breedName}
        title="Xóa thú cưng"
        message="Bạn có chắc chắn muốn xóa hồ sơ thú cưng này? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default ManagerPetsPage;
