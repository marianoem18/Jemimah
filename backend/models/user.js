const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @typedef User
 * @property {string} email - Correo electrónico (único)
 * @property {string} password - Contraseña encriptada
 * @property {string} name - Nombre del usuario
 * @property {string} role - Rol del usuario (admin, employee)
 * @property {Date} createdAt - Fecha de creación (automática)
 * @property {Date} updatedAt - Fecha de actualización (automática)
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato de correo inválido'],
      maxlength: [100, 'El correo no puede exceder 100 caracteres'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false, // Excluir en consultas por defecto
    },
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
    },
    role: {
      type: String,
      required: [true, 'El rol es obligatorio'],
      enum: {
        values: ['admin', 'employee'],
        message: 'Rol inválido: debe ser admin o employee',
      },
    },
  },
  { timestamps: true } // Añade createdAt y updatedAt
);

// Índice explícito para email
userSchema.index({ email: 1 }, { unique: true });

// Middleware para encriptar contraseña
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;