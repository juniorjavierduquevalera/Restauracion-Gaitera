const { Schema, model } = require("mongoose");

const likeSchema = Schema({
  userlike: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
  },
  model: {
    type: Schema.Types.ObjectId,
    refPath: 'modelname', // Utiliza refPath para que ref sea dinámico
    required: true,
  },  
  modelname: {
    type: String,
    required: true,
    enum: ["song", "album", "artist"], // Lista de modelos posibles
  },
  like_publication: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = model("Like", likeSchema, "likes");
