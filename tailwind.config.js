/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                display: ["'Bebas Neue'", "cursive"],
                body: ["'DM Sans'", "sans-serif"],
                mono: ["'JetBrains Mono'", "monospace"],
            },
            colors: {
                primary: {
                    DEFAULT: "#00D4FF",
                    dark: "#0099BB",
                    light: "#80EAFF",
                },
                accent: "#FF3B30",
                surface: {
                    DEFAULT: "#0A0F1E",
                    elevated: "#0F1729",
                    card: "#131D35",
                    border: "#1E2D4F",
                },
                text: {
                    primary: "#F0F4FF",
                    secondary: "#8A9BC5",
                    muted: "#4A5A80",
                },
            },
            backgroundImage: {
                "grid-pattern": "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
                "hero-gradient": "radial-gradient(ellipse at 30% 50%, rgba(0,212,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(0,100,255,0.1) 0%, transparent 50%)",
            },
            backgroundSize: {
                grid: "40px 40px",
            },
            animation: {
                "pulse-slow": "pulse 3s ease-in-out infinite",
                "scan-line": "scanLine 3s linear infinite",
                float: "float 6s ease-in-out infinite",
                "glow-pulse": "glowPulse 2s ease-in-out infinite",
            },
            keyframes: {
                scanLine: {
                    "0%": { transform: "translateY(-100%)" },
                    "100%": { transform: "translateY(100vh)" },
                },
                float: {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                glowPulse: {
                    "0%, 100%": { boxShadow: "0 0 20px rgba(0,212,255,0.3)" },
                    "50%": { boxShadow: "0 0 40px rgba(0,212,255,0.7)" },
                },
            },
            boxShadow: {
                glow: "0 0 30px rgba(0,212,255,0.3)",
                "glow-strong": "0 0 60px rgba(0,212,255,0.5)",
                card: "0 4px 40px rgba(0,0,0,0.5)",
            },
        },
    },
    plugins: [],
};