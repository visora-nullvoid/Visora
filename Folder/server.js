// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map(); // roomId -> Set of socketIds

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // ----- JOIN ROOM -----
  socket.on("join", (roomId) => {
    console.log(`${socket.id} joining room ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    const clients = rooms.get(roomId);
    clients.add(socket.id);
    socket.join(roomId);

    const numClients = clients.size;
    const isInitiator = numClients === 1;
    socket.emit("joined", { roomId, isInitiator });

    if (numClients === 2) {
      io.to(roomId).emit("ready");
    }

    console.log(`Room ${roomId} now has ${numClients} client(s)`);
  });

  // ----- WEBRTC SIGNALING -----
  socket.on("signal", ({ roomId, data }) => {
    socket.to(roomId).emit("signal", { data });
  });

  // ----- 🎤 TRANSCRIPT (Speech Text) FORWARD -----
  socket.on("transcript", ({ roomId, role, text }) => {
    if (!roomId || !text?.trim()) return;
    socket.to(roomId).emit("transcript", { role, text });
  });

  // ----- EXPLICIT CALL END (Leave button) -----
  socket.on("end-call", ({ roomId }) => {
    console.log(`Call ended by ${socket.id} in room ${roomId}`);
    socket.to(roomId).emit("call-ended");
  });

  // ----- DISCONNECT CLEANUP -----
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const [roomId, clients] of rooms.entries()) {
      if (clients.has(socket.id)) {
        clients.delete(socket.id);
        socket.to(roomId).emit("peer-disconnected");
        if (clients.size === 0) {
          rooms.delete(roomId);
        }
        break;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
