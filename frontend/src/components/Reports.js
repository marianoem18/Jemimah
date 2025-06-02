import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';

const Reports = () => {
  const [report, setReport] = useState(null);
  const [historicalReports, setHistoricalReports] = useState([]);
  const today = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');
  const thirtyDaysAgo = moment().tz('America/Argentina/Buenos_Aires').subtract(30, 'days').format('YYYY-MM-DD');

  const formatCurrency = (amount) => {
    return amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  const formatPaymentMethods = (methods) => {
    if (!methods) return 'No data available';
    return Object.entries(methods)
      .map(([method, amount]) => `${method}: ${formatCurrency(amount)}`)
      .join(', ');
  };

  const fetchReports = () => {
    const token = localStorage.getItem('token');
    const headers = { 'x-auth-token': token };

    // Obtener reporte diario
    axios
      .get(`http://localhost:5000/api/reports/summary?type=daily&date=${today}`, { headers })
      .then((res) => {
        const data = res.data.data;
        setReport(
          data.totalSales || data.totalExpenses || data.totalProductsSold
            ? data
            : {
                date: today,
                type: 'daily',
                totalProductsSold: 0,
                totalSales: 0,
                totalExpenses: 0,
                netProfit: 0,
                salesByPaymentMethod: {},
              }
        );
      })
      .catch((err) => {
        console.error(err);
        setReport({
          date: today,
          type: 'daily',
          totalProductsSold: 0,
          totalSales: 0,
          totalExpenses: 0,
          netProfit: 0,
          salesByPaymentMethod: {},
        });
      });

    // Obtener reportes históricos
    axios
      .get(`http://localhost:5000/api/reports/history?startDate=${thirtyDaysAgo}&endDate=${today}`, { headers })
      .then((res) => {
        setHistoricalReports(res.data.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchReports();
    // Actualizar cada 1 minuto para detectar cambios por el cron job
    const interval = setInterval(fetchReports, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString) => {
    return moment(dateString).tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY');
  };

  const downloadReport = () => {
    if (!report) return;
    const content = `
Reporte Diario - ${formatDate(report.date)}
Total Ventas: ${formatCurrency(report.totalSales)}
Total Egresos: ${formatCurrency(report.totalExpenses)}
Ganancia Neta: ${formatCurrency(report.netProfit)}
Ventas por Método de Pago:
${Object.entries(report.salesByPaymentMethod)
  .map(([method, amount]) => `${method}: ${formatCurrency(amount)}`)
  .join('\n')}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${today}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const download20DaysReport = () => {
    const token = localStorage.getItem('token');
    axios
      .get(`http://localhost:5000/api/reports/summary?date=${today}&type=20days`, {
        headers: { 'x-auth-token': token },
      })
      .then((res) => {
        const report20Days = res.data.data;
        const content = `
Reporte de 20 días - ${formatDate(report20Days.date)}
Total Ventas: ${formatCurrency(report20Days.totalSales)}
Total Egresos: ${formatCurrency(report20Days.totalExpenses)}
Ganancia Neta: ${formatCurrency(report20Days.netProfit)}
Total Productos Vendidos: ${report20Days.totalProductsSold}
Ventas por Método de Pago:
${Object.entries(report20Days.salesByPaymentMethod)
  .map(([method, amount]) => `${method}: ${formatCurrency(amount)}`)
  .join('\n')}
        `;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_20dias_${today}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Reportes - {formatDate(today)}</h2>

      {/* Resumen Diario */}
      {report ? (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">Resumen Diario</h3>
          <p><strong>Fecha:</strong> {formatDate(report.date)}</p>
          <p><strong>Total Ventas:</strong> {formatCurrency(report.totalSales)}</p>
          <p><strong>Total Egresos:</strong> {formatCurrency(report.totalExpenses)}</p>
          <p><strong>Ganancia Neta:</strong> {formatCurrency(report.netProfit)}</p>
          <h4 className="font-semibold mt-4">Ventas por Método de Pago</h4>
          <ul className="list-disc pl-5 mb-4">
            {Object.entries(report.salesByPaymentMethod).length > 0 ? (
              Object.entries(report.salesByPaymentMethod).map(([method, amount]) => (
                <li key={method}>
                  {method}: {formatCurrency(amount)}
                </li>
              ))
            ) : (
              <li>No hay ventas registradas</li>
            )}
          </ul>
          <div className="flex gap-4">
            <button
              onClick={downloadReport}
              className="bg-pink-500 text-white py-2 px-4 rounded hover:bg-pink-600"
            >
              Descargar Reporte Diario
            </button>
            <button
              onClick={download20DaysReport}
              className="bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600"
            >
              Descargar Reporte 20 Días
            </button>
          </div>
        </div>
      ) : (
        <p>Cargando reporte...</p>
      )}

      {/* Tabla de Reportes Históricos */}
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Historial de Reportes</h3>
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos Vendidos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia Neta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Métodos de Pago</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {historicalReports.map((report) => (
              <tr key={report.date}>
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(report.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{report.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{report.totalProductsSold} unidades</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(report.totalSales)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(report.totalExpenses)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(report.netProfit)}</td>
                <td className="px-6 py-4">{formatPaymentMethods(report.salesByPaymentMethod)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;