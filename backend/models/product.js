const mongoose = require('mongoose');

/**
 * @typedef Product
 * @property {string} name - Nombre del producto
 * @property {string} category - Categoría (Bebé, Nene/Nena)
 * @property {string} type - Tipo (Varón, Mujer, Unisex)
 * @property {string} garment - Prenda (Camiseta, Jeans, Buzos, Medias, Camperas, Pantalones)
 * @property {string} size - Talla
 * @property {string} color - Color
 * @property {number} quantity - Cantidad en stock (>= 0)
 * @property {number} price - Precio (>= 0)
 * @property {mongoose.Types.ObjectId} createdBy - ID del usuario que creó el producto
 * @property {mongoose.Types.ObjectId} updatedBy - ID del usuario que actualizó el producto
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: ['Bebé', 'Nene/Nena'],
        message: 'Categoría inválida: debe ser Bebé o Nene/Nena',
      },
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'El tipo es obligatorio'],
      enum: {
        values: ['Varón', 'Mujer', 'Unisex'],
        message: 'Tipo inválido: debe ser Varón, Mujer o Unisex',
      },
      trim: true,
    },
    garment: {
      type: String,
      required: [true, 'La prenda es obligatoria'],
      enum: {
        values: ['Camiseta', 'Jeans', 'Buzos', 'Medias', 'Camperas', 'Pantalones'],
        message: 'Prenda inválida: debe ser Camiseta, Jeans, Buzos, Medias, Camperas o Pantalones',
      },
      trim: true,
    },
    size: {
      type: String,
      required: [true, 'La talla es obligatoria'],
      trim: true,
      maxlength: [20, 'La talla no puede exceder 20 caracteres'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [0, 'La cantidad no puede ser negativa'],
      default: 0,
    },

    costPrice: {
      type: Number,
      required: [true, 'El precio de costo es obligatorio'],
      min: [0, 'El precio de costo no puede ser negativo'],
      default: 0,
    },
    salePrice: {
      type: Number,
      required: [true, 'El precio de venta es obligatorio'],
      min: [0, 'El precio de venta no puede ser negativo'],
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Opcional, pero útil para auditoría
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Opcional, para actualizaciones
    }
  },
  { timestamps: true } // Añade createdAt y updatedAt automáticamente
);

// Índices para consultas frecuentes
productSchema.index({ createdAt: -1 }); // Para ordenamiento en /routes/products.js
productSchema.index({ category: 1 }); // Para agregaciones en /routes/reports.js

const Product = mongoose.model('Product', productSchema);

module.exports = Product;