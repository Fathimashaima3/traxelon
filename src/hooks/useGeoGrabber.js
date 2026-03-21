/**
 * useGeoGrabber — captures GPS coordinates only.
 * Reverse geocoding (address lookup) is handled server-side in links.js
 * to avoid Nominatim rate-limiting / CORS issues from browsers.
 */

import { useState, useEffect } from "react";

const GPS_TIMEOUT_MS = 20000;

function getGPSPosition() {
    return new Promise(function (resolve, reject) {
        if (!navigator || !navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: GPS_TIMEOUT_MS,
            maximumAge: 0,
        });
    });
}

export function useGeoGrabber() {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(function () {
        var cancelled = false;

        async function grab() {
            setLoading(true);
            setError(null);
            setLocation(null);

            // PASS 1 — fast cached position (gets something immediately)
            let fastPos = null;
            try {
                fastPos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 30000,
                    });
                });
            } catch (_) { }

            if (fastPos && !cancelled) {
                setLocation({
                    source: "gps",
                    lat: fastPos.coords.latitude,
                    lon: fastPos.coords.longitude,
                    gpsAccuracy: Math.round(fastPos.coords.accuracy),
                });
            }

            // PASS 2 — precise fresh fix (overwrites pass 1 if better)
            try {
                const precisePos = await getGPSPosition();
                if (!cancelled) {
                    setLocation({
                        source: "gps",
                        lat: precisePos.coords.latitude,
                        lon: precisePos.coords.longitude,
                        gpsAccuracy: Math.round(precisePos.coords.accuracy),
                    });
                }
            } catch (e) {
                if (!fastPos) {
                    if (cancelled) return;
                    setLocation({ source: "ip", lat: null, lon: null });
                }
            }

            if (!cancelled) setLoading(false);
        }

        grab();
        return function () { cancelled = true; };
    }, []);

    return { location, loading, error };
}

export default useGeoGrabber;