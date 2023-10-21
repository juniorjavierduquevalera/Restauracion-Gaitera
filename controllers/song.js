const Song = require("../models/song");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");

const prueba = (req, res) => {
  res.status(200).send({
    status: "succes",
    mensaje: "menjaje enviado desde song",
  });
};

const saveSong = async (req, res) => {
  try {
    // Recoger los datos que llegan por el body
    const params = req.body;

    // Crear un objeto de tipo Song con los datos
    const song = new Song(params);

    // Guardar la canción en la base de datos
    await song.save();

    // Buscar la canción recién guardada con la selección
    const savedSong = await Song.findById(song._id).select("-created_at -__v");

    // Devolver una respuesta exitosa sin los campos "created_at" y "__v"
    res.status(200).json({
      status: "success",
      message: "Canción guardada exitosamente.",
      song: savedSong,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al guardar la canción.",
      error: error.message,
    });
  }
};
const searchSong = async (req, res) => {
  try {
    // Obtener el ID de la canción de los parámetros de la URL
    const songId = req.params.id;

    // Buscar la canción por su ID y popular la información del álbum al que pertenece
    const song = await Song.findById(songId)
      .select("-created_at -__v")
      .populate({
        path: "album",
        select: "-created_at -__v",
      });

    // Verificar si se encontró la canción
    if (!song) {
      return res.status(404).json({
        status: "error",
        message: "Canción no encontrada.",
      });
    }

    // Devolver la respuesta con la canción encontrada
    res.status(200).json({
      status: "success",
      message: "Canción encontrada exitosamente.",
      song: song,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al buscar la canción.",
      error: error.message,
    });
  }
};

const listSong = async (req, res) => {
  try {
    // Recoger el ID del álbum de los parámetros de la URL
    const albumId = req.params.albumId;

    // Realizar una consulta para buscar las canciones del álbum especificado
    const songs = await Song.find({ album: albumId })
      .populate({
        path: "album",
        select: "-created_at -__v",
        populate: {
          path: "artist",
          model: "Artist",
          select: "name description -_id",
        },
      })
      .select("-created_at -__v")
      .sort("track");

    // Verificar si se encontraron canciones
    if (!songs || songs.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No se encontraron canciones para este álbum.",
      });
    }

    // Devolver la respuesta con las canciones encontradas
    res.status(200).json({
      status: "success",
      message: "Canciones encontradas exitosamente.",
      songs: songs,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al buscar las canciones del álbum.",
      error: error.message,
    });
  }
};

const updateSong = async (req, res) => {
  try {
    // Obtener el ID de la canción de los parámetros de la URL
    const songId = req.params.songId;

    // Obtener datos del usuario//
    const userRole = req.user.role;

    // Obtener los datos actualizados de la canción del cuerpo de la solicitud
    const newData = req.body;

    // Verifica si el usuario es el propietario o tiene el rol "admin"
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para actualizar esta cancion",
      });
    }

    // Buscar la canción por su ID y actualizarla
    const updatedSong = await Song.findByIdAndUpdate(songId, newData, {
      new: true,
    }).select("-created_at -__v");

    // Verificar si la canción se actualizó correctamente
    if (!updatedSong) {
      return res.status(404).json({
        status: "error",
        message: "Canción no encontrada.",
      });
    }

    // Devolver una respuesta exitosa con la canción actualizada
    res.status(200).json({
      status: "success",
      message: "Canción actualizada exitosamente.",
      song: updatedSong,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al actualizar la canción.",
      error: error.message,
    });
  }
};
const removeSong = async (req, res) => {
  try {
    // Obtener el ID de la canción de los parámetros de la URL
    const songId = req.params.songId;

    // Obtener datos del usuario
    const userRole = req.user.role;

    // Verifica si el usuario es el propietario o tiene el rol "admin"
    if (userRole !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para eliminar esta canción",
      });
    }

    // Buscar la canción por su ID en la base de datos
    const song = await Song.findById(songId);

    // Verificar si la canción existe
    if (!song) {
      return res.status(404).json({
        status: "error",
        message: "Canción no encontrada.",
      });
    }

    // Obtener el nombre del archivo de audio asociado a la canción
    const audioFileName = song.file;

    // Eliminar la canción de la base de datos
    await Song.findByIdAndRemove(songId);

    // Eliminar el archivo de audio del sistema de archivos
    const audioFilePath = `./uploads/audios/${audioFileName}`;
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    // Devolver una respuesta exitosa con la canción eliminada
    res.status(200).json({
      status: "success",
      message: "Canción eliminada exitosamente.",
      song: song,
    });
  } catch (error) {
    // Manejar errores generales
    res.status(500).json({
      status: "error",
      message: "Error al eliminar la canción.",
      error: error.message,
    });
  }
};

