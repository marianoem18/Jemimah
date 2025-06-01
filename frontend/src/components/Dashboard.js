import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [totalStockQuantity, setTotalStockQuantity] = useState(0);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Obtener resumen diario
    axios.get(`http://localhost:5000/api/reports/summary?date=${today}&type=daily`, {
        headers: { 'x-auth-token': token },
      })
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
    axios.get('http://localhost:5000/api/products', {
        headers: { 'x-auth-token': token },
      })
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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Panel de Control - {today}</h2>
      {summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Ventas del Día</h3>
            <p className="text-xl">${summary.totalSales ? summary.totalSales.toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Productos Vendidos</h3>
            <p className="text-xl">{summary.totalProductsSold || 0}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Stock Total</h3>
            <p className="text-xl">{totalStockQuantity}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Gastos del Día</h3>
            <p className="text-xl">${summary.totalExpenses ? summary.totalExpenses.toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">Ganancia Neta</h3>
            <p className="text-xl">${summary.netProfit ? summary.netProfit.toFixed(2) : '0.00'}</p>
          </div>
        </div>
      ) : (
        <p>Cargando resumen...</p>
      )}
      {lowStock.length > 0 && (
        <div className="bg-red-100 p-4 rounded mb-8">
          <h3 className="font-semibold text-red-700">Alerta: Stock Bajo</h3>
          <ul className="list-disc pl-5">
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