const express = require("express");
const check = require("../midlewares/auth");
// Cargar el enrutador
const router = express.Router();
// Importar controlador
const userController = require("../controllers/user");
//importar dependencia
const multer = require("multer");

// Configuración de subida
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Especifica la carpeta donde se almacenarán los archivos subidos
    cb(null, "./uploads/avatars/");
  },
  filename: function (req, file, cb) {
    // Define el nombre del archivo en función de la fecha actual y el nombre original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.originalname.split(".").pop(); // Obtén la extensión del archivo original
    cb(null, "avatar-" + uniqueSuffix + "." + extension);
  },
});

// Crear un middleware de Multer
const upload = multer({ storage: storage });

// Definir rutas
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile/:id", check.auth, userController.profile);
router.put("/update", check.auth, userController.update);
router.post(
  "/upload",
  [check.auth, upload.single("file")],
  userController.upload
);
router.get("/avatar/:file", userController.avatar);


// Exportar el enrutador para su uso en otros archivos
module.exports = router;
