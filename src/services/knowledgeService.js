import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/Firebase";

// Knowledge resources live at users/{uid}/knowledge/{resourceId}. This is a
// flat, user-scoped collection (not nested under a plan) because the
// Knowledge nav item is a global, searchable view across all plans — each
// resource just carries a `planId` field to say which plan it belongs to.

const knowledgeRef = (uid) => collection(db, "users", uid, "knowledge");
const resourceRef = (uid, resourceId) => doc(db, "users", uid, "knowledge", resourceId);

export const subscribeToKnowledge = (uid, callback) => {
  const q = query(knowledgeRef(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const createNote = async (uid, { title, body, planId }) => {
  return addDoc(knowledgeRef(uid), {
    type: "note",
    title,
    body: body || "",
    planId,
    pinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const createLink = async (uid, { title, url, planId }) => {
  return addDoc(knowledgeRef(uid), {
    type: "link",
    title,
    url,
    planId,
    pinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const togglePin = async (uid, resourceId, pinned) => {
  return updateDoc(resourceRef(uid, resourceId), { pinned, updatedAt: serverTimestamp() });
};

// Full edit of a note — title and body together, since NoteDetailModal lets
// you change either. Only used for type "note"; links are simple enough
// that editing means "delete and re-add" rather than a dedicated edit flow.
export const updateNote = async (uid, resourceId, { title, body }) => {
  return updateDoc(resourceRef(uid, resourceId), { title, body, updatedAt: serverTimestamp() });
};

export const deleteResource = async (uid, resource) => {
  return deleteDoc(resourceRef(uid, resource.id));
};

// Re-tags a resource under a different plan — lets a note or link be moved
// without deleting and re-adding it. Used by the plan picker in NoteEditor.
export const moveResourceToPlan = async (uid, resourceId, planId) => {
  return updateDoc(resourceRef(uid, resourceId), { planId, updatedAt: serverTimestamp() });
};