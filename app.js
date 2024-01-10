const http = require("http");

const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server, {
  cors: {
    origin: `*`,
  },
});

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use("/static", express.static("public"));
// app.use(express.static(path.join(__dirname, "src")));

//behavior on connection to websocket

const rooms = {};
const enterGame = io.of("/entergame");
const gameLobby = io.of("/gamelobby");
const playGame = io.of("/playgame");
console.log(rooms);

enterGame.on("connection", (socket) => {
  console.log("enterGame: connected");

  socket.on("createRoom", (gameMode, userInfo) => {
    let code;
    do {
      code = generateRandomCode();
    } while (rooms[code]);
    console.log(socket.id);

    rooms[code] = { users: {}, gameMode: gameMode, hostId: userInfo.id };
    socket.emit("createRoom", code);
  });

  socket.on("verifyGame", (code) => {
    if (!rooms[code]) {
      socket.emit("verifyGame", -1);
      return;
    }
    if (Object.keys(rooms[code].users).length >= 10) {
      socket.emit("verifyGame", -2);
      return;
    }
    socket.emit("verifyGame", 1);
  });

  socket.on("disconnect", () => {
    console.log("enterGame: disconnected");
  });
});

//problems[code][index] === problem
const problems = {};
//answers[code][index] === []
const answers = {};
const gameChats = {};
playGame.on("connection", (socket) => {
  console.log("playGame: connected");

  socket.on("joinGame", (code) => {
    console.log("joined Game");
    socket.join(code);
  });

  socket.on("initializeGame", async (code, gameMode) => {
    //host만 호출
    console.log(gameMode);
    await selectProblems(code, gameMode);
    console.log(problems[code]);
    gameChats[code] = [];
    playGame.to(code).emit("initializeGame", problems[code][0]);
  });

  socket.on("newProblem", (code) => {
    problems[code].shift();
    answers[code].shift();

    if (problems[code].lenght === 0) {
      delete problems[code];
      delete answers[code];
      delete gameChats[code];
      playGame.to(code).emit("endGame", true);
    } else {
      playGame.to(code).emit("newProblem", problems[code][0]);
    }
  });

  socket.on("chatting", (code, chat) => {
    //check if the chat is correct
    gameChats[code].push(chat);
    if (answers[code][0].includes(chat.userChat)) {
      playGame.to(code).emit("chatting", chat, gameChats[code], true);

      problems[code].shift();
      answers[code].shift();

      if (problems[code].length === 0) {
        //finish game
        delete problems[code];
        delete answers[code];
        delete gameChats[code];
        playGame.to(code).emit("endGame", true);
      } else {
        playGame.to(code).emit("newProblem", problems[code][0]);
      }
    } else {
      playGame.to(code).emit("chatting", chat, gameChats[code], false);
    }
  });

  socket.on("disconnect", () => {
    console.log("playGame: disconnected");
  });
});

gameLobby.on("connection", (socket) => {
  console.log("gameLobby: connected");

  //게임 입장 화면에서 게임 생성을 눌렀을 때 실행

  //게임 입장 화면에서 게임 참가를 누르고 코드를 입력했을 때 실행
  //게임을 생성한 사람은 게임 대기방에서 실행
  socket.on("joinRoom", (code, userInfo) => {
    socket.emit("joinRoom", true);
    socket.join(code);
    rooms[code].users[socket.id] = { userInfo };
    gameLobby.to(code).emit("members", {
      users: Object.values(rooms[code].users).map((user) => user.userInfo),
      gameMode: rooms[code].gameMode,
      hostId: rooms[code].hostId,
    });
    // console.log(rooms);
    // console.log(rooms[code].users[socket.id].userInfo);
  });

  socket.on("changeGame", (code, gameMode) => {
    rooms[code].gameMode = gameMode;
    gameLobby.to(code).emit("changeGame", gameMode);
  });

  socket.on("startGame", (code) => {
    gameLobby.to(code).emit("startGame", true);
    console.log("start Game!");
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      if (rooms[code].users[socket.id]) {
        const leftUser = rooms[code].users[socket.id];
        delete rooms[code].users[socket.id];
        const users = Object.values(rooms[code].users).map(
          (user) => user.userInfo
        );
        if (users.length === 0) {
          delete rooms[code];
          console.log(`room: ${code} deleted`);
          console.log("gameLobby: disconnected");
          return;
        }
        if (leftUser.userInfo.id === rooms[code].hostId) {
          rooms[code].hostId = users[0].id;
        }
        gameLobby.to(code).emit("members", {
          users: users,
          gameMode: rooms[code].gameMode,
          hostId: rooms[code].hostId,
        });
        console.log("gameLobby: disconnected");
        return;
      }
    }
  });
});

