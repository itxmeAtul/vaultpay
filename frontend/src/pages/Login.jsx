import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { login } from "@/apiservices/auth.service";

export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  // Form states
  const [username, setUsername] = useState(
    localStorage.getItem("rememberUsername") || ""
  );
  const [password, setPassword] = useState("");

  // UI States
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // loader state
  const [timer, setTimer] = useState(3); // countdown

  // Error
  const [error, setError] = useState("");

  /* ===================================================
     PASSWORD STRENGTH
  =================================================== */
  const getPasswordStrength = () => {
    if (password.length < 4) return "weak";
    if (password.length < 7) return "medium";
    return "strong";
  };

  /* ===================================================
     VALIDATE TOKEN WITH API
  =================================================== */
  const checkTokenValid = async (token) => {
    try {
      const res = await api.get("auth/validate");
      console.log(
        res.statusText,
        res.data,
        res.statusText == "200",
        res.data?.valid
      );
      if (res.statusText == "OK" && res.data?.valid) {
        navigate("/dashboard");
      } else {
        localStorage.clear();
        setCheckingAuth(false); // show login
      }
    } catch {
      localStorage.clear();
      setCheckingAuth(false);
    }
  };

  /* ===================================================
     LOGIN
  =================================================== */
  const handleLogin = async () => {
    setError("");

    if (!username || !password)
      return setError("Username and password are required.");

    setLoading(true);

    try {
      const response = await login(username, password);

      if (remember) {
        localStorage.setItem("rememberUsername", username);
      } else {
        localStorage.removeItem("rememberUsername");
      }

      if (response) {
        toast.success("Login successful!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.error || "Login failed. Try again.");
    }

    setLoading(false);
  };

  /* ===================================================
     SIGNUP
  =================================================== */
  const handleSignup = async () => {
    // setError("");
    // if (!username || !password) return setError("All fields required.");
    // if (password.length < 4)
    //   return setError("Password must be at least 4 characters.");
    // setLoading(true);
    // try {
    //   const res = await api("/api/auth/signup", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ username, password }),
    //   });
    //   const data = await res.json();
    //   if (!res.ok) {
    //     setLoading(false);
    //     return setError(data.error || "Signup failed.");
    //   }
    //   toast.success("Signup successful! Please login.");
    //   setIsSignup(false);
    // } catch (err) {
    //   setError("Signup failed.");
    // }
    // setLoading(false);
  };

  /* ===================================================
     FORGOT PASSWORD (UI ONLY)
  =================================================== */
  const handleForgotPassword = () => {
    if (!username) return setError("Enter username to reset password");
    toast.success("Password reset link sent (UI feature only)");
    setForgotMode(false);
  };

  /* ===================================================
     AUTH CHECK TIMER + API VERIFY
  =================================================== */
  useEffect(() => {
    const token = localStorage.getItem("token");

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          // After 3 sec → Validate via API
          if (token) {
            checkTokenValid(token);
          } else {
            setCheckingAuth(false);
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ===================================================
     LOADER UI
  =================================================== */
  if (checkingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <div className="loader"></div>
        <p className="mt-4 text-orange-600 font-medium text-lg animate-pulse">
          Checking session... {timer}s
        </p>
      </div>
    );
  }

  /* ===================================================
     LOGIN UI
  =================================================== */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4">
      <Toaster />
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl transition-all duration-300">
        <h1 className="text-3xl font-bold mb-6 text-center text-orange-600">
          {forgotMode
            ? "Reset Password"
            : isSignup
            ? "Create Account"
            : "Welcome Back"}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {forgotMode ? (
          <>
            <input
              className="border p-3 w-full mb-3 rounded-lg"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white w-full p-3 rounded-lg font-medium transition"
              onClick={handleForgotPassword}
            >
              Send Reset Link
            </button>
            <p className="text-center text-sm mt-4">
              <button
                className="text-orange-600 font-medium hover:underline"
                onClick={() => {
                  setForgotMode(false);
                  setError("");
                }}
              >
                Back to login
              </button>
            </p>
          </>
        ) : (
          <>
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
                className="absolute right-3 top-3 cursor-pointer text-gray-600"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={22} /> : <Eye size={22} />}
              </span>
            </div>

            {password && (
              <div className="mb-4">
                <div className="text-xs text-gray-500">Password Strength:</div>
                <div className="h-2 w-full bg-gray-300 rounded mt-1 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      getPasswordStrength() === "weak"
                        ? "bg-red-500 w-1/4"
                        : getPasswordStrength() === "medium"
                        ? "bg-yellow-500 w-2/4"
                        : "bg-green-600 w-full"
                    }`}
                  ></div>
                </div>
              </div>
            )}

            {!isSignup && (
              <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember Me
              </label>
            )}

            <button
              className="bg-orange-600 hover:bg-orange-700 text-white w-full p-3 rounded-lg font-medium flex items-center justify-center gap-2 transition"
              onClick={isSignup ? handleSignup : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : isSignup ? (
                "Signup"
              ) : (
                "Login"
              )}
            </button>

            {!isSignup && (
              <p className="text-center text-sm mt-2">
                <button
                  className="text-orange-600 font-medium hover:underline"
                  onClick={() => {
                    setForgotMode(true);
                    setError("");
                  }}
                >
                  Forgot password?
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
