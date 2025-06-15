import axios from 'axios';

// Usar la URL del backend de producción
const API_URL = process.env.REACT_APP_API_URL || 'https://jemimah.onrender.com';

// Crear una instancia de axios con la URL base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-auth-token': localStorage.getItem('token') || ''
  },
  withCredentials: false, // Deshabilitar el envío de cookies para evitar problemas CORS
  timeout: 10000 // Establecer un timeout de 10 segundos para las solicitudes
});

// Interceptor para solicitudes
api.interceptors.request.use(
  config => {
    // Asegurarse de que el token esté actualizado en cada solicitud
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  error => {
    console.error('Error en la configuración de la solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
api.interceptors.response.use(
  response => response,
  error => {
    // Manejar errores de red o CORS
    if (error.message === 'Network Error') {
      console.error('Error de red - posible problema CORS:', error);
      console.log('URL de la solicitud:', error.config?.url);
      console.log('Método de la solicitud:', error.config?.method);
      console.log('Headers de la solicitud:', error.config?.headers);
    } else {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

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