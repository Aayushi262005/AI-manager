import {
  collection, doc, addDoc, updateDoc,
  onSnapshot, query, where, orderBy, serverTimestamp, collectionGroup,
} from "firebase/firestore";
import { db } from "../config/Firebase";

export const createFocusSession = async (uid, planId, taskId, { startedAt, endedAt, durationMinutes }) => {
  const sessionsRef = collection(db, "users", uid, "plans", planId, "tasks", taskId, "focusSessions");
  return addDoc(sessionsRef, {
    uid,
    taskId,
    startedAt,
    endedAt,
    durationMinutes,
    createdAt: serverTimestamp(),
  });
};
export const updateTaskProgress = async (uid, planId, taskId, progress) => {
  const taskRef = doc(db, "users", uid, "plans", planId, "tasks", taskId);
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  return updateDoc(taskRef, { progress: clamped, done: clamped >= 100 });
};

export const subscribeToTaskFocusSessions = (uid, planId, taskId, callback, onError) => {
  const sessionsRef = collection(db, "users", uid, "plans", planId, "tasks", taskId, "focusSessions");
  const q = query(sessionsRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (error) => {
      console.error("subscribeToTaskFocusSessions failed:", error);
      if (onError) onError(error);
      else callback([]);
    }
  );
};

export const subscribeToAllFocusSessions = (uid, callback, onError) => {
  const sessionsGroupRef = collectionGroup(db, "focusSessions");
  const q = query(sessionsGroupRef, where("uid", "==", uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((d) => ({
        id: d.id,
        taskId: d.ref.parent.parent.id,
        planId: d.ref.parent.parent.parent.parent.id,
        ...d.data(),
      }));
      callback(sessions);
    },
    (error) => {
      console.error("subscribeToAllFocusSessions failed:", error);
      if (onError) onError(error);
      else callback([]);
    }
  );
};