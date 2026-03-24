import React, { useState, useEffect, useRef } from "react";
import { User, Bot, Send } from "lucide-react";

export default function NeuralAnalyst({ captures, selectedLinkName }) {
  const [userQuery, setUserQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setChatMessages([
      { 
        role: "bot", 
        text: `Forensic Neural System Online. Good day, Officer. I have successfully established a data link with "${selectedLinkName}". Signal analysis is complete. How can I assist with this intelligence report?` 
      }
    ]);
  }, [selectedLinkName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function getReadableAddress(lat, lon) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      return data.display_name || "Address details restricted.";
    } catch (error) {
      return "Unable to resolve physical address.";
    }
  }

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    const userMsg = { role: "user", text: userQuery };
    setChatMessages((prev) => [...prev, userMsg]);

    const botResponse = await processForensicData(userQuery, captures);
    
    setTimeout(() => {
      setChatMessages((prev) => [...prev, { role: "bot", text: botResponse }]);
    }, 600);

    setUserQuery("");
  };

 async function processForensicData(query, data) {
    const q = query.toLowerCase();
    if (!data || data.length === 0) return "Negative. No signal packets found for this target.";

    const latest = data[data.length - 1]; // Focus on the most recent capture

    // 1. RAM / HARDWARE
    if (q.includes("ram") || q.includes("memory") || q.includes("hardware")) {
      const hardwareReport = data.map((c, i) => {
        const ramVal = c.deviceMemory || c.ram;
        const ramDisplay = ramVal ? `${ramVal} GB` : "Access Restricted on this Device";
        return `Packet #${i + 1}: Device: ${c.device || "Unknown"} | RAM: ${ramDisplay} | OS: ${c.os || "Unknown"}`;
      }).join("\n");
      return `Hardware Fingerprint Analysis:\n${hardwareReport}`;
    }

    // 2. LOCATION
    if (q.includes("location") || q.includes("where") || q.includes("address")) {
      const locationReports = await Promise.all(data.map(async (c, i) => {
        const lat = c.gpsLat || c.serverGeoLatitude;
        const lon = c.gpsLon || c.serverGeoLongitude;
        if (lat && lon) {
          const properAddress = await getReadableAddress(lat, lon);
          return `Packet #${i + 1} Intelligence:\n- Physical Address: ${properAddress}\n- Coordinates: ${lat}, ${lon}`;
        }
        return `Packet #${i + 1}: Precise GPS restricted by target device. Approx: ${c.city || "Region Undefined"}`;
      }));
      return `Geospatial Intelligence Report:\n\n${locationReports.join("\n\n")}`;
    }

    // 3. UPDATED BATTERY LOGIC (Fixes "Restricted" and "3500%" bugs)
    if (q.includes("battery") || q.includes("power")) {
      const report = data.map((c, i) => {
        const rawLevel = parseFloat(c.batteryLevel);
        let levelDisplay = "Restricted by Device Security";
        
        if (!isNaN(rawLevel)) {
          // If value is 0.35 -> 35%. If value is 35 -> 35%.
          const normalizedLevel = rawLevel <= 1 && rawLevel > 0 ? Math.round(rawLevel * 100) : Math.round(rawLevel);
          levelDisplay = `${normalizedLevel}%`;
        }
        
        const chargingStatus = c.batteryCharging === "true" || c.batteryCharging === true ? "Charging" : "Discharging";
        return `Packet #${i + 1}: ${levelDisplay} [Status: ${chargingStatus}]`;
      }).join("\n");
      return `Power Intelligence Report:\n${report}`;
    }

    // 4. SMART SEARCH (Answers any other specific question about the data)
    const dataKeys = Object.keys(latest);
    const matchedKey = dataKeys.find(key => q.includes(key.toLowerCase()));

    if (matchedKey) {
      const value = latest[matchedKey];
      return `[NEURAL REPORT - ${matchedKey.toUpperCase()}]: ${value || "DATA RESTRICTED"}. Intelligence verified from latest signal packet.`;
    }

    return "Forensic System Ready. Officer, please specify if you require address details, ISP provider info, battery status, or hardware fingerprints.";
  }
  return (
    <div className="mt-4 bg-black/40 rounded-lg overflow-hidden border border-white/5">
      <div className="h-48 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface text-text-secondary border border-white/10'}`}>
              <div className="flex items-center gap-1.5 mb-1 opacity-50 uppercase text-[8px] font-black">
                {msg.role === 'user' ? <User className="w-2 h-2" /> : <Bot className="w-2 h-2" />} {msg.role}
              </div>
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleChatSubmit} className="p-2 border-t border-white/5 flex gap-2">
        <input 
          type="text" 
          value={userQuery} 
          onChange={(e) => setUserQuery(e.target.value)} 
          placeholder="Ask about target signals..."
          className="flex-1 bg-surface border border-white/10 rounded-md px-3 py-2 text-[11px] outline-none text-text-primary focus:border-primary/50"
        />
        <button type="submit" className="bg-primary p-2 rounded-md text-surface hover:bg-primary-dark transition-colors">
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}