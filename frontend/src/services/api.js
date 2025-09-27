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

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/')) {
      window.location.href = '/login';
    } else if (error.response?.data?.message) {
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
