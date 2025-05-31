const permissions = [
  // Permisos para admin
  { role: 'admin', path: '/api/products', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  { role: 'admin', path: '/api/sales', methods: ['GET', 'POST', 'DELETE'] },
  { role: 'admin', path: '/api/expenses', methods: ['GET', 'POST', 'DELETE'] },
  { role: 'admin', path: '/api/reports', methods: ['GET'] },
  { role: 'admin', path: '/api/reports/summary', methods: ['GET'] },
  { role: 'admin', path: '/api/auth/register', methods: ['POST'] },
  // Permisos para employee
  { role: 'employee', path: '/api/sales', methods: ['GET', 'POST', 'DELETE'] },
  { role: 'employee', path: '/api/expenses', methods: ['GET', 'POST', 'DELETE'] },
];

module.exports = permissions;