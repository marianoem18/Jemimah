const winston = require('winston');
const path = require('path');

// Definir formatos de log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Crear el logger
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Transport para consola
    new winston.transports.Console(),
    // Transport para archivo de errores
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
    }),
    // Transport para todos los logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    }),
  ],
});

// Exportar el logger
module.exports = logger;