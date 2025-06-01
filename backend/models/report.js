const mongoose = require('mongoose');

/**
 * @typedef Report
 * @property {string} date - Fecha del reporte (YYYY-MM-DD)
 * @property {string} type - Tipo de reporte (daily, range)
 * @property {number} totalProductsSold - Total de productos vendidos
 * @property {number} totalSales - Total de ventas
 * @property {number} totalExpenses - Total de gastos
 * @property {number} netProfit - Ganancia neta
 * @property {Object} salesByPaymentMethod - Ventas por método de pago
 * @property {Date} createdAt - Fecha de creación (automática)
 */
const reportSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'La fecha es obligatoria'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido. Use YYYY-MM-DD'],
    },
    type: {
      type: String,
      required: [true, 'El tipo es obligatorio'],
      enum: {
        values: ['daily', 'range'],
        message: 'Tipo inválido: debe ser daily o range',
      },
      default: 'daily',
    },
    totalProductsSold: {
      type: Number,
      required: [true, 'El total de productos vendidos es obligatorio'],
      min: [0, 'El total de productos vendidos no puede ser negativo'],
      default: 0,
    },
    totalSales: {
      type: Number,
      required: [true, 'El total de ventas es obligatorio'],
      min: [0, 'El total de ventas no puede ser negativo'],
      default: 0,
    },
    totalExpenses: {
      type: Number,
      required: [true, 'El total de gastos es obligatorio'],
      min: [0, 'El total de gastos no puede ser negativo'],
      default: 0,
    },
    netProfit: {
      type: Number,
      required: [true, 'La ganancia neta es obligatoria'],
      default: 0,
    },
    salesByPaymentMethod: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

// Índice para consultas por fecha
reportSchema.index({ date: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;