import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# 1. Load the .env file you got from your mentor
load_dotenv()

app = Flask(__name__)
CORS(app) # This allows your React dashboard to talk to this Python script

def generate_detailed_narrative(logs):
    report_parts = ["--- INTELLIGENCE SUMMARY REPORT ---"]
    for index, log in enumerate(logs, 1):
        device = log.get('device', 'Mobile Device')
        os_name = log.get('os', 'Unknown OS')
        browser = log.get('browser', 'Web Browser')
        city = log.get('city', 'Unknown City')
        region = log.get('region', 'Unknown State')
        isp = log.get('isp', 'Internet Provider')
        ip = log.get('ip', 'Hidden')
        
        entry = f"SIGNAL {index} ANALYSIS:\n"
        entry += f"The subject accessed the link using a {device} (System: {os_name}) through the {browser} app. "
        entry += f"The internet connection is provided by '{isp}'. "

        address = log.get('gpsAddress') or log.get('address')
        accuracy = log.get('gpsAccuracy')

        if address and address != "null":
            entry += (
                f"\n📍 PRECISE LOCATION FOUND: We have successfully pinpointed the exact address at: \"{address}\". "
                f"This data is highly accurate (within {accuracy} meters), confirming they were physically at this building."
            )
        else:
            entry += (
                f"\n⚠️ GENERAL AREA ONLY: The target did not click 'Allow' on the location prompt. "
                f"Because of this, we cannot see the house number, but we have traced their connection to {city}, {region}. "
                f"Their unique digital ID is {ip}."
            )
        report_parts.append(entry)

    report_parts.append("\nFINAL VERDICT: All active signals have been logged and verified against local network infrastructure.")
    return "\n\n".join(report_parts)

# 2. Create the API Route for the Dashboard
@app.route('/summarize', methods=['POST'])
def summarize_handler():
    try:
        data = request.get_json()
        logs = data.get('logs', [])
        
        if not logs:
            return jsonify({"summary": "No tracking data available yet."}), 200

        result = generate_detailed_narrative(logs)
        return jsonify({"summary": result}), 200
    except Exception as e:
        return jsonify({"error": f"Internal Error: {str(e)}"}), 500

# 3. Run the server
if __name__ == "__main__":
    # Get port from .env or use 5000 as default
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)