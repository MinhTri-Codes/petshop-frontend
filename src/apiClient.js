import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Đường dẫn tới Backend của bạn
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
