const validate = require("../helpers/validate");
const User = require("../models/user");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("../helpers/jwt");
const path = require("path");

const register = async (req, res) => {
  try {
    let params = req.body;

    // Comprobar que se proporcionan todos los datos obligatorios
    if (!params.email || !params.password || !params.username || !params.nick) {
      return res
        .status(400)
        .json({ message: "Faltan datos obligatorios para el registro." });
    }

    // Validar los datos utilizando tu función de validación
    validate(params);

    // Verificar si el correo electrónico y el apodo ya están registrados
    const existingEmailUser = await User.findOne({
      email: params.email.toLowerCase(),
    });
    const existingNickUser = await User.findOne({
      nick: params.nick.toLowerCase(),
    });

    if (existingEmailUser) {
      return res
        .status(400)
        .json({ error: "El correo electrónico ya está registrado." });
    }

    if (existingNickUser) {
      return res.status(400).json({ error: "El apodo ya está registrado." });
    }

    // Cifrar la contraseña antes de almacenarla
    const saltRounds = 10; // Número de rondas de sal para la cifra (ajusta según tus necesidades)
    const hashedPassword = await bcrypt.hash(params.password, saltRounds);

    // Crear objeto de usuario con la contraseña cifrada
    let userToSave = new User({
      username: params.username,
      email: params.email.toLowerCase(),
      password: hashedPassword,
      nick: params.nick,
      // Otros campos del usuario si es necesario
    });

    // Guardar el usuario en la base de datos
    await userToSave.save();

    // Crear un objeto de respuesta sin incluir la contraseña
    const responseUser = {
      _id: userToSave._id,
      username: userToSave.username,
      email: userToSave.email,
      nick: userToSave.nick,
      // Otros campos del usuario si es necesario
    };

    res.status(200).json({ status: "success", user: responseUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    // Recoger los parámetros del cuerpo de la solicitud
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Faltan datos por enviar",
      });
    }

    // Buscar el usuario por su dirección de correo electrónico (email) y excluir la contraseña
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    // Comparar la contraseña proporcionada con la contraseña almacenada en la base de datos
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Contraseña incorrecta",
      });
    }

    const token = jwt.createToken(user);

    return res.status(200).json({
      status: "success",
      user: {
        id: user._id,
        name: user.username,
        nick: user.nick,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Error al iniciar sesión",
      error: error.message,
    });
  }
};

const profile = async (req, res) => {
  try {
    // Recoger id del usuario desde la URL
    const id = req.params.id;

    // Consulta para obtener los datos del perfil
    const user = await User.findById(id).select('-created_at -__v');

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "Usuario no encontrado",
      });
    }

    res.status(200).json({
      status: "success",      
      profile: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error en el servidor",
      error: error.message,
    });
  }
};
const update = async (req, res) => {
  try {
    // Recoger datos de usuario identificado
    let userIdentity = req.user;

    // Verificar si userIdentity es válido y contiene una propiedad _id
    if (!userIdentity || !userIdentity.id) {
      return res.status(401).json({
        status: "error",
        message: "Usuario no autenticado o datos incorrectos",
      });
    }

    // Recoger datos a actualizar
    let userToUpdate = req.body;

    // Comprobar si el email ya existe en la base de datos (excepto para el usuario identificado)
    const existingUserWithEmail = await User.findOne({
      email: userToUpdate.email,
      _id: { $ne: userIdentity.id }, // Excluir al usuario actual
    });

    // Si existingUserWithEmail tiene un valor, significa que el email ya está en uso
    if (existingUserWithEmail) {
      return res.status(200).json({
        status: "error",
        message:
          "El correo electrónico ya está en uso. Por favor, utiliza otro.",
      });
    }

    // Comprobar si el nick ya existe en la base de datos (excepto para el usuario identificado)
    const existingUserWithNick = await User.findOne({
      nick: userToUpdate.nick,
      _id: { $ne: userIdentity.id }, // Excluir al usuario actual
    });

    // Si existingUserWithNick tiene un valor, significa que el nick ya está en uso
    if (existingUserWithNick) {
      return res.status(200).json({
        status: "error",
        message: "El nick de usuario ya está en uso. Por favor, elige otro.",
      });
    }

    // Cifrar la contraseña si se proporciona
    if (userToUpdate.password) {
      const hashedPassword = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = hashedPassword;
    } else {
      delete userToUpdate.password; // Eliminar la propiedad de la contraseña si no se proporciona
    }

    // Buscar el usuario en la base de datos y actualizar datos
    const userUpdated = await User.findByIdAndUpdate(
      userIdentity.id,
      userToUpdate,
      { new: true }
    ).select("-__v -created_at");

    // Devolver la respuesta
    res.status(200).json({
      status: "success",
      message: "Usuario actualizado con éxito",
      userUpdated,
    });
  } catch (error) {
    console.error("Error en la actualización del usuario:", error);
    res.status(500).json({
      status: "error",
      message: "Error en el servidor",
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
    const user = await User.findOne({ _id: req.user.id });
    let currentImage = user.image; // Nombre de la imagen actual en la base de datos
  
    // Verificar si hay una imagen actual antes de intentar eliminarla
    if (currentImage) {
      const imagePath = `./uploads/avatars/${currentImage}`;
  
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
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { image: req.file.filename },
      { new: true }
    ).select("-email -__v -created_at");

    if (!updatedUser) {
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
      user: updatedUser,
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
    const filePath = path.join(__dirname, `../uploads/avatars/${file}`);

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
  register,
  login,
  profile,
  update,
  upload,
  avatar,
};
