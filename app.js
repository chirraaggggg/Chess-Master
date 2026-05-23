const express = require("express")
const socket = require("socket.io")
const http = require("http")
const path = require("path")
const { Chess } = require("chess.js")
const authenticateToken = require('./middleware/auth')

const app = express()
const server = http.createServer(app)
const io = socket(server)

let chess = new Chess()
let players = {}
let currentPlayer = "w"

// middlewares
app.use(express.json())
app.use('/auth', require('./routes/auth'))
app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))

// routes
app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" })
})
app.get('/login', (req, res) => {
  res.render('login')
})
app.get('/register', (req, res) => {
  res.render('register')
})

// socket middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) return next(new Error('No token provided'))
  const user = authenticateToken(token)
  if (!user) return next(new Error('Invalid token'))
  socket.data.user = user
  next()
})

// socket connections
io.on("connection", (socket) => {
  console.log("a user connected:", socket.id, "user:", socket.data.user.username)
  if (!players.white) {
    players.white = socket.id
    socket.emit("playerRole", "w")
  } else if (!players.black) {
    players.black = socket.id
    socket.emit("playerRole", "b")
    io.emit("boardState", chess.fen())
  } else {
    socket.emit("spectatorRole")
    socket.emit("boardState", chess.fen())
  }

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id)
    if (socket.id === players.white) {
      delete players.white
      chess = new Chess()
      io.emit("playerDisconnected", "white")
    } else if (socket.id === players.black) {
      delete players.black
      chess = new Chess()
      io.emit("playerDisconnected", "black")
    }
  })

  socket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && socket.id !== players.white) return
      if (chess.turn() === "b" && socket.id !== players.black) return
      const result = chess.move(move)
      if (result) {
        currentPlayer = chess.turn()
        socket.broadcast.emit("move", move)
        io.emit("boardState", chess.fen())
        if (chess.in_checkmate()) {
          io.emit("gameOver", { reason: "checkmate", winner: result.color === "w" ? "White" : "Black" })
        } else if (chess.in_draw()) {
          io.emit("gameOver", { reason: "draw", winner: null })
        } else if (chess.in_check()) {
          io.emit("check", chess.turn())
        }
      } else {
        socket.emit("invalidMove", move)
      }
    } catch (err) {
      console.log("Move error:", err)
      socket.emit("invalidMove", move)
    }
  })
})

server.listen(3000, () => {
  console.log("listening on port 3000")
})