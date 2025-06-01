const jwt = require('jsonwebtoken');
const pathToRegexp = require('path-to-regexp'); // Cambiado aquí
const logger = require('../config/logger');
const permissions = require('../config/permissions');

/**
 * @module Middleware/auth
 * @description Middleware for authenticating and authorizing requests using JWT.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @throws {Error} If token is invalid, expired, or user lacks permissions
 */
const auth = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET no está definido en las variables de entorno');
    return res.status(500).json({
      error: {
        code: 500,
        message: 'Error interno del servidor',
        details: 'JWT_SECRET no está configurado',
      },
    });
  }

  const token = req.header('x-auth-token');
  if (!token || typeof token !== 'string' || token.length < 10) {
    logger.warn(`Token inválido o no proporcionado: ${token}`);
    return res.status(401).json({
      error: {
        code: 401,
        message: 'Acceso denegado',
        details: 'Token mal formado o no proporcionado',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const userRole = req.user.role;
    if (!userRole) {
      logger.warn(`Rol no definido para el usuario ${decoded.id}`);
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Acceso denegado',
          details: 'Rol no proporcionado en el token',
        },
      });
    }

    // Normalizar la ruta para asegurar que siempre comience con '/' y no tenga '/' final
    let requestedRoute = req.originalUrl.split('?')[0].replace(/\/$/, '');
    if (!requestedRoute.startsWith('/')) {
      requestedRoute = '/' + requestedRoute;
    }
    if (requestedRoute === '') requestedRoute = '/';
    const requestedMethod = req.method;

    const isAllowed = permissions.some((perm) => {
      try {
        // Crear expresión regular con path-to-regexp
        const regexp = pathToRegexp(perm.path);
        const isPathMatch = regexp.test(requestedRoute); // Usar regexp.test() para la comparación
        const isMethodMatch = perm.methods.includes(requestedMethod) || perm.methods.includes('*');
        const isRoleMatch = perm.role === userRole;

        logger.info(
          `Evaluando permiso: Ruta solicitada='${requestedRoute}' (${requestedMethod}), ` +
          `Permiso: rol='${perm.role}', path='${perm.path}', methods='${perm.methods}'. ` +
          `Coincidencia: Rol=${isRoleMatch}, Ruta=${isPathMatch}, Método=${isMethodMatch}`
        );

        return isRoleMatch && isPathMatch && isMethodMatch;
      } catch (e) {
        logger.error(`Error evaluando permiso para ruta ${perm.path}: ${e.message}`);
        return false;
      }
    });

    if (!isAllowed) {
      logger.warn(
        `Permiso denegado para el rol ${userRole} (user: ${req.user.id}) en la ruta ${requestedRoute} (${requestedMethod})`
      );
      return res.status(403).json({
        error: {
          code: 403,
          message: 'Permiso denegado',
          details: `Ruta ${requestedRoute} (${requestedMethod}) no permitida para el rol ${userRole}`,
        },
      });
    }

    next();
  } catch (error) {
    logger.error(`Error de autenticación para el usuario ${req.user?.id || 'unknown'}: ${error.message}`);
    return res.status(401).json({
      error: {
        code: 401,
        message: 'Acceso denegado',
        details: 'Token inválido o expirado',
      },
    });
  }
};

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: { code: 403, message: 'Acceso denegado: solo administradores' } });
}

module.exports = auth;
module.exports.isAdmin = isAdmin;