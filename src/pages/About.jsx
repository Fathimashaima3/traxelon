import React, { useEffect, useRef, useState } from "react";
import { Shield, Target, Lock, Users, BookOpen, Award, Mic, Globe, ChevronDown, ChevronUp, Activity } from "lucide-react";
{/*--animated counter--*/}
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return [count, ref];
}

function StatCard({ numericValue, suffix, label }) {
  const [count, ref] = useCountUp(numericValue);
  return (
    <div ref={ref} className="bg-surface-elevated border border-surface-border rounded-2xl p-5 text-center hover:border-primary/40 transition-all">
      <div className="font-display text-3xl text-primary mb-1">{count}{suffix}</div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function About() {
  const [expanded, setExpanded] = useState(false);
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
        ctx.fillStyle = `rgba(0, 212, 255, ${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x, dy = a.y - b.y;
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

      {/* ── Hero ── */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-24 pb-16">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan-line pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
            <Activity className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">
              Intelligence Platform · Est. 2026
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-none mb-6 tracking-wider">
            ABOUT <span className="text-primary" style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}>
              US
            </span>
          </h1>

          <p className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            A specialized intelligence platform built for law enforcement agencies
            to conduct covert digital surveillance operations with precision and legality.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-24">

        {/* ── Stats Row ── */}
        <div className="flex flex-col items-center gap-4">

  {/* Top two boxes */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-5xl">
    <StatCard numericValue={2400} suffix="+" label="Verified Officers" />
    <StatCard numericValue={18} suffix="" label="States Covered" />

    {/* Desktop third card */}
    <div className="hidden md:block">
      <StatCard numericValue={100} suffix="%" label="Legal Compliant" />
    </div>
  </div>

  {/* Mobile centered card */}
  <div className="md:hidden w-1/2">
    <StatCard numericValue={100} suffix="%" label="Legal Compliant" />
  </div>

</div>
        {/* ── Purpose Cards ── */}
        <div>
          <div className="text-center mb-10">
            <h2 className="font-display text-5xl tracking-wider">
              OUR <span className="text-primary">PURPOSE</span>
            </h2>
            <p className="font-body text-text-secondary mt-3 max-w-xl mx-auto">
              Built exclusively for law enforcement with strict legal compliance.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Target className="w-6 h-6" />, title: "Our Mission", desc: "Empower law enforcement with cutting-edge tracking technology to reduce investigation time and improve case closure rates across India." },
              { icon: <Lock className="w-6 h-6" />, title: "Our Commitment", desc: "Every tool we build adheres to the IT Act 2000 and BNSS (Bharatiya Nagarik Suraksha Sanhita) guidelines. Access is strictly limited to verified government officers with valid badge IDs." },
              { icon: <Users className="w-6 h-6" />, title: "Our Users", desc: "We serve over 2,400 verified police officers across 18 states, from cyber crime cells to organized crime units." },
            ].map((item, i) => (
              <div key={i} className="bg-surface-elevated border border-surface-border rounded-2xl p-6 hover:border-primary/40 transition-all group">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-all">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl text-text-primary tracking-wide mb-2">{item.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Curator Section ── */}
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">
              🎓 VISION & LEADERSHIP
            </div>
            <h2 className="font-display text-5xl tracking-wider">
              MEET THE <span className="text-primary">CURATOR</span>
            </h2>
            <p className="font-body text-sm text-text-muted mt-2">The visionary behind Traxelon's mission</p>
          </div>

          <div className="bg-surface-elevated border border-primary/20 rounded-3xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />

            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">

                {/* Photo */}
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-glow">
                    <img src="/sir.jpg" alt="Dr. Ananth Prabhu G"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.parentElement.innerHTML = `<div class="w-full h-full bg-primary/10 flex items-center justify-center"><span style="font-size:56px;color:#00d4ff">A</span></div>`;
                      }} />
                  </div>
                  <div className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-center">
                    Curator & Resource Person
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-display text-3xl text-text-primary tracking-wide">Dr. Ananth Prabhu G</h3>
                  <p className="font-body text-primary text-sm font-semibold mt-1">PhD · PDF (Leicester, UK · Houston, TX)</p>
                  <p className="font-body text-text-muted text-sm mt-0.5">Professor, CSE · Principal Investigator — Digital Forensics & Cyber Security CoE</p>
                  <p className="font-body text-text-muted text-xs mt-0.5">Sahyadri College of Engineering and Management</p>

                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    {["Cyber Security", "Digital Forensics", "Cyber Law", "AI & Ethics", "InfoToons"].map((tag) => (
                      <span key={tag} className="bg-surface border border-surface-border text-text-muted font-mono text-xs px-3 py-1 rounded-full hover:border-primary/40 hover:text-primary transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-surface-border my-8" />

              {/* Achievement Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: <BookOpen className="w-4 h-4" />, value: "17", label: "Books Authored" },
                  { icon: <Globe className="w-4 h-4" />, value: "32", label: "Int'l Journals" },
                  { icon: <Award className="w-4 h-4" />, value: "3", label: "Patents Held" },
                  { icon: <Mic className="w-4 h-4" />, value: "3,000+", label: "Lectures Delivered" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-surface border border-surface-border rounded-xl p-4 text-center hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-center text-primary mb-2">{stat.icon}</div>
                    <div className="font-display text-2xl text-primary">{stat.value}</div>
                    <div className="font-body text-xs text-text-muted mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <div className="bg-surface border border-surface-border rounded-2xl p-6">
                <p className="font-body text-sm text-text-secondary leading-relaxed">
                  Dr. Ananth Prabhu G is a renowned Professor in the Department of Computer Science
                  and Engineering and serves as the Principal Investigator at the Digital Forensics
                  and Cyber Security Centre of Excellence at Sahyadri College of Engineering and Management.
                  He holds a B.E., MTech, and MBA from Manipal University, a PhD from VTU, and two
                  Post-Doctoral Research Fellowships from the University of Leicester, UK and the
                  University of Houston Downtown, Texas.
                </p>
                {expanded && (
                  <div className="mt-4 space-y-3 text-sm text-text-secondary font-body leading-relaxed">
                    <p>He also holds a Diploma in Cyber Law from Government Law College, Mumbai. Under his guidance, four research scholars have completed their PhDs, and five are currently pursuing their doctoral studies.</p>
                    <p>Dr. Prabhu is the Director of <a href="https://www.torsecure.com/" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">TorSecure Cyber LLP</a> and <a href="https://thesurepass.com/" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">SurePass Academy</a>. A dynamic speaker, he has delivered over 3,000 lectures, becoming a leading voice in cyber law and forensics.</p>
                    <p>His acclaimed book <span className="text-primary font-semibold">Cyber Safe Girl v6.1</span> has been downloaded <span className="text-primary font-semibold">4.5 crore times</span>. A free online certification course developed in partnership with <span className="text-primary font-semibold">ISEA</span> and the <span className="text-primary font-semibold">Ministry of Electronics and IT</span> has empowered citizens across India — especially in rural areas — with cyber literacy.</p>
                  </div>
                )}
                <button onClick={() => setExpanded(!expanded)}
                  className="mt-4 inline-flex items-center gap-1.5 text-primary font-body text-xs hover:underline transition-all">
                  {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Read more</>}
                </button>
              </div>

              {/* Cyber Safe Girl Banner */}
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="text-4xl">📘</div>
                <div>
                  <p className="font-display text-lg text-text-primary tracking-wide">Cyber Safe Girl v6.1</p>
                  <p className="font-body text-sm text-text-secondary mt-0.5">
                    Downloaded <span className="text-primary font-semibold">4.5 crore times</span> · Available in multiple regional languages ·
                    Certified course in partnership with <span className="text-primary font-semibold">MeitY & ISEA</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Legal Notice ── */}
        <div className="bg-surface-elevated border border-accent/20 rounded-2xl p-6">
          <h3 className="font-display text-xl text-accent tracking-wide mb-3">⚠️ Legal Notice</h3>
          <p className="font-body text-sm text-text-secondary leading-relaxed">
            Traxelon is intended solely for use by authorized law enforcement personnel in the
            performance of official duties. Unauthorized use of this tool to track individuals
            without proper legal authorization constitutes a violation of the IT Act 2000,
            Section 66 (Computer Related Offences) and may result in criminal prosecution.
            All activity on this platform is logged and auditable by senior officials.
          </p>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border py-8 px-6 mt-16">
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
            <a href="/" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Home</a>
            <a href="/contact" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Contact</a>
             <a href="/terms" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Terms and Conditions</a>
          </div>
        </div>
      </footer>

    </div>
  );
}