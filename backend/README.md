# Traxelon Backend

## Setup Steps

### Step 1 — Get Firebase Service Account Key
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key" → Download JSON file
3. Either:
   - Place it as `firebase/serviceAccountKey.json`
   - OR copy values into `.env` file

### Step 2 — Create .env file
Copy `.env.example` to `.env` and fill in your values:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FRONTEND_URL=https://traxalon-main-01.vercel.app
PORT=5001
```

### Step 3 — Install and run locally
```powershell
cd traxelon-backend
npm install
npm start
```

### Step 4 — Add to your frontend
In your frontend project, create `.env` file:
```
REACT_APP_BACKEND_URL=http://localhost:5001
```

Replace `TrackingCapture.jsx` with the provided `TrackingCapture.jsx` file.

### Step 5 — Deploy backend to Render.com (FREE)
1. Go to https://render.com and sign up
2. New → Web Service → Connect your GitHub repo
3. Set Root Directory to `traxelon-backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add Environment Variables (same as .env)
7. Deploy!

### Step 6 — Update frontend .env for production
```
REACT_APP_BACKEND_URL=https://your-render-app.onrender.com
```
Then push frontend to Vercel.

## What the backend does
- Gets REAL IP address from request headers
- Filters bots (WhatsApp, Telegram previews)
- Does IP enrichment (city, ISP, timezone) via ip-api.com
- Does GPS reverse geocoding via OpenStreetMap Nominatim
- Captures 30+ device data points
- Saves everything to Firebase Firestore
