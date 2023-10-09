const jwt = require("jwt-simple");
const moment = require("moment");
const libjwt = require("../helpers/jwt");
const secret = libjwt.secret;

// Función de autenticación middleware
exports.auth = (req, res, next) => {
  // Comprobar si me llega la cabecera de autenticación
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      message: "La petición no tiene la cabecera de autenticación",
    });
  }

  try {
    // Limpiar el token
    let token = req.headers.authorization.replace(/['"]*/g, "").trim();

    // Decodificar el token para obtener la información del usuario
    const payload = jwt.decode(token, secret);

    // Comprobar si el token ha expirado
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        message: "El token ha expirado",
      });
    }

    // Agregar datos de usuario al objeto request para que estén disponibles en las acciones posteriores
    req.user = payload;

    // Pasar a la ejecución de la acción
    next();
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error al procesar el token",
    });
  }
};
