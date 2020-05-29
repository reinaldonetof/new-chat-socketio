const session = require("express-session");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const { setupWebsocket } = require("./websocket");

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

setupWebsocket(http, expressSession);
app.use(expressSession);

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

mongoose
  .connect("mongodb://localhost/new-chat", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    http.listen(port, () => console.log("Chat runing..."));
  });
