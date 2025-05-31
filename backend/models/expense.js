const mongoose = require('mongoose');

/**
 * @typedef Expense
 * @property {string} type - Tipo de egreso (Servicios, Compra de Stock, Alquiler, Otros)
 * @property {string} description - Descripción del egreso
 * @property {number} amount - Monto del egreso (mayor a 0)
 * @property {Date} date - Fecha del egreso
 * @property {mongoose.Types.ObjectId} createdBy - ID del usuario que creó el egreso
 * @property {Date} createdAt - Fecha de creación (automática)
 * @property {Date} updatedAt - Fecha de actualización (automática)
 */
const expenseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'El tipo es obligatorio'],
      enum: {
        values: ['Servicios', 'Compra de Stock', 'Alquiler', 'Otros'],
        message: 'Tipo inválido: debe ser Servicios, Compra de Stock, Alquiler u Otros',
      },
      trim: true,
      maxlength: [50, 'El tipo no puede exceder 50 caracteres'],
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
    },
    amount: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0, 'El monto debe ser mayor o igual a 0'],
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

// Índice para consultas por fecha
expenseSchema.index({ date: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;