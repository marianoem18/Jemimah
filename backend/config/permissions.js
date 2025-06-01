const permissions = [
  // Permisos para admin
  { role: 'admin', path: '/api/products', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { role: 'admin', path: '/api/sales', methods: ['GET', 'POST', 'DELETE'] },
  { role: 'admin', path: '/api/expenses', methods: ['GET', 'POST', 'DELETE'] },
  { role: 'admin', path: '/api/reports', methods: ['GET'] },
  { role: 'admin', path: '/api/reports/summary', methods: ['GET'] },
  { role: 'admin', path: '/api/reports/history', methods: ['GET'] },
  { role: 'admin', path: '/api/reports/generate', methods: ['POST'] },
  { role: 'admin', path: '/api/auth/register', methods: ['POST'] },
  { role: 'admin', path: '/api/products/:id/quantity', methods: ['PUT'] },
  {role: 'user',  path: '/api/auth/me', methods: ['GET'] },
  // Permisos para employee
  { role: 'employee', path: '/api/sales', methods: ['GET', 'POST', 'DELETE'] },
  { role: 'employee', path: '/api/expenses', methods: ['GET', 'POST', 'DELETE'] },
  { role: 'employee', path: '/api/products', methods: ['GET'] },
  { role: 'employee', path: '/api/reports/summary', methods: ['GET'] }
];

module.exports = permissions;