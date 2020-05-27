const session = require("express-session");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const sharedSession = require("express-socket.io-session");

const redis = require("socket.io-redis");
io.adapter(redis());

const Room = require("./models/room");
const Message = require("./models/message");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const expressSession = session({
  secret: "socketio",
  cookie: {
    maxAge: 10 * 60 * 1000,
  },
});
app.use(expressSession);
io.use(sharedSession(expressSession, { autoSave: true }));
io.use((socket, next) => {
  const session = socket.handshake.session;
  if (!session.user) {
    next(new Error("Auth failed."));
  } else {
    next();
  }
});

app.get("/", (req, res) => res.render("home"));
app.post("/", (req, res) => {
  req.session.user = {
    name: req.body.name,
  };
  res.redirect("/room");
});

app.get("/room", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.render("room", {
    name: req.session.user.name,
  });
});

io.on("connection", (socket) => {
  Room.find({ members: { $in: "5ebc7dfb448b7f60983c9110" } }, (err, rooms) => {
    socket.emit("roomList", rooms);
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
    Message.find({ room: roomId }).then((msgs) => {
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

mongoose
  .connect("mongodb://localhost/new-chat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    http.listen(port, () => console.log("Chat runing..."));
  });
