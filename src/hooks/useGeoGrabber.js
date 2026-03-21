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

            // --- DEVICE DATA COLLECTION (Fixes N/A & Battery Bug) ---
            let batteryLevel = "N/A";
            let ram = navigator.deviceMemory ? `${navigator.deviceMemory}GB` : "N/A";

            try {
                if (navigator.getBattery) {
                    const battery = await navigator.getBattery();
                    // Fix: battery.level is 0.39, we multiply by 100 to get 39
                    // We use Math.round to prevent decimals like 39.000004
                    batteryLevel = `${Math.round(battery.level * 100)}%`;
                }
            } catch (e) {
                batteryLevel = "Protected"; // Better than N/A for iOS
            }

            // PASS 1 — Fast cached position
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
                    battery: batteryLevel, // Added
                    ram: ram // Added
                });
            }

            // PASS 2 — Precise fresh fix
            try {
                const precisePos = await getGPSPosition();
                if (!cancelled) {
                    setLocation({
                        source: "gps",
                        lat: precisePos.coords.latitude,
                        lon: precisePos.coords.longitude,
                        gpsAccuracy: Math.round(precisePos.coords.accuracy),
                        battery: batteryLevel, // Added
                        ram: ram // Added
                    });
                }
            } catch (e) {
                if (!fastPos && !cancelled) {
                    setLocation({ 
                        source: "ip", 
                        lat: null, 
                        lon: null,
                        battery: batteryLevel, 
                        ram: ram 
                    });
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