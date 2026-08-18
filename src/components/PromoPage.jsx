import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { 
  ChevronRight, 
  Ticket, 
  Scissors, 
  Timer,
  ShoppingBag,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import apiClient from '../apiClient';

const PromoPage = () => {
  const [vouchers, setVouchers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [toastMessage, setToastMessage] = React.useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  React.useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await apiClient.get('/vouchers');
        setVouchers(res.data);
      } catch (err) {
        console.error('Lỗi lấy danh sách mã giảm giá:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  return (
    <div className="text-on-surface bg-background overflow-x-hidden selection:bg-primary/20 selection:text-primary min-h-screen flex flex-col relative">
      <Header />
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-28 right-4 z-50 bg-white border border-primary/20 shadow-xl shadow-primary/10 rounded-xl px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
          <CheckCircle2 className="text-primary" size={20} />
          <span className="font-bold text-sm">{toastMessage}</span>
        </div>
      )}
      
      <main className="pt-24 pb-16 w-full flex-grow">
        
        {/* Mega Banner Section */}
        <section className="w-full bg-gradient-to-br from-primary to-[#ff9800] text-white pt-16 pb-24 px-4 relative overflow-hidden">
          {/* Abstract background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            <div className="w-full md:w-1/2 flex flex-col justify-center text-center md:text-left">
              <span className="inline-flex items-center gap-2 bg-white/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold text-xs md:text-sm backdrop-blur-sm w-max mx-auto md:mx-0 mb-6 border border-white/30">
                <Sparkles size={14} className="md:w-4 md:h-4" /> SIÊU SALE GIỮA THÁNG
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-tight drop-shadow-lg">
                Săn Khuyến Mãi <br/><span className="text-yellow-200">Giảm Tới 50%</span>
              </h1>
              <p className="text-base md:text-lg opacity-90 mb-6 md:mb-8 max-w-lg mx-auto md:mx-0 font-medium">
                Cơ hội vàng để sắm sửa thức ăn, phụ kiện và đồ chơi cho Boss với mức giá không thể rẻ hơn. Số lượng có hạn!
              </p>
              

            </div>
            
            <div className="w-full md:w-1/2 relative flex justify-center mt-4 md:mt-0">
              <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-96 md:h-96 relative z-10 animate-bounce" style={{animationDuration: '3s'}}>
                <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=1000&auto=format&fit=crop" alt="Promo Dog" className="w-full h-full object-cover rounded-full border-[6px] md:border-8 border-white/20 shadow-2xl" />
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-container-max mx-auto px-4 md:px-8 lg:px-12 -mt-10 relative z-20">
          
          {/* Voucher Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {vouchers.map(voucher => (
                <div key={voucher.Id} className="bg-white rounded-2xl flex shadow-lg shadow-surface-variant/50 border border-outline-variant/30 overflow-hidden hover:-translate-y-1 transition-transform group">
                  <div className={`text-white p-6 flex flex-col items-center justify-center border-r border-dashed border-white/40 w-32 shrink-0 ${voucher.Type === 'PERCENTAGE' ? 'bg-primary' : (voucher.Code.includes('FREE') ? 'bg-tertiary' : 'bg-[#E74C3C]')}`}>
                    <Ticket size={32} className="mb-2 opacity-80" />
                    <span className="font-black text-2xl">
                      {voucher.Type === 'PERCENTAGE' ? `${voucher.Value}%` : `${(voucher.Value / 1000)}K`}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-center mt-1">Giảm</span>
                  </div>
                  <div className="p-5 flex flex-col justify-center flex-grow bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-surface-container-low to-white">
                    <h3 className="font-extrabold text-on-surface mb-1 text-lg">
                      {voucher.Type === 'PERCENTAGE' 
                        ? `Giảm ${voucher.Value}%` 
                        : `Giảm ${Number(voucher.Value).toLocaleString('vi-VN')}đ`}
                    </h3>
                    <p className="text-xs text-outline mb-2 font-medium">
                      {voucher.MinOrder ? `Đơn tối thiểu ${Number(voucher.MinOrder).toLocaleString('vi-VN')}đ` : 'Áp dụng cho mọi đơn hàng'}
                      {voucher.Type === 'PERCENTAGE' && voucher.MaxDiscount ? ` - Giảm tối đa ${Number(voucher.MaxDiscount).toLocaleString('vi-VN')}đ` : ''}
                    </p>
                    {voucher.ExpiryDate && (
                      <p className="text-[10px] text-error font-bold mb-3 flex items-center gap-1">
                        <Timer size={12} /> HSD: {new Date(voucher.ExpiryDate).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="bg-surface-variant px-3 py-1.5 rounded-lg border border-outline-variant/50 font-bold text-sm tracking-widest">{voucher.Code}</div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(voucher.Code);
                          showToast(`Đã lưu và copy mã ${voucher.Code}!`);
                        }}
                        className={`hover:text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-1 ${voucher.Type === 'PERCENTAGE' ? 'bg-primary/10 text-primary hover:bg-primary' : (voucher.Code.includes('FREE') ? 'bg-tertiary/10 text-tertiary hover:bg-tertiary' : 'bg-[#E74C3C]/10 text-[#E74C3C] hover:bg-[#E74C3C]')}`}
                      >
                        <Scissors size={14} /> Lưu mã
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {vouchers.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-outline font-bold text-lg">Hiện tại không có mã khuyến mãi nào.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PromoPage;
