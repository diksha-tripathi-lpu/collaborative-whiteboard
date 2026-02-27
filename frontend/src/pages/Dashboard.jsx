import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import axios from "axios";
import { toast } from "react-toastify";

function Dashboard() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  const [joinRoomId, setJoinRoomId] = useState("");

  const handleCreateRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("https://collaborative-whiteboard-vsed.onrender.com/api/room/create", {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate(`/room/${res.data.roomId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create room");
    }
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim()) {
      toast.error("Please enter a Room ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("https://collaborative-whiteboard-vsed.onrender.com/api/room/join",
        { roomId: joinRoomId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate(`/room/${res.data.roomId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join room");
    }
  };

  return (
    <div className="min-h-screen transition-all duration-300 
      bg-gradient-to-br from-blue-50 via-white to-indigo-100
      dark:from-[#0f172a] dark:via-[#111827] dark:to-[#1f2937]
      flex flex-col">

      {/* Top Bar */}
      <div className="flex justify-between items-center px-12 py-6">
        <h1 className="text-2xl font-bold tracking-wide text-gray-900 dark:text-white">
          ✨ Whiteboard Pro
        </h1>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-5 py-2 rounded-full border 
            border-gray-300 dark:border-gray-600
            text-gray-800 dark:text-white
            bg-white/60 dark:bg-white/10
            backdrop-blur-md
            hover:scale-105 hover:bg-white/80 dark:hover:bg-white/20
            transition"
        >
          {darkMode ? "☀️ Switch to Light" : "🌙 Switch to Dark"}
        </button>
      </div>

      {/* Center Section */}
      <div className="flex flex-1 items-center justify-center">

        <div className="max-w-5xl w-full px-8">

          {/* Hero Text */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
              Collaborate. Create. Conquer.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Real-time collaborative whiteboard experience for teams.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-12">

            {/* Create Room */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-white/5 
              border border-white/30 dark:border-gray-700 
              p-12 rounded-3xl shadow-2xl 
              hover:-translate-y-2 transition duration-300">

              <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                🚀 Start New Session
              </h3>

              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Launch a fresh collaborative room and invite your team instantly.
              </p>

              <button
                onClick={handleCreateRoom}
                className="w-full py-4 rounded-xl text-lg font-medium
                bg-gradient-to-r from-blue-600 to-indigo-600 
                text-white hover:opacity-90 transition"
              >
                Create Room
              </button>
            </div>

            {/* Join Room */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-white/5 
              border border-white/30 dark:border-gray-700 
              p-12 rounded-3xl shadow-2xl 
              hover:-translate-y-2 transition duration-300">

              <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
                🔑 Join Existing Room
              </h3>

              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="w-full px-5 py-4 mb-6 rounded-xl
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-white
                border border-gray-300 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                onClick={handleJoinRoom}
                className="w-full py-4 rounded-xl text-lg font-medium
                bg-gradient-to-r from-emerald-500 to-green-600 
                text-white hover:opacity-90 transition"
              >
                Join Room
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;