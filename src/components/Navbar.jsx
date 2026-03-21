import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Menu, X, LogOut, Zap } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 w-8 h-8 text-primary opacity-50 blur-sm group-hover:opacity-100 transition-opacity">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <span className="font-display text-2xl text-text-primary tracking-widest">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-body text-sm tracking-wider uppercase transition-colors duration-200 ${location.pathname === link.to
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && userProfile ? (
              <>
                <Link to="/dashboard">
                  <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-full px-4 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-body text-sm text-text-secondary">
                      {userProfile?.displayName || "Officer"}
                    </span>
                    {userProfile?.credits !== undefined && (
                      <span className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 text-xs text-primary font-mono">
                        <Zap className="w-3 h-3" />
                        {userProfile.credits}
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-primary text-surface font-body text-sm font-semibold rounded-lg hover:bg-primary-dark transition-all shadow-glow hover:shadow-glow-strong"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface-elevated border-b border-surface-border px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block font-body text-sm tracking-wider uppercase text-text-secondary hover:text-primary py-2"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && userProfile ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm text-primary py-2">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="block text-sm text-accent py-2">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-text-secondary py-2">Login</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="block text-sm text-primary py-2">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}