# 🎨 Collaborative Real-Time Whiteboard  

A full-stack, real-time collaboration application that allows multiple users to draw, chat, and interact simultaneously on a shared canvas.

Built using the **MERN stack (MongoDB, Express, React, Node.js)** with **Socket.IO** for real-time WebSocket communication and styled using **Tailwind CSS** for a clean, responsive interface.

---

## 🚀 Why I Built This

I wanted to build something beyond a basic CRUD project — a system that demonstrates real-time communication, multi-user synchronization, and scalable full-stack architecture.

This project helped me understand:
- WebSocket-based real-time systems
- Canvas rendering logic
- Cross-device synchronization challenges
- Authentication and secure API design
- State persistence using MongoDB

---

## ✨ Features

### 🖌️ Advanced Drawing Tools

* **Multi-Tool Kit:** Pencil, Brush, Highlighter, and Eraser tools.
* **Smart Highlighter:** Uses dynamic alpha layering with `multiply` blend mode so users can highlight over drawings and text without obscuring them.
* **Draggable Text Boxes:** Click anywhere to add text. Text elements are draggable, resizable, and stylable (Font, Size, Bold). Text auto-commits when clicking outside.
* **Image Upload:** Upload images directly from your system onto the canvas.
* **Undo / Redo:** Local history stack allows seamless undo and redo functionality.

---

### 🌐 Real-Time Collaboration

* **Proportional Scaling:** Drawing coordinates are computed using percentage-based mapping (`x / canvas.width`). This ensures consistent rendering across devices of different screen sizes (mobile, laptop, 4K monitor).
* **Live In-Memory Rejoin:** When a new user joins, the backend syncs the current unsaved canvas state from active participants so the board loads instantly.
* **Persistent Rooms:** Users can save canvas state to MongoDB and resume work later.

---

### 💬 Live Chat System

* **Real-Time Messaging:** Room-based chat powered by Socket.IO.
* **In-Memory Chat History:** The server temporarily stores recent messages so late joiners receive context.
* **Custom Chat UI:** User messages appear as “You” in styled bubbles, while system notifications (join/leave events) are clearly distinguished.

---

### 💎 User Experience

* **Modern Glassmorphic UI:** Authentication and dashboard screens with soft gradients and glass-style overlays.
* **Custom Confirmation Modals:** Styled popups replace default browser alerts (e.g., Leave Room → Save / Don’t Save / Cancel).
* **Mobile Responsive:** Collapsible toolbars and responsive layout for smaller screens.

---

## 🏗️ System Architecture

- REST APIs handle authentication and room management.
- Socket.IO manages real-time drawing synchronization and chat communication.
- Canvas coordinates are normalized for cross-device consistency.
- MongoDB stores user credentials and saved whiteboard states.
- In-memory storage maintains temporary live room data for faster syncing.

---

## 🚀 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- React Router DOM
- Socket.IO Client
- React-RND (Draggable & Resizable Elements)
- React Toastify

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.IO
- JSON Web Tokens (JWT Authentication)
- Bcrypt (Password Hashing)

---

## 🛠️ Installation & Setup

### 1️⃣ Requirements

- Node.js (v16+)
- MongoDB (Local instance or MongoDB Atlas URI)

---

### 2️⃣ Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside `/backend` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key_here
```

Start the backend server:

```bash
npm start
```

(Or use `node server.js` if no start script is defined.)

---

### 3️⃣ Frontend Setup

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

### 4️⃣ Run the Application

Open your browser and visit:

```
http://localhost:5173
```

Create an account, start a new room from the dashboard, and share the room link to collaborate in real-time.

---

## 📌 Future Improvements

- Real-time cursor presence indicators
- Canvas export (PNG / PDF)
- Role-based permissions (Admin / Participant)
- Performance optimizations for large boards
- Docker-based deployment

---

## 📚 Key Learning Outcomes

- Implementing real-time communication using WebSockets
- Managing synchronized state across multiple clients
- Canvas rendering and coordinate normalization
- Secure authentication using JWT
- MongoDB schema design and persistence
- Structuring scalable MERN applications