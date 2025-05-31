const mongoose = require('mongoose');

/**
 * @typedef Sale
 * @property {mongoose.Types.ObjectId} productId - ID del producto (referencia a Product)
 * @property {string} productName - Nombre del producto
 * @property {string} size - Talla
 * @property {string} color - Color
 * @property {number} quantity - Cantidad vendida (>= 1)
 * @property {number} total - Total de la venta (>= 0)
 * @property {string} paymentMethod - Método de pago (cash, card, transfer)
 * @property {string} seller - Nombre del vendedor
 * @property {Date} date - Fecha de la venta
 * @property {mongoose.Types.ObjectId} createdBy - ID del usuario que creó la venta
 * @property {Date} createdAt - Fecha de creación (automática)
 * @property {Date} updatedAt - Fecha de actualización (automática)
 */
const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El ID del producto es obligatorio'],
    },
    productName: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    size: {
      type: String,
      required: [true, 'La talla es obligatoria'],
      trim: true,
      maxlength: [20, 'La talla no puede exceder 20 caracteres'],
    },
    color: {
      type: String,
      required: [true, 'El color es obligatorio'],
      trim: true,
      maxlength: [30, 'El color no puede exceder 30 caracteres'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser al menos 1'],
    },
    total: {
      type: Number,
      required: [true, 'El total es obligatorio'],
      min: [0, 'El total no puede ser negativo'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'El método de pago es obligatorio'],
      enum: {
        values: ['cash', 'card', 'transfer'],
        message: 'Método de pago inválido: debe ser cash, card o transfer',
      },
    },
    seller: {
      type: String,
      required: [true, 'El vendedor es obligatorio'],
      trim: true,
      maxlength: [50, 'El vendedor no puede exceder 50 caracteres'],
    },
    date: {
      type: Date,
      required: [true, 'La fecha es obligatoria'],
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Opcional, pero útil para auditoría
    },
  },
  { timestamps: true }
);

// Índices para consultas frecuentes
saleSchema.index({ date: -1 }); // Para ordenamiento en /routes/sales.js y /routes/reports.js
saleSchema.index({ productId: 1 }); // Para consultas en /routes/sales.js

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;