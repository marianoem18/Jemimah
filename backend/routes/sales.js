const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const Sale = require('../models/sale');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const logger = require('winston');
const router = express.Router();

// Validation schema for POST
const saleSchema = Joi.object({
  productId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.pattern.base': 'ID de producto inválido',
    'any.required': 'ID de producto obligatorio',
  }),
  productName: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Nombre no puede estar vacío',
    'string.max': 'Nombre no puede exceder 100 caracteres',
    'any.required': 'Nombre obligatorio',
  }),
  size: Joi.string().min(1).max(20).required().messages({
    'string.min': 'Talla no puede estar vacía',
    'string.max': 'Talla no puede exceder 20 caracteres',
    'any.required': 'Talla obligatoria',
  }),
  color: Joi.string().min(1).max(30).required().messages({
    'string.min': 'Color no puede estar vacío',
    'string.max': 'Color no puede exceder 30 caracteres',
    'any.required': 'Color obligatorio',
  }),
  quantity: Joi.number().integer().positive().required().messages({
    'number.positive': 'Cantidad debe ser mayor a 0',
    'any.required': 'Cantidad obligatoria',
  }),
  total: Joi.number().positive().required().messages({
    'number.positive': 'Total debe ser mayor a 0',
    'any.required': 'Total obligatorio',
  }),
  paymentMethod: Joi.string().valid('cash', 'card', 'transfer').required().messages({
    'any.only': 'Método de pago debe ser "cash", "card" o "transfer"',
    'any.required': 'Método de pago obligatorio',
  }),
  seller: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Vendedor no puede estar vacío',
    'string.max': 'Vendedor no puede exceder 50 caracteres',
    'any.required': 'Vendedor obligatorio',
  }),
});

/**
 * @route GET /api/sales
 * @description Get all sales (admin or employee)
 * @access Protected (admin, employee)
 * @returns {Object} List of sales
 * @throws {500} If server error occurs
 */
router.get('/', auth, async (req, res) => {
  try {
    const sales = await Sale.find()
      .select('productId productName size color quantity total paymentMethod seller date')
      .sort({ date: -1 })
      .limit(100);
    logger.info(`Sales retrieved by user: ${req.user.id}`);
    res.json({ data: sales });
  } catch (error) {
    logger.error(`Error fetching sales for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route GET /api/sales/today
 * @description Get today's sales (admin or employee)
 * @access Protected (admin, employee)
 * @returns {Object} List of today's sales
 * @throws {500} If server error occurs
 */
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const sales = await Sale.find({
      date: { $gte: today, $lt: tomorrow },
    })
      .select('productId productName size color quantity total paymentMethod seller date')
      .sort({ date: -1 });

    logger.info(`Today's sales retrieved by user: ${req.user.id}`);
    res.json({ data: sales });
  } catch (error) {
    logger.error(`Error fetching today's sales for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route POST /api/sales
 * @description Create a new sale (admin or employee)
 * @access Protected (admin, employee)
 * @param {Object} req.body - Sale data (productId, productName, size, color, quantity, total, paymentMethod, seller)
 * @returns {Object} Created sale
 * @throws {400} If validation fails or insufficient stock
 * @throws {404} If product not found
 * @throws {500} If server error occurs
 */
router.post('/', auth, async (req, res) => {
  const { error } = saleSchema.validate(req.body);
  if (error) {
    logger.warn(`Invalid sale creation attempt by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { productId, productName, size, color, quantity, total, paymentMethod, seller } = req.body;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const product = await Product.findById(productId).session(session);
    if (!product) {
      await session.abortTransaction();
      logger.warn(`Product not found: ${productId} by user ${req.user.id}`);
      return res.status(404).json({
        error: { code: 404, message: 'Producto no encontrado', details: 'No se encontró un producto con el ID proporcionado' },
      });
    }

    if (product.quantity < quantity) {
      await session.abortTransaction();
      logger.warn(`Insufficient stock for product ${productId} by user ${req.user.id}`);
      return res.status(400).json({
        error: { code: 400, message: 'Stock insuficiente', details: `Disponible: ${product.quantity}, solicitado: ${quantity}` },
      });
    }

    const newSale = new Sale({
      productId,
      productName,
      size,
      color,
      quantity,
      total,
      paymentMethod,
      seller,
      date: new Date(),
      createdBy: req.user.id,
    });

    product.quantity -= quantity;
    await Promise.all([newSale.save({ session }), product.save({ session })]);

    await session.commitTransaction();
    logger.info(`Sale created by user ${req.user.id}: ${newSale._id}`);
    res.status(201).json({ data: newSale });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating sale for user ${req.user.id}: ${error.message}`);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: { code: 400, message: 'Datos inválidos', details: error.message },
      });
    }
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  } finally {
    session.endSession();
  }
});

/**
 * @route DELETE /api/sales/:id
 * @description Delete a sale and restore stock (admin or employee)
 * @access Protected (admin, employee)
 * @param {string} req.params.id - Sale ID
 * @returns {Object} Deletion confirmation
 * @throws {400} If ID is invalid
 * @throws {404} If sale not found
 * @throws {500} If server error occurs
 */
router.delete('/:id', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    logger.warn(`Invalid sale ID: ${req.params.id} by user ${req.user.id}`);
    return res.status(400).json({
      error: { code: 400, message: 'ID inválido', details: 'El ID proporcionado no es válido' },
    });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const sale = await Sale.findById(req.params.id).session(session);
    if (!sale) {
      await session.abortTransaction();
      logger.warn(`Sale not found: ${req.params.id} by user ${req.user.id}`);
      return res.status(404).json({
        error: { code: 404, message: 'Venta no encontrada', details: 'No se encontró una venta con el ID proporcionado' },
      });
    }

    const product = await Product.findById(sale.productId).session(session);
    if (product) {
      product.quantity += sale.quantity;
      await product.save({ session });
    }

    await sale.deleteOne({ session });
    await session.commitTransaction();

    logger.info(`Sale deleted by user ${req.user.id}: ${req.params.id}`);
    res.json({
      data: {
        message: 'Venta eliminada con éxito',
        sale,
        stockRestored: product ? true : false,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting sale ${req.params.id} for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;