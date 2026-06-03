import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAhR3n0xxHiSyHWZU8doG6d0C9JgEvkD64",
  authDomain: "geotech-garbage-pickup.firebaseapp.com",
  projectId: "geotech-garbage-pickup",
  storageBucket: "geotech-garbage-pickup.firebasestorage.app",
  messagingSenderId: "694665257464",
  appId: "1:694665257464:web:ee2dcaa406fb202d6260d"
};


const app = initializeApp(firebaseConfig);


export const db = getFirestore(app); // Aapka Firestore Database
export const auth = getAuth(app);      // Aapka Auth system
export const storage = getStorage(app); // Aapka Storage system
