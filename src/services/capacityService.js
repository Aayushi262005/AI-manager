import {
  doc, setDoc, getDoc, deleteDoc, onSnapshot, collection
} from "firebase/firestore";
import { db } from "../config/Firebase";

export const subscribeToCapacitySettings=(uid,callback)=>{
    const userRef = doc(db, "users", uid);
    return onSnapshot(userRef,(snap)=>{
        const data=snap.data();
        const hours = data?.settings?.defaultDailyCapacityHours ?? 4;
        callback(hours);
    });
};

export const setDefaultCapacity = async(uid,hours)=>{
    const userRef = doc(db, "users", uid);
    return setDoc(userRef, { settings: { defaultDailyCapacityHours: hours } }, { merge: true });
};

export const setDayOverride = async (uid, date, hours) => {
    const overrideRef = doc(db, "users", uid, "capacityOverrides", date);
    return setDoc(overrideRef, { hours });
};
 
export const getDayOverride = async (uid, date) => {
    const overrideRef = doc(db, "users", uid, "capacityOverrides", date);
    const snap = await getDoc(overrideRef);
    return snap.exists() ? snap.data().hours : null;
};

export const clearDayOverride = async (uid, date) => {
    const overrideRef = doc(db, "users", uid, "capacityOverrides", date);
    return deleteDoc(overrideRef);
};

export const subscribeToOverrides = (uid, callback) => {
    const overridesRef = collection(db, "users", uid, "capacityOverrides");
    return onSnapshot(overridesRef, (snapshot) => {
        const overrides = {};
        snapshot.docs.forEach((d) => {
        overrides[d.id] = d.data().hours;
        });
        callback(overrides);
    });
};