import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Configurar el header de autenticación
        axios.defaults.headers.common['x-auth-token'] = token;
        try {
          const res = await axios.get('http://localhost:5000/api/auth/me');
          setUser(res.data.data.user);
        } catch (err) {
          console.error('Error verificando token:', err.response?.data || err.message);
          // Solo limpiar el token si el error es de autenticación (401/403)
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['x-auth-token'];
          }
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['x-auth-token'] = token;
      setUser(user);
      return true;
    } catch (err) {
      console.error('Error al iniciar sesión:', err.response?.data || err.message);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;