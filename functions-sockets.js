const handshake = (socket, next) => {
  const session = socket.handshake.session;
  console.log(session);
  if (!session.user) {
    next(new Error("Auth failed."));
  } else {
    next();
  }
};

module.exports = {
  handshake,
};
