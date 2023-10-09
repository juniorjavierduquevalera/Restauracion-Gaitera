const validator = require("validator");

const validate = (params) => {
  const errors = {}; // Objeto para almacenar los errores

  // Validación del campo de contraseña (password)
  if (!params.password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (!validator.isLength(params.password, { min: 6 })) {
    errors.password = "La contraseña debe tener al menos 6 caracteres.";
  }

  // Validación del campo de correo electrónico (email)
  if (!params.email) {
    errors.email = "El correo electrónico es obligatorio.";
  } else if (!validator.isEmail(params.email)) {
    errors.email = "El correo electrónico no es válido.";
  }

  // Validación del campo de nombre de usuario (username)
  if (!params.username) {
    errors.username = "El nombre de usuario es obligatorio.";
  } else if (params.username.length < 3) {
    errors.username = "El nombre de usuario debe tener al menos 3 caracteres.";
  } else if (!/^[a-zA-Z]+$/.test(params.username)) {
    errors.username = "El nombre de usuario no debe contener números ni caracteres especiales.";
  }

  // Validación del campo de apodo (nick)
  if (!params.nick) {
    errors.nick = "El apodo es obligatorio.";
  }

  // Verifica si hay errores
  const isValid = Object.keys(errors).length === 0;

  // Si alguna validación falla, lanza una excepción
  if (!isValid) {
    throw new Error("No se ha superado la validación.");
  }

  return { isValid, errors };
};

module.exports = validate;
