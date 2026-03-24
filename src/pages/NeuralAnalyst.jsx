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

    // 1. RAM / HARDWARE / FINGERPRINT / RESOLUTION
    if (q.includes("ram") || q.includes("hardware") || q.includes("fingerprint") || q.includes("resolution") || q.includes("device")) {
      const hardwareReport = data.map((c, i) => {
        const ramVal = c.deviceMemory || c.ram;
        const ramDisplay = ramVal ? `${ramVal} GB` : "Access Restricted on this Device";
        // Adding Resolution and Fingerprint details
        const res = c.screenResolution || "Resolution Restricted";
        return `Packet #${i + 1}: Device: ${c.device || "Mobile"} | OS: ${c.os || "Unknown"} | RAM: ${ramDisplay} | Screen: ${res}`;
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
// 3. IP & NETWORK (Prioritized for "public ip" or "ip address")
    if (q.includes("ip") || q.includes("public") || q.includes("network") || q.includes("isp")) {
      const network = data.map((c, i) => {
        const provider = c.isp || "Provider details restricted";
        return `Packet #${i + 1}: [NEURAL REPORT - IP]: ${c.ip || "Hidden"} | ISP: ${provider}`;
      }).join("\n");
      return `Network Intelligence verified from latest signal packets:\n${network}`;
    }
    // 4. UPDATED BATTERY LOGIC (Fixes "Restricted" and "3500%" bugs)
    if (q.includes("battery") || q.includes("power") || q.includes("charge")) {
      const report = data.map((c, i) => {
        // Try to get the level from multiple possible keys
        const rawValue = c.batteryLevel || c.battery; 
        const rawLevel = parseFloat(rawValue);
        
        // If it's a valid percentage (0.0 to 1.0)
        if (!isNaN(rawLevel) && rawLevel <= 1 && rawLevel > 0) {
            return `Packet #${i + 1}: ${(rawLevel * 100).toFixed(0)}% [Status: ${c.batteryCharging === "true" ? "Charging" : "Discharging"}]`;
        } 
        
        // If the database has a whole number (e.g., 85) instead of a decimal (0.85)
        if (!isNaN(rawLevel) && rawLevel > 1) {
            return `Packet #${i + 1}: ${rawLevel}% [Status: ${c.batteryCharging === "true" ? "Charging" : "Discharging"}]`;
        }

        return `Packet #${i + 1}: Restricted by Device Security (Check if Target used Incognito or Private mode)`;
      }).join("\n");
      
      return `Power Intelligence Report:\n${report}`;
    }
// 5. SECURITY / VPN / PROXY
    if (q.includes("security") || q.includes("proxy") || q.includes("vpn") || q.includes("tor")) {
      const securityReport = data.map((c, i) => {
        const isSecure = (c.isProxy === "true" || c.isTor === "true") ? "HIGH RISK (VPN/Proxy Detected)" : "CLEAR (Direct Connection)";
        return `Packet #${i + 1}: Connection Security: ${isSecure}`;
      }).join("\n");
      return `Security Signal Analysis:\n${securityReport}`;
    }
    // 6. SMART SEARCH (Answers any other specific question about the data)
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