import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [totalStockQuantity, setTotalStockQuantity] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Obtener resumen diario
    api.get(`/api/reports/summary?date=${today}&type=daily`)
      .then((res) => setSummary(res.data.data))
      .catch((err) => {
        console.error('Error fetching summary:', err);
        // Manejar errores específicos
        if (err.response) {
          if (err.response.status === 401) {
            // Redirigir a login si no está autenticado
            window.location.href = '/login';
          } else if (err.response.status === 403) {
            alert('Acceso denegado. No tienes permisos para ver esta información.');
          }
        }
      });

    // Obtener productos
    api.get('/api/products')
      .then((res) => {
        const allProducts = res.data.data;
        // Calcular stock bajo
        const low = allProducts.filter((p) => p.quantity < 5);
        setLowStock(low);
        // Calcular stock total
        const totalQuantity = allProducts.reduce((total, product) => total + product.quantity, 0);
        setTotalStockQuantity(totalQuantity);
      })
      .catch((err) => console.error('Error fetching products:', err));
  }, [today]);

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Panel de Control - {today}</h2>
      {summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">Ventas del Día</h3>
            <p className="text-2xl font-bold text-green-600">${summary.totalSales ? summary.totalSales.toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">Productos Vendidos</h3>
            <p className="text-2xl font-bold text-blue-600">{summary.totalProductsSold || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">Stock Total</h3>
            <p className="text-2xl font-bold text-purple-600">{totalStockQuantity}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">Gastos del Día</h3>
            <p className="text-2xl font-bold text-red-600">${summary.totalExpenses ? summary.totalExpenses.toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="font-semibold text-lg text-gray-700 mb-2">Ganancia Neta</h3>
            <p className="text-2xl font-bold text-teal-600">${summary.netProfit ? summary.netProfit.toFixed(2) : '0.00'}</p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">Cargando resumen...</p>
      )}
      {lowStock.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-md mb-8" role="alert">
          <h3 className="font-bold text-lg mb-2">Alerta: Stock Bajo</h3>
          <ul className="list-disc pl-5 space-y-1">
            {lowStock.map((product) => (
              <li key={product._id}>
                {product.name} (Talle: {product.size}, Cantidad: {product.quantity})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;