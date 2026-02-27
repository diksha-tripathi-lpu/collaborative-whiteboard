import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-toastify";

function Login() {
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );

      if (res.data.success) {
        toast.success("Welcome to the dashboard!!");

        // We can now just use the full user object returned by the server
        const token = res.data.token;
        const user = res.data.user;

        loginWithToken(token, user);

        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 dark:opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 dark:opacity-20 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-2xl rounded-3xl p-10">

          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              We're so excited to see you again!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:opacity-90 transform transition-all active:scale-95 mt-4"
            >
              Log In
            </button>
          </form>

          <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
            Don’t have an account?{" "}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              Register here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Login;