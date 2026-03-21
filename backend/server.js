import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import linksRouter from "./routes/links.js";
import authRouter from "./routes/auth.js";
import contactRouter from "./routes/contact.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://traxelon-main.vercel.app",
        "https://traxelon-main-git-thondekai-pranavs-projects-3ac675c8.vercel.app",
        "https://traxelon-main-git-thondekai-v2-pranavs-projects-3ac675c8.vercel.app",
        // Add your Vercel URL here
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({limit:'10mb'}));

app.get("/", (_req, res) => {
    res.json({ status: "Traxelon backend running ✅", version: "1.0.0" });
});

app.use("/api/links", linksRouter);
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error("[Error]", err);
    res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Traxelon backend running on http://localhost:${PORT}\n`);
});

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`   Run: taskkill /F /IM node.exe`);
        console.error(`   Then: npm start\n`);
        process.exit(1);
    } else {
        throw err;
    }
});
//New Deploy