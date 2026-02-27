import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Auth Routes
app.use("/api/auth", authRoutes);

// Test Routes
app.use("/api/test", testRoutes);

// Room Routes
app.use("/api/room", roomRoutes);

// Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Whiteboard Backend API Running 🚀",
  });
});

export default app;