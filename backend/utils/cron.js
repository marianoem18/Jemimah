const cron = require('node-cron');
const Sale = require('../models/sale');
const Expense = require('../models/expense');
const Report = require('../models/report');
const logger = require('../config/logger');
const moment = require('moment-timezone');

// Función para obtener la fecha actual en Argentina
const getCurrentDate = () => {
  return moment.tz('America/Argentina/Buenos_Aires').format('YYYY-MM-DD');
};

// Función para generar el reporte diario
const generateDailyReport = async () => {
  try {
    const currentDate = getCurrentDate();
    const startDate = moment.tz(currentDate, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').startOf('day').toDate();
    const endDate = moment.tz(currentDate, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').endOf('day').toDate();

    logger.info(`Generando reporte diario para: ${currentDate}`);

    // Verificar si ya existe un reporte para la fecha actual
    const existingReport = await Report.findOne({ date: currentDate });
    if (existingReport) {
      logger.warn(`Reporte ya existe para ${currentDate}`);
      return;
    }

    // Obtener ventas y gastos del día actual
    const [sales, expenses] = await Promise.all([
      Sale.find({
        date: { $gte: startDate, $lte: endDate },
        isProcessed: false // Cambiado de { $ne: true } a false
      }).select('items total paymentMethod'),
      Expense.find({
        date: { $gte: startDate, $lte: endDate },
        isProcessed: false // Cambiado de { $ne: true } a false
      }).select('amount'),
    ]);

    // Calcular métricas
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

    // Crear el reporte
    const report = new Report({
      date: currentDate,
      type: 'daily',
      totalProductsSold,
      totalSales,
      totalExpenses,
      netProfit,
      salesByPaymentMethod,
    });

    await report.save();

    // Marcar ventas y gastos como procesados
    await Promise.all([
      Sale.updateMany(
        { date: { $gte: startDate, $lte: endDate }, isProcessed: { $ne: true } },
        { $set: { isProcessed: true } }
      ),
      Expense.updateMany(
        { date: { $gte: startDate, $lte: endDate }, isProcessed: { $ne: true } },
        { $set: { isProcessed: true } }
      ),
    ]);

    logger.info(`Reporte diario para ${currentDate} guardado exitosamente y datos diarios reseteados`);
  } catch (error) {
    logger.error(`Error al generar reporte diario: ${error.message}`);
  }
};

// Programar el cron job para ejecutarse todos los días a las 00:00 (Argentina)
const initCronJobs = () => {
  cron.schedule('01 18 * * *', generateDailyReport, {
    scheduled: true,
    timezone: 'America/Argentina/Buenos_Aires',
  });

  logger.info('Cron jobs inicializados correctamente');
};

module.exports = { initCronJobs, generateDailyReport };