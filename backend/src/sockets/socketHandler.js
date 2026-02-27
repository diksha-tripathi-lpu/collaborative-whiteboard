import Room from "../models/Room.js";

const roomMessages = {};

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 User Connected:", socket.id);

    // Join Room
    socket.on("join-room", async ({ roomId, userId, userName }) => {
      const room = await Room.findOne({ roomId });

      if (!room) {
        socket.emit("error-message", "Room not found");
        return;
      }

      socket.join(roomId);

      const displayName = userName || "A user";
      io.to(roomId).emit("user-joined", {
        message: `${displayName} joined the room!`,
        userId,
      });

      // 1. Send chat history
      if (roomMessages[roomId]) {
        socket.emit("room-chat-history", roomMessages[roomId]);
      }

      // 2. Request live canvas state from an existing user
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      const otherClients = clients.filter(id => id !== socket.id);
      if (otherClients.length > 0) {
        io.to(otherClients[0]).emit("request-canvas-state", { requestorId: socket.id });
      }
    });

    // Relay canvas state response
    socket.on("send-canvas-state-response", ({ requestorId, canvasState }) => {
      io.to(requestorId).emit("receive-canvas-state", canvasState);
    });

    // Real-time chat
    socket.on("send-message", ({ roomId, message, user }) => {
      if (!roomMessages[roomId]) roomMessages[roomId] = [];
      roomMessages[roomId].push({ message, user });

      socket.to(roomId).emit("receive-message", {
        message,
        user,
      });
    });

    // Drawing events
    socket.on("draw-start", ({ roomId, x, y, color, size, tool }) => {
      socket.to(roomId).emit("receive-draw-start", { x, y, color, size, tool });
    });

    socket.on("draw", ({ roomId, x, y }) => {
      socket.to(roomId).emit("receive-draw", { x, y });
    });

    socket.on("draw-stop", ({ roomId }) => {
      socket.to(roomId).emit("receive-draw-stop");
    });

    // Text events
    socket.on("add-text", ({ roomId, textData }) => {
      socket.to(roomId).emit("receive-text", textData);
    });

    // Clear canvas
    socket.on("clear-canvas", ({ roomId }) => {
      socket.to(roomId).emit("receive-clear-canvas");
    });

    // Share canvas state (for late joiners or undo/redo sync if needed)
    socket.on("sync-canvas-state", ({ roomId, canvasState }) => {
      socket.to(roomId).emit("receive-canvas-state", canvasState);
    });

    socket.on("disconnect", () => {
      console.log("❌ User Disconnected:", socket.id);
    });
  });
};

export default socketHandler;