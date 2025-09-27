import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if it's a 401 and not on the auth routes
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      // Clear any stored auth state
      window.location.href = '/login';
    } else if (error.response?.data?.message) {
      // Only show error toast if it's not a 401 on profile check
      if (!(error.response.status === 401 && error.config.url.includes('/auth/profile'))) {
        toast.error(error.response.data.message);
      }
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default api;
