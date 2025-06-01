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

  // Si hay token, considerar al usuario autenticado incluso si user es null o tiene error
  if (!token) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user?.role !== 'admin') {
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

  return (
    <div className="flex flex-col min-h-screen">
      {token && <HeaderNavbar />}
      <main className="flex-grow">
        <Routes>
          <Route
            path="/login"
            element={token && !user?.error ? <Navigate to="/" /> : <Login />}
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