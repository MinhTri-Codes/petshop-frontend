import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.Role)) {
    // Nếu có đăng nhập nhưng không đủ quyền, trả về trang lỗi 403 hoặc trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
