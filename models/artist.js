const { Schema, model } = require("mongoose");

const artistSchema = new Schema({
  usuario: {
    // Campo para almacenar el ID del usuario
    type: Schema.Types.ObjectId,
    ref: "User", // Referencia al modelo de usuario
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "default.pg",
  },
  like: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Artist = model("Artist", artistSchema, "artists");

module.exports = Artist;
