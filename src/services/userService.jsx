import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/Firebase";

// Creates (or updates) the users/{uid} profile document.
// Safe to call on every login: { merge: true } means it will NOT
// overwrite fields that already exist (like settings the user changed),
// it only fills in anything missing.
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
    alert("FIRESTORE SUCCESS: profile doc written for " + user.uid); // TEMP - remove after debugging
  } catch (err) {
    // Log loudly instead of letting the caller's catch swallow this silently
    console.error("[Firestore] FAILED to write profile doc:", err.code, err.message);
    alert("FIRESTORE FAILED: " + err.code + " | " + err.message); // TEMP - remove after debugging
  }
};