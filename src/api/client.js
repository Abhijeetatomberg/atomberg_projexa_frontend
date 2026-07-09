import axios from 'axios';

// In dev, Vite proxies /api → http://localhost:4000 (see vite.config.js).
// Set VITE_API_BASE to point at a hosted backend in production builds.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  headers: { 'Content-Type': 'application/json' },
});

export default api;
