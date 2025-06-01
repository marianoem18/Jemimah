import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    type: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // Fecha local por defecto
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios
      .get('http://localhost:5000/api/expenses', {
        headers: { 'x-auth-token': token },
      })
      .then((res) => setExpenses(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // Enviar fecha como YYYY-MM-DD
      const dataToSend = {
        ...form,
        amount: parseFloat(form.amount),
        date: form.date, // Formato YYYY-MM-DD
      };
      await axios.post('http://localhost:5000/api/expenses', dataToSend, {
        headers: { 'x-auth-token': token },
      });
      setForm({ type: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      setError('');
      const res = await axios.get('http://localhost:5000/api/expenses', {
        headers: { 'x-auth-token': token },
      });
      setExpenses(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar egreso');
    }
  };

  // Formatear fecha para mostrar en la zona horaria local
  const formatDate = (date) => {
    const d = new Date(date);
    // Ajustar a la zona horaria local (-03:00) sin cambiar el día
    const offset = -3 * 60; // -3 horas en minutos
    const adjustedDate = new Date(d.getTime() + offset * 60 * 1000);
    return adjustedDate.toLocaleDateString('es-AR', { timeZone: 'UTC' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Gestión de Egresos</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Registrar Egreso</h3>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Seleccionar</option>
              <option value="Servicios">Servicios</option>
              <option value="Compra de Stock">Compra de Stock</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Monto (ARS)</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Fecha</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600"
        >
          Registrar
        </button>
      </form>
      <h3 className="text-lg font-semibold mb-4">Egresos Registrados</h3>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Monto</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td className="border px-4 py-2">{expense.type}</td>
                <td className="border px-4 py-2">${expense.amount.toFixed(2)}</td>
                <td className="border px-4 py-2">{expense.description}</td>
                <td className="border px-4 py-2">{formatDate(expense.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;