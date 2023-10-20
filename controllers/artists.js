const Artist = require("../models/artist");
const Album = require("../models/album");
const Song = require("../models/song");
  const fs = require("fs");
const path = require("path");

const save = async (req, res) => {
  try {
    // Recoger los datos del body
    let params = req.body;

    // Obtener el usuario identificado desde req.user
    const userIdentity = req.user;
    const userRole = req.user.role;

    // Verifica si el usuario tiene el rol "admin"
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para actualizar este artista.",
      });
    }

    // Crear el objeto del artista y asignar el usuario identificado como propietario
    let artist = new Artist({
      ...params,
      usuario: userIdentity.id,
    });

    // Guardar el artista en la base de datos
    await artist.save();

    // Eliminar los campos __v y create_at de la respuesta
    artist.__v = undefined;
    artist.created_at = undefined;

    res.status(200).send({
      status: "success",
      message: "Artista guardado exitosamente.",
      artist: artist,
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).send({
      status: "error",
      message: "Error al guardar el artista.",
      error: error.message,
    });
  }
};

const search = async (req, res) => {
  try {
    // Sacar el parámetro por la URL
    const artistId = req.params.id;

    // Buscar el artista por su ID en la base de datos
    const artist = await Artist.findById(artistId).select("-created_at -__v");

    if (!artist) {
      // Si no se encuentra el artista, devolver un mensaje de error
      return res.status(404).json({
        status: "error",
        message: "Artista no encontrado.",
      });
    }

    // Si se encuentra el artista, devolver los detalles del artista
    res.status(200).json({
      status: "success",
      artist: artist,
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      status: "error",
      message: "Error al buscar el artista.",
      error: error.message,
    });
  }
};

const list = async (req, res) => {
  try {
    // Sacar la página solicitada de los parámetros de la URL
    let page = 1;
    if (req.params.page) {
      page = parseInt(req.params.page);
    }

    // Definir la cantidad de artistas por página
    const itemsPerPage = 5;

    // Calcular el índice de inicio de la página
    const startIndex = (page - 1) * itemsPerPage;

    // Buscar y paginar los artistas en la base de datos
    const artists = await Artist.find()
      .skip(startIndex)
      .limit(itemsPerPage)
      .sort("name")
      .select("-created_at -__v");

    // Contar el total de artistas en la base de datos (sin paginar)
    const totalArtists = await Artist.countDocuments();

    res.status(200).json({
      status: "success",
      artists: artists,
      totalArtists: totalArtists,
      currentPage: page,
      totalPages: Math.ceil(totalArtists / itemsPerPage),
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      status: "error",
      message: "Error al listar los artistas.",
      error: error.message,
    });
  }
};

const updateArtist = async (req, res) => {
  try {
    const artistId = req.params.id;
    const updates = req.body;
    const userRole = req.user.role;

    // Busca el artista por su ID en la base de datos
    const artist = await Artist.findById(artistId);

    if (!artist) {
      return res.status(404).json({
        status: "error",
        message: "Artista no encontrado.",
      });
    }

    // Verifica si el usuario tiene el rol "admin"
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para actualizar este artista.",
      });
    }

    // Actualiza el artista y obtén el nuevo objeto actualizado
    const updatedArtist = await Artist.findByIdAndUpdate(artistId, updates, {
      new: true,
    }).select("-created_at -__v");

    res.status(200).json({
      status: "success",
      message: "Artista actualizado exitosamente.",
      artist: updatedArtist,
      role: userRole,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al actualizar el artista.",
      error: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    // Obtener el ID del artista de la URL
    const artistId = req.params.id;
    const userRole = req.user.role;

    // Buscar el artista por su ID
    const artist = await Artist.findById(artistId);

    // Verificar si el artista no fue encontrado
    if (!artist) {
      return res.status(404).json({
        status: "error",
        message: "El artista no fue encontrado.",
      });
    }

    // Verificar si el usuario tiene permiso para eliminar el artista
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para eliminar este artista.",
      });
    }

    // Buscar todos los álbumes del artista
    const albums = await Album.find({ artist: artistId });

    // Iterar a través de los álbumes para eliminar canciones, archivos de audio e imágenes de álbumes
    for (const album of albums) {
      // Obtén una lista de canciones del álbum
      const songsToDelete = await Song.find({ album: album._id });

      // Itera a través de las canciones y elimina los archivos de audio
      for (const song of songsToDelete) {
        const songFilePath = `./uploads/audios/${song.file}`;
        if (fs.existsSync(songFilePath)) {
          fs.unlinkSync(songFilePath);
        }
      }

      // Elimina todas las canciones del álbum
      await Song.deleteMany({ album: album._id });

      // Elimina la imagen del álbum si existe
      if (album.image) {
        const albumImageFilePath = `./uploads/album/${album.image}`;
        if (fs.existsSync(albumImageFilePath)) {
          fs.unlinkSync(albumImageFilePath);
        }
      }

      // Elimina el álbum
      await Album.findByIdAndRemove(album._id);
    }

    // Elimina la imagen del artista si existe
    if (artist.image) {
      const artistImageFilePath = `./uploads/artists/${artist.image}`;
      if (fs.existsSync(artistImageFilePath)) {
        fs.unlinkSync(artistImageFilePath);
      }
    }

    // Elimina el artista
    await Artist.findByIdAndRemove(artistId);

    // Respuesta exitosa
    res.status(200).json({
      status: "success",
      message: "Artista y sus álbumes/canciones eliminados exitosamente.",
    });
  } catch (error) {
    // Manejo de errores generales
    res.status(500).json({
      status: "error",
      message: "Error al eliminar el artista y sus álbumes/canciones.",
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
    const artist = await Artist.findOne({ _id: req.params.id });
    let currentImage = artist.image; // Nombre de la imagen actual en la base de datos

    // Verificar si hay una imagen actual antes de intentar eliminarla
    if (currentImage) {
      const imagePath = `./uploads/artists/${currentImage}`;

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
    const updatedArtist = await Artist.findOneAndUpdate(
      { _id: req.params.id },
      { image: req.file.filename },
      { new: true }
    ).select("-email -__v -created_at");

    if (!updatedArtist) {
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
      artist: updatedArtist,
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

const avatar = async (req, res) => {
  try {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar la ruta real de la imagen
    const filePath = path.join(__dirname, `../uploads/artists/${file}`);

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
  search,
  list,
  updateArtist,
  remove,
  upload,
  avatar,
};
