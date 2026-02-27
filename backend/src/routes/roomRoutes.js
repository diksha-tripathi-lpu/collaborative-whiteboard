import express from "express";
import protect from "../middleware/authMiddleware.js";
import { createRoom, joinRoom, saveCanvasState } from "../controllers/roomController.js";

const router = express.Router();

router.post("/create", protect, createRoom);
router.post("/join", protect, joinRoom);
router.post("/save", protect, saveCanvasState);

export default router;