import React, { useRef, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PawPrint, PlusCircle, Edit, Trash2, ChevronDown, CheckCircle2, XCircle, Save, DownloadCloud, FileUp } from 'lucide-react';
import * as xlsx from 'xlsx';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import GenericModal from './GenericModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Pagination from './Pagination';
import apiClient from '../apiClient';

const SpeciesPage = () => {
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const [speciesData, setSpeciesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleExportExcel = () => {
    const exportData = [];
    speciesData.forEach(sp => {
      if (sp.breeds && sp.breeds.length > 0) {
        sp.breeds.forEach(br => {
          exportData.push({ 'Loài': sp.name, 'Giống': br.Name });
        });
      } else {
        exportData.push({ 'Loài': sp.name, 'Giống': '' });
      }
    });
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Species_Breeds');
    xlsx.writeFile(wb, 'DanhSachGiongLoai.xlsx');
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
        
        const imported = data.map(row => ({
          SpeciesName: row['Loài'],
          BreedName: row['Giống'] || ''
        })).filter(r => r.SpeciesName);

        if (imported.length === 0) {
          alert('Không tìm thấy dữ liệu hợp lệ (Cột "Loài" trống).'); e.target.value = null; return;
        }

        const res = await apiClient.post('/manager/species-breeds/bulk', { data: imported });
        alert(res.data.message + ` (Đã thêm: ${res.data.inserted})`);
        fetchSpecies(currentPage);
    } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi nhập file Excel!');
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  // Modal states
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [isBreedModalOpen, setIsBreedModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewBreedsModalOpen, setIsViewBreedsModalOpen] = useState(false);
  const [isEditBreedModalOpen, setIsEditBreedModalOpen] = useState(false);
  const [editingBreed, setEditingBreed] = useState(null);
  
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [viewingSpecies, setViewingSpecies] = useState(null);

  // Form states
  const [speciesForm, setSpeciesForm] = useState({ name: '', status: 'Hoạt động' });
  const [breedForm, setBreedForm] = useState({ speciesId: '', breedName: '' });

  useEffect(() => {
    fetchSpecies(currentPage);
  }, [currentPage]);

  const fetchSpecies = async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/manager/species?page=${page}&limit=10`);
      const mapped = (res.data.data || res.data || []).map(s => ({
        id: s.Id,
        name: s.Name,
        status: s.Status,
        totalBreeds: s.breedsFull ? s.breedsFull.length : 0,
        breeds: s.breedsFull || []
      }));
      setSpeciesData(mapped);
      setTotalPages(res.data.pagination?.totalPages || 1);
      
      if (viewingSpecies) {
        const updatedViewing = mapped.find(s => s.id === viewingSpecies.id);
        if (updatedViewing) setViewingSpecies(updatedViewing);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách loài:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddSpecies = () => {
    setSpeciesForm({ name: '', status: 'Hoạt động' });
    setSelectedSpecies(null);
    setIsSpeciesModalOpen(true);
  };

  const handleOpenEditSpecies = (species) => {
    setSpeciesForm({ name: species.name, status: species.status });
    setSelectedSpecies(species);
    setIsSpeciesModalOpen(true);
  };

  const handleOpenAddBreed = () => {
    setBreedForm({ speciesId: speciesData[0]?.id || '', breedName: '', status: 'Hoạt động' });
    setIsBreedModalOpen(true);
  };

  const handleOpenDelete = (species) => {
    setSelectedSpecies(species);
    setIsDeleteModalOpen(true);
  };

  const handleOpenViewBreeds = (species) => {
    setViewingSpecies(species);
    setIsViewBreedsModalOpen(true);
  };

  const handleOpenEditBreed = (breed, speciesId) => {
    setEditingBreed(breed);
    setBreedForm({ speciesId: speciesId, breedName: breed.Name, status: breed.Status || 'Hoạt động' });
    setIsEditBreedModalOpen(true);
  };

  const handleSaveSpecies = async () => {
    try {
      if (selectedSpecies) {
        await apiClient.put(`/manager/species/${selectedSpecies.id}`, speciesForm);
      } else {
        await apiClient.post('/manager/species', speciesForm);
      }
      fetchSpecies(currentPage);
    setIsSpeciesModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleSaveBreed = async () => {
    try {
      if (editingBreed) {
        await apiClient.put(`/manager/breeds/${editingBreed.Id}`, {
          name: breedForm.breedName,
          status: breedForm.status
        });
        if (viewingSpecies) {
          setViewingSpecies(prev => ({
            ...prev,
            breeds: prev.breeds.map(b => b.Id === editingBreed.Id ? { ...b, Name: breedForm.breedName } : b)
          }));
        }
        setIsEditBreedModalOpen(false);
      } else {
        await apiClient.post('/manager/breeds', {
          speciesId: breedForm.speciesId,
          name: breedForm.breedName,
          status: breedForm.status
        });
        setIsBreedModalOpen(false);
      }
      fetchSpecies(currentPage);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (selectedSpecies) {
        await apiClient.delete(`/manager/species/${selectedSpecies.id}`);
        fetchSpecies(currentPage);
    }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteBreed = async (breedId) => {
    if (window.confirm('Bạn có chắc muốn xóa giống này không?')) {
      try {
        await apiClient.delete(`/manager/breeds/${breedId}`);
        fetchSpecies(currentPage);
    } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Có lỗi xảy ra');
      }
    }
  };

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm kiếm loài hoặc giống thú cưng..." />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
                <PawPrint className="text-primary" size={32} />
                Quản lý Loài & Giống
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Cấu hình danh mục đa dạng các loại thú cưng của cửa hàng.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleOpenAddBreed}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-variant transition-all active:scale-95 shadow-sm font-bold text-sm"
              >
                Thêm Giống mới
              </button>
              <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportExcel} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface rounded-xl hover:bg-surface-variant transition-all active:scale-95 shadow-sm border border-outline-variant/30 text-sm font-bold">
                <FileUp size={18} /> NHẬP EXCEL
              </button>
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2.5 bg-[#107C41] text-white rounded-xl hover:bg-[#0B5A2F] transition-all active:scale-95 shadow-md shadow-[#107C41]/20 text-sm font-bold">
                <DownloadCloud size={18} /> XUẤT EXCEL
              </button>
              <button 
                onClick={handleOpenAddSpecies}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20 text-sm font-extrabold"
              >
                <PlusCircle size={18} />
                THÊM LOÀI
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider w-16">ID</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Tên Loài</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Các giống tiêu biểu</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Tổng số giống</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {speciesData.map((species) => (
                    <tr key={species.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-6 py-5 font-mono text-sm font-bold text-outline">#{species.id.toString().padStart(2, '0')}</td>
                      <td className="px-6 py-5 font-bold text-base text-on-surface">{species.name}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5">
                           {species.breeds && species.breeds.slice(0, 8).map((b, idx) => (
                             <span key={idx} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-variant text-on-surface-variant flex items-center gap-1 group/breed">
                               {b.Name}
                               <button 
                                 onClick={() => handleDeleteBreed(b.Id)}
                                 className="opacity-0 group-hover/breed:opacity-100 hover:text-error transition-opacity"
                                 title="Xóa giống"
                               >
                                 <XCircle size={10} />
                               </button>
                             </span>
                           ))}
                           {species.totalBreeds > 8 && (
                             <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                               +{species.totalBreeds - 8}
                             </span>
                           )}
                           {species.totalBreeds === 0 && (
                             <span className="text-[11px] font-medium text-outline italic">Chưa có dữ liệu</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold text-primary">{species.totalBreeds} <span className="text-xs font-medium text-outline">giống</span></td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${species.status === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {species.status === 'Hoạt động' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {species.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenViewBreeds(species)}
                          className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                        >
                          Xem giống
                        </button>
                        <button 
                          onClick={() => handleOpenEditSpecies(species)}
                          className="p-2 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        {isAdmin && (<button 
                          onClick={() => handleOpenDelete(species)}
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

      {/* Species Modal */}
      <GenericModal
        isOpen={isSpeciesModalOpen}
        onClose={() => setIsSpeciesModalOpen(false)}
        title={selectedSpecies ? "Chỉnh sửa Loài" : "Thêm Loài mới"}
        icon={PawPrint}
        actions={
          <>
            <button 
              onClick={() => setIsSpeciesModalOpen(false)}
              className="px-6 py-2.5 font-bold text-outline hover:bg-surface-container-low rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSaveSpecies}
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
            <label className="font-bold text-sm text-on-surface">Tên loài</label>
            <input 
              type="text" 
              value={speciesForm.name}
              onChange={(e) => setSpeciesForm({...speciesForm, name: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              placeholder="VD: Chó, Mèo..."
            />
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Trạng thái</label>
            <select 
              value={speciesForm.status}
              onChange={(e) => setSpeciesForm({...speciesForm, status: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Đã ẩn">Đã ẩn</option>
            </select>
          </div>
        </div>
      </GenericModal>

      {/* Breed Modal */}
      <GenericModal
        isOpen={isBreedModalOpen}
        onClose={() => setIsBreedModalOpen(false)}
        title="Thêm Giống mới"
        icon={PlusCircle}
        actions={
          <>
            <button 
              onClick={() => setIsBreedModalOpen(false)}
              className="px-6 py-2.5 font-bold text-outline hover:bg-surface-container-low rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSaveBreed}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95"
            >
              <Save size={18} />
              Thêm giống
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Chọn loài</label>
            <select 
              value={breedForm.speciesId}
              onChange={(e) => setBreedForm({...breedForm, speciesId: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
            >
              {speciesData.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Tên giống mới</label>
            <input 
              type="text" 
              value={breedForm.breedName}
              onChange={(e) => setBreedForm({...breedForm, breedName: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              placeholder="VD: Corgi, Poodle..."
            />
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Trạng thái</label>
            <select 
              value={breedForm.status}
              onChange={(e) => setBreedForm({...breedForm, status: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none font-medium"
            >
              <option value="Hoạt động">Hoạt động</option>
              <option value="Đã ẩn">Đã ẩn</option>
            </select>
          </div>
        </div>
      </GenericModal>

      {/* Edit Breed Modal */}
      <GenericModal
        isOpen={isEditBreedModalOpen}
        onClose={() => setIsEditBreedModalOpen(false)}
        title="Sửa Giống thú cưng"
        icon={Edit}
        zIndex="z-[110]"
        actions={
          <>
            <button 
              onClick={() => setIsEditBreedModalOpen(false)}
              className="px-6 py-2.5 font-bold text-outline hover:bg-surface-container-low rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSaveBreed}
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
            <label className="font-bold text-sm text-on-surface">Tên giống</label>
            <input 
              type="text" 
              value={breedForm.breedName}
              onChange={(e) => setBreedForm({...breedForm, breedName: e.target.value})}
              className="w-full h-11 px-4 bg-white border border-outline-variant/50 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none"
              placeholder="VD: Corgi, Poodle..."
            />
          </div>
          <div className="space-y-2">
            <label className="font-bold text-sm text-on-surface">Trạng thái</label>
            <select 
              value={breedForm.status}
              onChange={(e) => setBreedForm({...breedForm, status: e.target.value})}
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
        onConfirm={handleDeleteConfirm}
        itemName={selectedSpecies?.name}
        title="Xóa Loài"
        message="Bạn có chắc chắn muốn xóa danh mục loài này? Các giống và thú cưng thuộc loài này cũng có thể bị ảnh hưởng."
      />
      {/* View Breeds Modal */}
      <GenericModal
        isOpen={isViewBreedsModalOpen}
        onClose={() => setIsViewBreedsModalOpen(false)}
        title={`Danh sách giống của loài ${viewingSpecies?.name}`}
        icon={PawPrint}
        actions={
          <button 
            onClick={() => setIsViewBreedsModalOpen(false)}
            className="px-6 py-2.5 font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md"
          >
            Đóng
          </button>
        }
      >
        <div className="space-y-3">
          {viewingSpecies?.breeds?.length === 0 ? (
            <p className="text-center text-outline italic py-4">Chưa có giống nào cho loài này.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {viewingSpecies?.breeds?.map(b => (
                <div key={b.Id} className="flex justify-between items-center p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl hover:border-primary/50 transition-colors group/item">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface text-sm">{b.Name}</span>
                    <span className={`text-[10px] font-bold uppercase ${b.Status === 'Hoạt động' ? 'text-green-600' : 'text-gray-500'}`}>{b.Status || 'Hoạt động'}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEditBreed(b, viewingSpecies.id)}
                      className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Sửa giống này"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteBreed(b.Id)}
                      className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                      title="Xóa giống này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GenericModal>
    </div>
  );
};

export default SpeciesPage;
