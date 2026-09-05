import { doc, setDoc, getDoc, getDocs, collection, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../config/Firebase";

export const DEFAULT_NOTIFICATION_SETTINGS = {
  dailyReminder: true,
  aiInsights: true,
  streakAlert: true,
  sessionComplete: false,
}

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
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.error("[Firestore] FAILED to write profile doc:", err.code, err.message);
  }
};

// Live profile doc (name/email/photoURL/settings) for the Settings page.
export const subscribeToUserProfile = (uid, callback) => {
  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, (snap) => callback(snap.exists() ? snap.data() : {}));
};

export const updateDisplayName = async (uid, name) => {
  const userRef = doc(db, "users", uid);
  return setDoc(userRef, { name }, { merge: true });
};

export const updateNotificationSetting = async (uid, key, value) => {
  const userRef = doc(db, "users", uid);
  return setDoc(userRef, { settings: { notifications: { [key]: value } } }, { merge: true });
};

// One-shot pull of everything the account owns, for the "Export all data"
// action in Settings. Walks the same subcollections the rest of the app
// reads from (plans -> tasks -> focusSessions, knowledge, capacityOverrides)
// and returns a plain JSON-able object.
export const exportUserData = async (uid) => {
  const userSnap = await getDoc(doc(db, "users", uid))
  const profile = userSnap.exists() ? userSnap.data() : {}

  const plansSnap = await getDocs(collection(db, "users", uid, "plans"))
  const plans = await Promise.all(
    plansSnap.docs.map(async (planDoc) => {
      const tasksSnap = await getDocs(collection(db, "users", uid, "plans", planDoc.id, "tasks"))
      const tasks = await Promise.all(
        tasksSnap.docs.map(async (taskDoc) => {
          const sessionsSnap = await getDocs(
            collection(db, "users", uid, "plans", planDoc.id, "tasks", taskDoc.id, "focusSessions")
          )
          return {
            id: taskDoc.id,
            ...taskDoc.data(),
            focusSessions: sessionsSnap.docs.map((s) => ({ id: s.id, ...s.data() })),
          }
        })
      )
      return { id: planDoc.id, ...planDoc.data(), tasks }
    })
  )

  const knowledgeSnap = await getDocs(collection(db, "users", uid, "knowledge"))
  const knowledge = knowledgeSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  const overridesSnap = await getDocs(collection(db, "users", uid, "capacityOverrides"))
  const capacityOverrides = overridesSnap.docs.map((d) => ({ date: d.id, ...d.data() }))

  return {
    exportedAt: new Date().toISOString(),
    profile,
    plans,
    knowledge,
    capacityOverrides,
  }
};