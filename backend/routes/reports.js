const express = require('express');
const Joi = require('joi');
const Sale = require('../models/sale');
const Expense = require('../models/expense');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const logger = require('winston');
const router = express.Router();

// Validation schema for query params
const reportSchema = Joi.object({
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido. Use YYYY-MM-DD',
    'any.required': 'La fecha es obligatoria',
  }),
  type: Joi.string().valid('daily', '20days').required().messages({
    'any.only': 'El tipo debe ser "daily" o "20days"',
    'any.required': 'El tipo es obligatorio',
  }),
});

/**
 * @route GET /api/reports/sales
 * @description Get sales report (daily or 20 days, admin only)
 * @access Protected (admin)
 * @query {string} date - Date in YYYY-MM-DD format
 * @query {string} type - Report type (daily, 20days)
 * @returns {Object} Sales report
 * @throws {400} If query params are invalid
 * @throws {500} If server error occurs
 */
router.get('/sales', auth, async (req, res) => {
  const { error } = reportSchema.validate(req.query);
  if (error) {
    logger.warn(`Invalid sales report request by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { date, type } = req.query;
  try {
    const queryDate = new Date(date);
    let startDate = new Date(queryDate);
    startDate.setUTCHours(0, 0, 0, 0);
    let endDate = new Date(queryDate);
    endDate.setUTCHours(23, 59, 59, 999);

    if (type === '20days') {
      startDate.setUTCDate(startDate.getUTCDate() - 19);
    }

    const sales = await Sale.find({
      date: { $gte: startDate, $lte: endDate },
    }).select('total quantity paymentMethod date');

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {});

    logger.info(`Sales report (${type}) retrieved by user: ${req.user.id}`);
    res.json({
      data: {
        date: type === 'daily' ? date : `${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`,
        type,
        totalSales,
        totalQuantity,
        salesByPaymentMethod,
        sales,
      },
    });
  } catch (error) {
    logger.error(`Error fetching sales report for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route GET /api/reports/expenses
 * @description Get expenses report (daily or 20 days, admin only)
 * @access Protected (admin)
 * @query {string} date - Date in YYYY-MM-DD format
 * @query {string} type - Report type (daily, 20days)
 * @returns {Object} Expenses report
 * @throws {400} If query params are invalid
 * @throws {500} If server error occurs
 */
router.get('/expenses', auth, async (req, res) => {
  const { error } = reportSchema.validate(req.query);
  if (error) {
    logger.warn(`Invalid expenses report request by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { date, type } = req.query;
  try {
    const queryDate = new Date(date);
    let startDate = new Date(queryDate);
    startDate.setUTCHours(0, 0, 0, 0);
    let endDate = new Date(queryDate);
    endDate.setUTCHours(23, 59, 59, 999);

    if (type === '20days') {
      startDate.setUTCDate(startDate.getUTCDate() - 19);
    }

    const expenses = await Expense.find({
      date: { $gte: startDate, $lte: endDate },
    }).select('amount type date');

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expensesByType = expenses.reduce((acc, expense) => {
      acc[expense.type] = (acc[expense.type] || 0) + expense.amount;
      return acc;
    }, {});

    logger.info(`Expenses report (${type}) retrieved by user: ${req.user.id}`);
    res.json({
      data: {
        date: type === 'daily' ? date : `${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`,
        type,
        totalExpenses,
        expensesByType,
        expenses,
      },
    });
  } catch (error) {
    logger.error(`Error fetching expenses report for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route GET /api/reports/stock
 * @description Get current stock report grouped by category (admin only)
 * @access Protected (admin)
 * @returns {Object} Stock report
 * @throws {500} If server error occurs
 */
router.get('/stock', auth, async (req, res) => {
  try {
    const stock = await Product.aggregate([
      { $group: { _id: '$category', totalQuantity: { $sum: '$quantity' } } },
      { $project: { _id: 0, category: '$_id', totalQuantity: 1 } },
    ]);

    logger.info(`Stock report retrieved by user: ${req.user.id}`);
    res.json({ data: stock });
  } catch (error) {
    logger.error(`Error fetching stock report for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route GET /api/reports/summary
 * @description Get combined sales and expenses report (daily or 20 days, admin only)
 * @access Protected (admin)
 * @query {string} date - Date in YYYY-MM-DD format
 * @query {string} type - Report type (daily, 20days)
 * @returns {Object} Combined report
 * @throws {400} If query params are invalid
 * @throws {500} If server error occurs
 */
router.get('/summary', auth, async (req, res) => {
  const { error } = reportSchema.validate(req.query);
  if (error) {
    logger.warn(`Invalid summary report request by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { date, type } = req.query;
  try {
    const queryDate = new Date(date);
    let startDate = new Date(queryDate);
    startDate.setUTCHours(0, 0, 0, 0);
    let endDate = new Date(queryDate);
    endDate.setUTCHours(23, 59, 59, 999);

    if (type === '20days') {
      startDate.setUTCDate(startDate.getUTCDate() - 19);
    }

    const [sales, expenses] = await Promise.all([
      Sale.find({ date: { $gte: startDate, $lte: endDate } }).select('total quantity paymentMethod'),
      Expense.find({ date: { $gte: startDate, $lte: endDate } }).select('amount'),
    ]);

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {});

    logger.info(`Summary report (${type}) retrieved by user: ${req.user.id}`);
    res.json({
      data: {
        date: type === 'daily' ? date : `${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}`,
        type,
        totalSales,
        totalExpenses,
        netProfit,
        salesByPaymentMethod,
      },
    });
  } catch (error) {
    logger.error(`Error fetching summary report for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

module.exports = router;