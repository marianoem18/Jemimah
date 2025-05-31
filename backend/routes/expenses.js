const express = require('express');
const Joi = require('joi');
const Expense = require('../models/expense');
const auth = require('../middleware/auth');
const logger = require('winston');
const router = express.Router();

// Validation schema for POST /
const expenseSchema = Joi.object({
  type: Joi.string().min(1).max(50).required().messages({
    'string.min': 'El tipo no puede estar vacío',
    'string.max': 'El tipo no puede exceder 50 caracteres',
    'any.required': 'El tipo es obligatorio',
  }),
  description: Joi.string().min(1).max(200).required().messages({
    'string.min': 'La descripción no puede estar vacía',
    'string.max': 'La descripción no puede exceder 200 caracteres',
    'any.required': 'La descripción es obligatoria',
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'El monto debe ser mayor a 0',
    'any.required': 'El monto es obligatorio',
  }),
  date: Joi.date().optional().messages({
    'date.base': 'La fecha debe ser válida',
  }),
});

/**
 * @route GET /api/expenses
 * @description Get all expenses (admin or employee)
 * @access Protected (admin, employee)
 * @returns {Object} List of expenses
 * @throws {500} If server error occurs
 */
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find()
      .select('type description amount date')
      .sort({ date: -1 })
      .limit(100); // Limitar resultados para mejor rendimiento
    logger.info(`Expenses retrieved by user: ${req.user.id}`);
    res.json({ data: expenses });
  } catch (error) {
    logger.error(`Error fetching expenses for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route GET /api/expenses/today
 * @description Get expenses for the current day (admin or employee)
 * @access Protected (admin, employee)
 * @returns {Object} List of today's expenses
 * @throws {500} If server error occurs
 */
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const expenses = await Expense.find({
      date: { $gte: today, $lt: tomorrow },
    })
      .select('type description amount date')
      .sort({ date: -1 });

    logger.info(`Today's expenses retrieved by user: ${req.user.id}`);
    res.json({ data: expenses });
  } catch (error) {
    logger.error(`Error fetching today's expenses for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route POST /api/expenses
 * @description Create a new expense (admin or employee)
 * @access Protected (admin, employee)
 * @param {Object} req.body - Expense data (type, description, amount, date)
 * @returns {Object} Created expense
 * @throws {400} If validation fails
 * @throws {500} If server error occurs
 */
router.post('/', auth, async (req, res) => {
  // Validate input
  const { error } = expenseSchema.validate(req.body);
  if (error) {
    logger.warn(`Invalid expense creation attempt by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { type, description, amount, date } = req.body;

  try {
    const newExpense = new Expense({
      type,
      description,
      amount,
      date: date || new Date(),
      createdBy: req.user.id, // Track who created the expense
    });

    await newExpense.save();
    logger.info(`Expense created by user ${req.user.id}: ${newExpense._id}`);
    res.status(201).json({ data: { message: 'Egreso registrado con éxito', expense: newExpense } });
  } catch (error) {
    logger.error(`Error creating expense for user ${req.user.id}: ${error.message}`);
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

module.exports = router;