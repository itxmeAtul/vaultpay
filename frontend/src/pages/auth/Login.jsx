import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { authenticateUser } from "@/redux/actions/authActions";
import { useNavigate } from "react-router-dom";
import { getFirstAccessibleRoute } from "@/utils/firstRoute";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    localStorage.getItem("rememberUsername") || ""
  );
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);

    const result = await dispatch(
      authenticateUser({
        username,
        password,
        rememberMe: remember,
      })
    );

    // ❌ Login failed
    if (authenticateUser.rejected.match(result)) {
      const err = result.payload;
      setError(err?.errorMessage || "Login failed.");
      setLoading(false);
      return;
    }

    // ✔ Login success
    toast.success("Login successful!", { duration: 1200 });

    setTimeout(() => {
      navigate(getFirstAccessibleRoute(), { replace: true });
    }, 1200);

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      <Toaster position="top-right" />
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-orange-600">
          Welcome Back
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <input
          className="border p-3 w-full mb-3 rounded-lg"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className="relative mb-3">
          <input
            className="border p-3 w-full rounded-lg"
            placeholder="Password"
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="absolute right-3 top-3 cursor-pointer"
            onClick={() => setShowPass(!showPass)}
          >
            {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember Me
        </label>

        <button
          className="bg-orange-600 text-white p-3 w-full rounded-lg flex justify-center items-center gap-2"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Login"}
        </button>
      </div>
    </div>
  );
}
