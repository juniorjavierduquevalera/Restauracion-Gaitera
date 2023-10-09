const jwt = require("jwt-simple");
const moment = require("moment");

// Clave secreta
const secret = "clave_secreta_301_api_music";

// Crear una función para generar tokens
const createToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    nick: user.nick,
    email: user.email,
    role: user.role,
    image: user.image,
    iat: moment().unix(),
    exp: moment().add(14, "days").unix(),
  };

  // Devolver jwt token codificado
  return jwt.encode(payload, secret);
};

module.exports = {
  secret,
  createToken
}