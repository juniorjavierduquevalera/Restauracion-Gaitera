const { Schema, model } = require("mongoose");

const songSchema = new Schema({
  album: {
    type: Schema.Types.ObjectId,
    ref: "Album",
    required: true,
  },
  track: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
  },
  file: {
    type: String,
    default: "default.mp3",
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

const Song = model("Song", songSchema, "songs");

module.exports = Song;
