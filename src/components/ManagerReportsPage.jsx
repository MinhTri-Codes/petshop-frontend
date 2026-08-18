import React, { useRef, useState, useEffect } from 'react';
import { LineChart as LucideLineChart, TrendingUp, DollarSign, ShoppingBag, Users, Package, Award, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import apiClient from '../apiClient';

const ReportsPage = () => {

  const COLORS = ['#F26A4B', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
    if (percent === 0) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const searchInputRef = useRef(null);

  const [period, setPeriod] = useState('week');
  const [data, setData] = useState({ revenue: 0, orders: 0, newCustomers: 0, productsSold: 0, chartData: [], topProducts: [], recentTransactions: [], paymentMethodData: [], orderTypeData: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/manager/reports/dashboard?period=${period}`);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbf9f8] text-on-surface flex min-h-screen font-body-md overflow-hidden">
      <ManagerSidebar />

      <main className="flex-1 ml-0 lg:ml-[240px] flex flex-col min-w-0 h-screen overflow-y-auto">
        <ManagerHeader ref={searchInputRef} placeholder="Tìm kiếm báo cáo..." />

        <div className="p-4 md:p-8 space-y-8 flex-1">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
                <LucideLineChart className="text-primary" size={32} />
                Báo cáo Doanh thu
              </h2>
              <p className="text-sm md:text-base text-outline font-medium mt-1">Thống kê hoạt động kinh doanh tổng quan.</p>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white border border-outline-variant/50 rounded-xl text-sm font-bold px-5 py-2.5 outline-none shadow-sm text-on-surface"
            >
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-10">Đang tải dữ liệu...</div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-primary to-[#F2994A] rounded-3xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-90 mb-1">Doanh thu</p>
                      <h3 className="text-3xl font-black">{Number(data.revenue).toLocaleString('vi-VN')}đ</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <DollarSign size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold bg-white/20 w-max px-2 py-1 rounded-lg relative z-10">
                    <TrendingUp size={14} /> Thời gian thực
                  </div>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Đơn hàng thành công</p>
                      <h3 className="text-3xl font-black text-on-surface">{data.orders}</h3>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <ShoppingBag size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-green-600 relative z-10">
                    <TrendingUp size={14} /> Thời gian thực
                  </div>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Khách mới</p>
                      <h3 className="text-3xl font-black text-on-surface">{data.newCustomers}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Users size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-green-600 relative z-10">
                    <TrendingUp size={14} /> Khách đăng ký
                  </div>
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">Sản phẩm bán ra</p>
                      <h3 className="text-3xl font-black text-on-surface">{data.productsSold}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-green-600 relative z-10">
                    <TrendingUp size={14} /> Đã giao xong
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm min-h-[400px] flex flex-col">
                <h3 className="font-extrabold text-lg mb-6">Biểu đồ doanh thu {period === 'today' ? 'hôm nay' : period === 'week' ? 'tuần này' : period === 'month' ? 'tháng này' : 'năm nay'}</h3>
                <div className="flex-1 min-h-[350px]">
                  {data.chartData && data.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value) => [`${Number(value).toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#F26A4B"
                          strokeWidth={4}
                          dot={{ fill: '#F26A4B', strokeWidth: 2, r: 4, stroke: 'white' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-outline">Chưa có dữ liệu để vẽ biểu đồ</div>
                  )}
                </div>
              </div>


              {/* Breakdown Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm min-h-[300px] flex flex-col items-center">
                  <h3 className="font-extrabold text-lg mb-4 w-full text-left">Cơ cấu Thanh toán</h3>
                  {data.paymentMethodData?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.paymentMethodData.map(d => ({ ...d, value: Number(d.value) }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString('vi-VN')}đ`, 'Doanh thu']} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-outline">Chưa có dữ liệu</div>
                  )}
                </div>

                <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm min-h-[300px] flex flex-col items-center">
                  <h3 className="font-extrabold text-lg mb-4 w-full text-left">Nguồn Doanh thu</h3>
                  {data.orderTypeData?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.orderTypeData.map(d => ({ ...d, value: Number(d.value) }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.orderTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString('vi-VN')}đ`, 'Doanh thu']} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-outline">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>

              {/* Data Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                {/* Top Products */}
                <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                      <Award size={20} />
                    </div>
                    <h3 className="font-extrabold text-lg">Top 5 Bán chạy nhất</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-outline-variant/30 text-outline text-sm">
                          <th className="pb-3 font-medium">Sản phẩm</th>
                          <th className="pb-3 font-medium text-right">Đã bán</th>
                          <th className="pb-3 font-medium text-right">Doanh thu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topProducts?.length > 0 ? (
                          data.topProducts.map((p, idx) => (
                            <tr key={idx} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                              <td className="py-4 font-bold text-sm truncate max-w-[150px] sm:max-w-[200px]" title={p.ProductName}>{p.ProductName}</td>
                              <td className="py-4 font-medium text-sm text-right">{p.totalSold}</td>
                              <td className="py-4 font-bold text-primary text-sm text-right">{Number(p.revenue).toLocaleString('vi-VN')}đ</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="py-8 text-center text-outline">Chưa có dữ liệu</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <h3 className="font-extrabold text-lg">Giao dịch gần đây</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-outline-variant/30 text-outline text-sm">
                          <th className="pb-3 font-medium">Mã ĐH</th>
                          <th className="pb-3 font-medium">Thời gian</th>
                          <th className="pb-3 font-medium text-right">Giá trị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentTransactions?.length > 0 ? (
                          data.recentTransactions.map((t, idx) => {
                            const dateObj = new Date(t.CreatedAt);
                            return (
                              <tr key={idx} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container/50 transition-colors">
                                <td className="py-4 font-bold text-sm text-primary">#{t.Id.slice(0, 8).toUpperCase()}</td>
                                <td className="py-4 font-medium text-sm text-outline">
                                  {dateObj.toLocaleDateString('vi-VN')} {dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-4 font-bold text-sm text-right">{Number(t.TotalAmount).toLocaleString('vi-VN')}đ</td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan="3" className="py-8 text-center text-outline">Chưa có giao dịch nào</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
