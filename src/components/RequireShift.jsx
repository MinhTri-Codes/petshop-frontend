import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../apiClient';
import { AlertTriangle, LogIn } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const RequireShift = ({ children, allowAdminBypass = false }) => {
  const [hasShift, setHasShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    const checkShift = async () => {
      try {
        const res = await apiClient.get('/cashier/sessions/current-stats');
        if (res.data && res.data.session) {
          setHasShift(true);
        } else {
          setHasShift(false);
        }
      } catch (err) {
        setHasShift(false);
      } finally {
        setLoading(false);
      }
    };
    checkShift();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!hasShift && !(allowAdminBypass && user?.role === 'ADMIN')) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] w-full max-w-lg mx-auto text-center px-4">
        <div className="bg-error/10 text-error p-6 rounded-full mb-6">
          <AlertTriangle size={64} />
        </div>
        <h2 className="text-3xl font-black text-on-surface mb-4">Vui lòng mở ca làm việc!</h2>
        <p className="text-outline font-medium mb-8">
          Để đảm bảo an toàn luân chuyển dòng tiền, bạn cần mở ca làm việc trước khi sử dụng tính năng này.
        </p>
        <button 
          onClick={() => navigate('/cashflow')} 
          className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-95"
        >
          <LogIn size={20} />
          Đến trang Sổ quỹ ca
        </button>
      </div>
    );
  }

  return children;
};

export default RequireShift;
