const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      // required: true,
    },
    city: {
      type: String,
      trim: true,
      // required: true,
    },
    chatId: {
      type: Number,
      // required: true,
    },
    apiKey: {
      type: String,
    },
    subscriber: {
      type: String,
    },
  },
  { timestamps: true }
);

const user = mongoose.model("user", userSchema);

module.exports = { user };
