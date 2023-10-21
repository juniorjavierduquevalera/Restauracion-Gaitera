const Album = require("../models/album");
const Song = require("../models/song");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");

const save = async (req, res) => {
  try {
    // Extraer los datos enviados en el body de la solicitud
    let params = req.body;
    const userRole = req.user.role;

    // Verificar si el usuario tiene el rol "admin"
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para guardar este álbum",
      });
    }

    // Crear un objeto "album" a partir de los datos recibidos
    let album = new Album(params);

    // Guardar el objeto "album" en la base de datos
    const savedAlbum = await album.save();

    // Crear un nuevo objeto sin los campos "__v" y "created_at"
    const responseAlbum = {
      ...savedAlbum._doc,
      _id: savedAlbum._id, // Mantener el _id si es necesario
    };

    // Eliminar los campos "__v" y "created_at"
    delete responseAlbum.__v;
    delete responseAlbum.created_at;

    // Responder con un mensaje de éxito y el nuevo objeto sin los campos no deseados
    res.status(200).json({
      status: "success",
      message: "Álbum guardado exitosamente.",
      album: responseAlbum,
    });
  } catch (error) {
    // Responder con un mensaje de error en caso de fallo
    res.status(500).json({
      status: "error",
      message: "Error al guardar el álbum.",
      error: error.message,
    });
  }
};

const searchAlbum = async (req, res) => {
  try {
    // Sacar el ID del álbum de los parámetros de la URL
    const albumId = req.params.id;

    // Buscar el álbum por su ID y popular la información del artista
    const album = await Album.findById(albumId)
      .populate("artist", "name description -_id")
      .select("-__v -created_at");

    // Verificar si se encontró el álbum
    if (!album) {
      return res.status(404).json({
        status: "error",
        message: "Álbum no encontrado.",
      });
    }

    // Devolver la respuesta con el álbum encontrado
    res.status(200).json({
      status: "success",
      message: "Álbum encontrado exitosamente.",
      album: album,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al buscar el álbum.",
      error: error.message,
    });
  }
};

const listAlbumsByArtist = async (req, res) => {
  try {
    // Sacar el ID del artista de los parámetros de la URL
    const artistId = req.params.artistId;

    // Verificar si se proporcionó un ID de artista válido
    if (!artistId) {
      return res.status(404).json({
        status: "error",
        message: "No se ha encontrado el artista.",
      });
    }

    // Buscar todos los álbumes del artista en la base de datos y popular la información del artista
    const albums = await Album.find({ artist: artistId })
      .populate("artist", "name description")
      .select("-created_at -__v"); // Elimina los campos created_at y __v de la respuesta;

    // Verificar si se encontraron álbumes del artista
    if (!albums || albums.length === 0) {
      return res.status(404).json({
        status: "success",
        message: "No se encontraron álbumes para este artista.",
      });
    }

    // Devolver la respuesta con los álbumes encontrados
    res.status(200).json({
      status: "success",
      message: "Álbumes encontrados exitosamente.",
      albums: albums,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al listar los álbumes del artista.",
      error: error.message,
    });
  }
};

const updateAlbum = async (req, res) => {
  try {
    // Recoger el parámetro de la URL que contiene el ID del álbum
    const albumId = req.params.albumId;

    // Recoger los datos del body de la solicitud
    const data = req.body;

    // Recoger los datos del usuario identificado
    const userRole = req.user.role;

    // Verifica si el usuario es el propietario o tiene el rol "admin"
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para actualizar este álbum.",
      });
    }

    // Buscar y actualizar el álbum por su ID
    const updatedAlbum = await Album.findByIdAndUpdate(albumId, data, {
      new: true,
    });

    // Verificar si se encontró y actualizó el álbum
    if (!updatedAlbum) {
      return res.status(404).json({
        status: "error",
        message: "Álbum no encontrado.",
      });
    }

    // Crear un nuevo objeto sin los campos "__v" y "created_at"
    const responseAlbum = {
      ...updatedAlbum._doc,
      _id: updatedAlbum._id, // Mantener el _id si es necesario
    };

    // Eliminar los campos "__v" y "created_at" del objeto actualizado
    delete responseAlbum.__v;
    delete responseAlbum.created_at;

    // Devolver la respuesta con el álbum actualizado
    res.status(200).json({
      status: "success",
      message: "Álbum actualizado exitosamente.",
      album: responseAlbum,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al actualizar el álbum.",
      error: error.message,
    });
  }
};

