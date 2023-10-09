const express = require("express");
const check = require("../midlewares/auth");

// Cargar el enrutador
const router = express.Router();

// Importar controlador
const likeController = require("../controllers/like");

// Definir rutas

router.put("/", check.auth, likeController.like);

module.exports = router;
