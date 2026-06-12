import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lumos_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