let messages = [];
io.on("connection", (socket) => {
  //chatting: chatting id (server와 client가 같은 id 내에서 통신 - 통신하는 방이라고 생각)
  //data: client가 보낸 data
  //on이 받는 것(read), emit이 보내는 것(send)이라고 생각하면 편함
  socket.on("chatting", (data) => {
    console.log(data);
    messages.push(data);
    console.log(messages);
    io.emit("chatting", messages);
  });
  //   console.log("connected");

  socket.on("disconnect", () => {
    messages = [];
  });
});

server.listen(port, () =>
  console.log(`Server up and running on port ${port}.`)
);

const { REPL_MODE_SLOPPY } = require("repl");

// require("./routes/routes")(io);

const generateRandomCode = () => {
  let code = "";
  const characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return code;
};

const db = require("./models");
const MovieProblemTable = db.Movie_Problem;
const FourProblemTable = db.Four_Problem;
const FourAnswerTable = db.Four_Answer;
const ImageProblemTable = db.Image_Problem;
const selectProblems = async (code, gameMode) => {
  if (gameMode === "영화") {
    const randomProblem = await MovieProblemTable.findAll({
      order: db.sequelize.literal("RAND()"),
      limit: 30,
    });
    console.log(randomProblem);
    problems[code] = randomProblem.map((problem) => ({
      problem: problem.problem,
      isText: problem.is_text,
    }));
    answers[code] = randomProblem.map((problem) => [problem.answer]);
    console.log("problems", problems[code]);
    console.log("answers", answers[code]);

    return;
  }
  if (gameMode === "인물") {
    const randomProblem = await ImageProblemTable.findAll({
      order: db.sequelize.literal("RAND()"),
      limit: 10,
    });
    console.log(randomProblem);
    problems[code] = randomProblem.map((problem) => ({
      problem: problem.problem,
      isText: problem.is_text,
    }));
    answers[code] = randomProblem.map((problem) => [problem.answer]);
    console.log("problems", problems[code]);
    console.log("answers", answers[code]);

    return;
  }
  if (gameMode === "4글자") {
    const randomProblem = await FourProblemTable.findAll({
      order: db.sequelize.literal("RAND()"),
      limit: 30,
    });

    let i;
    const answer = [];
    for (i = 0; i < 30; i++) {
      const data = await FourAnswerTable.findAll({
        where: {
          problem_id: randomProblem[i].id,
        },
      });
      answer.push(data.map((data) => data.answer));
    }
    // console.log(randomProblem);
    problems[code] = randomProblem.map((problem) => ({
      problem: problem.problem,
      isText: problem.is_text,
    }));
    answers[code] = answer;
    console.log("problems", problems[code]);
    // console.log("answer", answer);
    console.log("answers", answers[code]);

    return;
  }
  if (gameMode === "랜덤") {
    const movies = await MovieProblemTable.findAll({
      order: db.sequelize.literal("RAND()"),
      limit: 10,
    });
    const images = await ImageProblemTable.findAll({
      order: db.sequelize.literal("RAND()"),
      limit: 10,
    });
    const fours = await FourProblemTable.findAll({
      order: db.sequelize.literal("RAND()"),
      limit: 10,
    });
    const foursAnswers = [];
    let i;
    for (i = 0; i < 10; i++) {
      const data = await FourAnswerTable.findAll({
        where: {
          problem_id: fours[i].id,
        },
      });
      foursAnswers.push(data.map((data) => data.answer));
    }

    const total = [
      ...movies.map((movie) => ({
        problem: { problem: movie.problem, isText: movie.is_text },
        answer: [movie.answer],
      })),
      ...images.map((image) => ({
        problem: { problem: image.problem, isText: image.is_text },
        answer: [image.answer],
      })),
    ];

    for (i = 0; i < 10; i++) {
      total.push({
        problem: { problem: fours[i].problem, isText: fours[i].is_text },
        answer: foursAnswers[i],
      });
    }

    for (i = 30 - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      // 배열 요소를 교환
      [total[i], total[j]] = [total[j], total[i]];
    }

    problems[code] = total.map((problem) => ({
      problem: problem.problem.problem,
      isText: problem.problem.isText,
    }));
    answers[code] = total.map((problem) => problem.answer);
  }

  console.log("problems", problems[code]);
  // console.log("answer", answer);
  console.log("answers", answers[code]);
};

return;
// problems[code] = [
//   "친절한",
//   "해리포터와 죽음의",
//   "인사이드",
//   "유주얼",
//   "어메이징",
//   "비긴",
//   "수상한",
//   "동갑내기",
//   "팔월의",
//   "은밀하게",
// ];

// answers[code] = [
//   ["금자씨"],
//   ["성물"],
//   ["아웃"],
//   ["서스펙트"],
//   ["스파이더맨"],
//   ["어게인"],
//   ["그녀"],
//   ["과외하기"],
//   ["크리스마스"],
//   ["위대하게"],
// ];