const uploadAudio = async (req, res) => {
  // Recoger el fichero y comprobar si existe
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      message: "La petición no incluye el audio",
    });
  }

  // Conseguir el nombre del archivo
  let audio = req.file.filename;

  // Sacar información de la imagen
  const audioSplit = audio.split(".");
  const extension = audioSplit[1];

  // Comprobar si la extensión es válida
  if (
    extension !== "mp3" &&
    extension !== "wav" &&
    extension !== "wma" &&
    extension !== "ogg"
  ) {
    const filePath = req.file.path; // Utiliza la propiedad path para obtener la ruta del archivo
    try {
      fs.unlinkSync(filePath); // Elimina el archivo asociado
      return res.status(400).send({
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

  // Obtener el nombre del audio actual en la base de datos
  try {
    const song = await Song.findOne({ _id: req.params.id });
    let currentAudio = song.file; // Nombre del audio actual en la base de datos

    // Verificar si hay un track actual antes de intentar eliminarla
    if (currentAudio) {
      const audioPath = `./uploads/audios/${currentAudio}`;

      // Verificar si el archivo existe antes de intentar eliminarlo
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath); // Eliminar el audio anterior si existe
      }
    }
  } catch (error) {
    // Manejar errores al obtener o eliminar la imagen anterior
    return res.status(500).json({
      status: "error",
      message: "Error al obtener o eliminar el audio anterior.",
      error: error.message,
    });
  }

  // Si es correcto, se sube a la base de datos
  try {
    const updatedSong = await Song.findOneAndUpdate(
      { _id: req.params.id },
      { file: req.file.filename },
      { new: true }
    ).select("-email -__v");

    if (!updatedSong) {
      // Si no se encontró un usuario para actualizar, puedes manejar el error aquí
      return res.status(404).json({
        status: "error",
        message: "song no encontrada",
      });
    }

    // Si se actualizó correctamente, puedes enviar una respuesta exitosa
    return res.status(200).json({
      status: "success",
      message: "el audio ha sido actualizada con éxito.",
      album: updatedSong,
    });
  } catch (error) {
    // Manejo de errores en caso de que ocurra un error durante la actualización
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar el audio de la cancion",
      error: error.message,
    });
  }
};

const audio = async (req, res) => {
  try {
    // Sacar el parámetro de la URL
    const file = req.params.file;

    // Montar la ruta real de la imagen
    const filePath = path.join(__dirname, `../uploads/audios/${file}`);

    // Comprobar si el archivo existe
    const stats = await fs.promises.stat(filePath);

    if (!stats.isFile()) {
      return res.status(404).json({
        status: "error",
        message: "El audio no existe.",
      });
    }

    // Devolver el archivo

    return res.status(200).sendFile(filePath);
  } catch (error) {
    // Manejar errores generales
    return res.status(500).json({
      status: "error",
      message: "Error al obtener el audio",
      error: error.message,
    });
  }
};

module.exports = {
  prueba,
  saveSong,
  searchSong,
  listSong,
  updateSong,
  removeSong,
  uploadAudio,
  audio,
 
};
