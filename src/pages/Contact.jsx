import React, { useRef, useEffect, useState } from "react";
import { Mail, MapPin, Send, Shield, Activity, ExternalLink, Paperclip, X } from "lucide-react";
import { Link } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", badge: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const hcaptchaRef = useRef(null);
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
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,212,255,${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Please attach a file under 5MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      setAttachment({ content: base64, name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!captchaToken) {
      alert("Please complete the captcha first.");
      return;
    }
    setSending(true);
    try {
      const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";
      const response = await fetch(`${BASE_URL}/api/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, captchaToken, attachment }),
      });
      const data = await response.json();
      if (response.ok) {
        setSent(true);
        setAttachment(null);
        setForm({ name: "", email: "", badge: "", subject: "", message: "" });
      } else {
        alert(data.error || "Failed to send. Please try again.");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSending(false);
      hcaptchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    }
  }

  const MAPS_URL = `https://www.google.com/maps/place/SURE+PASS/@12.8766748,74.8415473,17z`;

  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-hidden">

      <section className="relative min-h-[45vh] flex items-center justify-center pt-24 pb-12">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" style={{ zIndex: 1 }} />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-10 animate-scan-line pointer-events-none" style={{ zIndex: 1 }} />

        <div className="relative max-w-5xl mx-auto px-6 text-center" style={{ zIndex: 10 }}>
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
            <Activity className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">
              Support · 24/7
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-none mb-6 tracking-wider">
            CONTACT <span className="text-primary" style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}>US.</span>
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            For technical support, new registrations, or partnership inquiries.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:items-stretch">

          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 space-y-5">
              <h3 className="font-display text-xl tracking-wider text-text-primary">
                GET IN <span className="text-primary">TOUCH</span>
              </h3>
              {[
                { icon: <Mail className="w-5 h-5" />, label: "Email", value: "support@traxelon.com", href: "mailto:support@traxelon.com" },
                { icon: <FaWhatsapp className="w-5 h-5" />, label: "WhatsApp", value: "+91 8951511111", href: "https://wa.me/918951511111" },
                { icon: <MapPin className="w-5 h-5" />, label: "Office", value: "Torsecure Cyber LLP, Door No. 4-9-765/17, Second Floor, Manasa Towers, MG Road, Kodialbail, Mangalore, Karnataka", href: MAPS_URL },
              ].map((item, i) => (
                <a key={i} href={item.href} target={i >= 1 ? "_blank" : undefined} rel="noreferrer"
                  className="flex items-start gap-3 group hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-all">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-body text-xs text-text-muted uppercase tracking-wider">{item.label}</div>
                    <div className="font-body text-sm text-text-primary mt-0.5">{item.value}</div>
                  </div>
                </a>
              ))}
            </div>

            <div className="bg-surface-elevated border border-primary/20 rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-primary uppercase tracking-wider">Live Location</span>
                </div>
                <a href={MAPS_URL} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-text-muted hover:text-primary transition-colors">
                  <ExternalLink className="w-3 h-3" /> Open Maps
                </a>
              </div>

              <a href={MAPS_URL} target="_blank" rel="noreferrer"
                className="relative mx-4 mb-4 rounded-xl overflow-hidden border border-surface-border block"
                style={{ height: 400 }}>
                <iframe
                  title="Traxelon Location"
                  width="100%"
                  height="400"
                  frameBorder="0"
                  style={{
                    display: "block",
                    filter: "invert(90%) hue-rotate(180deg) saturate(0.7) brightness(0.85)",
                    pointerEvents: "none",
                  }}
                  src={`https://maps.google.com/maps?q=12.8766748,74.8415473&ll=12.8766748,74.8415473&z=17&output=embed`}
                  allowFullScreen
                />

                <div className="absolute bottom-3 right-3 bg-surface/90 border border-primary/30 rounded-lg px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-sm">
                  <ExternalLink className="w-3 h-3 text-primary" />
                  <span className="font-mono text-xs text-primary">Open in Maps</span>
                </div>
              </a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 h-full">
              <h3 className="font-display text-xl tracking-wider text-text-primary mb-6">
                SEND A <span className="text-primary">MESSAGE</span>
              </h3>
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="font-display text-2xl text-primary tracking-wider mb-2">MESSAGE SENT</h3>
                  <p className="font-body text-text-secondary">We'll respond to your query within 24 working hours.</p>
                  <button onClick={() => setSent(false)}
                    className="mt-6 px-6 py-2.5 border border-surface-border rounded-lg font-body text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors">
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormInput label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="Officer Name" required />
                    <FormInput label="Badge ID" name="badge" value={form.badge} onChange={handleChange} placeholder="KA-2024-001" />
                  </div>
                  <FormInput label="Official Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="officer@traxelon.com" required />
                  <FormInput label="Subject" name="subject" value={form.subject} onChange={handleChange} placeholder="Technical issue / New registration / Other" required />
                  <div>
                    <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Message</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={6} required
                      placeholder="Describe your issue or query..."
                      className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none" />
                  </div>

                  <div>
                    <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">
                      Attachment <span className="text-text-muted normal-case">(optional · image, PDF, doc · max 5MB)</span>
                    </label>
                    <label className="flex items-center gap-3 w-full bg-surface border border-surface-border rounded-lg px-4 py-3 cursor-pointer hover:border-primary transition-colors group">
                      <Paperclip className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                      <span className="font-body text-sm text-text-muted group-hover:text-primary transition-colors truncate">
                        {attachment ? attachment.name : "Choose file..."}
                      </span>
                      <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                    </label>
                    {attachment && (
                      <button type="button" onClick={() => setAttachment(null)}
                        className="mt-1.5 flex items-center gap-1 font-body text-xs text-text-muted hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" /> Remove attachment
                      </button>
                    )}
                  </div>

                  <div className="w-full overflow-hidden">
                    <div style={{ transform: "scale(0.85)", transformOrigin: "left center" }}
                      className="md:scale-100">
                      <HCaptcha
                        sitekey="2c7ab4e4-6cd4-43fa-9416-57f458ea07c6"
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        ref={hcaptchaRef}
                        theme="dark"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={sending}
                    className="w-full px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    <Send className="w-4 h-4" />
                    {sending ? "Sending..." : "Send Message"}
                  </button>

                  <div className="flex items-start gap-3 bg-surface border border-surface-border rounded-xl px-4 py-3">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="font-body text-xs text-text-muted leading-relaxed">
                      All communications are encrypted and logged for security purposes.
                      Please use your official government email when contacting us.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-surface-border py-8 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-text-primary">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </div>
          <p className="font-body text-xs text-text-muted">© 2026 Traxelon. Authorized law enforcement use only.</p>
          <div className="flex gap-6">
            <Link to="/" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Home</Link>
            <Link to="/about" className="font-body text-xs text-text-muted hover:text-primary transition-colors">About</Link>
            <Link to="/terms" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Terms and Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FormInput({ label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
    </div>
  );
}
