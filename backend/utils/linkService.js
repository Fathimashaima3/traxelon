import { db } from "../firebase/config.js";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "https://traxelon-main.vercel.app";

export function generateToken() {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 10)
  );
}

export async function createTrackingLink(uid, label, destinationUrl) {
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) throw new Error("User not found");

  const userData = userSnap.data();
  if ((userData.credits ?? 0) < 1) throw new Error("Insufficient credits");

  const token = generateToken();
  const trackingUrl = `${FRONTEND_URL}/t/${token}`;

  await db.collection("trackingLinks").doc(token).set({
    uid,
    token,
    label: label || "Tracking Link",
    trackingUrl,
    destinationUrl: destinationUrl || "",
    clicks: 0,
    captures: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    active: true,
  });

  await userRef.update({
    credits: admin.firestore.FieldValue.increment(-1),
    totalLinksGenerated: admin.firestore.FieldValue.increment(1),
  });

  return { token, trackingUrl };
}

export async function recordCapture(token, deviceData) {
  const linksRef = db.collection("trackingLinks");
  const snap = await linksRef.where("token", "==", token).get();

  if (snap.empty) return { found: false, destinationUrl: null };

  const linkDoc = snap.docs[0];
  const linkData = linkDoc.data();

  await linksRef.doc(linkDoc.id).update({
    clicks: admin.firestore.FieldValue.increment(1),
    captures: admin.firestore.FieldValue.arrayUnion({
      ...deviceData,
      capturedAt: new Date().toISOString(),
    }),
  });

  return { found: true, destinationUrl: linkData.destinationUrl || null };
}

export async function addCredits(uid, amount) {
  await db.collection("users").doc(uid).update({
    credits: admin.firestore.FieldValue.increment(amount),
  });
}
