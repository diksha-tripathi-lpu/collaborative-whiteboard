import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import socketHandler from "./src/sockets/socketHandler.js";

dotenv.config();

// Connect Database
connectDB();

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
socketHandler(io);

// // Basic Socket Connection
// io.on("connection", (socket) => {
//   console.log("🔌 User Connected:", socket.id);

//   socket.on("disconnect", () => {
//     console.log("❌ User Disconnected:", socket.id);
//   });
// });

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});