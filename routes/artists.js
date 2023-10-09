const express = require("express");
const check = require("../midlewares/auth");

// Cargar el enrutador
const router = express.Router();

// Importar controlador
const artistsController = require("../controllers/artists");

//importar dependencia
const multer = require("multer");

// Configuración de subida
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Especifica la carpeta donde se almacenarán los archivos subidos
    cb(null, "./uploads/artists/");
  },
  filename: function (req, file, cb) {
    // Define el nombre del archivo en función de la fecha actual y el nombre original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.originalname.split(".").pop(); // Obtén la extensión del archivo original
    cb(null, "artist-" + uniqueSuffix + "." + extension);
  },
});

// Crear un middleware de Multer
const upload = multer({ storage: storage });

// Definir rutas

router.post("/save", check.auth, artistsController.save);
router.get("/search/:id", check.auth, artistsController.search);
router.get("/list/:page?", check.auth, artistsController.list);
router.put("/update/:id", check.auth, artistsController.updateArtist);
router.delete("/remove/:id", check.auth, artistsController.remove);
router.post(
    "/upload/:id",
    [check.auth, upload.single("file")],
    artistsController.upload
  );
router.get("/avatar/:file", check.auth, artistsController.avatar);

// Exportar el enrutador para su uso en otros archivos
module.exports = router;
