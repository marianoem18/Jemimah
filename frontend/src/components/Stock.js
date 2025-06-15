import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    size: '',
    category: '',
    type: '',
    garment: '',
    quantity: '',
    costPrice: '',
    salePrice: '',
  });
  const [error, setError] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editError, setEditError] = useState('');

  // Obtener el rol del usuario desde el token
  let userRole = '';
  const token = localStorage.getItem('token');
  if (token) {
    try {
      userRole = JSON.parse(atob(token.split('.')[1])).role;
    } catch (e) {
      userRole = '';
    }
  }

  useEffect(() => {
    if (!token) return;
    api
      .get('/api/products')
      .then((res) => setProducts(res.data.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = {
      ...form,
      quantity: parseInt(form.quantity, 10),
      costPrice: parseFloat(form.costPrice),
      salePrice: parseFloat(form.salePrice),
    };
    try {
      await api.post('/api/products', dataToSend);
      setForm({ name: '', size: '', category: '', type: '', garment: '', quantity: '', costPrice: '', salePrice: '' });
      setError('');
      const res = await api.get('/api/products');
      setProducts(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al agregar producto');
    }
  };

  const handleEditClick = (product) => {
    setEditingProductId(product._id);
    setEditQuantity(product.quantity);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setEditQuantity('');
    setEditError('');
  };

  const handleSaveEdit = async (productId) => {
    if (!Number.isInteger(Number(editQuantity)) || Number(editQuantity) < 0) {
      setEditError('La cantidad debe ser un número entero no negativo');
      return;
    }
    try {
      await api.put(
        `/api/products/${productId}/quantity`,
        { quantity: Number(editQuantity) }
      );
      const res = await api.get('/api/products');
      setProducts(res.data.data);
      setEditingProductId(null);
      setEditQuantity('');
      setEditError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setEditError('Sesión expirada. Inicie sesión nuevamente.');
        setTimeout(() => window.location.href = '/login', 1500);
      } else if (err.response?.status === 403) {
        setEditError('Acceso denegado. No tiene permisos para editar.');
      } else {
        setEditError(err.response?.data?.error?.message || 'Error al actualizar cantidad');
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Gestión de Stock</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Agregar Producto</h3>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Talle</label>
            <input
              type="text"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Categoría</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Seleccionar</option>
              <option value="Bebé">Bebé</option>
              <option value="Nene/Nena">Nene/Nena</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Seleccionar</option>
              <option value="Varón">Varón</option>
              <option value="Mujer">Mujer</option>
              <option value="Unisex">Unisex</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Prenda</label>
            <select
              value={form.garment}
              onChange={(e) => setForm({ ...form, garment: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            >
              <option value="">Seleccionar</option>
              <option value="Camiseta">Camiseta</option>
              <option value="Jeans">Jeans</option>
              <option value="Buzos">Buzos</option>
              <option value="Medias">Medias</option>
              <option value="Camperas">Camperas</option>
              <option value="Pantalones">Pantalones</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Cantidad</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Precio de costo (ARS)</label>
            <input
              type="number"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Precio de venta (ARS)</label>
            <input
              type="number"
              step="0.01"
              value={form.salePrice}
              onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600"
        >
          Agregar
        </button>
      </form>
      <h3 className="text-lg font-semibold mb-4">Inventario</h3>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Talle</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Prenda</th>
              <th className="px-4 py-2">Cantidad</th>
              <th className="px-4 py-2">Precio de costo</th>
              <th className="px-4 py-2">Precio de venta</th>
              {userRole === 'admin' && <th className="px-4 py-2">Acción</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td className="border px-4 py-2">{product.name}</td>
                <td className="border px-4 py-2">{product.size}</td>
                <td className="border px-4 py-2">{product.category}</td>
                <td className="border px-4 py-2">{product.type}</td>
                <td className="border px-4 py-2">{product.garment}</td>
                <td className="border px-4 py-2">
                  {editingProductId === product._id ? (
                    <input
                      type="number"
                      value={editQuantity}
                      min="0"
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="w-20 px-2 py-1 border rounded"
                    />
                  ) : (
                    product.quantity
                  )}
                </td>
                <td className="border px-4 py-2">${product.costPrice?.toFixed(2) || 'N/A'}</td>
                <td className="border px-4 py-2">${product.salePrice?.toFixed(2) || 'N/A'}</td>
                {userRole === 'admin' && (
                  <td className="border px-4 py-2">
                    {editingProductId === product._id ? (
                      <>
                        <button
                          className="bg-pink-500 text-white px-2 py-1 rounded mr-2 hover:bg-pink-600"
                          onClick={() => handleSaveEdit(product._id)}
                        >
                          Guardar
                        </button>
                        <button
                          className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                          onClick={handleCancelEdit}
                        >
                          Cancelar
                        </button>
                        {editError && <p className="text-red-500 mt-2">{editError}</p>}
                      </>
                    ) : (
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => handleEditClick(product)}
                        disabled={editingProductId !== null}
                      >
                        Editar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Stock;