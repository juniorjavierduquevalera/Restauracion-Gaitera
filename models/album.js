const { Schema, model } = require("mongoose");

const albumSchema = new Schema({
  artist: {
    type: Schema.Types.ObjectId,
    ref: "Artist",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  year: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    default: "default.png",
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

const Album = model("Album", albumSchema, "albums");

module.exports = Album;
