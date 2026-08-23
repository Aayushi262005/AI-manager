import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/Firebase";

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
    console.log("[Firestore] profile doc written for", user.uid);
  } catch (err) {
    console.error("[Firestore] FAILED to write profile doc:", err.code, err.message);
  }
};