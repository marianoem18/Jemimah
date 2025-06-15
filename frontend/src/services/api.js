import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://jemimah.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'x-auth-token': localStorage.getItem('token') || '' },
  withCredentials: true // Habilitar el envío de cookies en solicitudes cross-origin
});

export default api;