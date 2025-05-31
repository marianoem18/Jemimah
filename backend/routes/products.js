const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const logger = require('winston');
const router = express.Router();

// Validation schema for POST and PUT
const productSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'El nombre no puede estar vacío',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'El nombre es obligatorio',
  }),
  category: Joi.string().min(1).max(50).required().messages({
    'string.min': 'La categoría no puede estar vacía',
    'string.max': 'La categoría no puede exceder 50 caracteres',
    'any.required': 'La categoría es obligatoria',
  }),
  type: Joi.string().min(1).max(50).required().messages({
    'string.min': 'El tipo no puede estar vacío',
    'string.max': 'El tipo no puede exceder 50 caracteres',
    'any.required': 'El tipo es obligatorio',
  }),
  garment: Joi.string().min(1).max(50).required().messages({
    'string.min': 'La prenda no puede estar vacía',
    'string.max': 'La prenda no puede exceder 50 caracteres',
    'any.required': 'La prenda es obligatoria',
  }),
  size: Joi.string().min(1).max(20).required().messages({
    'string.min': 'La talla no puede estar vacía',
    'string.max': 'La talla no puede exceder 20 caracteres',
    'any.required': 'La talla es obligatoria',
  }),
  color: Joi.string().min(1).max(30).required().messages({
    'string.min': 'El color no puede estar vacío',
    'string.max': 'El color no puede exceder 30 caracteres',
    'any.required': 'El color es obligatorio',
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'La cantidad no puede ser negativa',
    'any.required': 'La cantidad es obligatoria',
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'El precio no puede ser negativo',
    'any.required': 'El precio es obligatorio',
  }),
});

/**
 * @route GET /api/products
 * @description Get all products (admin only)
 * @access Protected (admin)
 * @returns {Object} List of products
 * @throws {500} If server error occurs
 */
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find()
      .select('name category type garment size color quantity price')
      .sort({ createdAt: -1 })
      .limit(100);
    logger.info(`Products retrieved by user: ${req.user.id}`);
    res.json({ data: products });
  } catch (error) {
    logger.error(`Error fetching products for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route POST /api/products
 * @description Create a new product (admin only)
 * @access Protected (admin)
 * @param {Object} req.body - Product data (name, category, type, garment, size, color, quantity, price)
 * @returns {Object} Created product
 * @throws {400} If validation fails
 * @throws {500} If server error occurs
 */
router.post('/', auth, async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) {
    logger.warn(`Invalid product creation attempt by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  try {
    const newProduct = new Product({ ...req.body, createdBy: req.user.id });
    const savedProduct = await newProduct.save();
    logger.info(`Product created by user ${req.user.id}: ${savedProduct._id}`);
    res.status(201).json({ data: savedProduct });
  } catch (error) {
    logger.error(`Error creating product for user ${req.user.id}: ${error.message}`);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: { code: 400, message: 'Datos inválidos', details: error.message },
      });
    }
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route PUT /api/products/:id
 * @description Update a product (admin only)
 * @access Protected (admin)
 * @param {string} req.params.id - Product ID
 * @param {Object} req.body - Updated product data
 * @returns {Object} Updated product
 * @throws {400} If validation fails or ID is invalid
 * @throws {404} If product not found
 * @throws {500} If server error occurs
 */
router.put('/:id', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    logger.warn(`Invalid product ID: ${req.params.id} by user ${req.user.id}`);
    return res.status(400).json({
      error: { code: 400, message: 'ID inválido', details: 'El ID proporcionado no es válido' },
    });
  }

  const { error } = productSchema.validate(req.body);
  if (error) {
    logger.warn(`Invalid product update attempt by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      logger.warn(`Product not found: ${req.params.id} by user ${req.user.id}`);
      return res.status(404).json({
        error: { code: 404, message: 'Producto no encontrado', details: 'No se encontró un producto con el ID proporcionado' },
      });
    }

    logger.info(`Product updated by user ${req.user.id}: ${updatedProduct._id}`);
    res.json({ data: updatedProduct });
  } catch (error) {
    logger.error(`Error updating product ${req.params.id} for user ${req.user.id}: ${error.message}`);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: { code: 400, message: 'Datos inválidos', details: error.message },
      });
    }
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route DELETE /api/products/:id
 * @description Delete a product (admin only)
 * @access Protected (admin)
 * @param {string} req.params.id - Product ID
 * @returns {Object} Deletion confirmation
 * @throws {400} If ID is invalid
 * @throws {404} If product not found
 * @throws {500} If server error occurs
 */
router.delete('/:id', auth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    logger.warn(`Invalid product ID: ${req.params.id} by user ${req.user.id}`);
    return res.status(400).json({
      error: { code: 400, message: 'ID inválido', details: 'El ID proporcionado no es válido' },
    });
  }

  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      logger.warn(`Product not found: ${req.params.id} by user ${req.user.id}`);
      return res.status(404).json({
        error: { code: 404, message: 'Producto no encontrado', details: 'No se encontró un producto con el ID proporcionado' },
      });
    }

    logger.info(`Product deleted by user ${req.user.id}: ${deletedProduct._id}`);
    res.json({ data: { message: 'Producto eliminado con éxito', product: deletedProduct } });
  } catch (error) {
    logger.error(`Error deleting  product ${req.params.id} for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

module.exports = router;