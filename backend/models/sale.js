const mongoose = require('mongoose');
const moment = require('moment-timezone');

const saleSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: [true, 'El ID del producto es obligatorio'],
        },
        quantity: {
          type: Number,
          required: [true, 'La cantidad es obligatoria'],
          min: [1, 'La cantidad debe ser al menos 1'],
        },
        unitPrice: {
          type: Number,
          required: [true, 'El precio unitario es obligatorio'],
          min: [0, 'El precio unitario no puede ser negativo'],
        },
      },
    ],
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
      default: () => moment.tz('America/Argentina/Buenos_Aires').toDate(),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Índice compuesto para consultas por fecha
saleSchema.index({ date: -1, createdAt: -1 });
saleSchema.index({ 'items.productId': 1 });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;