import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { ShieldCheck, Truck, RefreshCcw, Info } from 'lucide-react';

const PoliciesPage = () => {
  const [activeTab, setActiveTab] = useState('privacy');

  return (
    <div className="text-on-surface bg-background overflow-x-hidden min-h-screen flex flex-col">
      <Header />
      
      <main className="pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-container-max mx-auto w-full flex-grow">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold text-on-surface mb-4">Chính sách & Quy định</h1>
          <p className="text-lg text-outline font-medium max-w-2xl mx-auto">
            Vui lòng đọc kỹ các chính sách dưới đây để đảm bảo quyền lợi của bạn khi mua sắm tại PetLove.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-outline-variant/30 sticky top-28 space-y-2">
              <button 
                onClick={() => setActiveTab('privacy')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'privacy' ? 'bg-primary/10 text-primary' : 'text-outline hover:bg-surface-container-low hover:text-on-surface'}`}
              >
                <ShieldCheck size={20} />
                Bảo mật thông tin
              </button>
              <button 
                onClick={() => setActiveTab('shipping')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'shipping' ? 'bg-primary/10 text-primary' : 'text-outline hover:bg-surface-container-low hover:text-on-surface'}`}
              >
                <Truck size={20} />
                Giao hàng & Vận chuyển
              </button>
              <button 
                onClick={() => setActiveTab('return')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'return' ? 'bg-primary/10 text-primary' : 'text-outline hover:bg-surface-container-low hover:text-on-surface'}`}
              >
                <RefreshCcw size={20} />
                Đổi trả & Hoàn tiền
              </button>
              <button 
                onClick={() => setActiveTab('terms')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left ${activeTab === 'terms' ? 'bg-primary/10 text-primary' : 'text-outline hover:bg-surface-container-low hover:text-on-surface'}`}
              >
                <Info size={20} />
                Điều khoản sử dụng
              </button>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-3 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-outline-variant/30">
            {activeTab === 'privacy' && (
              <div className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:font-medium prose-p:text-on-surface/80">
                <h2 className="text-2xl mb-6 flex items-center gap-2"><ShieldCheck className="text-primary"/> Chính sách Bảo mật Thông tin</h2>
                <p>PetLove cam kết bảo vệ tuyệt đối thông tin cá nhân của khách hàng. Chúng tôi hiểu rằng việc bạn cung cấp thông tin là một sự tin tưởng lớn.</p>
                <h3>1. Mục đích thu thập</h3>
                <p>Chúng tôi chỉ thu thập thông tin cá nhân nhằm mục đích xử lý đơn hàng, hỗ trợ khách hàng và gửi các thông tin khuyến mãi (nếu bạn đồng ý).</p>
                <h3>2. Cam kết không chia sẻ</h3>
                <p>Tuyệt đối không mua bán, trao đổi thông tin khách hàng cho bên thứ ba vì mục đích thương mại vi phạm cam kết bảo mật.</p>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:font-medium prose-p:text-on-surface/80">
                <h2 className="text-2xl mb-6 flex items-center gap-2"><Truck className="text-primary"/> Chính sách Giao hàng & Vận chuyển</h2>
                <p>Nhằm mang lại trải nghiệm mua sắm tốt nhất, PetLove cung cấp dịch vụ giao hàng tận nơi trên toàn quốc.</p>
                <h3>1. Phí giao hàng</h3>
                <ul>
                  <li>Miễn phí vận chuyển cho đơn hàng từ 500,000đ trở lên trong nội thành.</li>
                  <li>Phí đồng giá 30,000đ cho các đơn hàng còn lại.</li>
                </ul>
                <h3>2. Thời gian giao hàng</h3>
                <p>Nội thành TP.HCM: 1-2 ngày làm việc. Các tỉnh thành khác: 3-5 ngày làm việc.</p>
              </div>
            )}

            {activeTab === 'return' && (
              <div className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:font-medium prose-p:text-on-surface/80">
                <h2 className="text-2xl mb-6 flex items-center gap-2"><RefreshCcw className="text-primary"/> Chính sách Đổi trả & Hoàn tiền</h2>
                <p>Bạn có thể yêu cầu đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu thỏa mãn các điều kiện sau.</p>
                <h3>1. Điều kiện đổi trả</h3>
                <ul>
                  <li>Sản phẩm còn nguyên bao bì, tem nhãn, chưa qua sử dụng.</li>
                  <li>Sản phẩm bị lỗi do nhà sản xuất hoặc hư hỏng trong quá trình vận chuyển.</li>
                </ul>
                <h3>2. Quy trình hoàn tiền</h3>
                <p>Hoàn tiền sẽ được xử lý trong vòng 3-5 ngày làm việc sau khi chúng tôi nhận được hàng hoàn trả và kiểm tra đạt yêu cầu.</p>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="prose prose-lg max-w-none prose-headings:font-extrabold prose-p:font-medium prose-p:text-on-surface/80">
                <h2 className="text-2xl mb-6 flex items-center gap-2"><Info className="text-primary"/> Điều khoản Sử dụng</h2>
                <p>Bằng việc truy cập và mua sắm tại PetLove, bạn đồng ý với các điều khoản sử dụng của chúng tôi.</p>
                <p>Chúng tôi có quyền thay đổi, chỉnh sửa các điều khoản này bất cứ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên website mà không cần thông báo trước.</p>
              </div>
            )}
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PoliciesPage;
