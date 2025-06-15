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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  // Verificar si hay token y si el usuario está autenticado
  if (!token || !user) {
    console.log('Redirigiendo a login: no hay token o usuario', { token: !!token, user });
    return <Navigate to="/login" />;
  }

  // Verificar si la ruta requiere rol de admin
  if (adminOnly && user.role !== 'admin') {
    console.log('Redirigiendo a dashboard: ruta solo para admin', { role: user.role });
    return <Navigate to="/" />;
  }

  return children;
};

const App = () => {
  const { user, loading } = useContext(AuthContext);
  const token = localStorage.getItem('token');

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  }

  console.log('Estado de autenticación en App:', { user, token: !!token });

  return (
    <div className="flex flex-col min-h-screen">
      {token && user && <HeaderNavbar />}
      <main className="flex-grow">
        <Routes>
          <Route
            path="/login"
            element={token && user ? <Navigate to="/" /> : <Login />}
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
          <Route path="*" element={<Navigate to={token ? "/" : "/login"} />} />
        </Routes>
      </main>
      {token && <Footer />}
    </div>
  );
};

export default App;