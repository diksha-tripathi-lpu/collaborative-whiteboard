import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const res = await axios.post(
        "https://collaborative-whiteboard-vsed.onrender.com/api/auth/register",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }
      );

      toast.success(res.data.message);

      // auto redirect after 1.5 sec
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 dark:opacity-20 animate-blob"></div>
      <div className="absolute top-[-20%] right-[10%] w-96 h-96 bg-fuchsia-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 dark:opacity-20 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 shadow-2xl rounded-3xl p-10">

          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 mb-2">
              Create Account
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Join us and start collaborating today!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                onChange={handleChange}
                className="w-full px-5 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 mt-6 rounded-xl text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-purple-500/30 hover:opacity-90 transform transition-all active:scale-95"
            >
              Sign Up
            </button>
          </form>

          <p className="text-center mt-8 text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link to="/" className="text-purple-600 dark:text-purple-400 font-bold hover:underline">
              Log in here
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Register;