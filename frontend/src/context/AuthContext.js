import React, { createContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '../services/api'; // Importar la instancia de api y la función setAuthToken

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
      // No es necesario pasar el token en los headers aquí, ya que la instancia de axios
      // compartida ya tiene el token en sus headers por defecto
      const res = await api.get('/api/auth/me');
      
      // La respuesta del backend tiene la estructura res.data.data.user
      if (res.data && res.data.data && res.data.data.user) {
        setUser(res.data.data.user);
        console.log('Usuario cargado correctamente:', res.data.data.user);
      } else {
        console.error('Respuesta inesperada del servidor:', res.data);
        setAuthToken(null); // Limpiar el token si la respuesta no tiene la estructura esperada
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      // Si hay un error 401 (Unauthorized), limpiar el token
      if (err.response && err.response.status === 401) {
        console.log('Token inválido o expirado, limpiando sesión...');
        setAuthToken(null);
      }
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
      console.log('Intentando iniciar sesión con:', { email });
      
      const res = await api.post('/api/auth/login', { email, password });
      // Verificar que la respuesta tenga la estructura esperada
      console.log('Respuesta de login:', res.data);
      
      if (!res.data || !res.data.data || !res.data.data.token || !res.data.data.user) {
        console.error('Estructura de respuesta inesperada:', res.data);
        const error = new Error('Respuesta del servidor incorrecta');
        error.friendlyMessage = 'El formato de respuesta del servidor es incorrecto. Contacta al administrador.';
        throw error;
      }
      
      // Actualizar el token en la instancia de axios compartida
      setAuthToken(res.data.data.token);
      
      // Establecer el usuario directamente desde la respuesta
      setUser(res.data.data.user);
      console.log('Usuario después del login:', res.data.data.user);
      
      // Actualizar el estado de carga
      setLoading(false);
      return true; // Indicar éxito
    } catch (err) {
      console.error('Error en login:', err);
      // Si el login falla, limpiar el token
      setAuthToken(null);
      setUser(null);
      
      // Propagar el error con el mensaje amigable
      // El interceptor de axios ya ha añadido friendlyMessage al objeto de error
      throw err;
    }
  
  };

  const logout = () => {
    setAuthToken(null); // Eliminar el token de la instancia de axios compartida
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;