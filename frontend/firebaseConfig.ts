// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIza....",
  authDomain: "orange-sweetness.firebaseapp.com",
  projectId: "orange-sweetness",
  storageBucket: "orange-sweetness.appspot.com",
  messagingSenderId: "xxxxxxx",
  appId: "1:xxxx:web:xxxxxx"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
