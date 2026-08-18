import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://petshop-backend-8nk4.onrender.com/api', // Đường dẫn tới Backend trên Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động gài Token vào request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;
