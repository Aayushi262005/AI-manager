import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/Firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const createUserProfileIfNotExists = async (user, extra = {}) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);

  try {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        name: user.displayName || extra.name || "",
        email: user.email,
        photoURL: user.photoURL || "",
        createdAt: serverTimestamp(),
        settings: {
          appearance: "dark",
          notifications: true,
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.error("[Firestore] FAILED to write profile doc:", err.code, err.message);
  }
};