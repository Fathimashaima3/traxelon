import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function getPasswordStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", textColor: "text-red-400", width: "w-1/4" };
  if (score <= 2) return { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-400", width: "w-2/4" };
  if (score <= 3) return { label: "Good", color: "bg-blue-500", textColor: "text-blue-400", width: "w-3/4" };
  return { label: "Strong", color: "bg-green-500", textColor: "text-green-400", width: "w-full" };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // async function handleSubmit(e) {
  //   e.preventDefault();
  //   setError("");
  //   setLoading(true);
  //   try {
  //     const freshUser = await login(email, password);

  //     if (!freshUser.emailVerified) {
  //       await auth.signOut();
  //       setError("Please verify your email before logging in. Check your inbox.");
  //       setLoading(false);
  //       return;
  //     }

  //     navigate("/dashboard");
  //   } catch (err) {
  //     setError("Invalid credentials. Please check your email and password.");
  //   }
  //   setLoading(false);
  // }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      if (err.message === "🚫 This account has been suspended. You cannot login again." ||
        err.message?.toLowerCase().includes("suspended")) {
        setError("🚫 Your account has been suspended. Contact support if you believe this is a mistake.");
      } else if (err.message === "Email not verified") {
        setError("Please verify your email before logging in. Check your inbox.");
      } else if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  }

  // async function handleForgotPassword(e) {
  //   e.preventDefault();
  //   setForgotLoading(true);
  //   setForgotStatus("");
  //   try {
  //     await resetPassword(forgotEmail);
  //     setForgotStatus("success");
  //   } catch (err) {
  //     setForgotStatus("error");
  //   }
  //   setForgotLoading(false);
  // }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotStatus("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-reset-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email.");
      setForgotStatus("success");
    } catch (err) {
      setForgotStatus("error");
    }
    setForgotLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 rounded-2xl mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-wider text-text-primary">
              OFFICER <span className="text-primary">LOGIN</span>
            </h1>
            <p className="font-body text-sm text-text-secondary mt-2">Authorized personnel only</p>
          </div>

          {error && (
            <div className="bg-accent/10 border border-accent/30 text-accent rounded-lg px-4 py-3 font-body text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@traxelon.com" required
                  className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-body text-xs text-text-secondary uppercase tracking-wider">Password</label>
                <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotStatus(""); }}
                  className="font-body text-xs text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required
                  className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50">
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>

          <p className="text-center font-body text-sm text-text-muted mt-6">
            New officer? <Link to="/signup" className="text-primary hover:underline">Register here</Link>
          </p>
        </div>
      </div>

      {showForgot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 w-full max-w-sm">
            <h2 className="font-display text-2xl tracking-wider text-text-primary mb-1">
              RESET <span className="text-primary">PASSWORD</span>
            </h2>
            <p className="font-body text-xs text-text-muted mb-6">Enter your email and we'll send you a reset link.</p>

            {forgotStatus === "success" && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 font-body text-sm mb-4">
                ✅ Reset link sent! Check your email inbox.
              </div>
            )}
            {forgotStatus === "error" && (
              <div className="bg-accent/10 border border-accent/30 text-accent rounded-lg px-4 py-3 font-body text-sm mb-4">
                ⚠️ Email not found. Please check and try again.
              </div>
            )}

            {forgotStatus !== "success" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="officer@traxelon.com" required
                    className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
                </div>
                <button type="submit" disabled={forgotLoading}
                  className="w-full px-6 py-3 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50">
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            )}

            <button onClick={() => setShowForgot(false)}
              className="w-full mt-3 px-6 py-3 bg-surface border border-surface-border text-text-secondary font-body rounded-lg hover:border-primary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
