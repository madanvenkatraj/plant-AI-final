import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3caBFgQjVFB3C8e4l7rpcak7jk2P7nJY",
  authDomain: "plant-project-330a0.firebaseapp.com",
  projectId: "plant-project-330a0",
  storageBucket: "plant-project-330a0.firebasestorage.app",
  messagingSenderId: "990216900217",
  appId: "1:990216900217:web:5fd2f5155ab526d8880ea8",
  measurementId: "G-M6ZLDBEPC2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
