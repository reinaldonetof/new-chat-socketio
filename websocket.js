const socketio = require("socket.io");
const redis = require("socket.io-redis");
const sharedSession = require("express-socket.io-session");
const { handshake } = require("./functions-sockets");

const Room = require("./models/room");
const Message = require("./models/message");

const setupWebsocket = (server, expressSession) => {
  const io = socketio(server);
  io.adapter(redis());
  io.use(sharedSession(expressSession, { autoSave: true }));

  io.use(handshake);

  io.on("connection", (socket) => {
    Room.find(
      { members: { $in: "5ebc7dfb448b7f60983c9110" } },
      (err, rooms) => {
        socket.emit("roomList", rooms);
      }
    );

    socket.on("upListMsgs", (object) => {
      Message.find({ room: object.selectedRoom })
        .sort({ when: -1 })
        .limit(10 * object.countMsgs)
        .then((msgs) => {
          socket.emit("msgsList", msgs);
        });
    });
    socket.on("addRoom", async (roomMembers) => {
      const checkRoom = await Room.findOne({ members: roomMembers.members });
      if (!checkRoom) {
        const room = new Room({
          members: roomMembers.members,
        });
        room.save().then(() => {
          io.emit("newRoom", room);
        });
      } else {
        io.emit("existRoom", checkRoom);
      }
    });

    // join na sala que o usuario quer entrar
    socket.on("join", (roomId) => {
      socket.join(roomId);
      Message.find({ room: roomId })
        .sort({ when: -1 })
        .limit(10)
        .then((msgs) => {
          socket.emit("msgsList", msgs);
        });
    });

    // receber mensagem
    socket.on("sendMsg", (msg) => {
      const message = new Message({
        author: socket.handshake.session.user.name,
        when: new Date(),
        type: "text",
        message: msg.msg,
        room: msg.room,
      });
      message.save().then(() => {
        io.to(msg.room).emit("newMsg", message);
      });
    });

    socket.on("sendAudio", (msg) => {
      const message = new Message({
        author: socket.handshake.session.user.name,
        when: new Date(),
        type: "audio",
        message: msg.data,
        room: msg.room,
      });
      message.save().then(() => {
        io.to(msg.room).emit("newAudio", message);
      });
    });
  });
};

module.exports = {
  setupWebsocket,
};
