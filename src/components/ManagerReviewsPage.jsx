import React, { useRef, useEffect, useState } from 'react';
import { 
  MessageSquare, Star, CheckCircle, XCircle, Search, Trash2, EyeOff, Eye
} from 'lucide-react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import apiClient from '../apiClient';

const StaffReviewsPage = () => {
  const searchInputRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [filterStar, setFilterStar] = useState('Tất cả');
  const [loading, setLoading] = useState(true);
  
  const [isHideModalOpen, setIsHideModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/manager/reviews');
      setReviews(res.data.map(r => ({
        id: r.Id,
        product: r.ProductName || 'Sản phẩm',
        customer: r.FullName || 'Khách hàng',
        rating: r.Rating || 5,
        content: r.Content || '',
        date: new Date(r.CreatedAt).toLocaleDateString('vi-VN'),
        status: r.Status || 'Đã duyệt'
      })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenHide = (review) => {
    setSelectedReview(review);
    setIsHideModalOpen(true);
  };

  const handleOpenDelete = (review) => {
    setSelectedReview(review);
    setIsDeleteModalOpen(true);
  };

  const handleHideConfirm = async () => {
    if (selectedReview) {
      try {
        await apiClient.put(`/manager/reviews/${selectedReview.id}/status`, { status: 'Đã ẩn' });
        fetchReviews();
      } catch (error) {
        alert('Có lỗi xảy ra!');
        console.error(error);
      }
    }
    setIsHideModalOpen(false);
  };

  const handleShow = async (review) => {
    try {
      await apiClient.put(`/manager/reviews/${review.id}/status`, { status: 'Đã duyệt' });
      fetchReviews();
    } catch (error) {
      alert('Có lỗi xảy ra!');
      console.error(error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedReview) {
      try {
        await apiClient.delete(`/manager/reviews/${selectedReview.id}`);
        fetchReviews();
      } catch (error) {
        alert('Có lỗi xảy ra khi xóa!');
        console.error(error);
      }
    }
    setIsDeleteModalOpen(false);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className={i < rating ? "fill-orange-400 text-orange-400" : "text-outline-variant/50"} />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = (r.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (r.product || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Tất cả' || r.status === filterStatus;
    const matchesStar = filterStar === 'Tất cả' || r.rating.toString() === filterStar;
    return matchesSearch && matchesStatus && matchesStar;
  });

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader />

        <div className="p-4 md:p-8 space-y-6 flex-1">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
                <MessageSquare className="text-primary" size={32} />
                Đánh giá khách hàng
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Kiểm duyệt các phản hồi từ khách hàng.</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo tên khách, sản phẩm, nội dung..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant/50 rounded-2xl focus:outline-none focus:border-primary shadow-sm"
              />
            </div>
            <select 
              value={filterStar}
              onChange={(e) => setFilterStar(e.target.value)}
              className="bg-white border border-outline-variant/50 rounded-xl text-sm font-semibold px-4 h-11 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm outline-none"
            >
              <option value="Tất cả">Tất cả số sao</option>
              <option value="5">5 Sao</option>
              <option value="4">4 Sao</option>
              <option value="3">3 Sao</option>
              <option value="2">2 Sao</option>
              <option value="1">1 Sao</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-outline-variant/50 rounded-xl text-sm font-semibold px-4 h-11 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm outline-none"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đã duyệt">Đã duyệt</option>
              <option value="Đã ẩn">Đã ẩn</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-surface-container-lowest border-b border-outline-variant/30">
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Sản phẩm / Khách</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider w-2/5">Nội dung đánh giá</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider">Ngày gửi</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-center">Trạng thái</th>
                    <th className="px-6 py-5 text-xs font-bold text-outline uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-outline font-medium">
                        Không có đánh giá nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-primary line-clamp-1 mb-1">{review.product}</div>
                        <div className="text-xs font-medium text-outline flex items-center gap-1">
                          Khách: <span className="font-bold text-on-surface">{review.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-1">{renderStars(review.rating)}</div>
                        <p className="text-sm font-medium text-on-surface line-clamp-2">{review.content}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-outline">{review.date}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider w-24 ${review.status === 'Đã duyệt' ? 'bg-green-100 text-green-700' : 'bg-surface-variant text-outline'}`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {review.status !== 'Đã ẩn' ? (
                          <button 
                            onClick={() => handleOpenHide(review)}
                            className="p-2 text-outline hover:text-orange-500 hover:bg-orange-100 rounded-lg transition-colors shadow-sm border border-outline-variant/30 bg-white" 
                            title="Ẩn đánh giá"
                          >
                            <EyeOff size={18} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleShow(review)}
                            className="p-2 text-outline hover:text-green-500 hover:bg-green-100 rounded-lg transition-colors shadow-sm border border-outline-variant/30 bg-white" 
                            title="Hiện đánh giá"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleOpenDelete(review)}
                          className="p-2 text-outline hover:text-error hover:bg-error/10 rounded-lg transition-colors shadow-sm border border-outline-variant/30 bg-white" 
                          title="Xóa đánh giá"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>

      {/* Hide Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isHideModalOpen}
        onClose={() => setIsHideModalOpen(false)}
        onConfirm={handleHideConfirm}
        itemName={`Đánh giá từ ${selectedReview?.customer}`}
        title="Ẩn đánh giá"
        message="Bạn có chắc chắn muốn ẩn đánh giá này khỏi người dùng? Bạn vẫn có thể xem lại trong tab Đã ẩn."
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={`Đánh giá từ ${selectedReview?.customer}`}
        title="Xóa đánh giá vi phạm"
        message="Bạn có chắc chắn muốn xóa VĨNH VIỄN đánh giá vi phạm này? Hành động này không thể hoàn tác."
      />
    </div>
  );
};

export default StaffReviewsPage;
