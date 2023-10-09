const mongoose = require("mongoose");

const connection = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/app_music");
        console.log("Conexión exitosa a la base de datos");
    } catch (error) {
        console.error("Error de conexión a la base de datos:", error);
    }
};

module.exports = connection;