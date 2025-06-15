import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://jemimah.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'x-auth-token': localStorage.getItem('token') || '' },
  withCredentials: true // Habilitar el envío de cookies en solicitudes cross-origin
});

// Función para actualizar el token en los headers
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers['x-auth-token'] = token;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers['x-auth-token'];
    localStorage.removeItem('token');
  }
};

export default api;