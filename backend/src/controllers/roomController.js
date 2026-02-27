import { v4 as uuidv4 } from "uuid";
import Room from "../models/Room.js";

// CREATE ROOM
export const createRoom = async (req, res) => {
  try {
    const roomId = uuidv4();

    const room = await Room.create({
      roomId,
      host: req.user._id,
      participants: [req.user._id],
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      roomId: room.roomId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// JOIN ROOM
export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (!room.participants.includes(req.user._id)) {
      room.participants.push(req.user._id);
      await room.save();
    }

    res.status(200).json({
      success: true,
      message: "Joined room successfully",
      roomId: room.roomId,
      canvasState: room.canvasState, // Add canvasState to join response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// SAVE CANVAS STATE
export const saveCanvasState = async (req, res) => {
  try {
    const { roomId, canvasData } = req.body;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.canvasState = canvasData;
    await room.save();

    res.status(200).json({
      success: true,
      message: "Canvas state saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};