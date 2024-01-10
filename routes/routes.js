const uuid = require('uuid')

module.exports = (io) => {
  const game = io.of("/entergame");

  let members = [];
  let gameInfo;

  game.on("connection", (socket) => {
    socket.on("identify", (enterRequest) => {
      //enter_request = {userId: uuid, code: string, isHost: boolean}
      if (enterRequest.isHost)
        gameInfo = {
          gameId: uuid.v4(),
          hostId: enterRequest.userId,
          code: enterRequest.code,
          gametype: 
        };
      else {
        if (gameInfo.code === enterRequest.code) {
          socket.emit("identify", true);
        }
      }
    });
  });
};
