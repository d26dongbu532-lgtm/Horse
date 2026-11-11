const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.get("/health", (_req, res) => res.json({ ok: true, game: "HORSE WORLD" }));

const players = new Map();
const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v) || 0));
const cleanName = (v) => String(v || "익명 말").replace(/[<>]/g, "").trim().slice(0, 14) || "익명 말";

io.on("connection", (socket) => {
  socket.on("join", (payload = {}) => {
    if (players.has(socket.id)) return;
    const player = {
      id: socket.id,
      name: cleanName(payload.name),
      color: ["#b96f45", "#e8e0d0", "#292b35", "#c7a05c", "#8b9caa", "#a76d7b"][Math.floor(Math.random() * 6)],
      x: clamp(payload.x, -12, 12),
      z: clamp(payload.z, -12, 12),
      rot: 0,
      moving: false,
      zone: "초원"
    };
    players.set(socket.id, player);
    socket.emit("welcome", { id: socket.id, players: [...players.values()] });
    socket.broadcast.emit("playerJoined", player);
    io.emit("onlineCount", players.size);
    io.emit("systemMessage", { text: `${player.name}님이 HORSE WORLD에 입장했습니다.` });
  });

  socket.on("move", (data = {}) => {
    const p = players.get(socket.id);
    if (!p) return;
    p.x = clamp(data.x, -480, 480);
    p.z = clamp(data.z, -480, 480);
    p.rot = Number.isFinite(data.rot) ? data.rot : 0;
    p.moving = !!data.moving;
    p.zone = String(data.zone || "초원").slice(0, 20);
    socket.broadcast.emit("playerMoved", p);
  });

  socket.on("chat", (raw) => {
    const p = players.get(socket.id);
    if (!p) return;
    const text = String(raw || "").replace(/[<>]/g, "").trim().slice(0, 120);
    if (!text) return;
    io.emit("chatMessage", { id: socket.id, name: p.name, text, time: Date.now() });
  });

  socket.on("disconnect", () => {
    const p = players.get(socket.id);
    if (!p) return;
    players.delete(socket.id);
    io.emit("playerLeft", socket.id);
    io.emit("onlineCount", players.size);
    io.emit("systemMessage", { text: `${p.name}님이 퇴장했습니다.` });
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`HORSE WORLD listening on ${PORT}`));