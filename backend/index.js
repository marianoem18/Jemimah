const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./config/logger'); // Importa el logger configurado

// Configurar dotenv
dotenv.config();

// Eliminar completamente este bloque de código, ya no es necesario:
// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
//     new winston.transports.File({ filename: 'logs/combined.log' }),
//     new winston.transports.Console(),
//   ],
// });

// Validar variables de entorno
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length) {
  logger.error(`Faltan variables de entorno: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Crear aplicación Express
const app = express();

// Configurar CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Ajustar según frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Rutas
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));

// Middleware de errores global
app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.message}`, { stack: err.stack });
  res.status(500).json({
    error: { code: 500, message: 'Error del servidor', details: err.message },
  });
});

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    logger.info('✅ Conectado exitosamente a MongoDB');
  })
  .catch((error) => {
    logger.error(`❌ Error al conectar a MongoDB: ${error.message}`);
    process.exit(1);
  });

// Configurar servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
});

// Manejo de cierre elegante
process.on('SIGTERM', () => {
  logger.info('🛑 Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('🔌 Conexión a MongoDB cerrada');
      process.exit(0);
    });
  });
});

process.on('uncaughtException', (error) => {
  logger.error(`Excepción no capturada: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Promesa rechazada no manejada: ${reason}`, { promise });
});