import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

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

export default function ResetPassword() {
  const { confirmReset } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Firebase passes oobCode in the URL query string
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    if (!oobCode) {
      setError("Invalid or expired reset link. Please request a new one.");
    }
  }, [oobCode]);

  const strength = getPasswordStrength(newPassword);
  const submitDisabled =
    loading ||
    !oobCode ||
    !newPassword ||
    !confirmPassword ||
    strength?.label === "Weak" ||
    strength?.label === "Fair";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (newPassword.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (strength?.label === "Weak" || strength?.label === "Fair") {
      return setError("Password is too weak. Add uppercase letters, numbers, and symbols.");
    }

    setLoading(true);
    try {
      await confirmReset(oobCode, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
        setError("This reset link has expired or already been used. Please request a new one.");
      } else {
        setError(err.message || "Failed to reset password. Please try again.");
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 pt-16">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-8 shadow-card">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 rounded-2xl mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-wider text-text-primary">
              NEW <span className="text-primary">PASSWORD</span>
            </h1>
            <p className="font-body text-sm text-text-secondary mt-2">
              Choose a strong password for your account
            </p>
          </div>

          {/* Success state */}
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3 font-body text-sm">
                ✅ Password reset successfully! Redirecting to login…
              </div>
              <Link to="/login" className="block font-body text-sm text-primary hover:underline">
                Click here if not redirected
              </Link>
            </div>
          ) : (
            <>
              {/* Error */}
              {error && (
                <div className="bg-accent/10 border border-accent/30 text-accent rounded-lg px-4 py-3 font-body text-sm mb-6">
                  {error}
                </div>
              )}

              {/* No oobCode — show message only */}
              {!oobCode ? (
                <div className="text-center space-y-4">
                  <p className="font-body text-sm text-text-muted">
                    Please use the link from your reset email.
                  </p>
                  <Link to="/login"
                    className="inline-block px-6 py-3 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all">
                    Back to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* New Password */}
                  <div>
                    <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {strength && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`font-body text-xs ${strength.textColor}`}>{strength.label} password</p>
                          <p className="font-body text-xs text-text-muted">Use uppercase, numbers & symbols</p>
                        </div>
                      </div>
                    )}

                    {/* Requirements checklist */}
                    {newPassword && (
                      <ul className="mt-2 space-y-1">
                        {[
                          { test: newPassword.length >= 8, label: "At least 8 characters" },
                          { test: /[A-Z]/.test(newPassword), label: "One uppercase letter" },
                          { test: /[0-9]/.test(newPassword), label: "One number" },
                          { test: /[^A-Za-z0-9]/.test(newPassword), label: "One special character" },
                        ].map(({ test, label }) => (
                          <li key={label} className={`font-body text-xs flex items-center gap-1.5 ${test ? "text-green-400" : "text-text-muted"}`}>
                            <span>{test ? "✅" : "○"}</span> {label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                        className={`w-full bg-surface border rounded-lg pl-10 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                          confirmPassword && confirmPassword !== newPassword
                            ? "border-red-500 focus:border-red-500"
                            : confirmPassword && confirmPassword === newPassword
                            ? "border-green-500 focus:border-green-500"
                            : "border-surface-border focus:border-primary"
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="font-body text-xs text-red-400 mt-1">❌ Passwords do not match</p>
                    )}
                    {confirmPassword && confirmPassword === newPassword && (
                      <p className="font-body text-xs text-green-400 mt-1">✅ Passwords match</p>
                    )}
                  </div>

                  <button type="submit" disabled={submitDisabled}
                    className="w-full mt-2 px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Resetting…" : "Reset Password"}
                  </button>

                  <p className="text-center font-body text-sm text-text-muted">
                    <Link to="/login" className="text-primary hover:underline">← Back to Login</Link>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}