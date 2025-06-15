const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger'); // Importa el logger configurado
const { initCronJobs } = require('./utils/cron');

// Configurar dotenv
dotenv.config();

// Validar variables de entorno
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingEnvVars.length) {
  logger.error(`Faltan variables de entorno: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Crear aplicación Express
const app = express();

// Configurar Helmet para cabeceras de seguridad
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        connectSrc: [
          "'self'",
          process.env.CORS_ORIGIN || 'http://localhost:3000',
          'https://jemimahkids.vercel.app',
          'https://jemimah.onrender.com',
          'http://localhost:5000' // Para pruebas locales del backend
        ],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
  })
);

// Configurar Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 solicitudes por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 429,
      message: 'Demasiadas solicitudes',
      details: 'Has excedido el límite de solicitudes. Intenta de nuevo más tarde.',
    },
  },
  handler: (req, res, next, options) => {
    logger.warn(`Límite de solicitudes excedido para IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});
app.use(limiter);

// Configurar CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como las de Postman o curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Permitir múltiples orígenes separados por comas
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,https://jemimahkids.vercel.app').split(',');
    
    // Normalizar el origen comparando sin la barra final
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    // Verificar si el origen está en la lista de permitidos
    const isAllowed = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.trim().replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed) {
      // Configurar el origen específico que hizo la solicitud
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  credentials: true // Permitir cookies en solicitudes cross-origin
};
app.use(cors(corsOptions));

// Middleware para establecer cabeceras CORS específicas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    // Establecer el origen específico que hizo la solicitud
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});

// Middleware
app.use(express.json({ limit: '10kb' })); // Limitar tamaño del body

// Rutas
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));

// Middleware de errores global
app.use((err, req, res, next) => {
  logger.error(`Error no manejado: ${err.message}`, { stack: err.stack, ip: req.ip });
  res.status(err.status || 500).json({
    error: {
      code: err.status || 500,
      message: err.message || 'Error del servidor',
      details: err.details || 'Ocurrió un error inesperado',
    },
  });
});

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    logger.info('✅ Conectado exitosamente a MongoDB');
    // Inicializar cron jobs después de conectar a MongoDB
    initCronJobs();
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