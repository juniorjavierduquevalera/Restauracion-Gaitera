const { Schema, model } = require("mongoose");

// Define el esquema del usuario
const userSchema = new Schema({
  // Campos del usuario
  username: {
    type: String,
    required: true,
  },
  nick: {
    type: String,
    required: true,
    unique: true, // Debe ser único
  },
  email: {
    type: String,
    required: true,
    unique: true, // Debe ser único
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  image: {
    type: String,
  },
  created_at: {
    type: Date,
    default: Date.now, // Establece la fecha actual por defecto
  },
  // Otros campos del usuario si es necesario
});

// Crea el modelo de usuario
const User = model("User", userSchema, "users");

// Exporta el modelo para su uso en otras partes de la aplicación
module.exports = User;
