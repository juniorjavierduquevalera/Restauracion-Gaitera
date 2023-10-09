const Like = require("../models/like");
const Album = require("../models/album");
const Song = require("../models/song");
const User = require("../models/user");

const like = async (req, res) => {
  try {
    // Obtener los datos necesarios del cuerpo de la solicitud
    const { modelId, modelname, likePublication } = req.body;
    const userlike = req.user.id;

    if (!userlike || !modelId || !likePublication || !modelname) {
      return res.status(400).json({
        status: "error",
        message:
          "Los campos 'userlike', 'modelId' y 'like_publication' son obligatorios.",
      });
    }

    // Verificar si el usuario existe
    const user = await User.findById(userlike);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado.",
      });
    }

    // Verificar si ya existe un registro de "Like" para este usuario y modelo
    const existingLike = await Like.findOne({
      userlike: userlike,
      model: modelId,
      modelname: modelname,
    });

    if (!existingLike) {
      // Crear un nuevo documento "Like"
      const like = new Like({
        userlike,
        model: modelId,
        modelname,
        like_publication: likePublication,
      });

      // Guardar el like en la base de datos
      await like.save();
    }

    // Incrementar o decrementar el contador de likes en el modelo correspondiente
    let model;
    switch (modelname) {
      case "song":
        model = Song;
        break;
      case "album":
        model = Album;
        break;
      case "artist":
        model = Artist; // Agrega Artist aquí
        break;
      default:
        return res.status(400).json({
          status: "error",
          message: "El valor de 'modelname' no es válido.",
        });
    }

    // Verificar si el usuario ya le dio like a la canción
    const modelLike = await model.findById(modelId).select('-created_at -__v');

    if (like.like_publication === false) {
      // El usuario ya dio like a la canción, restamos uno si es mayor que 0
      if (modelLike.like > 0) {
        modelLike.like -= 1;
      }
    } else {
      // El usuario no había dado like a la canción, incrementamos el contador
      modelLike.like += 1;
    }

    // Guardar el modelo actualizado en la base de datos
    const dataLike = await modelLike.save();

    res.status(200).json({
      status: "success",
      message: "Like agregado o restado exitosamente.",
      dataLike,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error al agregar o restar el like.",
      error: error.message,
    });
  }
};
  

module.exports = {
  like,
};
