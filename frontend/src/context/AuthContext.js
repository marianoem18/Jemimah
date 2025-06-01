import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token || typeof token !== 'string' || token.length < 10) {
        console.warn('No se encontró un token válido en localStorage');
        setUser(null);
        setLoading(false);
        return;
      }

      axios.defaults.headers.common['x-auth-token'] = token;
      try {
        const res = await axios.get('http://localhost:5000/api/auth/me');
        // Manejar estructura esperada { data: { user: {...} } }
        if (res.data && res.data.data && res.data.data.user) {
          setUser(res.data.data.user);
        } 
        // Manejar respuesta directa { _id, email, name, role, ... }
        else if (res.data && res.data._id && res.data.email && res.data.role) {
          setUser({
            id: res.data._id,
            name: res.data.name,
            email: res.data.email,
            role: res.data.role,
          });
        } else {
          console.warn('Estructura de respuesta inválida desde /api/auth/me:', res.data);
          setUser(null); // Cambiado a null para mantener compatibilidad con App.js
        }
      } catch (err) {
        console.error('Error verificando token:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          console.warn('Token inválido, eliminando token');
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['x-auth-token'];
          setUser(null);
        } else if (err.response?.status === 403) {
          console.warn('Permiso denegado en /api/auth/me:', err.response?.data);
          setUser(null); // Cambiado a null para mantener compatibilidad con App.js
        } else {
          console.warn('Error al cargar usuario:', err.message);
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