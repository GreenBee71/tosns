import axios from 'axios';

export const api = axios.create({
  baseURL: '', // Vite proxy redirects /api/v1 to http://localhost:8101
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
