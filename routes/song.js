const express = require("express");
const check = require("../midlewares/auth");

// Cargar el enrutador
const router = express.Router();

// Importar controlador
const songController = require("../controllers/song");

//importar dependencia
const multer = require("multer");

// Configuración de subida
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Especifica la carpeta donde se almacenarán los archivos subidos
    cb(null, "./uploads/audios/");
  },
  filename: function (req, file, cb) {
    // Define el nombre del archivo en función de la fecha actual y el nombre original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.originalname.split(".").pop(); // Obtén la extensión del archivo original
    cb(null, "audio-" + uniqueSuffix + "." + extension);
  },
});

// Crear un middleware de Multer
const upload = multer({ storage: storage });

// Definir rutas
router.get("/prueba", songController.prueba);
router.post("/save", check.auth, songController.saveSong);
router.get("/search-song/:id", check.auth, songController.searchSong);
router.get("/list/:albumId", check.auth, songController.listSong);
router.put("/update/:songId", check.auth, songController.updateSong);
router.delete("/remove/:songId", check.auth, songController.removeSong);
router.post(
  "/upload/:id",
  [check.auth, upload.single("file")],
  songController.uploadAudio
);

router.get("/audio/:file", check.auth, songController.audio);

// Exportar el enrutador para su uso en otros archivos
module.exports = router;
