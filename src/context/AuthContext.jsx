import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../apiClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khi app vừa load, lấy token từ localStorage ra kiểm tra
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await apiClient.get('/auth/me');
          const normalized = {
            id: res.data.Id,
            Id: res.data.Id,
            fullName: res.data.FullName,
            FullName: res.data.FullName,
            email: res.data.Email,
            Email: res.data.Email,
            role: res.data.Role,
            Role: res.data.Role,
            phoneNumber: res.data.PhoneNumber,
            PhoneNumber: res.data.PhoneNumber,
            avatarUrl: res.data.AvatarUrl,
            AvatarUrl: res.data.AvatarUrl
          };
          setUser(normalized);
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    const normalized = {
      id: userData.id || userData.Id,
      Id: userData.id || userData.Id,
      fullName: userData.fullName || userData.FullName,
      FullName: userData.fullName || userData.FullName,
      email: userData.email || userData.Email,
      Email: userData.email || userData.Email,
      role: userData.role || userData.Role,
      Role: userData.role || userData.Role,
      phoneNumber: userData.phoneNumber || userData.PhoneNumber,
      PhoneNumber: userData.phoneNumber || userData.PhoneNumber,
      avatarUrl: userData.avatarUrl || userData.AvatarUrl,
      AvatarUrl: userData.avatarUrl || userData.AvatarUrl
    };
    setUser(normalized);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/auth'; // Chuyển hướng về trang đăng nhập
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
