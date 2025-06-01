import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HeaderNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/stock', label: 'Stock' },
    { to: '/sales', label: 'Ventas' },
    { to: '/expenses', label: 'Egresos' },
    { to: '/reports', label: 'Reportes' },
  ];

  const employeeLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/sales', label: 'Ventas' },
    { to: '/expenses', label: 'Egresos' },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <header className="bg-gray-800 text-white shadow-md py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Izquierda: Nombre del sitio */}
        <Link to="/" className="text-xl font-bold">
          Jemimah Kids
        </Link>

        {/* Centro: Menú (visible en escritorio, colapsable en móvil) */}
        <nav className="hidden sm:flex flex-grow justify-center">
          <ul className="flex space-x-6">
            {user &&
              links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-pink-300">
                    {link.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        {/* Derecha: Cerrar sesión (nombre) */}
        <div className="hidden sm:flex items-center space-x-4">
          {user && (
            <span className="text-gray-300">
              {user.name || 'Usuario'}
            </span>
          )}
          {user && (
            <button onClick={handleLogout} className="hover:text-pink-300">
              Cerrar Sesión
            </button>
          )}
        </div>

        {/* Botón hamburguesa para móviles */}
        <button
          className="sm:hidden text-white focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Menú móvil (colapsable) */}
      {isMenuOpen && (
        <nav className="sm:hidden bg-gray-800 px-4 py-2">
          <ul className="flex flex-col space-y-2">
            {user &&
              links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="block hover:text-pink-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            {user && (
              <li>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">
                    {user.name || 'Usuario'}
                  </span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="hover:text-pink-300"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default HeaderNavbar;