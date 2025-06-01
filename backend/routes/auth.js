const express = require('express');
const Joi = require('joi');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const logger = require('winston');
const { ROLES, DEFAULT_ROLE } = require('../config/roles');
const auth = require('../middleware/auth');

const router = express.Router();

// Esquemas de validación
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email obligatorio',
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required().messages({
    'string.min': 'Contraseña debe tener al menos 8 caracteres',
    'string.pattern.base': 'Contraseña debe contener letras y números',
    'any.required': 'Contraseña obligatoria',
  }),
  name: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Nombre no puede estar vacío',
    'string.max': 'Nombre no puede exceder 50 caracteres',
    'any.required': 'Nombre obligatorio',
  }),
  role: Joi.string().valid(...ROLES).optional().messages({
    'any.only': `Rol debe ser: ${ROLES.join(', ')}`,
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email obligatorio',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Contraseña obligatoria',
  }),
});

/**
 * @route POST /api/auth/register
 * @description Registrar un nuevo usuario (solo servidor)
 * @access Solo servidor (ej. vía Thunder Client)
 * @param {Object} req.body - Datos del usuario (email, password, name, role)
 * @returns {Object} Mensaje de éxito
 * @throws {400} Si la validación falla o el email ya existe
 * @throws {500} Si ocurre un error en el servidor
 */
router.post('/register', async (req, res) => {
  // Validar entrada
  const { error } = registerSchema.validate(req.body);
  if (error) {
    logger.warn(`Intento de registro inválido: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { email, password, name, role } = req.body;

  try {
    // Validar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET no definido');
      return res.status(500).json({
        error: { code: 500, message: 'Error del servidor', details: 'Configuración de autenticación faltante' },
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Intento de registro con email existente: ${email}`);
      return res.status(400).json({
        error: { code: 400, message: 'Email ya registrado', details: 'Email en uso' },
      });
    }

    // Asignar rol
    const userRole = role && ROLES.includes(role) ? role : DEFAULT_ROLE;

    // Crear usuario
    const newUser = new User({ email, password, name, role: userRole });
    await newUser.save();

    logger.info(`Usuario registrado: ${email} (rol: ${userRole})`);
    res.status(201).json({ data: { message: 'Usuario registrado con éxito' } });
  } catch (error) {
    logger.error(`Error registrando usuario ${email}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route POST /api/auth/login
 * @description Autenticar usuario y generar JWT
 * @access Público
 * @param {Object} req.body - Credenciales del usuario (email, password)
 * @returns {Object} Token JWT y datos del usuario
 * @throws {400} Si las credenciales son inválidas
 * @throws {500} Si ocurre un error en el servidor
 */
router.post('/login', async (req, res) => {
  // Validar entrada
  const { error } = loginSchema.validate(req.body);
  if (error) {
    logger.warn(`Intento de login inválido: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { email, password } = req.body;

  try {
    // Validar JWT_SECRET
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET no definido');
      return res.status(500).json({
        error: { code: 500, message: 'Error del servidor', details: 'Configuración de autenticación faltante' },
      });
    }

    // Buscar usuario
    const user = await User.findOne({ email }).select('password role name _id');
    if (!user) {
      logger.warn(`Intento de login con email no registrado: ${email}`);
      return res.status(400).json({
        error: { code: 400, message: 'Credenciales incorrectas', details: 'Email no registrado' },
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Intento de contraseña inválida para usuario: ${email}`);
      return res.status(400).json({
        error: { code: 400, message: 'Credenciales incorrectas', details: 'Contraseña incorrecta' },
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user._id, role: user.role || DEFAULT_ROLE },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    logger.info(`Login exitoso para usuario: ${email} (rol: ${user.role || DEFAULT_ROLE})`);
    res.json({
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role || DEFAULT_ROLE },
      },
    });
  } catch (error) {
    logger.error(`Error iniciando sesión para usuario ${email}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route GET /api/auth/me
 * @description Obtener datos del usuario autenticado
 * @access Privado (requiere token)
 * @returns {Object} Datos del usuario (id, name, email, role)
 * @throws {401} Si el token es inválido o no se proporciona
 * @throws {404} Si el usuario no se encuentra
 * @throws {500} Si ocurre un error en el servidor
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      logger.warn(`Usuario no encontrado para ID en token: ${req.user.id}`);
      return res.status(404).json({
        error: { code: 404, message: 'Usuario no encontrado', details: 'No se encontró un usuario con el ID proporcionado' },
      });
    }
    res.json({
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role || DEFAULT_ROLE,
        },
      },
    });
  } catch (error) {
    logger.error(`Error obteniendo datos del usuario en /me (ID: ${req.user?.id}): ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: 'No se pudo recuperar la información del usuario' },
    });
  }
});

module.exports = router;