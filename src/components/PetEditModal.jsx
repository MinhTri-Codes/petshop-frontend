import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiClient from '../apiClient';

const PetEditModal = ({ isOpen, onClose, pet, onSuccess }) => {
  const [formData, setFormData] = useState({
    Name: '',
    BreedId: '',
    Gender: 'Đực',
    Age: '',
    ImageUrl: ''
  });
  const [breeds, setBreeds] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFilters();
    }
  }, [isOpen]);

  useEffect(() => {
    if (pet) {
      setFormData({
        Name: pet.Name || '',
        BreedId: pet.BreedId ? pet.BreedId.toString() : '',
        Gender: pet.Gender || 'Đực',
        Age: pet.Age || '',
        ImageUrl: pet.ImageUrl || ''
      });
      if (pet.BreedId && breeds.length > 0) {
        const currentBreed = breeds.find(b => b.Id.toString() === pet.BreedId.toString());
        if (currentBreed) {
          setSelectedSpecies(currentBreed.SpeciesId.toString());
        }
      }
    } else {
      setSelectedSpecies('');
      setFormData({
        Name: '',
        BreedId: '',
        Gender: 'Đực',
        Age: '',
        ImageUrl: ''
      });
    }
  }, [pet, breeds]);

  const fetchFilters = async () => {
    try {
      const res = await apiClient.get('/customer/categories-breeds');
      setBreeds(res.data.breeds || []);
      setSpeciesList(res.data.species || []);
    } catch (err) {
      console.error('Lỗi tải danh sách giống:', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSpeciesChange = (e) => {
    setSelectedSpecies(e.target.value);
    setFormData({ ...formData, BreedId: '' }); // Reset giống khi đổi loài
  };

  const availableBreeds = breeds.filter(b => b.SpeciesId.toString() === selectedSpecies);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    try {
      setLoading(true);
      const res = await apiClient.post('/customer/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, ImageUrl: res.data.url }));
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      setError('Lỗi upload ảnh, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (pet) {
        await apiClient.put(`/customer/my-pets/${pet.Id}`, formData);
      } else {
        await apiClient.post('/customer/my-pets', formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-outline-variant/30 shrink-0">
          <h2 className="text-xl font-extrabold text-on-surface">{pet ? 'Sửa thông tin thú cưng' : 'Thêm thú cưng mới'}</h2>
          <button onClick={onClose} className="p-2 bg-surface-container-low hover:bg-surface-variant rounded-full transition-colors text-outline">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          {error && <div className="p-3 bg-error-container text-error rounded-xl text-sm font-bold">{error}</div>}
          
          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Tên thú cưng <span className="text-error">*</span></label>
            <input 
              type="text" 
              name="Name"
              value={formData.Name} 
              onChange={handleChange}
              placeholder="VD: Cậu Vàng, Bé Na..."
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-on-surface">Loài</label>
              <select 
                value={selectedSpecies} 
                onChange={handleSpeciesChange}
                className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
                required
              >
                <option value="">Chọn loài</option>
                {speciesList.map(s => (
                  <option key={s.Id} value={s.Id}>{s.Name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-on-surface">Giống</label>
              <select 
                name="BreedId"
                value={formData.BreedId} 
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                disabled={!selectedSpecies}
              >
                <option value="">Chọn giống</option>
                {availableBreeds.map(b => (
                  <option key={b.Id} value={b.Id}>{b.Name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Giới tính</label>
            <select 
              name="Gender"
              value={formData.Gender} 
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white"
            >
              <option value="Đực">Đực</option>
              <option value="Cái">Cái</option>
              <option value="Chưa rõ">Chưa rõ</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Tuổi (Tháng/Năm)</label>
            <input 
              type="text" 
              name="Age"
              value={formData.Age} 
              onChange={handleChange}
              placeholder="VD: 2 tuổi, 3 tháng"
              className="w-full h-12 px-4 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-on-surface">Hình ảnh</label>
            <div className="flex flex-col gap-3">
              {formData.ImageUrl && (
                <div className="w-full h-32 rounded-xl overflow-hidden shrink-0 border border-outline-variant/30 relative group">
                  <img src={formData.ImageUrl || "https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"} onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x400/f3f4f6/a1a1aa?text=PetLove+No+Image"; }} alt="Pet Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full h-12 px-4 py-2.5 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm cursor-pointer file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl font-bold bg-surface-variant text-on-surface hover:bg-surface-container-high transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PetEditModal;
