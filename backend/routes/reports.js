const express = require('express');
const Joi = require('joi');
const Sale = require('../models/sale');
const Expense = require('../models/expense');
const Product = require('../models/product');
const auth = require('../middleware/auth');
const logger = require('winston');
const router = express.Router();
const Report = require('../models/report');
const moment = require('moment-timezone');

// Validation schema for query params
const reportSchema = Joi.object({
  date: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    'string.pattern.base': 'Formato de fecha inválido. Use YYYY-MM-DD',
  }),
  type: Joi.string().valid('daily', '20days').required().messages({
    'any.only': 'El tipo debe ser "daily" o "20days"',
    'any.required': 'El tipo es obligatorio',
  }),
});

// Validation schema for history query params
const historySchema = Joi.object({
  startDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido. Use YYYY-MM-DD',
    'any.required': 'La fecha de inicio es obligatoria',
  }),
  endDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Formato de fecha inválido. Use YYYY-MM-DD',
    'any.required': 'La fecha de fin es obligatoria',
  }),
});

/**
 * @route GET /api/reports/history
 * @description Get historical reports between dates (admin only)
 * @access Protected (admin)
 * @query {string} startDate - Start date in YYYY-MM-DD format
 * @query {string} endDate - End date in YYYY-MM-DD format
 * @returns {Object} Historical reports
 * @throws {400} If query params are invalid
 * @throws {500} If server error occurs
 */
router.get('/history', auth, auth.isAdmin, async (req, res) => {
  const { error } = historySchema.validate(req.query);
  if (error) {
    logger.warn(`Invalid history report request by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { startDate, endDate } = req.query;
  try {
    const reports = await Report.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });

    logger.info(`Historical reports retrieved by user: ${req.user.id}`);
    res.json({ data: reports });
  } catch (error) {
    logger.error(`Error fetching historical reports for user ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
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
    const queryDate = moment.tz(date, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires');
    let startDate = queryDate.clone().startOf('day').toDate();
    let endDate = queryDate.clone().endOf('day').toDate();

    if (type === '20days') {
      startDate = queryDate.clone().subtract(19, 'days').startOf('day').toDate();
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
    const queryDate = moment.tz(date, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires');
    let startDate = queryDate.clone().startOf('day').toDate();
    let endDate = queryDate.clone().endOf('day').toDate();

    if (type === '20days') {
      startDate = queryDate.clone().subtract(19, 'days').startOf('day').toDate();
    }

    const expenses = await Sale.find({
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
 * @query {string} [date] - Date in YYYY-MM-DD format (optional, defaults to today)
 * @query {string} type - Report type (daily, 20days)
 * @returns {Object} Combined report
 * @throws {400} If query params are invalid
 * @throws {500} If server error occurs
 */
router.get('/summary', auth, async (req, res) => {
  const modifiedSchema = reportSchema.fork('date', (schema) => schema.optional());
  const { error } = modifiedSchema.validate(req.query);
  if (error) {
    logger.warn(`Invalid summary report request by user ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { date = moment().tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD'), type } = req.query;
  try {
    const queryDate = moment.tz(date, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires');
    let startDate = queryDate.clone().startOf('day').toDate();
    let endDate = queryDate.clone().endOf('day').toDate();

    if (type === '20days') {
      startDate = queryDate.clone().subtract(19, 'days').startOf('day').toDate();
    }

    const [sales, expenses] = await Promise.all([
      Sale.find({ date: { $gte: startDate, $lte: endDate } }).select('items total paymentMethod'),
      Expense.find({ date: { $gte: startDate, $lte: endDate } }).select('amount'),
    ]);

    const totalProductsSold = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {});

    logger.info(`Summary report (${type}) retrieved for ${date} by user: ${req.user.id}`);
    res.json({
      data: {
        date,
        type,
        totalSales,
        totalExpenses,
        netProfit,
        totalProductsSold,
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

/**
 * @route POST /api/reports/generate
 * @description Generar manualmente un reporte diario para una fecha específica
 * @access Protected (admin)
 * @body {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Object} Reporte generado
 * @throws {400} Si los parámetros son inválidos o el reporte ya existe
 * @throws {500} Si ocurre un error del servidor
 */
router.post('/generate', auth, auth.isAdmin, async (req, res) => {
  const { error } = generateReportSchema.validate(req.body);
  if (error) {
    logger.warn(`Solicitud inválida de generación de reporte por usuario ${req.user.id}: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { date } = req.body;
  try {
    const existingReport = await Report.findOne({ date });
    if (existingReport) {
      logger.warn(`Intento de generar reporte duplicado para ${date} por usuario ${req.user.id}`);
      return res.status(400).json({
        error: { code: 400, message: 'Ya existe un reporte para esta fecha' },
      });
    }

    const queryDate = moment.tz(date, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires');
    const startDate = queryDate.clone().startOf('day').toDate();
    const endDate = queryDate.clone().endOf('day').toDate();

    const [sales, expenses] = await Promise.all([
      Sale.find({ date: { $gte: startDate, $lte: endDate } }).select('items total paymentMethod'),
      Expense.find({ date: { $gte: startDate, $lte: endDate } }).select('amount'),
    ]);

    const totalProductsSold = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const salesByPaymentMethod = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {});

    const report = new Report({
      date,
      type: 'daily',
      totalProductsSold,
      totalSales,
      totalExpenses,
      netProfit,
      salesByPaymentMethod,
    });

    await report.save();
    logger.info(`Reporte generado manualmente para ${date} por usuario ${req.user.id}`);
    res.json({ data: report });
  } catch (error) {
    logger.error(`Error al generar reporte manual para ${date} por usuario ${req.user.id}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

module.exports = router;