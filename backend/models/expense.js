const mongoose = require('mongoose');
const moment = require('moment-timezone');

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
expenseSchema.index({ date: -1, createdAt: -1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;