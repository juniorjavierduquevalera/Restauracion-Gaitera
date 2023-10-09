const Album = require("../models/album");
const Song = require("../models/song");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");

const save = async (req, res) => {
  try {
    // Sacar datos enviados en el body
    let params = req.body;

    // Crear objeto
    let album = new Album(params);

    // Guardar el objeto en la base de datos
    const savedAlbum = await album.save();

    res.status(200).json({
      status: "success",
      message: "Álbum guardado exitosamente.",
      album: savedAlbum,
    });
  } catch (error) {
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
        message: "No tienes permiso para actualizar este album.",
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

    // Devolver la respuesta con el álbum actualizado
    res.status(200).json({
      status: "success",
      message: "Álbum actualizado exitosamente.",
      album: updatedAlbum,
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
        message: "No tienes permiso para actualizar este album.",
      });
    }

    // Buscar y eliminar el álbum por su ID
    const deletedAlbum = await Album.findByIdAndDelete(albumId);
    const deleteSongs = await Song.deleteMany({ album: albumId });

    // Verificar si se encontró y eliminó el álbum
    if (!deletedAlbum) {
      return res.status(404).json({
        status: "error",
        message: "Álbum no encontrado.",
      });
    }

    // Devolver una respuesta exitosa
    res.status(200).json({
      status: "success",
      message: "Álbum eliminado exitosamente.",
      album: deletedAlbum,
      songs: deleteSongs,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al eliminar el álbum.",
      error: error.message,
    });
  }
};

const upload = async (req, res) => {
  // Recoger el fichero y comprobar si existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "La petición no incluye la imagen",
    });
  }

  // Conseguir el nombre del archivo
  let image = req.file.originalname;

  // Sacar información de la imagen
  const imageSplit = image.split(".");
  const extension = imageSplit[1];

  // Comprobar si la extensión es válida
  if (extension !== "png" && extension !== "jpg" && extension !== "jpeg") {
    const filePath = req.file.filePath; // Utiliza la misma propiedad filePath
    try {
      fs.unlinkSync(filePath); // Elimina el archivo asociado
      return res.status(404).send({
        status: "error",
        message: "La extensión no es válida. El archivo ha sido eliminado.",
      });
    } catch (error) {
      return res.status(500).send({
        status: "error",
        message: "Error al eliminar el archivo.",
      });
    }
  }

  // Obtener el nombre de la imagen actual en la base de datos
  try {
    const album = await Album.findOne({ _id: req.params.id });
    let currentImage = album.image; // Nombre de la imagen actual en la base de datos

    // Verificar si hay una imagen actual antes de intentar eliminarla
    if (currentImage) {
      const imagePath = `./uploads/album/${currentImage}`;

      // Verificar si el archivo existe antes de intentar eliminarlo
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Eliminar la imagen anterior si existe
      }
    }
  } catch (error) {
    // Manejar errores al obtener o eliminar la imagen anterior
    return res.status(500).json({
      status: "error",
      message: "Error al obtener o eliminar la imagen anterior.",
      error: error.message,
    });
  }

  // Si es correcto, se sube a la base de datos
  try {
    const updatedAlbum = await Album.findOneAndUpdate(
      { _id: req.params.id },
      { image: req.file.filename },
      { new: true }
    ).select("-email -__v");

    if (!updatedAlbum) {
      // Si no se encontró un usuario para actualizar, puedes manejar el error aquí
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado.",
      });
    }

    // Si se actualizó correctamente, puedes enviar una respuesta exitosa
    return res.status(200).json({
      status: "success",
      message: "Imagen de perfil actualizada con éxito.",
      album: updatedAlbum,
    });
  } catch (error) {
    // Manejo de errores en caso de que ocurra un error durante la actualización
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar la imagen de perfil.",
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
