import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useContext, useRef, useEffect, useState } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { Rnd } from "react-rnd";
import io from "socket.io-client";
import { toast } from "react-toastify";

// Initialize socket outside component to avoid reconnects on re-render, 
// but in a real app, might want this managed in context. 
// For simplicity, we create it here and connect in useEffect.
let socket;

function Whiteboard() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  /* ================= CHAT ================= */
  const [messages, setMessages] = useState(["System: Welcome to the whiteboard!!"]);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (!message.trim() || !socket) return;

    const msgData = { roomId, message, user: user?.name || "Anonymous" };
    socket.emit("send-message", msgData);

    setMessages(prev => [...prev, `${msgData.user}: ${msgData.message}`]);
    setMessage("");
  };

  /* ================= CANVAS ================= */
  const canvasRef = useRef(null);
  const contextRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);

  /* ================= ADVANCED TEXT ================= */
  const [textBox, setTextBox] = useState(null);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [isBold, setIsBold] = useState(false);

  /* ================= INIT SOCKET & CANVAS ================= */
  useEffect(() => {
    // Connect Socket
    socket = io("http://localhost:5000");

    socket.emit("join-room", { roomId, userId: user?.id, userName: user?.name });

    socket.on("user-joined", (data) => {
      toast.info(data.message);
    });

    socket.on("room-chat-history", (history) => {
      setMessages(["System: Welcome to the whiteboard!!", ...history.map(msg => `${msg.user}: ${msg.message}`)]);
    });

    socket.on("request-canvas-state", ({ requestorId }) => {
      const canvas = canvasRef.current;
      if (canvas) {
        socket.emit("send-canvas-state-response", { requestorId, canvasState: canvas.toDataURL() });
      }
    });

    socket.on("receive-message", (data) => {
      setMessages(prev => [...prev, `${data.user}: ${data.message}`]);
    });

    socket.on("receive-draw-start", ({ x, y, color: rColor, size: rSize, tool: rTool }) => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!ctx || !canvas) return;

      const absX = x * canvas.width;
      const absY = y * canvas.height;

      ctx.beginPath();
      ctx.moveTo(absX, absY);

      // Handle tool styles
      if (rTool === "highlighter") {
        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = "multiply";
        ctx.strokeStyle = rColor;
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";
        ctx.lineWidth = Number(rSize) * 2;
      } else {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = rTool === "eraser" ? "#ffffff" : rColor;
        ctx.lineCap = rTool === "brush" ? "round" : "butt";
        ctx.lineJoin = rTool === "brush" ? "round" : "miter";
        ctx.lineWidth = rTool === "brush" ? Number(rSize) * 3 : Number(rSize);
      }
    });

    socket.on("receive-draw", ({ x, y }) => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!ctx || !canvas) return;

      const absX = x * canvas.width;
      const absY = y * canvas.height;

      ctx.lineTo(absX, absY);
      ctx.stroke();
    });

    socket.on("receive-draw-stop", () => {
      const ctx = contextRef.current;
      if (!ctx) return;
      ctx.closePath();
    });

    socket.on("receive-text", (textData) => {
      drawTextOnCanvas(textData);
    });

    socket.on("receive-clear-canvas", () => {
      clearLocalCanvas(false);
    });

    socket.on("receive-canvas-state", (canvasState) => {
      restoreCanvas(canvasState, false);
    });

    // Setup Canvas
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    // initial white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    contextRef.current = ctx;

    // Save initial blank state or load existing state
    if (location.state?.initialCanvas) {
      restoreCanvas(location.state.initialCanvas, false);
      setHistory([location.state.initialCanvas]);
      setHistoryStep(0);
    } else {
      saveHistoryState();
    }

    return () => {
      socket.disconnect();
    };
  }, [roomId, user]);

  useEffect(() => {
    if (contextRef.current) {
      if (tool === "highlighter") {
        contextRef.current.globalAlpha = 0.4;
        contextRef.current.globalCompositeOperation = "multiply";
        contextRef.current.strokeStyle = color;
        contextRef.current.lineCap = "butt";
        contextRef.current.lineJoin = "miter";
        contextRef.current.lineWidth = Number(brushSize) * 2;
      } else {
        contextRef.current.globalAlpha = 1.0;
        contextRef.current.globalCompositeOperation = "source-over";
        contextRef.current.strokeStyle = tool === "eraser" ? "#ffffff" : color;
        contextRef.current.lineCap = tool === "brush" ? "round" : "butt";
        contextRef.current.lineJoin = tool === "brush" ? "round" : "miter";
        contextRef.current.lineWidth = tool === "brush" ? Number(brushSize) * 3 : Number(brushSize);
      }
    }
  }, [color, brushSize, tool]);

  /* ================= HISTORY ================= */
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(dataUrl);
      setHistoryStep(newHistory.length - 1);
      return newHistory;
    });
  };

  const undo = () => {
    if (textBox) setTextBox(null);
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1);
      restoreCanvas(history[historyStep - 1], true);
    }
  };

  const redo = () => {
    if (textBox) setTextBox(null);
    if (historyStep < history.length - 1) {
      setHistoryStep(prev => prev + 1);
      restoreCanvas(history[historyStep + 1], true);
    }
  };

  const restoreCanvas = (dataUrl, emit = false) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || !dataUrl) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (emit) {
        socket.emit("sync-canvas-state", { roomId, canvasState: dataUrl });
      }
    };
    img.src = dataUrl;
  };

  const clearLocalCanvas = (emit = false) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // reset background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // restore active stroke conditions
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = brushSize;

    if (emit) {
      socket.emit("clear-canvas", { roomId });
    }
  };

  const clearCanvas = () => {
    if (textBox) setTextBox(null);
    clearLocalCanvas(true);
    saveHistoryState();
  };

  /* ================= DRAW ================= */
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;

    // Auto commit text when interacting with canvas
    if (textBox) {
      commitTextToCanvas();
    }

    if (tool === "text") {
      setTextBox({
        x: offsetX,
        y: offsetY,
        width: 220,
        height: 80,
        text: ""
      });
      return;
    }

    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);

    const relX = offsetX / canvasRef.current.width;
    const relY = offsetY / canvasRef.current.height;

    socket.emit("draw-start", { roomId, x: relX, y: relY, color, size: brushSize, tool });
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    const relX = offsetX / canvasRef.current.width;
    const relY = offsetY / canvasRef.current.height;

    socket.emit("draw", { roomId, x: relX, y: relY });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);

    socket.emit("draw-stop", { roomId });
    saveHistoryState();
  };

  /* ================= COMMIT TEXT ================= */
  const drawTextOnCanvas = (data) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.fillStyle = data.color;
    ctx.font = `${data.isBold ? "bold" : ""} ${data.fontSize}px ${data.fontFamily}`;

    const lines = data.text.split("\n");
    lines.forEach((line, i) => {
      ctx.fillText(
        line,
        data.x + 5,
        data.y + data.fontSize + i * (data.fontSize + 4)
      );
    });
  };

  const commitTextToCanvas = () => {
    if (!textBox || !textBox.text.trim()) return;

    const textData = {
      text: textBox.text,
      x: textBox.x,
      y: textBox.y,
      color,
      fontSize,
      fontFamily,
      isBold
    };

    drawTextOnCanvas(textData);
    socket.emit("add-text", { roomId, textData });
    saveHistoryState();

    setTextBox(null);
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        // Calculate aspect ratio to fit image within canvas nicely
        const maxW = canvas.width * 0.8;
        const maxH = canvas.height * 0.8;
        let finalW = img.width;
        let finalH = img.height;

        if (finalW > maxW) {
          const ratio = maxW / finalW;
          finalW = maxW;
          finalH = finalH * ratio;
        }
        if (finalH > maxH) {
          const ratio = maxH / finalH;
          finalH = maxH;
          finalW = finalW * ratio;
        }

        // Center on canvas
        const x = (canvas.width - finalW) / 2;
        const y = (canvas.height - finalH) / 2;

        ctx.drawImage(img, x, y, finalW, finalH);

        saveHistoryState();
        const dataUrl = canvas.toDataURL();
        socket.emit("sync-canvas-state", { roomId, canvasState: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  /* ================= EXTRA CANVAS TOOLS ================= */
  /* ================= SAVE & SHARE ================= */
  const saveCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");

    // 1. Download image locally
    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = dataUrl;
    link.click();

    // 2. Save state to MongoDB
    try {
      // Need to dynamically import axios since it wasn't at the top
      const axios = (await import("axios")).default;
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/room/save",
        { roomId, canvasData: dataUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      if (res.data.success) {
        toast.success("Canvas saved to database!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save to database");
    }
  };

  const shareRoom = () => {
    const inviteLink = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard!");
  };

  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const handleLeaveRoomClick = () => {
    setShowLeaveModal(true);
  };

  const handleLeaveSave = () => {
    saveCanvas().then(() => navigate("/dashboard"));
  };

  const handleLeaveNoSave = () => {
    navigate("/dashboard");
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
  };

  /* ================= UI TOGGLES FOR MOBILE ================= */
  const [showTools, setShowTools] = useState(false);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">

      {/* ===== TOP BAR ===== */}
      <div className="h-16 px-4 md:px-8 flex items-center justify-between
        bg-white dark:bg-gray-800 border-b dark:border-gray-700">

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setShowTools(!showTools)}
            className="md:hidden p-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            ☰
          </button>

          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white hidden md:block">
              Collaborative Whiteboard
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Room ID: {roomId}
            </p>
          </div>
          <button
            onClick={clearCanvas}
            className="ml-2 md:ml-4 px-2 md:px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          >
            Clear Board
          </button>

          <button
            onClick={undo} disabled={historyStep <= 0}
            className="px-2 md:px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50 transition"
            title="Undo"
          >
            ↩
          </button>
          <button
            onClick={redo} disabled={historyStep >= history.length - 1}
            className="px-2 md:px-3 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50 transition"
            title="Redo"
          >
            ↪
          </button>
        </div>

        {tool === "text" && textBox && (
          <div className="flex items-center gap-2 hidden lg:flex">

            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-2 py-1 border rounded"
            >
              {[16, 20, 24, 28, 32, 40].map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>

            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="px-2 py-1 border rounded"
            >
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
              <option>Verdana</option>
            </select>

            <button
              onClick={() => setIsBold(!isBold)}
              className={`px-3 py-1 rounded ${isBold ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              B
            </button>

            <button
              onClick={commitTextToCanvas}
              className="px-3 py-1 bg-green-500 text-white rounded"
            >
              Add
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setShowChat(!showChat)}
            className="lg:hidden p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition"
          >
            💬
          </button>
          <button
            onClick={shareRoom}
            className="px-2 md:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            title="Share"
          >
            🔗 <span className="hidden md:inline">Share</span>
          </button>
          <button
            onClick={saveCanvas}
            className="px-2 md:px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
            title="Save"
          >
            💾 <span className="hidden md:inline">Save</span>
          </button>
          <button
            onClick={handleLeaveRoomClick}
            className="px-2 md:px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition hidden md:block"
          >
            Leave Room
          </button>
          <button
            onClick={handleLeaveRoomClick}
            className="px-2 md:px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition md:hidden"
            title="Leave Room"
          >
            X
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative h-[calc(100vh-4rem)]">

        {/* ===== TOOLS ===== */}
        <div className={`
          absolute z-10 md:static inset-y-0 left-0
          w-24 flex flex-col items-center py-6 space-y-5
          bg-white dark:bg-gray-800 border-r dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${showTools ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>

          {["pencil", "brush", "highlighter", "eraser", "text"].map((t, i) => (
            <button
              key={i}
              onClick={() => { setTool(t); setShowTools(false); }}
              className={`w-14 h-14 rounded-2xl shadow flex items-center justify-center transition hover:scale-105
                ${tool === t ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 dark:text-white"}`}
              title={`Use ${t}`}
            >
              {t === "pencil" && "✏️"}
              {t === "brush" && "🖌️"}
              {t === "highlighter" && "🖍️"}
              {t === "eraser" && "🧽"}
              {t === "text" && "🔤"}
            </button>
          ))}

          {/* Image Upload Button */}
          <label className="w-14 h-14 rounded-2xl shadow flex items-center justify-center transition hover:scale-105 bg-gray-100 dark:bg-gray-700 dark:text-white cursor-pointer" title="Upload Image">
            🖼️
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          <div className="w-14 h-14 rounded-2xl shadow bg-gray-100 dark:bg-gray-700 flex items-center justify-center" title="Color Picker">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 cursor-pointer"
            />
          </div>

          <div className="flex flex-col items-center mt-4">
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1">Size</label>
            <input
              type="range"
              min="1"
              max="20"
              value={brushSize}
              onChange={(e) => setBrushSize(e.target.value)}
              className="w-16 cursor-pointer"
            />
          </div>
        </div>

        {/* ===== CANVAS ===== */}
        <div className="flex-1 flex items-center justify-center bg-gray-200 dark:bg-gray-950 p-4">

          <div className="w-full h-full bg-white dark:bg-white rounded-3xl shadow-2xl relative overflow-hidden">

            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />

            {textBox && (
              <Rnd
                size={{ width: textBox.width, height: textBox.height }}
                position={{ x: textBox.x, y: textBox.y }}
                onDragStop={(e, d) =>
                  setTextBox({ ...textBox, x: d.x, y: d.y })
                }
                onResizeStop={(e, dir, ref, delta, pos) =>
                  setTextBox({
                    ...textBox,
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                    ...pos
                  })
                }
                bounds="parent"
              >
                <textarea
                  value={textBox.text}
                  onChange={(e) =>
                    setTextBox({ ...textBox, text: e.target.value })
                  }
                  style={{
                    width: "100%",
                    height: "100%",
                    fontSize,
                    fontFamily,
                    fontWeight: isBold ? "bold" : "normal",
                    color,
                    background: "transparent",
                    border: "1px dashed gray",
                    resize: "none",
                    outline: "none"
                  }}
                  autoFocus
                />
              </Rnd>
            )}
          </div>
        </div>

        {/* ===== CHAT ===== */}
        <div className={`
          absolute z-10 lg:static inset-y-0 right-0
          w-80 flex flex-col bg-white dark:bg-gray-800 border-l dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${showChat ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}>
          <div className="p-4 font-semibold text-gray-900 dark:text-white border-b dark:border-gray-700 flex justify-between items-center">
            <span>Live Chat</span>
            <button
              onClick={() => setShowChat(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-2 flex flex-col">
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center mt-4">No messages yet.</p>
            )}
            {messages.map((msg, i) => {
              // msg is in format "Username: message"
              const [msgUser, ...msgBodyArr] = msg.split(": ");
              const msgBody = msgBodyArr.join(": ");

              // Determine if the message is from the current user
              const isMe = (msgUser === user?.name) || (msgUser === "Anonymous" && !user);
              const displayName = isMe ? "You" : msgUser;

              return (
                <div key={i} className={`text-sm px-3 py-2 rounded-lg self-start max-w-[90%] break-words
                  ${isMe ? "bg-blue-600 text-white self-end ml-auto" : "bg-blue-50 text-blue-900 dark:bg-gray-700 dark:text-gray-100"}`}>
                  <span className="font-semibold block text-xs opacity-75 mb-1">{displayName}</span>
                  {msgBody || msg}
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ===== LEAVE MODAL ===== */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Leave Room</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Do you want to save before leaving?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelLeave}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveNoSave}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
              >
                No
              </button>
              <button
                onClick={handleLeaveSave}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Whiteboard;