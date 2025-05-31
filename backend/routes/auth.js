const express = require('express');
const Joi = require('joi');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const logger = require('winston');
const { ROLES, DEFAULT_ROLE } = require('../config/roles');
const router = express.Router();

// Validation schemas
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
 * @description Register a new user (server-side only)
 * @access Server-only (e.g., via Thunder Client)
 * @param {Object} req.body - User data (email, password, name, role)
 * @returns {Object} Success message
 * @throws {400} If validation fails or email exists
 * @throws {500} If server error occurs
 */
router.post('/register', async (req, res) => {
  // Validate input
  const { error } = registerSchema.validate(req.body);
  if (error) {
    logger.warn(`Invalid registration attempt: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { email, password, name, role } = req.body;

  try {
    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET no definido');
      return res.status(500).json({
        error: { code: 500, message: 'Error del servidor', details: 'Configuración de autenticación faltante' },
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Attempt to register existing email: ${email}`);
      return res.status(400).json({
        error: { code: 400, message: 'Email ya registrado', details: 'Email en uso' },
      });
    }

    // Assign role
    const userRole = role && ROLES.includes(role) ? role : DEFAULT_ROLE;

    // Create user
    const newUser = new User({ email, password, name, role: userRole });
    await newUser.save();

    logger.info(`User registered: ${email} (role: ${userRole})`);
    res.status(201).json({ data: { message: 'Usuario registrado con éxito' } });
  } catch (error) {
    logger.error(`Error registering user ${email}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

/**
 * @route POST /api/auth/login
 * @description Authenticate user and generate JWT
 * @access Public
 * @param {Object} req.body - User credentials (email, password)
 * @returns {Object} JWT token and user data
 * @throws {400} If credentials are invalid
 * @throws {500} If server error occurs
 */
router.post('/login', async (req, res) => {
  // Validate input
  const { error } = loginSchema.validate(req.body);
  if (error) {
    logger.warn(`Invalid login attempt: ${error.details[0].message}`);
    return res.status(400).json({
      error: { code: 400, message: 'Datos inválidos', details: error.details[0].message },
    });
  }

  const { email, password } = req.body;

  try {
    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET no definido');
      return res.status(500).json({
        error: { code: 500, message: 'Error del servidor', details: 'Configuración de autenticación faltante' },
      });
    }

    // Find user
    const user = await User.findOne({ email }).select('password role name _id');
    if (!user) {
      logger.warn(`Login attempt with non-existing email: ${email}`);
      return res.status(400).json({
        error: { code: 400, message: 'Credenciales incorrectas', details: 'Email no registrado' },
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password attempt for user: ${email}`);
      return res.status(400).json({
        error: { code: 400, message: 'Credenciales incorrectas', details: 'Contraseña incorrecta' },
      });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    logger.info(`Successful login for user: ${email}`);
    res.json({
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    logger.error(`Error logging in user ${email}: ${error.message}`);
    res.status(500).json({
      error: { code: 500, message: 'Error del servidor', details: error.message },
    });
  }
});

module.exports = router;