import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Crear una instancia de Axios con la URL base desde la variable de entorno
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: { 'x-auth-token': localStorage.getItem('token') || '' },
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
      const res = await api.get('/api/auth', {
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
      const res = await api.post('/api/auth', { email, password });
      localStorage.setItem('token', res.data.token);
      await loadUser();
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