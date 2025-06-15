import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Añadir estado para el error
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Limpiar errores previos
    try {
      await login(email, password);
      // Si llegamos aquí, el login fue exitoso
      navigate('/');
    } catch (err) {
      console.error('Error en Login.js:', err);
      // Usar el mensaje amigable del interceptor o un mensaje predeterminado
      setError(err.friendlyMessage || err.toString() || 'Credenciales inválidas. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>} {/* Mostrar el error */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-pink-500 text-white py-2 rounded hover:bg-pink-600"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;