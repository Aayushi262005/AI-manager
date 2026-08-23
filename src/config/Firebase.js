// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAjiC5jjr1Qw4iKjXZcqpM516PHohycBXU",
  authDomain: "project1-3d935.firebaseapp.com",
  projectId: "project1-3d935",
  storageBucket: "project1-3d935.firebasestorage.app",
  messagingSenderId: "745452615512",
  appId: "1:745452615512:web:bb1d5814066cd79933972d",
  measurementId: "G-6ZRRQL6G5V"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { auth, analytics, db };