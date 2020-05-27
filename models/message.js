const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
  author: String,
  when: Date,
  type: String,
  message: String,
  room: {
    type: mongoose.ObjectId,
    ref: "Room",
  },
  msgRead: {
    type: Boolean,
    default: false,
  },
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
