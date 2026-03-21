import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp,
  collection, addDoc, query, where,
  orderBy, limit, getDocs, updateDoc, onSnapshot
} from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banned, setBanned] = useState(false);
  const loginJustRan = useRef(false); 

  async function signup(email, password, displayName, badgeId, department) {

    // ✅ Check if this email belongs to a banned user
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const existingUser = snap.docs[0].data();
      if (existingUser.status === "rejected") {
        throw new Error("This account has been suspended. You cannot register again.");
      }
    }

    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName,
      badgeId,
      department,
      credits: 1,
      role: "officer",
      createdAt: serverTimestamp(),
      totalLinksGenerated: 0,
    });
    await signOut(auth);
    return user;
  }


  async function login(email, password) {
    loginJustRan.current = true;
    const result = await signInWithEmailAndPassword(auth, email, password);
    await result.user.reload();
    const freshUser = result.user;

    // ✅ Check ban FIRST before anything else
    const profile = await fetchUserProfile(freshUser.uid);
    if (profile?.status === "rejected") {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setBanned(false);
      throw new Error("This account has been suspended. You cannot login again.");
    }

    // ✅ Only write to Firestore if not banned
    await setDoc(doc(db, "users", freshUser.uid), {
      lastSeen: serverTimestamp(),
      isOnline: true
    }, { merge: true });

    await addDoc(collection(db, "users", freshUser.uid, "sessions"), {
      loginAt: serverTimestamp(),
      logoutAt: null,
      type: "login",
    });

    setCurrentUser(freshUser);
    return freshUser;
  }

  async function logout() {
    setBanned(false); // ✅ reset banned immediately before anything else
    if (currentUser) {
      // ✅ Find the latest open session and close it
      const sessionsRef = collection(db, "users", currentUser.uid, "sessions");
      const q = query(
        sessionsRef,
        where("logoutAt", "==", null),
        orderBy("loginAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          logoutAt: serverTimestamp(),
        });
      }

      // Update user doc
      await setDoc(doc(db, "users", currentUser.uid), {
        isOnline: false,
      }, { merge: true });
    }
    setUserProfile(null);
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function confirmReset(oobCode, newPassword) {
    return confirmPasswordReset(auth, oobCode, newPassword);
  }

  async function fetchUserProfile(uid) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      setUserProfile(userData);

      // ✅ Ban check
      if (userData.status === "rejected") {
        setBanned(true);
      } else {
        setBanned(false);
      }

      return userData;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setCurrentUser(user);
          if (!loginJustRan.current) { 
            await fetchUserProfile(user.uid);
          }
          loginJustRan.current = false;
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Auth context error:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(doc(db, "users", currentUser.uid), async (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        setUserProfile(userData);

        // ✅ If banned, auto logout immediately — no suspended screen
        if (userData.status === "rejected") {
          setBanned(false); // reset so no flash
          setUserProfile(null);
          setCurrentUser(null);
          await signOut(auth);
        } else {
          setBanned(false);
        }
      }
    });

    return unsubscribe;
  }, [currentUser]);

  const value = {
    currentUser,
    userProfile,
    banned,
    loading,
    isAuthenticated: !!currentUser,
    signup,
    login,
    logout,
    resetPassword,
    confirmReset,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}