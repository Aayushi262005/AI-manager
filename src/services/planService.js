import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDocs
} from "firebase/firestore";
import { db } from "../config/Firebase";

export const subscribeToPlans = (uid, callback) => {
  const plansRef = collection(db, "users", uid, "plans");
  const q = query(plansRef, orderBy("deadline", "asc"));
  return onSnapshot(q, (snapshot) => {
    const plans = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(plans);
  });
};

export const createPlan = async (uid, { name, deadline, description, color }) => {
  const plansRef = collection(db, "users", uid, "plans");
  return addDoc(plansRef, {
    name,
    deadline, 
    description: description || "",
    color: color || "#7C3AED",
    status: "active",
    createdAt: serverTimestamp(),
  });
};

export const updatePlan = async (uid, planId, { name, deadline, description }) => {
  const planRef = doc(db, "users", uid, "plans", planId);
  return updateDoc(planRef, { name, deadline, description: description || "" });
};

export const deletePlan = async (uid, planId) => {
  const tasksRef = collection(db, "users", uid, "plans", planId, "tasks");
  const snapshot = await getDocs(tasksRef);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "users", uid, "plans", planId));
};

export const subscribeToTasks = (uid, planId, callback) => {
  const tasksRef = collection(db, "users", uid, "plans", planId, "tasks");
  const q = query(tasksRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(tasks);
  });
};

export const createTask = async (uid, planId, { title, estMinutes, priority }) => {
  const tasksRef = collection(db, "users", uid, "plans", planId, "tasks");
  return addDoc(tasksRef, {
    title,
    estMinutes: estMinutes || 30,
    priority: priority || "medium",
    done: false,
    createdAt: serverTimestamp(),
  });
};

export const toggleTask = async (uid, planId, taskId, done) => {
  const taskRef = doc(db, "users", uid, "plans", planId, "tasks", taskId);
  return updateDoc(taskRef, { done });
};

export const deleteTask = async (uid, planId, taskId) => {
  const taskRef = doc(db, "users", uid, "plans", planId, "tasks", taskId);
  return deleteDoc(taskRef);
};