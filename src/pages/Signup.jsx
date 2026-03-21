import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield, User, Mail, Lock, BadgeCheck, Building2,
  Eye, EyeOff, KeyRound, RotateCcw, CheckCircle2,
} from "lucide-react";

// ── YOUR existing password strength (kept as is) ──────────────
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";
const OTP_RESEND_COOLDOWN = 60;

export default function Signup() {
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("form"); // "form" | "otp" | "creating"
  const [form, setForm] = useState({
    displayName: "", email: "", password: "",
    confirmPassword: "", badgeId: "", department: "",
  });
  const [otpValue, setOtpValue] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const strength = getPasswordStrength(form.password);
  const submitDisabled = loading || strength?.label === "Weak" || !termsAccepted;;

  useEffect(() => {
    if (cooldown <= 0) { clearInterval(cooldownRef.current); return; }
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(cooldownRef.current); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  // ── Step 1: validate & send OTP ───────────────────────────────
  async function handleSendOtp(e) {
    e.preventDefault();
    setError(""); setInfo("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (strength?.label === "Weak") return setError("Password is too weak. Add uppercase letters, numbers or symbols.");
    setLoading(true);
    try {
      // ✅ Check ban before even sending OTP
      const { getDocs, collection, query, where } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", form.email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existingUser = snap.docs[0].data();
        if (existingUser.status === "rejected") {
          setError("🚫 This account has been suspended. You cannot register again.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP.");
      setStep("otp");
      setCooldown(OTP_RESEND_COOLDOWN);
      setInfo(`A 6-digit verification code was sent to ${form.email}`);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    }
    setLoading(false);
  }

  async function handleVerifyAndCreate(e) {
    e.preventDefault();
    setError(""); setInfo("");
    if (!otpValue || otpValue.length !== 6) return setError("Please enter the 6-digit OTP.");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed.");
      setStep("creating");
      // await signup(form.email, form.password, form.displayName, form.badgeId, form.department);
      try {
        await signup(form.email, form.password, form.displayName, form.badgeId, form.department);
      } catch (err) {
        setStep("otp");
        setError(err.message); // shows "This account has been suspended..."
        setLoading(false);
        return; // ← stops execution, never reaches login()
      }
      // Now sign them in since OTP already proved email ownership
      await login(form.email, form.password);  // ← ADD THIS
      navigate("/dashboard");
    } catch (err) {
      setStep("otp");
      setError(err.message || "Verification failed. Please try again.");
    }
    setLoading(false);
  }

  // ── Resend OTP ────────────────────────────────────────────────
  async function handleResendOtp() {
    if (cooldown > 0) return;
    setError(""); setInfo(""); setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP.");
      setOtpValue("");
      setCooldown(OTP_RESEND_COOLDOWN);
      setInfo("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 pt-28 pb-8">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-lg">
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-8 shadow-card">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 rounded-2xl mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-wider text-text-primary">
              OFFICER <span className="text-primary">REGISTRATION</span>
            </h1>
            <p className="font-body text-sm text-text-secondary mt-2">
              {step === "form" ? "Create your secure Traxelon account"
                : step === "creating" ? "Creating your account…"
                  : "Verify your email address"}
            </p>
            {step === "form" && (
              <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-mono">
                🎁 1 FREE credit on signup
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            {["form", "otp", "creating"].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-mono ${step === s ? "text-primary"
                  : i < ["form", "otp", "creating"].indexOf(step) ? "text-green-500"
                    : "text-text-muted"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${step === s ? "border-primary bg-primary/20 text-primary"
                    : i < ["form", "otp", "creating"].indexOf(step) ? "border-green-500 bg-green-500/20 text-green-500"
                      : "border-surface-border bg-surface text-text-muted"}`}>
                    {i < ["form", "otp", "creating"].indexOf(step) ? "✓" : i + 1}
                  </div>
                  <span className="hidden sm:inline">{["Details", "Verify", "Account"][i]}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-surface-border" />}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-accent/10 border border-accent/30 text-accent rounded-lg px-4 py-3 font-body text-sm mb-6">{error}</div>
          )}

          {/* Info */}
          {info && (
            <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 text-primary rounded-lg px-4 py-3 font-body text-sm mb-6">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{info}</span>
            </div>
          )}

          {/* ── STEP 1: Form ── */}
          {step === "form" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField icon={<User />} label="Full Name" name="displayName" value={form.displayName} onChange={handleChange} placeholder="John Doe" required />
                <InputField icon={<BadgeCheck />} label="Badge ID" name="badgeId" value={form.badgeId} onChange={handleChange} placeholder="KA-2024-001" required />
              </div>
              <InputField icon={<Building2 />} label="Department" name="department" value={form.department} onChange={handleChange} placeholder="Cyber Crime Division" required />
              <InputField icon={<Mail />} label="Official Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="officer@traxelon.com" required />

              {/* Password with YOUR strength meter */}
              <div>
                <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                    placeholder="Min. 8 characters" required
                    className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repeat password" required
                    className={`w-full bg-surface border rounded-lg pl-10 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${form.confirmPassword && form.confirmPassword !== form.password ? "border-red-500 focus:border-red-500"
                      : form.confirmPassword && form.confirmPassword === form.password ? "border-green-500 focus:border-green-500"
                        : "border-surface-border focus:border-primary"}`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="font-body text-xs text-red-400 mt-1">❌ Passwords do not match</p>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p className="font-body text-xs text-green-400 mt-1">✅ Passwords match</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 mt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary cursor-pointer flex-shrink-0"
                />
                <label htmlFor="terms" className="font-body text-xs text-text-muted leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a>
                    Privacy Policy
                  </a>. I confirm that I am an authorized law enforcement officer.
                </label>
              </div>

              <button type="submit" disabled={submitDisabled}
                className="w-full mt-2 px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Sending OTP…" : "Send Verification OTP"}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyAndCreate} className="space-y-5">
              <div>
                <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                  <input type="text" inputMode="numeric" maxLength={6} value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP" required autoFocus
                    className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-4 py-3 font-mono text-xl text-center tracking-[0.5em] text-text-primary placeholder:text-text-muted placeholder:tracking-normal placeholder:font-body placeholder:text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>
                <p className="font-body text-xs text-text-muted mt-2">
                  Check your inbox at <span className="text-primary">{form.email}</span>
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" onClick={handleResendOtp} disabled={cooldown > 0 || loading}
                  className="inline-flex items-center gap-1.5 font-body text-xs text-text-muted hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <RotateCcw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
                <button type="button" onClick={() => { setStep("form"); setError(""); setInfo(""); setOtpValue(""); }}
                  className="font-body text-xs text-text-muted hover:text-primary transition-colors">
                  ← Change email
                </button>
              </div>

              <button type="submit" disabled={loading || otpValue.length !== 6}
                className="w-full px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Verifying…" : "Verify & Create Account"}
              </button>
            </form>
          )}

          {/* ── STEP 3: Creating spinner ── */}
          {step === "creating" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="font-body text-sm text-text-secondary">Setting up your officer account…</p>
            </div>
          )}

          {step !== "creating" && (
            <p className="text-center font-body text-sm text-text-muted mt-6">
              Already registered? <Link to="/login" className="text-primary hover:underline">Login here</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4">{icon}</div>
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
          className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
      </div>
    </div>
  );
}
