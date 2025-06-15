import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Sales = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({
    items: [],
    paymentMethod: '',
    seller: '',
  });
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const token = localStorage.getItem('token');
    api
      .get('/api/products')
      .then((res) => setProducts(res.data.data))
      .catch((err) => console.error(err));

    api
      .get('/api/sales/today')
      .then((res) => {
        setSales(res.data.data);
      })
      .catch((err) => console.error(err));

    // ADDED: Fetch user info to pre-fill seller name
    axios
      .get('http://localhost:5000/api/auth/me', {
        headers: { 'x-auth-token': token },
      })
      .then((res) => {
        setForm((prevForm) => ({ ...prevForm, seller: res.data.name || '' }));
      })
      .catch((err) => console.error('Error fetching user info:', err));

  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/sales', saleData);
      setForm({ items: [], paymentMethod: '', seller: '' });
      setError('');
      
      // Actualizar solo con las ventas del día
      // REMOVED: const res = await axios.get('http://localhost:5000/api/sales/today', {
      // REMOVED:   headers: { 'x-auth-token': token },
      // REMOVED: });
      // REMOVED: setSales(res.data.data);

      // ADDED: Fetch all sales and filter by today's date
      const salesRes = await api.get('/api/sales/today');
      const todaySales = res.data.data.filter(
        (sale) => new Date(sale.date).toISOString().split('T')[0] === today
      );
      setSales(todaySales);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error al registrar venta');
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setSearch('');
  };

  const addItem = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      setError('Selecciona un producto y una cantidad válida');
      return;
    }
    setForm({
      ...form,
      items: [
        ...form.items,
        { productId: selectedProduct._id, quantity: parseInt(quantity) },
      ],
    });
    setSelectedProduct(null);
    setQuantity('');
    setError('');
  };

  const removeItem = (index) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  // REMOVED DUPLICATE handleSubmit FUNCTION
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (form.items.length === 0) {
  //     setError('Debe agregar al menos un producto');
  //     return;
  //   }
  //   try {
  //     const token = localStorage.getItem('token');
  //     await axios.post('http://localhost:5000/api/sales', form, {
  //       headers: { 'x-auth-token': token },
  //     });
  //     setForm({ items: [], paymentMethod: '', seller: '' });
  //     setError('');
  //     const res = await axios.get('http://localhost:5000/api/sales', {
  //       headers: { 'x-auth-token': token },
  //     });
  //     const todaySales = res.data.data.filter(
  //       (sale) => new Date(sale.date).toISOString().split('T')[0] === today
  //     );
  //     setSales(todaySales);
  //   } catch (err) {
  //     setError(err.response?.data?.error?.message || 'Error al registrar venta');
  //   }
  // };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Gestión de Ventas</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Registrar Venta</h3>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        
        {/* Sección para agregar productos */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-2">Agregar Productos</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">Producto</label>
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Buscar producto..."
                className="w-full px-3 py-2 border rounded"
              />
              {search && filteredProducts.length > 0 && (
                <ul className="border rounded mt-1 max-h-40 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <li
                      key={product._id}
                      onClick={() => selectProduct(product)}
                      className="px-3 py-1 hover:bg-gray-200 cursor-pointer"
                    >
                      {product.name} (Talle: {product.size})
                    </li>
                  ))}
                </ul>
              )}
              <input
                type="text"
                value={selectedProduct ? `${selectedProduct.name} (Talle: ${selectedProduct.size})` : ''}
                readOnly
                className="w-full px-3 py-2 border rounded mt-2"
              />
            </div>
            <div>
              <label className="block text-gray-700">Cantidad</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Agregar Producto
          </button>
        </div>

        {/* Lista de productos seleccionados */}
        {form.items.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">Productos Seleccionados</h4>
            <ul className="border rounded">
              {form.items.map((item, index) => {
                const product = products.find((p) => p._id === item.productId);
                return (
                  <li key={index} className="flex justify-between px-3 py-2 border-b">
                    <span>
                      {product ? `${product.name} (Talle: ${product.size})` : 'Producto no encontrado'} - Cantidad: {item.quantity}
                    </span>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Separador visual */}
        <hr className="my-6 border-gray-300" />

        {/* Sección para detalles de la venta */}
        <div>
          <h4 className="text-md font-semibold mb-2">Detalles de la Venta</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700">Método de Pago</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              >
                <option value="">Seleccionar</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">Vendedor</label>
              <input
                type="text"
                value={form.seller}
                onChange={(e) => setForm({ ...form, seller: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600"
        >
          Registrar Venta
        </button>
      </form>
      <h3 className="text-lg font-semibold mb-4">Ventas del Día</h3>
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Productos</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Método</th>
              <th className="px-4 py-2">Vendedor</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale._id}>
                <td className="border px-4 py-2">
                  <ul>
                    {sale.items.map((item, index) => (
                      <li key={index}>
                        {item.productId?.name || 'N/A'} (Talle: {item.productId?.size || 'N/A'}, Cantidad: {item.quantity}, Precio: ${item.unitPrice.toFixed(2)})
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="border px-4 py-2">${sale.total.toFixed(2)}</td>
                <td className="border px-4 py-2">{sale.paymentMethod}</td>
                <td className="border px-4 py-2">{sale.seller}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Sales;