const removeAlbum = async (req, res) => {
  try {
    // Recoger el parámetro de la URL que contiene el ID del álbum a eliminar
    const albumId = req.params.albumId;

    // Recoger los datos del usuario identificado
    const userRole = req.user.role;

    // Verifica si el usuario es el propietario o tiene el rol "admin"
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para eliminar este álbum.",
      });
    }

    // Buscar el álbum por su ID para obtener la ruta de la imagen y las canciones asociadas
    const album = await Album.findById(albumId);

    // Verificar si se encontró el álbum
    if (!album) {
      return res.status(404).json({
        status: "error",
        message: "Álbum no encontrado.",
      });
    }

    // Obtener la ruta de la imagen del álbum
    const currentImage = album.image; // Reemplaza "image" con el campo correcto que almacena el nombre de la imagen
    const imagePath = `./uploads/album/${currentImage}`;

    // Verificar si el archivo de imagen existe antes de intentar eliminarlo
    if (fs.existsSync(imagePath)) {
      // Eliminar la imagen del álbum del sistema de archivos
      fs.unlinkSync(imagePath);
    }

    // Obtener todas las canciones asociadas al álbum
    const songs = await Song.find({ album: albumId });

    // Eliminar los archivos de audio de las canciones
    songs.forEach((song) => {
      const audioPath = `./uploads/audios/${song.file}`; // Reemplaza "audio" con el campo correcto que almacena el nombre del archivo de audio
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    });

    // Eliminar todas las canciones asociadas
    await Song.deleteMany({ album: albumId });

    // Eliminar el álbum de la base de datos
    const deletedAlbum = await Album.findByIdAndDelete(albumId);

    // Devolver una respuesta exitosa
    res.status(200).json({
      status: "success",
      message: "Álbum y canciones eliminados exitosamente.",
      album: deletedAlbum,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al eliminar el álbum y las canciones.",
      error: error.message,
    });
  }
};

const upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(404).send({
        status: "error",
        message: "La petición no incluye la imagen",
      });
    }

    let image = req.file.originalname;
    const imageSplit = image.split(".");
    const extension = imageSplit[1];

    if (extension != "png" && extension != "jng" && extension != "jpeg") {
      const filePath = req.file.path;
      const fileDeleted = fs.unlinkSync(filePath);

      return res.status(404).send({
        status: "error",
        message: "la etension no es valida",
      });
    }

    const album = await Album.findOne({ _id: req.params.id });

    if (!album) {
      // El álbum no fue encontrado, puedes manejarlo como desees
      const filePath = req.file.path;
      const fileDeleted = fs.unlinkSync(filePath);

      return res.status(404).json({
        status: "error",
        message: "Álbum no encontrado.",
      });
    }

    let currentImage = album.image;

    const deleteFile = (filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    if (currentImage) {
      const imagePath = `./uploads/album/${currentImage}`;
      deleteFile(imagePath);
    }

    const updatedAlbum = await Album.findOneAndUpdate(
      { _id: req.params.id },
      { image: req.file.filename },
      { new: true }
    ).select("-email -__v");

    if (!updatedAlbum) {
      return res.status(404).json({
        status: "error",
        message: "Álbum no encontrado.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Imagen de perfil actualizada con éxito.",
      album: updatedAlbum,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Ocurrió un error.",
      error: error.message,
    });
  }
};

const coverArt = async (req, res) => {
  try {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar la ruta real de la imagen
    const filePath = path.join(__dirname, `../uploads/album/${file}`);

    // Comprobar si el archivo existe
    const stats = await fs.promises.stat(filePath);

    if (!stats.isFile()) {
      return res.status(404).json({
        status: "error",
        message: "El avatar no existe.",
      });
    }

    // Devolver el archivo tal como está
    return res.status(200).sendFile(filePath);
  } catch (error) {
    // Manejar errores generales
    return res.status(500).json({
      status: "error",
      message: "Error al obtener el avatar.",
      error: error.message,
    });
  }
};

module.exports = {
  save,
  searchAlbum,
  listAlbumsByArtist,
  updateAlbum,
  removeAlbum,
  upload,
  coverArt,
};
