const express = require("express");
const check = require("../midlewares/auth");
// Cargar el enrutador
const router = express.Router();

// Importar controlador
const albumController = require("../controllers/album");

//importar dependencia
const multer = require("multer");

// Configuración de subida
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Especifica la carpeta donde se almacenarán los archivos subidos
    cb(null, "./uploads/album/");
  },
  filename: function (req, file, cb) {
    // Define el nombre del archivo en función de la fecha actual y el nombre original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = file.originalname.split(".").pop(); // Obtén la extensión del archivo original
    cb(null, "album-" + uniqueSuffix + "." + extension);
  },
});

// Crear un middleware de Multer
const upload = multer({ storage: storage });

// Definir rutas
router.post("/save",check.auth, albumController.save);
router.get("/search/:id",check.auth, albumController.searchAlbum);
router.get("/list/:artistId",check.auth, albumController.listAlbumsByArtist);
router.put("/update/:albumId",check.auth, albumController.updateAlbum);
router.delete("/remove/:albumId",check.auth, albumController.removeAlbum);
router.post(
    "/upload/:id",
    [check.auth, upload.single("file")],
    albumController.upload
  );
router.get("/cover-art/:file", check.auth, albumController.coverArt);

// Exportar el enrutador para su uso en otros archivos
module.exports = router;
