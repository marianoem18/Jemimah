import axios from 'axios';

// Usar la URL del backend de producción
const API_URL = process.env.REACT_APP_API_URL || 'https://jemimah.onrender.com';
console.log('API URL utilizada:', API_URL); // Para depuración

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
  response => {
    // Log de respuestas exitosas para depuración
    console.log(`Respuesta exitosa de ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    // Información detallada sobre el error
    console.error('Error en solicitud API:', error.message);
    
    // Manejar errores de red o CORS
    if (error.message === 'Network Error') {
      console.error('Error de red detectado - posible problema CORS');
      console.log('URL completa de la solicitud:', API_URL + (error.config?.url || ''));
      console.log('Método de la solicitud:', error.config?.method);
      console.log('Headers de la solicitud:', JSON.stringify(error.config?.headers));
      
      // Mensaje de error más amigable para el usuario
      error.friendlyMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet o contacta al administrador.';
    } else if (error.response) {
      // El servidor respondió con un código de error
      console.log('Respuesta de error del servidor:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // Mensaje basado en el código de estado
      switch (error.response.status) {
        case 401:
          error.friendlyMessage = 'Sesión expirada o credenciales inválidas. Por favor, inicia sesión nuevamente.';
          break;
        case 403:
          error.friendlyMessage = 'No tienes permiso para realizar esta acción.';
          break;
        case 404:
          error.friendlyMessage = 'El recurso solicitado no existe.';
          break;
        case 500:
          error.friendlyMessage = 'Error en el servidor. Por favor, intenta más tarde.';
          break;
        default:
          error.friendlyMessage = error.response.data?.error?.message || 'Ocurrió un error inesperado.';
      }
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta
      console.log('No se recibió respuesta:', error.request);
      error.friendlyMessage = 'El servidor no responde. Por favor, intenta más tarde.';
    } else {
      // Error en la configuración de la solicitud
      console.log('Error en la configuración:', error.message);
      error.friendlyMessage = 'Error al preparar la solicitud. Por favor, intenta nuevamente.';
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