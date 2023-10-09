const connection = require("./database/connection");
const cors = require("cors"); // Importa la biblioteca cors
const express = require("express");

// Llama a la función para establecer la conexión
connection();

const app = express();
const port = 3910;

//configurar cors//
app.use(cors());

// convertir los datos del body a objetos js
app.use(express.json()); // Para parsear JSON en el cuerpo de las solicitudes
app.use(express.urlencoded({ extended: true })); // Para parsear datos de formularios

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

// Cargar configuración de rutas
const userRoutes = require("./routes/user");
const artistRoutes = require("./routes/artists");
const albumRoutes = require("./routes/album");
const songRoutes = require("./routes/song");
const likeRoutes = require("./routes/like");

// Usar las rutas en la ruta base "/api"
app.use("/api/user", userRoutes);
app.use("/api/artist", artistRoutes);
app.use("/api/album", albumRoutes);
app.use("/api/song", songRoutes);
app.use("/api/like", likeRoutes);

// Rutas
app.get("/", (req, res) => {
  res.send("¡Bienvenido a mi servidor!");
});
