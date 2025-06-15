import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import HeaderNavbar from './components/HeaderNavbar';
import Footer from './components/Footer';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Stock from './components/Stock';
import Sales from './components/Sales';
import Expenses from './components/Expenses';
import Reports from './components/Reports';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  // Verificar si hay token y si el usuario está autenticado
  if (!token || !user) {
    console.log('Redirigiendo a login: no hay token o usuario', { token: !!token, user });
    // Limpiar cualquier token inválido antes de redirigir
    if (token && !user) {
      localStorage.removeItem('token');
    }
    return <Navigate to="/login" replace />;
  }

  // Verificar si la ruta requiere ser admin
  if (adminOnly && user.role !== 'admin') {
    console.log('Usuario no es admin, redirigiendo a inicio');
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const { user, loading } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  // Función para verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return token && user;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  console.log('Estado de autenticación en App:', { user, token: !!token });

  return (
    <div className="flex flex-col min-h-screen">
      {isAuthenticated() && <HeaderNavbar />}
      <main className="flex-grow">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? 
                <Navigate to="/" replace /> : 
                <Login />
            } 
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/stock"
            element={
              <PrivateRoute adminOnly>
                <Stock />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <Sales />
              </PrivateRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <PrivateRoute>
                <Expenses />
              </PrivateRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <PrivateRoute adminOnly>
                <Reports />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to={isAuthenticated() ? "/" : "/login"} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;