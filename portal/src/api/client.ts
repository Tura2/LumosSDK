import axios from 'axios';
import { getMockResponse } from './mockData';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lumos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url ?? '';
    if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.response) {
      const mock = getMockResponse(url);
      if (mock !== null) return Promise.resolve({ data: mock });
    }
    return Promise.reject(err);
  }
);
