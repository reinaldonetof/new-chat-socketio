const mongoose = require("mongoose");

const RoomSchema = mongoose.Schema({
  members: [mongoose.ObjectId],
});

const Room = mongoose.model("Room", RoomSchema);

module.exports = Room;
