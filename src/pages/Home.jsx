import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Zap, Eye, Lock, Globe, ChevronRight, Activity } from "lucide-react";

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Instant Link Generation",
    desc: "Generate disguised tracking links in seconds. Target sees a Paytm link; you get their full device fingerprint.",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Full Device Intelligence",
    desc: "Capture IP address, GPS coordinates, browser info, OS, ISP, device type — everything you need.",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Real-Time Tracking",
    desc: "Get notified the moment a suspect opens your link. View captured data instantly on your dashboard.",
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Encrypted & Secure",
    desc: "All data is encrypted end-to-end. Only authorized officers with valid credentials can access captures.",
  },
];

const statsConfig = [
  { rawValue: 2400,  display: (n) => `${n.toLocaleString()}+`, label: "Active Officers" },
  { rawValue: 18900, display: (n) => `${n.toLocaleString()}+`, label: "Suspects Tracked" },
  { rawValue: 94,    display: (n) => `${n}%`,                  label: "Case Closure Rate" },
  { rawValue: 2,     display: () => `< 2S`,                    label: "Capture Speed", noCount: true },
];

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

function StatCard({ rawValue, display, label, noCount }) {
  const { count, ref } = useCountUp(rawValue, 2000);
  return (
    <div ref={ref} className="bg-surface-card border border-surface-border rounded-xl p-4">
      <div className="font-display text-3xl text-primary">
        {noCount ? display() : display(count)}
      </div>
      <div className="font-body text-xs text-text-muted mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Home() {
  const { currentUser } = useAuth();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    let raf;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-24">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan-line pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
  <Activity className="w-3 h-3 text-primary flex-shrink-0" />
  <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">
    Law Enforcement Intelligence Tool
  </span>
</div>
          <h1 className="font-display text-7xl md:text-9xl text-text-primary leading-none mb-6 tracking-wider">
            TRACK.<br />
            <span className="text-primary" style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}>
              CAPTURE.
            </span><br />
            CLOSE.
          </h1>

          <p className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Traxelon gives law enforcement officers a covert link-based tracking
            system. Generate a disguised link, send it to a suspect — and get
            their full device intelligence the moment they click.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-surface font-body font-bold rounded-lg text-base hover:bg-primary-dark transition-all shadow-glow hover:shadow-glow-strong"
              >
                Go to Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-surface font-body font-bold rounded-lg text-base hover:bg-primary-dark transition-all shadow-glow hover:shadow-glow-strong"
                >
                  Register as Officer
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-surface-border text-text-secondary rounded-lg font-body text-base hover:border-primary hover:text-primary transition-all"
                >
                  Officer Login
                </Link>
              </>
            )}
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
           {statsConfig.map((s) => (
          <StatCard key={s.label} {...s} />
          ))}
         </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl text-text-primary tracking-wider mb-4">
              HOW IT <span className="text-primary">WORKS</span>
            </h2>
            <p className="font-body text-text-secondary max-w-xl mx-auto">
              Built exclusively for law enforcement. Follow these steps to track a suspect using Traxelon.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Steps */}
            <div className="space-y-0">
              {[
                {
                  num: "01",
                  title: "Create Officer Account",
                  desc: "Register with your badge ID and department. You'll receive 1 free credit to generate your first tracking link.",
                },
                {
                  num: "02",
                  title: "Generate Tracking Link",
                  desc: "A Traxelon tracking link is created instantly that redirects to any URL you choose.",
                },
                {
                  num: "03",
                  title: "Send Link to Suspect",
                  desc: "Share the link via WhatsApp, SMS or email. The suspect sees a normal webpage — completely unaware they're being tracked.",
                },
                {
                  num: "04",
                  title: "Capture Device Intelligence",
                  desc: "The moment they click, their IP, GPS location, device, browser, OS and ISP are silently captured.",
                },
              ].map((step, i) => (
                <div key={i} className="flex gap-6 p-6 border-b border-surface-border hover:bg-surface-card transition-all cursor-pointer group">
                  <div className="font-display text-4xl text-primary/30 group-hover:text-primary transition-colors leading-none flex-shrink-0 w-12">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-text-primary tracking-wide mb-1 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Terminal */}
            <div className="bg-black border border-surface-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-card">
                <span className="font-mono text-xs text-text-muted tracking-widest uppercase">Traxelon Console — Live Feed</span>
                <span className="flex items-center gap-1 font-mono text-xs text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
                  LIVE
                </span>
              </div>
              <div className="p-5 font-mono text-xs space-y-3 min-h-64">
                <div className="text-primary">$ traxelon --generate-link --case "Suspect-047"</div>
                <div className="text-text-muted">→ Generating disguised link...</div>
                <div className="text-green-400">✓ Link created: https://traxelon.app/t/x9k2p...</div>
                <div className="text-text-muted">→ Sending to target device...</div>
                <div className="text-primary mt-2">$ traxelon --monitor --case "Suspect-047"</div>
                <div className="text-text-muted">→ Waiting for target to open link...</div>
                <div className="text-yellow-400">⚠ Link opened — capturing data...</div>
                <div className="text-green-400">✓ IP captured: 192.168.xx.xx</div>
                <div className="text-green-400">✓ Location: Mangaluru, Karnataka, India</div>
                <div className="text-green-400">✓ Device: Android Mobile — Chrome</div>
                <div className="text-green-400">✓ ISP: Bharti Airtel Ltd.</div>
                <div className="text-green-400">✓ GPS: 12.8698°N, 74.8431°E</div>
                <div className="text-primary mt-2">$ traxelon --export --case "Suspect-047"</div>
                <div className="text-green-400">✓ Evidence package ready for download</div>
                <div className="flex items-center gap-1 text-primary mt-1">
                  <span>█</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center bg-surface-elevated border border-surface-border rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient opacity-50" />
          <div className="relative z-10">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
            <h2 className="font-display text-4xl md:text-5xl text-text-primary tracking-wider mb-4">
              JOIN THE FORCE.<br />
              <span className="text-primary">START TRACKING.</span>
            </h2>
            <p className="font-body text-text-secondary mb-8">
              Sign up as a verified officer and receive 1 free credit to generate
              your first tracking link. Upgrade anytime for continued access.
            </p>
            {/* {!currentUser && (
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow hover:shadow-glow-strong"
              >
                Create Officer Account
                <ChevronRight className="w-5 h-5" />
              </Link>
            )} */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-text-primary">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </div>
          <p className="font-body text-xs text-text-muted">
            © 2026 Traxelon. Authorized law enforcement use only.
          </p>
          <div className="flex gap-6">
            <Link to="/about" className="font-body text-xs text-text-muted hover:text-primary transition-colors">About</Link>
            <Link to="/contact" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Contact</Link>
            <Link to="/terms" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Terms and Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}