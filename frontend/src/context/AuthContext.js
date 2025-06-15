import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Crear una instancia de Axios con la URL base desde la variable de entorno
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://jemimah.onrender.com',
  headers: { 'x-auth-token': localStorage.getItem('token') || '' },
  withCredentials: true // Habilitar el envío de cookies en solicitudes cross-origin
});

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/api/auth/me', {
        headers: { 'x-auth-token': token },
      });
      setUser(res.data);
    } catch (err) {
      console.error('Error loading user:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      // Asumiendo que la respuesta es { token: "...", user: { ... } }
      localStorage.setItem('token', res.data.token);
      api.defaults.headers['x-auth-token'] = res.data.token; // Actualizar el token en la instancia de axios
      setUser(res.data.user); // Establecer el usuario directamente desde la respuesta del login
      console.log('User after login:', res.data.user); // Para depurar el rol
    } catch (err) {
      throw err.response?.data?.error?.message || 'Error al iniciar sesión';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;